import { db } from './firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

class SmartMatchingService {
  constructor() {
    this.db = db;
    this.preferenceCache = new Map();
    this.marketDataCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get smart ride recommendations for a driver
   * @param {string} driverId - Driver's user ID
   * @param {Object} driverLocation - Current driver location
   * @param {Object} options - Matching options
   * @returns {Promise<Object>} Smart recommendations
   */
  async getSmartRecommendations(driverId, driverLocation, options = {}) {
    try {
      const {
        maxDistance = 10, // miles
        timeWindow = 30, // minutes
        includePredictions = true,
        marketAnalysis = true
      } = options;

      // Get driver preferences and behavior patterns
      const [preferences, behaviorPatterns, marketData] = await Promise.all([
        this.getDriverPreferences(driverId),
        this.getBehaviorPatterns(driverId),
        marketAnalysis ? this.getMarketData(driverLocation) : null
      ]);

      // Get available ride requests
      const availableRides = await this.getAvailableRideRequests(driverId, driverLocation, maxDistance);

      // Score and rank rides based on smart matching
      const scoredRides = await this.scoreRideRequests(
        availableRides, 
        preferences, 
        behaviorPatterns, 
        marketData,
        driverLocation
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        scoredRides, 
        preferences, 
        behaviorPatterns, 
        marketData
      );

      return {
        recommendations,
        preferences,
        behaviorPatterns,
        marketData,
        totalAvailable: availableRides.length,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting smart recommendations:', error);
      throw error;
    }
  }

  /**
   * Get driver preferences learned from behavior
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object>} Driver preferences
   */
  async getDriverPreferences(driverId) {
    try {
      // Check cache first
      const cacheKey = `preferences_${driverId}`;
      const cached = this.preferenceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // Get preference document
      const prefDoc = await getDoc(doc(this.db, 'driverPreferences', driverId));
      
      if (prefDoc.exists()) {
        const preferences = prefDoc.data();
        this.preferenceCache.set(cacheKey, { data: preferences, timestamp: Date.now() });
        return preferences;
      }

      // If no preferences exist, create default based on analytics
      const defaultPreferences = await this.createDefaultPreferences(driverId);
      await this.saveDriverPreferences(driverId, defaultPreferences);
      
      this.preferenceCache.set(cacheKey, { data: defaultPreferences, timestamp: Date.now() });
      return defaultPreferences;
    } catch (error) {
      console.error('Error getting driver preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get driver behavior patterns from historical data
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object>} Behavior patterns
   */
  async getBehaviorPatterns(driverId) {
    try {
      const dateRange = this.getDateRange('30d');
      
      // Get completed rides
      const ridesQuery = query(
        collection(this.db, 'activeRides'),
        where('driverId', '==', driverId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', dateRange.start),
        where('completedAt', '<=', dateRange.end),
        orderBy('completedAt', 'desc'),
        limit(100)
      );

      const ridesSnapshot = await getDocs(ridesQuery);
      const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get bid history
      const bidsQuery = query(
        collection(this.db, 'rideRequests'),
        where('driverBids', 'array-contains-any', [{ driverId }]),
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end),
        orderBy('createdAt', 'desc'),
        limit(200)
      );

      const bidsSnapshot = await getDocs(bidsQuery);
      const allBids = [];
      
      bidsSnapshot.docs.forEach(doc => {
        const rideRequest = doc.data();
        const driverBids = rideRequest.driverBids || [];
        const driverBid = driverBids.find(bid => bid.driverId === driverId);
        
        if (driverBid) {
          allBids.push({
            rideRequestId: doc.id,
            bidAmount: driverBid.bidAmount,
            bidType: driverBid.bidType,
            submittedAt: driverBid.submittedAt,
            wasAccepted: rideRequest.acceptedDriver?.driverId === driverId,
            rideRequest: rideRequest
          });
        }
      });

      // Analyze patterns
      return this.analyzeBehaviorPatterns(rides, allBids);
    } catch (error) {
      console.error('Error getting behavior patterns:', error);
      return this.getDefaultBehaviorPatterns();
    }
  }

  /**
   * Get market data for the area
   * @param {Object} location - Location to analyze
   * @returns {Promise<Object>} Market data
   */
  async getMarketData(location) {
    try {
      const cacheKey = `market_${location.latitude}_${location.longitude}`;
      const cached = this.marketDataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      const dateRange = this.getDateRange('7d');
      
      // Get recent rides in the area (simplified - in production would use geospatial queries)
      const marketQuery = query(
        collection(this.db, 'activeRides'),
        where('status', '==', 'completed'),
        where('completedAt', '>=', dateRange.start),
        where('completedAt', '<=', dateRange.end),
        limit(500)
      );

      const marketSnapshot = await getDocs(marketQuery);
      const marketRides = marketSnapshot.docs.map(doc => doc.data());

      // Analyze market conditions
      const marketData = this.analyzeMarketConditions(marketRides, location);
      
      this.marketDataCache.set(cacheKey, { data: marketData, timestamp: Date.now() });
      return marketData;
    } catch (error) {
      console.error('Error getting market data:', error);
      return this.getDefaultMarketData();
    }
  }

  /**
   * Get available ride requests for the driver
   * @param {string} driverId - Driver's user ID
   * @param {Object} driverLocation - Driver's current location
   * @param {number} maxDistance - Maximum distance in miles
   * @returns {Promise<Array>} Available ride requests
   */
  async getAvailableRideRequests(driverId, driverLocation, maxDistance) {
    try {
      const rideRequestsQuery = query(
        collection(this.db, 'rideRequests'),
        where('availableDrivers', 'array-contains', driverId),
        where('status', 'in', ['open_for_bids', 'pending']),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(rideRequestsQuery);
      const rideRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by distance (simplified - in production would use geospatial queries)
      return rideRequests.filter(ride => {
        const distance = this.calculateDistance(driverLocation, ride.pickup);
        return distance <= maxDistance;
      });
    } catch (error) {
      console.error('Error getting available ride requests:', error);
      return [];
    }
  }

  /**
   * Score ride requests based on smart matching criteria
   * @param {Array} rideRequests - Available ride requests
   * @param {Object} preferences - Driver preferences
   * @param {Object} behaviorPatterns - Driver behavior patterns
   * @param {Object} marketData - Market data
   * @param {Object} driverLocation - Driver location
   * @returns {Promise<Array>} Scored ride requests
   */
  async scoreRideRequests(rideRequests, preferences, behaviorPatterns, marketData, driverLocation) {
    return rideRequests.map(ride => {
      const score = this.calculateRideScore(ride, preferences, behaviorPatterns, marketData, driverLocation);
      return {
        ...ride,
        smartScore: score.total,
        scoreBreakdown: score.breakdown,
        recommendations: score.recommendations
      };
    }).sort((a, b) => b.smartScore - a.smartScore);
  }

  /**
   * Calculate smart score for a ride request
   * @param {Object} ride - Ride request
   * @param {Object} preferences - Driver preferences
   * @param {Object} behaviorPatterns - Driver behavior patterns
   * @param {Object} marketData - Market data
   * @param {Object} driverLocation - Driver location
   * @returns {Object} Score breakdown
   */
  calculateRideScore(ride, preferences, behaviorPatterns, marketData, driverLocation) {
    const breakdown = {
      distance: 0,
      timeOfDay: 0,
      rideType: 0,
      earnings: 0,
      market: 0,
      behavior: 0
    };

    const recommendations = [];

    // Distance scoring (closer is better)
    const distance = this.calculateDistance(driverLocation, ride.pickup);
    breakdown.distance = Math.max(0, 100 - (distance * 10)); // 0-100 scale

    // Time of day scoring
    const rideTime = new Date(ride.scheduledTime || ride.createdAt);
    const hour = rideTime.getHours();
    const timeBlock = this.getTimeBlockForHour(hour);
    
    if (preferences.preferredTimeBlocks.includes(timeBlock)) {
      breakdown.timeOfDay = 100;
    } else if (preferences.acceptableTimeBlocks.includes(timeBlock)) {
      breakdown.timeOfDay = 60;
    } else {
      breakdown.timeOfDay = 20;
    }

    // Ride type scoring
    if (preferences.preferredRideTypes.includes(ride.rideType || 'standard')) {
      breakdown.rideType = 100;
    } else {
      breakdown.rideType = 50;
    }

    // Earnings potential scoring
    const estimatedEarnings = this.estimateRideEarnings(ride, preferences);
    const earningsScore = Math.min(100, (estimatedEarnings / preferences.targetEarningsPerRide) * 100);
    breakdown.earnings = earningsScore;

    // Market conditions scoring
    if (marketData) {
      const marketScore = this.calculateMarketScore(ride, marketData);
      breakdown.market = marketScore;
    }

    // Behavior pattern scoring
    const behaviorScore = this.calculateBehaviorScore(ride, behaviorPatterns);
    breakdown.behavior = behaviorScore;

    // Generate recommendations
    if (breakdown.distance < 30) {
      recommendations.push({
        type: 'warning',
        message: 'Long pickup distance - consider fuel costs'
      });
    }

    if (breakdown.timeOfDay < 40) {
      recommendations.push({
        type: 'info',
        message: 'Outside your preferred time blocks'
      });
    }

    if (breakdown.earnings > 120) {
      recommendations.push({
        type: 'success',
        message: 'High earnings potential!'
      });
    }

    // Calculate weighted total score
    const weights = preferences.scoreWeights || {
      distance: 0.25,
      timeOfDay: 0.20,
      rideType: 0.15,
      earnings: 0.25,
      market: 0.10,
      behavior: 0.05
    };

    const totalScore = Object.keys(breakdown).reduce((sum, key) => {
      return sum + (breakdown[key] * (weights[key] || 0));
    }, 0);

    return {
      total: Math.round(totalScore),
      breakdown,
      recommendations
    };
  }

  /**
   * Generate smart recommendations
   * @param {Array} scoredRides - Scored ride requests
   * @param {Object} preferences - Driver preferences
   * @param {Object} behaviorPatterns - Driver behavior patterns
   * @param {Object} marketData - Market data
   * @returns {Object} Recommendations
   */
  generateRecommendations(scoredRides, preferences, behaviorPatterns, marketData) {
    const recommendations = {
      topPicks: scoredRides.slice(0, 3),
      avoid: scoredRides.filter(ride => ride.smartScore < 30),
      insights: [],
      suggestions: []
    };

    // Generate insights
    if (scoredRides.length > 0) {
      const avgScore = scoredRides.reduce((sum, ride) => sum + ride.smartScore, 0) / scoredRides.length;
      
      if (avgScore > 80) {
        recommendations.insights.push({
          type: 'success',
          message: 'Great selection of rides available!',
          icon: 'star'
        });
      } else if (avgScore < 50) {
        recommendations.insights.push({
          type: 'warning',
          message: 'Limited high-quality rides available',
          icon: 'warning'
        });
      }
    }

    // Generate suggestions based on patterns
    if (behaviorPatterns.lowAcceptanceRate) {
      recommendations.suggestions.push({
        type: 'improvement',
        title: 'Improve Acceptance Rate',
        message: 'Consider being more selective with ride acceptance',
        action: 'Review your rate settings'
      });
    }

    if (marketData && marketData.demandHigh) {
      recommendations.suggestions.push({
        type: 'opportunity',
        title: 'High Demand Period',
        message: 'Market conditions are favorable for higher earnings',
        action: 'Consider increasing your rates'
      });
    }

    return recommendations;
  }

  /**
   * Create default preferences based on analytics
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object>} Default preferences
   */
  async createDefaultPreferences(driverId) {
    try {
      // Get analytics data to inform preferences
      const analyticsService = require('./analyticsService').default;
      const analytics = await analyticsService.getDriverAnalytics(driverId, { timeRange: '30d' });

      const preferences = {
        preferredTimeBlocks: [],
        acceptableTimeBlocks: [],
        preferredRideTypes: ['standard'],
        targetEarningsPerRide: 15,
        maxPickupDistance: 5,
        scoreWeights: {
          distance: 0.25,
          timeOfDay: 0.20,
          rideType: 0.15,
          earnings: 0.25,
          market: 0.10,
          behavior: 0.05
        },
        learningEnabled: true,
        lastUpdated: new Date()
      };

      // Set preferred time blocks based on earnings data
      if (analytics.earnings.timeBlockEarnings) {
        const timeBlocks = analytics.earnings.timeBlockEarnings;
        const sortedBlocks = Object.keys(timeBlocks).sort((a, b) => 
          timeBlocks[b].hourlyRate - timeBlocks[a].hourlyRate
        );

        preferences.preferredTimeBlocks = sortedBlocks.slice(0, 2);
        preferences.acceptableTimeBlocks = sortedBlocks.slice(2, 4);
      }

      // Set target earnings based on historical data
      if (analytics.earnings.averageEarningsPerRide > 0) {
        preferences.targetEarningsPerRide = Math.round(analytics.earnings.averageEarningsPerRide * 1.1);
      }

      return preferences;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save driver preferences
   * @param {string} driverId - Driver's user ID
   * @param {Object} preferences - Preferences to save
   */
  async saveDriverPreferences(driverId, preferences) {
    try {
      await setDoc(doc(this.db, 'driverPreferences', driverId), {
        ...preferences,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving driver preferences:', error);
    }
  }

  /**
   * Update driver preferences based on behavior
   * @param {string} driverId - Driver's user ID
   * @param {Object} behaviorData - New behavior data
   */
  async updatePreferencesFromBehavior(driverId, behaviorData) {
    try {
      const preferences = await this.getDriverPreferences(driverId);
      
      if (!preferences.learningEnabled) {
        return;
      }

      // Update preferences based on behavior
      const updatedPreferences = this.learnFromBehavior(preferences, behaviorData);
      await this.saveDriverPreferences(driverId, updatedPreferences);
      
      // Clear cache
      this.preferenceCache.delete(`preferences_${driverId}`);
    } catch (error) {
      console.error('Error updating preferences from behavior:', error);
    }
  }

  // Helper methods
  getDateRange(timeRange) {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
  }

  getTimeBlockForHour(hour) {
    if (hour >= 6 && hour < 9) return 'morning_rush';
    if (hour >= 11 && hour < 13) return 'lunch_rush';
    if (hour >= 16 && hour < 18) return 'evening_rush';
    if (hour >= 1 && hour < 3) return 'late_night';
    return 'default';
  }

  calculateDistance(location1, location2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(location1.latitude)) * Math.cos(this.toRadians(location2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  estimateRideEarnings(ride, preferences) {
    // Simplified earnings estimation
    const baseRate = 2.00;
    const distance = this.calculateDistance(ride.pickup, ride.destination);
    return baseRate + (distance * 1.50);
  }

  calculateMarketScore(ride, marketData) {
    // Simplified market scoring
    if (marketData.demandHigh) return 80;
    if (marketData.demandMedium) return 60;
    return 40;
  }

  calculateBehaviorScore(ride, behaviorPatterns) {
    // Simplified behavior scoring based on patterns
    return 70; // Default score
  }

  analyzeBehaviorPatterns(rides, bids) {
    return {
      totalRides: rides.length,
      totalBids: bids.length,
      acceptanceRate: bids.length > 0 ? (bids.filter(b => b.wasAccepted).length / bids.length) * 100 : 0,
      averageEarnings: rides.length > 0 ? rides.reduce((sum, ride) => sum + (ride.bidAmount || 0), 0) / rides.length : 0,
      preferredTimeBlocks: this.analyzeTimePreferences(rides),
      lowAcceptanceRate: bids.length > 10 && (bids.filter(b => b.wasAccepted).length / bids.length) < 0.3
    };
  }

  analyzeTimePreferences(rides) {
    const timeBlocks = {};
    rides.forEach(ride => {
      const completedAt = ride.completedAt?.toDate() || new Date();
      const timeBlock = this.getTimeBlockForHour(completedAt.getHours());
      timeBlocks[timeBlock] = (timeBlocks[timeBlock] || 0) + 1;
    });
    
    return Object.keys(timeBlocks).sort((a, b) => timeBlocks[b] - timeBlocks[a]);
  }

  analyzeMarketConditions(rides, location) {
    const totalRides = rides.length;
    const avgEarnings = rides.reduce((sum, ride) => sum + (ride.bidAmount || 0), 0) / totalRides;
    
    return {
      totalRides,
      averageEarnings: avgEarnings,
      demandHigh: totalRides > 100,
      demandMedium: totalRides > 50,
      demandLow: totalRides <= 50
    };
  }

  learnFromBehavior(preferences, behaviorData) {
    // Simple learning algorithm - in production would be more sophisticated
    const updatedPreferences = { ...preferences };
    
    // Update time preferences based on successful rides
    if (behaviorData.successfulRides) {
      const newTimeBlocks = this.analyzeTimePreferences(behaviorData.successfulRides);
      updatedPreferences.preferredTimeBlocks = newTimeBlocks.slice(0, 2);
    }
    
    return updatedPreferences;
  }

  getDefaultPreferences() {
    return {
      preferredTimeBlocks: ['morning_rush', 'evening_rush'],
      acceptableTimeBlocks: ['lunch_rush', 'default'],
      preferredRideTypes: ['standard'],
      targetEarningsPerRide: 15,
      maxPickupDistance: 5,
      scoreWeights: {
        distance: 0.25,
        timeOfDay: 0.20,
        rideType: 0.15,
        earnings: 0.25,
        market: 0.10,
        behavior: 0.05
      },
      learningEnabled: true,
      lastUpdated: new Date()
    };
  }

  getDefaultBehaviorPatterns() {
    return {
      totalRides: 0,
      totalBids: 0,
      acceptanceRate: 0,
      averageEarnings: 0,
      preferredTimeBlocks: [],
      lowAcceptanceRate: false
    };
  }

  getDefaultMarketData() {
    return {
      totalRides: 0,
      averageEarnings: 0,
      demandHigh: false,
      demandMedium: false,
      demandLow: true
    };
  }
}

// Export singleton instance
export default new SmartMatchingService();
