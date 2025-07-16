// Driver Efficiency Learning System for RydeIQ Driver App
// Tracks actual fuel efficiency and improves estimates over time

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for efficiency data
const STORAGE_KEYS = {
  EFFICIENCY_DATA: 'driver_efficiency_data',
  TRIP_SAMPLES: 'efficiency_trip_samples',
  LEARNING_STATS: 'efficiency_learning_stats'
};

// Learning parameters
const LEARNING_CONFIG = {
  MIN_TRIPS_FOR_LEARNING: 10, // Minimum trips before applying learned efficiency
  SAMPLE_SIZE_LIMIT: 100, // Maximum trip samples to store
  CONFIDENCE_THRESHOLD: 0.7, // Minimum confidence to use learned data
  OUTLIER_THRESHOLD: 2.5, // Standard deviations for outlier detection
  LEARNING_WEIGHT: 0.3, // How much to weight learned vs database efficiency
  SEASONAL_ADJUSTMENT: true // Account for weather/seasonal factors
};

/**
 * Record actual trip data for efficiency learning
 * @param {Object} tripData - Completed trip information
 * @param {string} tripData.tripId - Unique trip identifier
 * @param {Object} tripData.vehicle - Vehicle information
 * @param {number} tripData.distance - Actual trip distance in miles
 * @param {number} tripData.fuelUsed - Actual fuel used (gallons or kWh)
 * @param {string} tripData.fuelType - Fuel type (gasoline, diesel, electric, hybrid)
 * @param {number} tripData.duration - Trip duration in minutes
 * @param {Object} tripData.conditions - Trip conditions (weather, traffic, etc.)
 * @param {string} tripData.driverId - Driver ID
 * @returns {Object} Recording result
 */
export const recordTripEfficiency = async (tripData) => {
  try {
    const {
      tripId,
      vehicle,
      distance,
      fuelUsed,
      fuelType,
      duration,
      conditions = {},
      driverId
    } = tripData;

    // Validate input data
    if (!tripId || !vehicle || !distance || !fuelUsed || distance <= 0 || fuelUsed <= 0) {
      return {
        success: false,
        error: 'Invalid trip data provided'
      };
    }

    // Calculate actual efficiency
    let actualEfficiency;
    if (fuelType === 'electric') {
      // For electric vehicles, calculate kWh per 100 miles, then convert to MPGe
      const kWhPer100Miles = (fuelUsed / distance) * 100;
      actualEfficiency = 100 / kWhPer100Miles; // Convert to MPGe equivalent
    } else {
      // For gasoline/diesel/hybrid, calculate MPG
      actualEfficiency = distance / fuelUsed;
    }

    // Create efficiency sample
    const efficiencySample = {
      tripId,
      timestamp: new Date().toISOString(),
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.vehicleType
      },
      actualEfficiency,
      distance,
      duration,
      fuelType,
      conditions: {
        weather: conditions.weather || 'unknown',
        temperature: conditions.temperature || null,
        trafficLevel: conditions.trafficLevel || 'normal',
        roadType: conditions.roadType || 'mixed',
        season: getCurrentSeason()
      },
      driverId
    };

    // Store the sample
    await addEfficiencySample(efficiencySample);

    // Update learning statistics
    await updateLearningStats(driverId, efficiencySample);

    return {
      success: true,
      actualEfficiency,
      sample: efficiencySample
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get learned efficiency for a vehicle/driver combination
 * @param {Object} params - Query parameters
 * @param {string} params.driverId - Driver ID
 * @param {Object} params.vehicle - Vehicle information
 * @param {Object} params.conditions - Current trip conditions
 * @returns {Object} Learned efficiency data
 */
export const getLearnedEfficiency = async ({ driverId, vehicle, conditions = {} }) => {
  try {
    // Get stored efficiency data
    const efficiencyData = await getStoredEfficiencyData(driverId);
    
    if (!efficiencyData || efficiencyData.samples.length < LEARNING_CONFIG.MIN_TRIPS_FOR_LEARNING) {
      return {
        hasLearnedData: false,
        confidence: 0,
        message: `Need at least ${LEARNING_CONFIG.MIN_TRIPS_FOR_LEARNING} trips for learning`
      };
    }

    // Filter samples for similar conditions
    const relevantSamples = filterRelevantSamples(efficiencyData.samples, vehicle, conditions);
    
    if (relevantSamples.length < 3) {
      return {
        hasLearnedData: false,
        confidence: 0,
        message: 'Insufficient data for similar conditions'
      };
    }

    // Calculate learned efficiency
    const learnedEfficiency = calculateLearnedEfficiency(relevantSamples);
    
    // Calculate confidence based on sample size and consistency
    const confidence = calculateConfidence(relevantSamples);

    return {
      hasLearnedData: true,
      learnedEfficiency,
      confidence,
      sampleCount: relevantSamples.length,
      conditions: conditions,
      adjustments: calculateSeasonalAdjustments(relevantSamples, conditions)
    };

  } catch (error) {
    return {
      hasLearnedData: false,
      confidence: 0,
      error: error.message
    };
  }
};

/**
 * Blend database efficiency with learned efficiency
 * @param {Object} params - Blending parameters
 * @param {number} params.databaseEfficiency - Efficiency from vehicle database
 * @param {Object} params.learnedData - Learned efficiency data
 * @param {Object} params.conditions - Current conditions
 * @returns {Object} Blended efficiency recommendation
 */
export const blendEfficiencyData = ({ databaseEfficiency, learnedData, conditions = {} }) => {
  try {
    if (!learnedData.hasLearnedData || learnedData.confidence < LEARNING_CONFIG.CONFIDENCE_THRESHOLD) {
      // Not enough learned data, use database efficiency
      return {
        recommendedEfficiency: databaseEfficiency,
        source: 'database',
        confidence: 0.8,
        blend: 'database_only'
      };
    }

    // Blend database and learned efficiency
    const learningWeight = Math.min(
      LEARNING_CONFIG.LEARNING_WEIGHT * learnedData.confidence,
      0.6 // Cap at 60% learned data influence
    );
    
    const databaseWeight = 1 - learningWeight;
    
    const blendedEfficiency = (
      databaseEfficiency * databaseWeight +
      learnedData.learnedEfficiency * learningWeight
    );

    // Apply seasonal adjustments if available
    let finalEfficiency = blendedEfficiency;
    if (learnedData.adjustments && learnedData.adjustments.seasonal) {
      finalEfficiency *= learnedData.adjustments.seasonal;
    }

    return {
      recommendedEfficiency: Math.round(finalEfficiency * 10) / 10,
      source: 'blended',
      confidence: Math.min(0.95, 0.8 + (learnedData.confidence * 0.15)),
      blend: {
        databaseWeight,
        learningWeight,
        databaseEfficiency,
        learnedEfficiency: learnedData.learnedEfficiency,
        sampleCount: learnedData.sampleCount
      },
      adjustments: learnedData.adjustments
    };

  } catch (error) {
    // Fallback to database efficiency
    return {
      recommendedEfficiency: databaseEfficiency,
      source: 'database_fallback',
      confidence: 0.8,
      error: error.message
    };
  }
};

/**
 * Add efficiency sample to storage
 * @param {Object} sample - Efficiency sample to store
 */
const addEfficiencySample = async (sample) => {
  try {
    const samplesJson = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_SAMPLES);
    let samples = samplesJson ? JSON.parse(samplesJson) : [];

    // Add new sample
    samples.push(sample);

    // Limit sample size (keep most recent)
    if (samples.length > LEARNING_CONFIG.SAMPLE_SIZE_LIMIT) {
      samples = samples
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, LEARNING_CONFIG.SAMPLE_SIZE_LIMIT);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.TRIP_SAMPLES, JSON.stringify(samples));
  } catch (error) {
    console.error('Error storing efficiency sample:', error);
  }
};

/**
 * Get stored efficiency data for a driver
 * @param {string} driverId - Driver ID
 * @returns {Object} Stored efficiency data
 */
const getStoredEfficiencyData = async (driverId) => {
  try {
    const [samplesJson, statsJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TRIP_SAMPLES),
      AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS)
    ]);

    const allSamples = samplesJson ? JSON.parse(samplesJson) : [];
    const stats = statsJson ? JSON.parse(statsJson) : {};

    // Filter samples for this driver
    const driverSamples = allSamples.filter(sample => sample.driverId === driverId);

    return {
      samples: driverSamples,
      stats: stats[driverId] || {}
    };
  } catch (error) {
    console.error('Error loading efficiency data:', error);
    return { samples: [], stats: {} };
  }
};

/**
 * Filter samples relevant to current conditions
 * @param {Array} samples - All efficiency samples
 * @param {Object} vehicle - Current vehicle
 * @param {Object} conditions - Current conditions
 * @returns {Array} Filtered relevant samples
 */
const filterRelevantSamples = (samples, vehicle, conditions) => {
  return samples.filter(sample => {
    // Must be same vehicle
    if (sample.vehicle.make !== vehicle.make || 
        sample.vehicle.model !== vehicle.model) {
      return false;
    }

    // Filter by similar conditions if specified
    if (conditions.trafficLevel && sample.conditions.trafficLevel !== conditions.trafficLevel) {
      // Allow some flexibility in traffic conditions
      const trafficLevels = ['light', 'normal', 'heavy'];
      const currentIndex = trafficLevels.indexOf(conditions.trafficLevel);
      const sampleIndex = trafficLevels.indexOf(sample.conditions.trafficLevel);
      
      if (Math.abs(currentIndex - sampleIndex) > 1) {
        return false;
      }
    }

    // Consider seasonal factors
    if (LEARNING_CONFIG.SEASONAL_ADJUSTMENT) {
      const currentSeason = getCurrentSeason();
      if (sample.conditions.season !== currentSeason) {
        // Reduce weight for different seasons, but don't eliminate
        sample.seasonalWeight = 0.7;
      } else {
        sample.seasonalWeight = 1.0;
      }
    }

    return true;
  });
};

/**
 * Calculate learned efficiency from relevant samples
 * @param {Array} samples - Relevant efficiency samples
 * @returns {number} Calculated learned efficiency
 */
const calculateLearnedEfficiency = (samples) => {
  // Remove outliers
  const cleanedSamples = removeOutliers(samples.map(s => s.actualEfficiency));
  
  // Calculate weighted average (more recent samples have higher weight)
  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  cleanedSamples.forEach((efficiency, index) => {
    const sample = samples[index];
    const ageInDays = (now - new Date(sample.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    // Age weight: newer samples get higher weight
    const ageWeight = Math.exp(-ageInDays / 30); // Exponential decay over 30 days
    
    // Seasonal weight
    const seasonalWeight = sample.seasonalWeight || 1.0;
    
    // Distance weight: longer trips are more reliable
    const distanceWeight = Math.min(sample.distance / 10, 2); // Cap at 2x for 10+ mile trips
    
    const totalSampleWeight = ageWeight * seasonalWeight * distanceWeight;
    
    weightedSum += efficiency * totalSampleWeight;
    totalWeight += totalSampleWeight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : null;
};

/**
 * Calculate confidence in learned efficiency
 * @param {Array} samples - Relevant samples
 * @returns {number} Confidence score (0-1)
 */
const calculateConfidence = (samples) => {
  if (samples.length < 3) return 0;

  const efficiencies = samples.map(s => s.actualEfficiency);
  const cleanedEfficiencies = removeOutliers(efficiencies);
  
  // Base confidence on sample size
  let confidence = Math.min(samples.length / 20, 0.8); // 80% max from sample size
  
  // Adjust for consistency (lower standard deviation = higher confidence)
  const mean = cleanedEfficiencies.reduce((sum, val) => sum + val, 0) / cleanedEfficiencies.length;
  const variance = cleanedEfficiencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cleanedEfficiencies.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;
  
  // Lower CV = higher confidence
  const consistencyBonus = Math.max(0, 0.2 - coefficientOfVariation);
  confidence += consistencyBonus;
  
  return Math.min(confidence, 1.0);
};

/**
 * Remove statistical outliers from efficiency data
 * @param {Array} values - Array of efficiency values
 * @returns {Array} Values with outliers removed
 */
const removeOutliers = (values) => {
  if (values.length < 4) return values;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return values.filter(value => 
    Math.abs(value - mean) <= LEARNING_CONFIG.OUTLIER_THRESHOLD * stdDev
  );
};

/**
 * Calculate seasonal adjustments
 * @param {Array} samples - Efficiency samples
 * @param {Object} conditions - Current conditions
 * @returns {Object} Seasonal adjustments
 */
const calculateSeasonalAdjustments = (samples, conditions) => {
  const currentSeason = getCurrentSeason();
  const seasonalSamples = {};
  
  // Group samples by season
  samples.forEach(sample => {
    const season = sample.conditions.season;
    if (!seasonalSamples[season]) {
      seasonalSamples[season] = [];
    }
    seasonalSamples[season].push(sample.actualEfficiency);
  });

  // Calculate seasonal adjustment factors
  const adjustments = {};
  const baselineEfficiency = samples.reduce((sum, s) => sum + s.actualEfficiency, 0) / samples.length;
  
  Object.keys(seasonalSamples).forEach(season => {
    const seasonEfficiency = seasonalSamples[season].reduce((sum, e) => sum + e, 0) / seasonalSamples[season].length;
    adjustments[season] = seasonEfficiency / baselineEfficiency;
  });

  return {
    seasonal: adjustments[currentSeason] || 1.0,
    allSeasons: adjustments
  };
};

/**
 * Get current season based on date
 * @returns {string} Current season
 */
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'fall';
};

/**
 * Update learning statistics
 * @param {string} driverId - Driver ID
 * @param {Object} sample - New efficiency sample
 */
const updateLearningStats = async (driverId, sample) => {
  try {
    const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
    const allStats = statsJson ? JSON.parse(statsJson) : {};
    
    if (!allStats[driverId]) {
      allStats[driverId] = {
        totalTrips: 0,
        totalDistance: 0,
        averageEfficiency: 0,
        lastUpdated: null
      };
    }

    const driverStats = allStats[driverId];
    driverStats.totalTrips += 1;
    driverStats.totalDistance += sample.distance;
    
    // Update rolling average efficiency
    const newAverage = (
      (driverStats.averageEfficiency * (driverStats.totalTrips - 1)) + 
      sample.actualEfficiency
    ) / driverStats.totalTrips;
    
    driverStats.averageEfficiency = Math.round(newAverage * 10) / 10;
    driverStats.lastUpdated = new Date().toISOString();

    allStats[driverId] = driverStats;
    await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_STATS, JSON.stringify(allStats));
  } catch (error) {
    console.error('Error updating learning stats:', error);
  }
};

/**
 * Get driver efficiency learning statistics
 * @param {string} driverId - Driver ID
 * @returns {Object} Learning statistics
 */
export const getDriverLearningStats = async (driverId) => {
  try {
    const [statsJson, samplesJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS),
      AsyncStorage.getItem(STORAGE_KEYS.TRIP_SAMPLES)
    ]);

    const allStats = statsJson ? JSON.parse(statsJson) : {};
    const allSamples = samplesJson ? JSON.parse(samplesJson) : [];
    
    const driverStats = allStats[driverId] || {};
    const driverSamples = allSamples.filter(s => s.driverId === driverId);

    return {
      ...driverStats,
      recentTrips: driverSamples.slice(-10), // Last 10 trips
      hasLearningData: driverSamples.length >= LEARNING_CONFIG.MIN_TRIPS_FOR_LEARNING,
      learningProgress: Math.min(driverSamples.length / LEARNING_CONFIG.MIN_TRIPS_FOR_LEARNING, 1.0)
    };
  } catch (error) {
    return {
      totalTrips: 0,
      hasLearningData: false,
      error: error.message
    };
  }
};

/**
 * Clear all learning data for a driver
 * @param {string} driverId - Driver ID
 */
export const clearDriverLearningData = async (driverId) => {
  try {
    const [statsJson, samplesJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS),
      AsyncStorage.getItem(STORAGE_KEYS.TRIP_SAMPLES)
    ]);

    // Remove from stats
    const allStats = statsJson ? JSON.parse(statsJson) : {};
    delete allStats[driverId];
    await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_STATS, JSON.stringify(allStats));

    // Remove from samples
    const allSamples = samplesJson ? JSON.parse(samplesJson) : [];
    const filteredSamples = allSamples.filter(s => s.driverId !== driverId);
    await AsyncStorage.setItem(STORAGE_KEYS.TRIP_SAMPLES, JSON.stringify(filteredSamples));

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export the learning system
export default {
  recordTripEfficiency,
  getLearnedEfficiency,
  blendEfficiencyData,
  getDriverLearningStats,
  clearDriverLearningData,
  LEARNING_CONFIG
}; 