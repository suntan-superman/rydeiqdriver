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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import analyticsService from './analyticsService';
import bidCalculationService from './bidCalculationService';
import rateSettingsService from './rateSettingsService';

class EarningsOptimizationService {
  constructor() {
    this.db = db;
    this.earningsGoals = [];
    this.optimizationSettings = {
      autoOptimize: true,
      marketAnalysis: true,
      performanceTracking: true,
      goalTracking: true,
      predictiveAnalytics: true
    };
    this.marketData = {};
    this.performanceMetrics = {};
  }

  /**
   * Initialize earnings optimization service
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      
      // Load optimization settings
      await this.loadOptimizationSettings();
      
      // Load earnings goals
      await this.loadEarningsGoals();
      
      // Initialize market analysis
      await this.initializeMarketAnalysis();
      
      console.log('✅ Earnings Optimization Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Earnings Optimization Service:', error);
      return false;
    }
  }

  /**
   * Get comprehensive earnings optimization analysis
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Optimization analysis
   */
  async getEarningsOptimizationAnalysis(timeRange = '30d') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      // Get comprehensive analytics data
      const analyticsData = await analyticsService.getDriverAnalytics(this.driverId, {
        timeRange,
        includePredictions: true,
        includeMarketComparison: true
      });

      // Get rate settings
      const rateSettings = await rateSettingsService.getRateSettings(this.driverId);

      // Get market analysis
      const marketAnalysis = await this.getMarketAnalysis(dateRange);

      // Get performance optimization recommendations
      const optimizationRecommendations = await this.getOptimizationRecommendations(analyticsData, marketAnalysis);

      // Get earnings forecasting
      const earningsForecast = await this.getEarningsForecast(analyticsData, timeRange);

      // Get goal tracking
      const goalTracking = await this.getGoalTracking(analyticsData);

      return {
        currentEarnings: analyticsData.earnings,
        marketAnalysis,
        optimizationRecommendations,
        earningsForecast,
        goalTracking,
        rateSettings,
        performanceMetrics: this.calculatePerformanceMetrics(analyticsData),
        timeRange,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting earnings optimization analysis:', error);
      throw error;
    }
  }

  /**
   * Get market analysis for earnings optimization
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} Market analysis
   */
  async getMarketAnalysis(dateRange) {
    try {
      // Get market demand data
      const demandQuery = query(
        collection(this.db, 'marketDemand'),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const demandSnapshot = await getDocs(demandQuery);
      const demandData = demandSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get competitor pricing data
      const pricingQuery = query(
        collection(this.db, 'competitorPricing'),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const pricingSnapshot = await getDocs(pricingQuery);
      const pricingData = pricingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get surge pricing data
      const surgeQuery = query(
        collection(this.db, 'surgePricing'),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const surgeSnapshot = await getDocs(surgeQuery);
      const surgeData = surgeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return this.analyzeMarketData(demandData, pricingData, surgeData);
    } catch (error) {
      console.error('Error getting market analysis:', error);
      return this.getDefaultMarketAnalysis();
    }
  }

  /**
   * Analyze market data for insights
   * @param {Array} demandData - Market demand data
   * @param {Array} pricingData - Competitor pricing data
   * @param {Array} surgeData - Surge pricing data
   * @returns {Object} Market analysis
   */
  analyzeMarketData(demandData, pricingData, surgeData) {
    const analysis = {
      demandTrends: this.analyzeDemandTrends(demandData),
      pricingInsights: this.analyzePricingInsights(pricingData),
      surgeOpportunities: this.analyzeSurgeOpportunities(surgeData),
      marketRecommendations: [],
      optimalTimeBlocks: [],
      competitivePosition: 'average'
    };

    // Generate market recommendations
    analysis.marketRecommendations = this.generateMarketRecommendations(analysis);
    
    // Identify optimal time blocks
    analysis.optimalTimeBlocks = this.identifyOptimalTimeBlocks(analysis);

    return analysis;
  }

  /**
   * Analyze demand trends
   * @param {Array} demandData - Demand data
   * @returns {Object} Demand analysis
   */
  analyzeDemandTrends(demandData) {
    const trends = {
      peakHours: [],
      lowDemandHours: [],
      weeklyPatterns: {},
      seasonalTrends: {},
      averageDemand: 0,
      demandVolatility: 0
    };

    if (demandData.length === 0) {
      return trends;
    }

    // Analyze hourly demand patterns
    const hourlyDemand = {};
    demandData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      hourlyDemand[hour] = (hourlyDemand[hour] || 0) + data.demandLevel;
    });

    // Find peak and low demand hours
    const sortedHours = Object.entries(hourlyDemand)
      .sort(([,a], [,b]) => b - a);
    
    trends.peakHours = sortedHours.slice(0, 5).map(([hour]) => parseInt(hour));
    trends.lowDemandHours = sortedHours.slice(-5).map(([hour]) => parseInt(hour));

    // Calculate average demand
    const totalDemand = demandData.reduce((sum, data) => sum + data.demandLevel, 0);
    trends.averageDemand = totalDemand / demandData.length;

    return trends;
  }

  /**
   * Analyze pricing insights
   * @param {Array} pricingData - Pricing data
   * @returns {Object} Pricing analysis
   */
  analyzePricingInsights(pricingData) {
    const insights = {
      averageMarketRate: 0,
      pricingTrends: {},
      competitiveAdvantage: 0,
      optimalPricingStrategy: 'balanced'
    };

    if (pricingData.length === 0) {
      return insights;
    }

    // Calculate average market rate
    const totalRates = pricingData.reduce((sum, data) => sum + data.averageRate, 0);
    insights.averageMarketRate = totalRates / pricingData.length;

    // Analyze pricing trends
    const recentData = pricingData.slice(0, 7); // Last 7 days
    const olderData = pricingData.slice(7, 14); // Previous 7 days
    
    if (recentData.length > 0 && olderData.length > 0) {
      const recentAvg = recentData.reduce((sum, data) => sum + data.averageRate, 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, data) => sum + data.averageRate, 0) / olderData.length;
      
      insights.pricingTrends = {
        direction: recentAvg > olderAvg ? 'increasing' : 'decreasing',
        percentage: Math.abs((recentAvg - olderAvg) / olderAvg * 100)
      };
    }

    return insights;
  }

  /**
   * Analyze surge opportunities
   * @param {Array} surgeData - Surge pricing data
   * @returns {Object} Surge analysis
   */
  analyzeSurgeOpportunities(surgeData) {
    const opportunities = {
      highSurgeHours: [],
      surgeFrequency: 0,
      averageSurgeMultiplier: 1.0,
      surgePredictability: 'low'
    };

    if (surgeData.length === 0) {
      return opportunities;
    }

    // Analyze surge patterns
    const surgeHours = {};
    let totalSurge = 0;
    
    surgeData.forEach(data => {
      if (data.surgeMultiplier > 1.0) {
        const hour = new Date(data.timestamp).getHours();
        surgeHours[hour] = (surgeHours[hour] || 0) + 1;
        totalSurge += data.surgeMultiplier;
      }
    });

    // Find high surge hours
    opportunities.highSurgeHours = Object.entries(surgeHours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));

    // Calculate surge frequency
    opportunities.surgeFrequency = surgeData.filter(data => data.surgeMultiplier > 1.0).length / surgeData.length;

    // Calculate average surge multiplier
    opportunities.averageSurgeMultiplier = totalSurge / surgeData.filter(data => data.surgeMultiplier > 1.0).length;

    return opportunities;
  }

  /**
   * Get optimization recommendations
   * @param {Object} analyticsData - Analytics data
   * @param {Object} marketAnalysis - Market analysis
   * @returns {Promise<Array>} Optimization recommendations
   */
  async getOptimizationRecommendations(analyticsData, marketAnalysis) {
    const recommendations = [];

    // Rate optimization recommendations
    const rateRecommendations = this.getRateOptimizationRecommendations(analyticsData, marketAnalysis);
    recommendations.push(...rateRecommendations);

    // Time block optimization recommendations
    const timeBlockRecommendations = this.getTimeBlockOptimizationRecommendations(analyticsData, marketAnalysis);
    recommendations.push(...timeBlockRecommendations);

    // Performance optimization recommendations
    const performanceRecommendations = this.getPerformanceOptimizationRecommendations(analyticsData);
    recommendations.push(...performanceRecommendations);

    // Market opportunity recommendations
    const marketRecommendations = this.getMarketOpportunityRecommendations(marketAnalysis);
    recommendations.push(...marketRecommendations);

    return recommendations.sort((a, b) => b.potentialImpact - a.potentialImpact);
  }

  /**
   * Get rate optimization recommendations
   * @param {Object} analyticsData - Analytics data
   * @param {Object} marketAnalysis - Market analysis
   * @returns {Array} Rate recommendations
   */
  getRateOptimizationRecommendations(analyticsData, marketAnalysis) {
    const recommendations = [];

    // Analyze current rates vs market rates
    const currentRates = analyticsData.earnings?.averageRatePerMile || 0;
    const marketRate = marketAnalysis.pricingInsights?.averageMarketRate || 0;

    if (currentRates < marketRate * 0.9) {
      recommendations.push({
        type: 'rate_optimization',
        priority: 'high',
        title: 'Increase Base Rates',
        description: `Your rates are ${((marketRate - currentRates) / marketRate * 100).toFixed(1)}% below market average`,
        action: 'Consider increasing your base rates by 10-15%',
        potentialImpact: 'high',
        estimatedIncrease: `${((marketRate - currentRates) / currentRates * 100).toFixed(1)}%`
      });
    }

    // Analyze time block performance
    const timeBlockEarnings = analyticsData.earnings?.timeBlockEarnings || {};
    Object.entries(timeBlockEarnings).forEach(([timeBlock, earnings]) => {
      if (earnings.averageEarningsPerHour < marketRate * 0.8) {
        recommendations.push({
          type: 'time_block_optimization',
          priority: 'medium',
          title: `Optimize ${timeBlock} Rates`,
          description: `${timeBlock} earnings are below market rate`,
          action: `Increase ${timeBlock} rates by 15-20%`,
          potentialImpact: 'medium',
          timeBlock
        });
      }
    });

    return recommendations;
  }

  /**
   * Get time block optimization recommendations
   * @param {Object} analyticsData - Analytics data
   * @param {Object} marketAnalysis - Market analysis
   * @returns {Array} Time block recommendations
   */
  getTimeBlockOptimizationRecommendations(analyticsData, marketAnalysis) {
    const recommendations = [];

    // Analyze peak hour performance
    const peakHours = marketAnalysis.demandTrends?.peakHours || [];
    const timeBlockEarnings = analyticsData.earnings?.timeBlockEarnings || {};

    peakHours.forEach(hour => {
      const timeBlock = this.getTimeBlockForHour(hour);
      const earnings = timeBlockEarnings[timeBlock];
      
      if (earnings && earnings.averageEarningsPerHour < marketAnalysis.pricingInsights?.averageMarketRate * 1.2) {
        recommendations.push({
          type: 'peak_hour_optimization',
          priority: 'high',
          title: `Maximize Peak Hour Earnings`,
          description: `${timeBlock} is a peak demand period with high earning potential`,
          action: `Focus on ${timeBlock} and increase rates by 20-25%`,
          potentialImpact: 'high',
          timeBlock,
          peakHour: hour
        });
      }
    });

    // Analyze low demand hours
    const lowDemandHours = marketAnalysis.demandTrends?.lowDemandHours || [];
    lowDemandHours.forEach(hour => {
      const timeBlock = this.getTimeBlockForHour(hour);
      const earnings = timeBlockEarnings[timeBlock];
      
      if (earnings && earnings.averageEarningsPerHour > 0) {
        recommendations.push({
          type: 'low_demand_optimization',
          priority: 'low',
          title: `Consider Reducing ${timeBlock} Activity`,
          description: `${timeBlock} has low demand and may not be profitable`,
          action: `Consider reducing ${timeBlock} rates or focusing on other time blocks`,
          potentialImpact: 'medium',
          timeBlock,
          lowDemandHour: hour
        });
      }
    });

    return recommendations;
  }

  /**
   * Get performance optimization recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Array} Performance recommendations
   */
  getPerformanceOptimizationRecommendations(analyticsData) {
    const recommendations = [];

    // Analyze bid success rate
    const bidSuccessRate = analyticsData.bidding?.successRate || 0;
    if (bidSuccessRate < 0.7) {
      recommendations.push({
        type: 'bid_optimization',
        priority: 'high',
        title: 'Improve Bid Success Rate',
        description: `Your bid success rate is ${(bidSuccessRate * 100).toFixed(1)}%`,
        action: 'Consider adjusting bid amounts or focusing on higher-demand areas',
        potentialImpact: 'high',
        currentRate: bidSuccessRate
      });
    }

    // Analyze reliability score
    const reliabilityScore = analyticsData.reliability?.overallScore || 0;
    if (reliabilityScore < 85) {
      recommendations.push({
        type: 'reliability_optimization',
        priority: 'medium',
        title: 'Improve Reliability Score',
        description: `Your reliability score is ${reliabilityScore}`,
        action: 'Focus on on-time arrivals and reducing cancellations',
        potentialImpact: 'medium',
        currentScore: reliabilityScore
      });
    }

    // Analyze earnings per hour
    const earningsPerHour = analyticsData.earnings?.averageEarningsPerHour || 0;
    if (earningsPerHour < 25) {
      recommendations.push({
        type: 'efficiency_optimization',
        priority: 'high',
        title: 'Increase Earnings Per Hour',
        description: `Your earnings per hour is $${earningsPerHour.toFixed(2)}`,
        action: 'Focus on shorter rides and higher-demand areas',
        potentialImpact: 'high',
        currentEarnings: earningsPerHour
      });
    }

    return recommendations;
  }

  /**
   * Get market opportunity recommendations
   * @param {Object} marketAnalysis - Market analysis
   * @returns {Array} Market recommendations
   */
  getMarketOpportunityRecommendations(marketAnalysis) {
    const recommendations = [];

    // Surge pricing opportunities
    const surgeOpportunities = marketAnalysis.surgeOpportunities;
    if (surgeOpportunities?.surgeFrequency > 0.3) {
      recommendations.push({
        type: 'surge_optimization',
        priority: 'high',
        title: 'Leverage Surge Pricing',
        description: `Surge pricing occurs ${(surgeOpportunities.surgeFrequency * 100).toFixed(1)}% of the time`,
        action: 'Focus on high-surge hours and areas',
        potentialImpact: 'high',
        surgeFrequency: surgeOpportunities.surgeFrequency
      });
    }

    // Peak hour opportunities
    const peakHours = marketAnalysis.demandTrends?.peakHours || [];
    if (peakHours.length > 0) {
      recommendations.push({
        type: 'peak_hour_opportunity',
        priority: 'medium',
        title: 'Focus on Peak Hours',
        description: `Peak demand hours: ${peakHours.join(', ')}`,
        action: 'Schedule driving during peak hours for maximum earnings',
        potentialImpact: 'medium',
        peakHours
      });
    }

    return recommendations;
  }

  /**
   * Get earnings forecast
   * @param {Object} analyticsData - Analytics data
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Earnings forecast
   */
  async getEarningsForecast(analyticsData, timeRange) {
    try {
      const forecast = {
        nextWeek: 0,
        nextMonth: 0,
        nextQuarter: 0,
        confidence: 'medium',
        factors: [],
        scenarios: {
          optimistic: 0,
          realistic: 0,
          pessimistic: 0
        }
      };

      // Calculate current earnings trends
      const currentEarnings = analyticsData.earnings?.totalEarnings || 0;
      const dailyAverage = currentEarnings / this.getDaysInRange(timeRange);

      // Generate forecasts based on trends
      forecast.nextWeek = dailyAverage * 7;
      forecast.nextMonth = dailyAverage * 30;
      forecast.nextQuarter = dailyAverage * 90;

      // Generate scenario forecasts
      forecast.scenarios.optimistic = forecast.nextMonth * 1.2;
      forecast.scenarios.realistic = forecast.nextMonth;
      forecast.scenarios.pessimistic = forecast.nextMonth * 0.8;

      // Determine confidence level
      const earningsVolatility = this.calculateEarningsVolatility(analyticsData.earnings?.dailyEarnings || []);
      if (earningsVolatility < 0.1) {
        forecast.confidence = 'high';
      } else if (earningsVolatility < 0.2) {
        forecast.confidence = 'medium';
      } else {
        forecast.confidence = 'low';
      }

      // Identify forecast factors
      forecast.factors = this.identifyForecastFactors(analyticsData, earningsVolatility);

      return forecast;
    } catch (error) {
      console.error('Error getting earnings forecast:', error);
      return this.getDefaultEarningsForecast();
    }
  }

  /**
   * Get goal tracking
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Object>} Goal tracking
   */
  async getGoalTracking(analyticsData) {
    try {
      const goals = await this.getEarningsGoals();
      const currentEarnings = analyticsData.earnings?.totalEarnings || 0;

      const goalTracking = {
        activeGoals: [],
        completedGoals: [],
        progress: {},
        recommendations: []
      };

      goals.forEach(goal => {
        const progress = this.calculateGoalProgress(goal, currentEarnings);
        
        if (goal.status === 'active') {
          goalTracking.activeGoals.push({
            ...goal,
            progress: progress.percentage,
            remaining: progress.remaining,
            onTrack: progress.onTrack
          });
        } else if (goal.status === 'completed') {
          goalTracking.completedGoals.push(goal);
        }

        goalTracking.progress[goal.id] = progress;
      });

      // Generate goal recommendations
      goalTracking.recommendations = this.generateGoalRecommendations(goalTracking.activeGoals, currentEarnings);

      return goalTracking;
    } catch (error) {
      console.error('Error getting goal tracking:', error);
      return this.getDefaultGoalTracking();
    }
  }

  /**
   * Set earnings goal
   * @param {Object} goal - Goal data
   * @returns {Promise<Object>} Created goal
   */
  async setEarningsGoal(goal) {
    try {
      const goalData = {
        driverId: this.driverId,
        ...goal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const goalRef = await addDoc(collection(this.db, 'earningsGoals'), goalData);
      
      // Add to local array
      this.earningsGoals.push({ id: goalRef.id, ...goalData });
      
      return { id: goalRef.id, ...goalData };
    } catch (error) {
      console.error('Error setting earnings goal:', error);
      throw error;
    }
  }

  /**
   * Update earnings goal
   * @param {string} goalId - Goal ID
   * @param {Object} updates - Updates to apply
   */
  async updateEarningsGoal(goalId, updates) {
    try {
      await updateDoc(doc(this.db, 'earningsGoals', goalId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update local array
      const index = this.earningsGoals.findIndex(g => g.id === goalId);
      if (index !== -1) {
        this.earningsGoals[index] = { ...this.earningsGoals[index], ...updates };
      }
    } catch (error) {
      console.error('Error updating earnings goal:', error);
      throw error;
    }
  }

  /**
   * Get earnings goals
   * @returns {Promise<Array>} Earnings goals
   */
  async getEarningsGoals() {
    try {
      if (this.earningsGoals.length === 0) {
        const goalsQuery = query(
          collection(this.db, 'earningsGoals'),
          where('driverId', '==', this.driverId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(goalsQuery);
        this.earningsGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      return this.earningsGoals;
    } catch (error) {
      console.error('Error getting earnings goals:', error);
      return [];
    }
  }

  /**
   * Calculate performance metrics
   * @param {Object} analyticsData - Analytics data
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(analyticsData) {
    const metrics = {
      efficiency: 0,
      profitability: 0,
      consistency: 0,
      growth: 0,
      overall: 0
    };

    // Calculate efficiency (earnings per hour)
    const earningsPerHour = analyticsData.earnings?.averageEarningsPerHour || 0;
    metrics.efficiency = Math.min(earningsPerHour / 30 * 100, 100); // Normalize to 0-100

    // Calculate profitability (earnings vs costs)
    const totalEarnings = analyticsData.earnings?.totalEarnings || 0;
    const estimatedCosts = totalEarnings * 0.3; // Assume 30% costs
    const profit = totalEarnings - estimatedCosts;
    metrics.profitability = Math.max(0, Math.min(profit / totalEarnings * 100, 100));

    // Calculate consistency (earnings volatility)
    const dailyEarnings = analyticsData.earnings?.dailyEarnings || [];
    const volatility = this.calculateEarningsVolatility(dailyEarnings);
    metrics.consistency = Math.max(0, 100 - (volatility * 100));

    // Calculate growth (earnings trend)
    const growth = this.calculateEarningsGrowth(dailyEarnings);
    metrics.growth = Math.max(0, Math.min(growth * 100, 100));

    // Calculate overall score
    metrics.overall = (metrics.efficiency + metrics.profitability + metrics.consistency + metrics.growth) / 4;

    return metrics;
  }

  // Helper methods
  loadOptimizationSettings() {
    // Load settings from database or use defaults
    return Promise.resolve();
  }

  loadEarningsGoals() {
    // Load goals from database
    return this.getEarningsGoals();
  }

  initializeMarketAnalysis() {
    // Initialize market analysis
    return Promise.resolve();
  }

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
      case '1y':
        start.setDate(now.getDate() - 365);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
  }

  getDaysInRange(timeRange) {
    const ranges = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    return ranges[timeRange] || 30;
  }

  getTimeBlockForHour(hour) {
    if (hour >= 6 && hour < 9) return 'morning_rush';
    if (hour >= 11 && hour < 13) return 'lunch';
    if (hour >= 16 && hour < 18) return 'evening_rush';
    if (hour >= 1 && hour < 3) return 'late_night';
    return 'default';
  }

  calculateEarningsVolatility(dailyEarnings) {
    if (dailyEarnings.length < 2) return 0;
    
    const mean = dailyEarnings.reduce((sum, earnings) => sum + earnings.amount, 0) / dailyEarnings.length;
    const variance = dailyEarnings.reduce((sum, earnings) => sum + Math.pow(earnings.amount - mean, 2), 0) / dailyEarnings.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? standardDeviation / mean : 0;
  }

  calculateEarningsGrowth(dailyEarnings) {
    if (dailyEarnings.length < 7) return 0;
    
    const recent = dailyEarnings.slice(0, 7);
    const older = dailyEarnings.slice(7, 14);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, earnings) => sum + earnings.amount, 0) / recent.length;
    const olderAvg = older.reduce((sum, earnings) => sum + earnings.amount, 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  calculateGoalProgress(goal, currentEarnings) {
    const progress = currentEarnings / goal.targetAmount;
    const remaining = goal.targetAmount - currentEarnings;
    const onTrack = progress >= (Date.now() - goal.startDate) / (goal.endDate - goal.startDate);
    
    return {
      percentage: Math.min(progress * 100, 100),
      remaining: Math.max(remaining, 0),
      onTrack
    };
  }

  generateGoalRecommendations(activeGoals, currentEarnings) {
    const recommendations = [];
    
    activeGoals.forEach(goal => {
      if (!goal.progress.onTrack) {
        recommendations.push({
          type: 'goal_optimization',
          title: `Get Back on Track for ${goal.name}`,
          description: `You're behind on your ${goal.name} goal`,
          action: 'Consider increasing your driving hours or optimizing your rates',
          goalId: goal.id
        });
      }
    });
    
    return recommendations;
  }

  identifyForecastFactors(analyticsData, volatility) {
    const factors = [];
    
    if (volatility > 0.2) {
      factors.push('High earnings volatility may affect forecast accuracy');
    }
    
    if (analyticsData.bidding?.successRate < 0.7) {
      factors.push('Low bid success rate may impact future earnings');
    }
    
    if (analyticsData.reliability?.overallScore < 85) {
      factors.push('Reliability score may affect ride availability');
    }
    
    return factors;
  }

  generateMarketRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.demandTrends.peakHours.length > 0) {
      recommendations.push('Focus on peak demand hours for maximum earnings');
    }
    
    if (analysis.surgeOpportunities.surgeFrequency > 0.3) {
      recommendations.push('Leverage surge pricing opportunities');
    }
    
    return recommendations;
  }

  identifyOptimalTimeBlocks(analysis) {
    return analysis.demandTrends.peakHours.map(hour => ({
      hour,
      timeBlock: this.getTimeBlockForHour(hour),
      demandLevel: 'high',
      recommendation: 'Focus on this time block'
    }));
  }

  getDefaultMarketAnalysis() {
    return {
      demandTrends: { peakHours: [], lowDemandHours: [], averageDemand: 0 },
      pricingInsights: { averageMarketRate: 0, pricingTrends: {} },
      surgeOpportunities: { highSurgeHours: [], surgeFrequency: 0 },
      marketRecommendations: [],
      optimalTimeBlocks: [],
      competitivePosition: 'average'
    };
  }

  getDefaultEarningsForecast() {
    return {
      nextWeek: 0,
      nextMonth: 0,
      nextQuarter: 0,
      confidence: 'low',
      factors: ['Insufficient data for accurate forecasting'],
      scenarios: { optimistic: 0, realistic: 0, pessimistic: 0 }
    };
  }

  getDefaultGoalTracking() {
    return {
      activeGoals: [],
      completedGoals: [],
      progress: {},
      recommendations: []
    };
  }
}

// Export singleton instance
export default new EarningsOptimizationService();
