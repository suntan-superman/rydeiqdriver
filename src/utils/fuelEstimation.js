// Fuel Cost Estimation Utility for RydeIQ Driver App
// This unique feature helps drivers calculate potential profit before bidding

// Comprehensive vehicle fuel efficiency database
const VEHICLE_MPG_DATABASE = {
  // Popular ride-share vehicles with real-world MPG data
  'Toyota': {
    'Camry': { 
      city: 28, highway: 39, combined: 32,
      fuelType: 'gasoline', tankSize: 15.8
    },
    'Corolla': { 
      city: 31, highway: 40, combined: 35,
      fuelType: 'gasoline', tankSize: 13.2
    },
    'Prius': { 
      city: 58, highway: 53, combined: 56,
      fuelType: 'hybrid', tankSize: 11.3
    },
    'RAV4': { 
      city: 27, highway: 35, combined: 30,
      fuelType: 'gasoline', tankSize: 14.5
    },
    'Highlander': { 
      city: 21, highway: 29, combined: 24,
      fuelType: 'gasoline', tankSize: 17.1
    }
  },
  'Honda': {
    'Civic': { 
      city: 32, highway: 42, combined: 36,
      fuelType: 'gasoline', tankSize: 12.4
    },
    'Accord': { 
      city: 30, highway: 38, combined: 33,
      fuelType: 'gasoline', tankSize: 14.8
    },
    'CR-V': { 
      city: 28, highway: 34, combined: 30,
      fuelType: 'gasoline', tankSize: 14.0
    },
    'Insight': { 
      city: 55, highway: 49, combined: 52,
      fuelType: 'hybrid', tankSize: 10.6
    }
  },
  'Nissan': {
    'Altima': { 
      city: 28, highway: 39, combined: 32,
      fuelType: 'gasoline', tankSize: 16.0
    },
    'Sentra': { 
      city: 29, highway: 39, combined: 33,
      fuelType: 'gasoline', tankSize: 12.3
    },
    'Rogue': { 
      city: 26, highway: 33, combined: 29,
      fuelType: 'gasoline', tankSize: 14.5
    },
    'Leaf': { 
      city: 149, highway: 114, combined: 131, // MPGe for electric
      fuelType: 'electric', batterySize: 40 // kWh
    }
  },
  'Hyundai': {
    'Elantra': { 
      city: 33, highway: 43, combined: 37,
      fuelType: 'gasoline', tankSize: 12.8
    },
    'Sonata': { 
      city: 27, highway: 36, combined: 31,
      fuelType: 'gasoline', tankSize: 16.0
    },
    'Tucson': { 
      city: 23, highway: 28, combined: 25,
      fuelType: 'gasoline', tankSize: 17.2
    }
  },
  'Kia': {
    'Forte': { 
      city: 31, highway: 41, combined: 35,
      fuelType: 'gasoline', tankSize: 13.2
    },
    'Optima': { 
      city: 24, highway: 32, combined: 27,
      fuelType: 'gasoline', tankSize: 16.5
    },
    'Sorento': { 
      city: 24, highway: 32, combined: 27,
      fuelType: 'gasoline', tankSize: 17.7
    }
  },
  'Chevrolet': {
    'Malibu': { 
      city: 29, highway: 36, combined: 32,
      fuelType: 'gasoline', tankSize: 15.8
    },
    'Cruze': { 
      city: 30, highway: 38, combined: 33,
      fuelType: 'gasoline', tankSize: 14.0
    },
    'Equinox': { 
      city: 26, highway: 31, combined: 28,
      fuelType: 'gasoline', tankSize: 14.9
    }
  },
  'Ford': {
    'Fusion': { 
      city: 21, highway: 31, combined: 25,
      fuelType: 'gasoline', tankSize: 16.5
    },
    'Focus': { 
      city: 25, highway: 34, combined: 29,
      fuelType: 'gasoline', tankSize: 12.4
    },
    'Escape': { 
      city: 23, highway: 31, combined: 26,
      fuelType: 'gasoline', tankSize: 15.7
    }
  }
};

// Default MPG for unknown vehicles by category
const DEFAULT_MPG = {
  'standard': { city: 25, highway: 35, combined: 29, fuelType: 'gasoline' },
  'premium': { city: 22, highway: 32, combined: 26, fuelType: 'gasoline' },
  'suv': { city: 20, highway: 28, combined: 23, fuelType: 'gasoline' },
  'electric': { city: 120, highway: 100, combined: 110, fuelType: 'electric' },
  'hybrid': { city: 50, highway: 45, combined: 48, fuelType: 'hybrid' }
};

// Import live fuel price service
import { getFuelPrices } from '../services/api/fuelPriceService';

// Cached fuel prices (updated when getFuelPrices is called)
let cachedFuelPrices = null;
let lastFuelPriceUpdate = null;
const FUEL_PRICE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Current fuel prices (now fetches from live API)
const getCurrentFuelPrices = async (location = null, forceRefresh = false) => {
  try {
    // Check if we have cached prices that are still fresh
    if (!forceRefresh && cachedFuelPrices && lastFuelPriceUpdate) {
      const cacheAge = Date.now() - lastFuelPriceUpdate;
      if (cacheAge < FUEL_PRICE_CACHE_DURATION) {
        return cachedFuelPrices;
      }
    }

    // Fetch fresh prices from API
    const freshPrices = await getFuelPrices(location, forceRefresh);
    
    // Update cache
    cachedFuelPrices = {
      gasoline: freshPrices.gasoline,
      diesel: freshPrices.diesel,
      electricity: freshPrices.electricity,
      hybrid: freshPrices.hybrid,
      source: freshPrices.source,
      lastUpdated: freshPrices.lastUpdated,
      location: freshPrices.location
    };
    lastFuelPriceUpdate = Date.now();

    return cachedFuelPrices;
  } catch (error) {
    // Fallback to default prices if API fails
    return {
      gasoline: 3.45,
      diesel: 3.85,
      electricity: 0.13,
      hybrid: 3.45,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Get vehicle fuel efficiency data with AI learning integration
 * @param {string} make - Vehicle make (Toyota, Honda, etc.)
 * @param {string} model - Vehicle model (Camry, Civic, etc.)
 * @param {string} year - Vehicle year
 * @param {string} vehicleType - Vehicle type (standard, premium, etc.)
 * @param {string} driverId - Driver ID for learning data (optional)
 * @param {Object} conditions - Current driving conditions (optional)
 * @returns {Object} Fuel efficiency data with learning integration
 */
export const getVehicleMPG = async (make, model, year, vehicleType = 'standard', driverId = null, conditions = {}) => {
  // Normalize inputs
  const normalizedMake = make?.trim()?.toLowerCase();
  const normalizedModel = model?.trim()?.toLowerCase();
  
  // Try to find exact match in database
  for (const [dbMake, models] of Object.entries(VEHICLE_MPG_DATABASE)) {
    if (dbMake.toLowerCase() === normalizedMake) {
      for (const [dbModel, specs] of Object.entries(models)) {
        if (dbModel.toLowerCase() === normalizedModel) {
          return {
            ...specs,
            source: 'database',
            make: dbMake,
            model: dbModel
          };
        }
      }
    }
  }
  
  // Fall back to default based on vehicle type
  const defaultSpecs = DEFAULT_MPG[vehicleType] || DEFAULT_MPG.standard;
  let finalSpecs = {
    ...defaultSpecs,
    source: 'estimated',
    make,
    model
  };

  // If we have a driver ID, try to get learned efficiency
  if (driverId) {
    try {
      const { getLearnedEfficiency, blendEfficiencyData } = await import('./driverEfficiencyLearning');
      
      const learnedData = await getLearnedEfficiency({
        driverId,
        vehicle: { make, model, year, vehicleType },
        conditions
      });

      if (learnedData.hasLearnedData) {
        const blendedData = blendEfficiencyData({
          databaseEfficiency: finalSpecs.combined,
          learnedData,
          conditions
        });

        finalSpecs = {
          ...finalSpecs,
          combined: blendedData.recommendedEfficiency,
          city: Math.round(blendedData.recommendedEfficiency * 0.85), // Estimate city from combined
          highway: Math.round(blendedData.recommendedEfficiency * 1.15), // Estimate highway from combined
          source: blendedData.source,
          confidence: blendedData.confidence,
          learningData: learnedData,
          blendInfo: blendedData.blend
        };
      }
    } catch (error) {
      // If learning system fails, continue with database/default data
      console.warn('Failed to get learned efficiency:', error);
    }
  }

  return finalSpecs;
};

/**
 * Calculate fuel cost for a trip
 * @param {Object} params - Calculation parameters
 * @param {number} params.distance - Trip distance in miles
 * @param {Object} params.vehicle - Vehicle information
 * @param {number} params.trafficFactor - Traffic factor (1.0 = normal, 1.2 = heavy traffic)
 * @param {Object} params.customFuelPrices - Custom fuel prices (optional)
 * @param {Object} params.location - Driver location for local fuel prices
 * @returns {Object} Detailed fuel cost breakdown
 */
export const calculateFuelCost = async ({
  distance,
  vehicle,
  trafficFactor = 1.0,
  customFuelPrices = null,
  location = null
}) => {
  if (!distance || distance <= 0) {
    return {
      totalCost: 0,
      costBreakdown: {},
      error: 'Invalid distance'
    };
  }

  // Get vehicle MPG data (now async for learning integration)
  const mpgData = await getVehicleMPG(
    vehicle.make, 
    vehicle.model, 
    vehicle.year, 
    vehicle.vehicleType,
    vehicle.driverId, // Pass driver ID for learning
    { trafficFactor, location } // Pass conditions
  );

  // Get current fuel prices (now async)
  const fuelPrices = customFuelPrices || await getCurrentFuelPrices(location);

  // Calculate effective MPG based on traffic
  // Heavy traffic reduces fuel efficiency
  let effectiveMPG;
  if (trafficFactor <= 1.1) {
    // Light traffic - use combined MPG
    effectiveMPG = mpgData.combined;
  } else if (trafficFactor <= 1.3) {
    // Moderate traffic - between city and combined
    effectiveMPG = (mpgData.city + mpgData.combined) / 2;
  } else {
    // Heavy traffic - use city MPG
    effectiveMPG = mpgData.city;
  }

  // Apply traffic factor penalty
  effectiveMPG = effectiveMPG / Math.max(1.0, trafficFactor);

  let totalCost = 0;
  let costBreakdown = {};

  if (mpgData.fuelType === 'electric') {
    // Electric vehicle calculation (kWh per 100 miles)
    const kWhPer100Miles = 100 / effectiveMPG; // Convert MPGe to kWh/100mi
    const energyNeeded = (distance / 100) * kWhPer100Miles;
    totalCost = energyNeeded * fuelPrices.electricity;
    
    costBreakdown = {
      energyNeeded: energyNeeded.toFixed(2),
      unit: 'kWh',
      pricePerUnit: fuelPrices.electricity,
      efficiency: effectiveMPG,
      efficiencyUnit: 'MPGe'
    };
  } else {
    // Gasoline/Hybrid calculation
    const gallonsNeeded = distance / effectiveMPG;
    const fuelPrice = mpgData.fuelType === 'hybrid' ? 
      fuelPrices.hybrid : fuelPrices.gasoline;
    totalCost = gallonsNeeded * fuelPrice;
    
    costBreakdown = {
      fuelNeeded: gallonsNeeded.toFixed(3),
      unit: 'gallons',
      pricePerUnit: fuelPrice,
      efficiency: effectiveMPG,
      efficiencyUnit: 'MPG'
    };
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to cents
    costBreakdown,
    vehicleInfo: {
      make: mpgData.make,
      model: mpgData.model,
      fuelType: mpgData.fuelType,
      dataSource: mpgData.source
    },
    trafficImpact: {
      factor: trafficFactor,
      originalMPG: mpgData.combined,
      effectiveMPG: Math.round(effectiveMPG * 10) / 10
    }
  };
};

/**
 * Calculate profit after expenses for a ride bid
 * @param {Object} params - Calculation parameters
 * @param {number} params.bidAmount - Driver's bid amount
 * @param {number} params.distance - Trip distance in miles
 * @param {Object} params.vehicle - Vehicle information
 * @param {number} params.commissionRate - Platform commission rate (0.15 = 15%)
 * @param {number} params.trafficFactor - Traffic factor for fuel calculation
 * @param {Object} params.additionalExpenses - Other expenses (wear, insurance, etc.)
 * @param {Object} params.location - Driver location for local fuel prices
 * @returns {Object} Detailed profit analysis
 */
export const calculateProfitEstimate = async ({
  bidAmount,
  distance,
  vehicle,
  commissionRate = 0.15, // 15% default commission
  trafficFactor = 1.0,
  additionalExpenses = {},
  location = null
}) => {
  if (!bidAmount || bidAmount <= 0) {
    return {
      netProfit: 0,
      profitMargin: 0,
      breakdown: {},
      error: 'Invalid bid amount'
    };
  }

  // Calculate fuel cost
  const fuelCalculation = await calculateFuelCost({
    distance,
    vehicle,
    trafficFactor,
    location
  });

  // Platform commission
  const commission = bidAmount * commissionRate;

  // Vehicle wear and tear (approximate $0.10 per mile)
  const wearTear = distance * (additionalExpenses.wearTearPerMile || 0.10);

  // Insurance allocation (approximate $0.05 per mile)
  const insuranceAllocation = distance * (additionalExpenses.insurancePerMile || 0.05);

  // Total expenses
  const totalExpenses = fuelCalculation.totalCost + commission + wearTear + insuranceAllocation;

  // Net profit
  const netProfit = bidAmount - totalExpenses;
  const profitMargin = (netProfit / bidAmount) * 100;

  // Profit per mile
  const profitPerMile = distance > 0 ? netProfit / distance : 0;

  return {
    bidAmount,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    profitPerMile: Math.round(profitPerMile * 100) / 100,
    breakdown: {
      grossEarnings: bidAmount,
      fuelCost: fuelCalculation.totalCost,
      commission: Math.round(commission * 100) / 100,
      wearTear: Math.round(wearTear * 100) / 100,
      insurance: Math.round(insuranceAllocation * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100
    },
    fuelDetails: fuelCalculation,
    recommendations: generateProfitRecommendations(netProfit, profitMargin, bidAmount)
  };
};

/**
 * Generate recommendations based on profit analysis
 * @param {number} netProfit - Calculated net profit
 * @param {number} profitMargin - Profit margin percentage
 * @param {number} bidAmount - Original bid amount
 * @returns {Array} Array of recommendation objects
 */
const generateProfitRecommendations = (netProfit, profitMargin, bidAmount) => {
  const recommendations = [];

  if (netProfit < 0) {
    recommendations.push({
      type: 'warning',
      message: 'This bid may result in a loss. Consider increasing your bid.',
      action: 'increase_bid',
      suggestedIncrease: Math.abs(netProfit) + 2 // Cover loss + $2 profit
    });
  } else if (profitMargin < 10) {
    recommendations.push({
      type: 'caution',
      message: 'Low profit margin. Consider if the time investment is worth it.',
      action: 'evaluate_time'
    });
  } else if (profitMargin > 40) {
    recommendations.push({
      type: 'success',
      message: 'Excellent profit margin! This looks like a great ride.',
      action: 'accept_quickly'
    });
  }

  if (netProfit > 0 && netProfit < 5) {
    recommendations.push({
      type: 'info',
      message: 'Consider shorter, more profitable rides in your area.',
      action: 'optimize_strategy'
    });
  }

  return recommendations;
};

/**
 * Get optimal bid suggestion based on profit targets
 * @param {Object} params - Calculation parameters
 * @param {number} params.companyBid - Original company bid
 * @param {number} params.distance - Trip distance
 * @param {Object} params.vehicle - Vehicle information
 * @param {number} params.targetProfit - Desired profit amount
 * @param {number} params.targetMargin - Desired profit margin (optional)
 * @param {Object} params.location - Driver location for local fuel prices
 * @returns {Object} Optimal bid suggestion
 */
export const suggestOptimalBid = async ({
  companyBid,
  distance,
  vehicle,
  targetProfit = 10, // Default $10 target profit
  targetMargin = null,
  trafficFactor = 1.0,
  location = null
}) => {
  const commissionRate = 0.15; // 15% commission
  
  // Calculate base expenses (excluding commission)
  const fuelCost = (await calculateFuelCost({ distance, vehicle, trafficFactor, location })).totalCost;
  const wearTear = distance * 0.10;
  const insurance = distance * 0.05;
  const baseExpenses = fuelCost + wearTear + insurance;

  let suggestedBid;
  
  if (targetMargin) {
    // Calculate bid based on target margin
    // netProfit = bidAmount - (baseExpenses + bidAmount * commission)
    // targetMargin = (netProfit / bidAmount) * 100
    // Solve for bidAmount
    suggestedBid = baseExpenses / (1 - commissionRate - (targetMargin / 100));
  } else {
    // Calculate bid based on target profit
    // targetProfit = bidAmount - (baseExpenses + bidAmount * commission)
    // Solve for bidAmount
    suggestedBid = (targetProfit + baseExpenses) / (1 - commissionRate);
  }

  // Round to nearest quarter
  suggestedBid = Math.round(suggestedBid * 4) / 4;

  // Ensure minimum of company bid - 10%
  const minimumBid = companyBid * 0.9;
  suggestedBid = Math.max(suggestedBid, minimumBid);

  // Calculate actual profit at suggested bid
  const profitAnalysis = await calculateProfitEstimate({
    bidAmount: suggestedBid,
    distance,
    vehicle,
    trafficFactor,
    location
  });

  return {
    suggestedBid,
    companyBid,
    difference: suggestedBid - companyBid,
    profitAnalysis,
    reasoning: `Optimized for ${targetMargin ? `${targetMargin}% margin` : `$${targetProfit} profit`}`
  };
};

// Export utility functions
export default {
  getVehicleMPG,
  calculateFuelCost,
  calculateProfitEstimate,
  suggestOptimalBid,
  getCurrentFuelPrices,
  VEHICLE_MPG_DATABASE
};

// Export async versions for convenience
export {
  getCurrentFuelPrices as getFuelPrices
}; 