import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit, onSnapshot } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class DynamicPricingService {
  async getDynamicPricingDashboard(userId = null, timeRange = '30d') {
    // Demand prediction
    const demandPrediction = await this.getDemandPrediction(userId, timeRange);
    // Competitor analysis
    const competitorAnalysis = await this.getCompetitorAnalysis(userId, timeRange);
    // Weather impact
    const weatherImpact = await this.getWeatherImpact(userId);
    // Event pricing
    const eventPricing = await this.getEventPricing(userId);
    // Driver incentives
    const driverIncentives = await this.getDriverIncentives(userId, timeRange);
    // Market optimization
    const marketOptimization = await this.getMarketOptimization(userId, timeRange);
    // Pricing recommendations
    const pricingRecommendations = await this.getPricingRecommendations(userId);
    // Historical pricing data
    const historicalPricing = await this.getHistoricalPricing(userId, timeRange);
    
    return {
      demandPrediction,
      competitorAnalysis,
      weatherImpact,
      eventPricing,
      driverIncentives,
      marketOptimization,
      pricingRecommendations,
      historicalPricing,
      timestamp: Date.now()
    };
  }

  async getDemandPrediction(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const demandRef = collection(db, 'demandData');
    let demandQuery;
    
    if (userId) {
      demandQuery = query(
        demandRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      demandQuery = query(
        demandRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const demandSnapshot = await getDocs(demandQuery);
    const demandData = demandSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentDemand: this.calculateCurrentDemand(demandData),
      demandForecast: this.generateDemandForecast(demandData),
      peakHours: this.identifyPeakHours(demandData),
      demandZones: this.identifyDemandZones(demandData),
      demandTrends: this.analyzeDemandTrends(demandData),
      demandFactors: {
        weather: 'High impact',
        events: 'Medium impact',
        timeOfDay: 'High impact',
        dayOfWeek: 'Medium impact',
        holidays: 'High impact'
      }
    };
  }

  async getCompetitorAnalysis(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const competitorRef = collection(db, 'competitorData');
    let competitorQuery;
    
    if (userId) {
      competitorQuery = query(
        competitorRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      competitorQuery = query(
        competitorRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
    }
    
    const competitorSnapshot = await getDocs(competitorQuery);
    const competitorData = competitorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      competitorPrices: this.analyzeCompetitorPrices(competitorData),
      marketPosition: this.calculateMarketPosition(competitorData),
      priceGaps: this.identifyPriceGaps(competitorData),
      competitorStrategies: this.analyzeCompetitorStrategies(competitorData),
      competitiveAdvantage: this.calculateCompetitiveAdvantage(competitorData),
      marketShare: {
        uber: '45%',
        lyft: '35%',
        anyryde: '12%',
        others: '8%'
      }
    };
  }

  async getWeatherImpact(userId) {
    // Mock weather impact data
    return {
      currentWeather: {
        condition: 'Rainy',
        temperature: 45,
        precipitation: 0.8,
        windSpeed: 15,
        impact: 'High'
      },
      weatherPricing: {
        baseMultiplier: 1.3,
        surgeMultiplier: 1.5,
        recommendedIncrease: '+30%',
        reason: 'Rain increases demand and reduces driver availability'
      },
      weatherForecast: [
        { hour: '12:00', condition: 'Rainy', multiplier: 1.3 },
        { hour: '13:00', condition: 'Rainy', multiplier: 1.4 },
        { hour: '14:00', condition: 'Cloudy', multiplier: 1.2 },
        { hour: '15:00', condition: 'Sunny', multiplier: 1.0 }
      ],
      weatherAlerts: [
        { type: 'Heavy Rain', impact: 'High', duration: '2 hours' },
        { type: 'Wind Advisory', impact: 'Medium', duration: '4 hours' }
      ]
    };
  }

  async getEventPricing(userId) {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(
      eventsRef,
      where('startDate', '>=', new Date()),
      orderBy('startDate', 'asc'),
      limit(10)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      upcomingEvents: events,
      eventPricing: this.calculateEventPricing(events),
      eventDemand: this.predictEventDemand(events),
      eventZones: this.identifyEventZones(events),
      eventRecommendations: this.generateEventRecommendations(events),
      eventTypes: {
        sports: { multiplier: 1.4, duration: '3-4 hours' },
        concerts: { multiplier: 1.6, duration: '4-5 hours' },
        conferences: { multiplier: 1.3, duration: '8-10 hours' },
        festivals: { multiplier: 1.5, duration: '6-8 hours' }
      }
    };
  }

  async getDriverIncentives(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const incentivesRef = collection(db, 'driverIncentives');
    let incentivesQuery;
    
    if (userId) {
      incentivesQuery = query(
        incentivesRef,
        where('driverId', '==', userId),
        where('startDate', '>=', timeFilter),
        orderBy('startDate', 'desc')
      );
    } else {
      incentivesQuery = query(
        incentivesRef,
        where('startDate', '>=', timeFilter),
        orderBy('startDate', 'desc'),
        limit(20)
      );
    }
    
    const incentivesSnapshot = await getDocs(incentivesQuery);
    const incentives = incentivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      activeIncentives: incentives.filter(i => i.status === 'active'),
      incentivePerformance: this.analyzeIncentivePerformance(incentives),
      recommendedIncentives: this.generateIncentiveRecommendations(incentives),
      incentiveTypes: {
        surgeBonus: { description: 'Extra earnings during high demand', multiplier: 1.2 },
        completionBonus: { description: 'Bonus for completing rides', amount: 5 },
        peakHourBonus: { description: 'Bonus for driving during peak hours', multiplier: 1.15 },
        referralBonus: { description: 'Bonus for referring new drivers', amount: 50 }
      }
    };
  }

  async getMarketOptimization(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const marketRef = collection(db, 'marketData');
    let marketQuery;
    
    if (userId) {
      marketQuery = query(
        marketRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      marketQuery = query(
        marketRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(40)
      );
    }
    
    const marketSnapshot = await getDocs(marketQuery);
    const marketData = marketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      marketEquilibrium: this.calculateMarketEquilibrium(marketData),
      optimalPricing: this.calculateOptimalPricing(marketData),
      supplyDemandBalance: this.analyzeSupplyDemandBalance(marketData),
      marketEfficiency: this.calculateMarketEfficiency(marketData),
      optimizationRecommendations: this.generateOptimizationRecommendations(marketData),
      marketMetrics: {
        driverUtilization: '78%',
        averageWaitTime: '3.2 minutes',
        acceptanceRate: '92%',
        customerSatisfaction: '4.6/5'
      }
    };
  }

  async getPricingRecommendations(userId) {
    // Generate personalized pricing recommendations
    return {
      currentRecommendations: [
        {
          type: 'surge_pricing',
          recommendation: 'Increase base fare by 25%',
          reason: 'High demand in your area',
          confidence: 0.85,
          expectedImpact: '+$12.50 per ride'
        },
        {
          type: 'competitive_pricing',
          recommendation: 'Match competitor pricing',
          reason: 'Competitors charging 15% more',
          confidence: 0.78,
          expectedImpact: '+$8.75 per ride'
        },
        {
          type: 'weather_pricing',
          recommendation: 'Apply weather multiplier',
          reason: 'Rainy conditions increasing demand',
          confidence: 0.92,
          expectedImpact: '+$6.25 per ride'
        }
      ],
      pricingStrategy: {
        baseStrategy: 'Dynamic pricing with demand-based adjustments',
        surgeStrategy: 'Aggressive surge pricing during peak hours',
        competitiveStrategy: 'Price matching with premium positioning',
        weatherStrategy: 'Weather-based pricing adjustments'
      },
      pricingFactors: {
        demand: { weight: 0.35, current: 'High' },
        competition: { weight: 0.25, current: 'Medium' },
        weather: { weight: 0.20, current: 'High' },
        events: { weight: 0.15, current: 'Low' },
        driverRating: { weight: 0.05, current: 'High' }
      }
    };
  }

  async getHistoricalPricing(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const pricingRef = collection(db, 'pricingHistory');
    let pricingQuery;
    
    if (userId) {
      pricingQuery = query(
        pricingRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      pricingQuery = query(
        pricingRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }
    
    const pricingSnapshot = await getDocs(pricingQuery);
    const pricingHistory = pricingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      pricingHistory,
      pricingTrends: this.analyzePricingTrends(pricingHistory),
      pricingPerformance: this.analyzePricingPerformance(pricingHistory),
      pricingPatterns: this.identifyPricingPatterns(pricingHistory),
      pricingOptimization: this.calculatePricingOptimization(pricingHistory)
    };
  }

  // Helper methods for calculations
  calculateCurrentDemand(demandData) {
    if (demandData.length === 0) return { level: 'Low', score: 0.3 };
    
    const recentDemand = demandData.slice(0, 10);
    const averageDemand = recentDemand.reduce((sum, d) => sum + (d.demandScore || 0), 0) / recentDemand.length;
    
    if (averageDemand > 0.8) return { level: 'Very High', score: averageDemand };
    if (averageDemand > 0.6) return { level: 'High', score: averageDemand };
    if (averageDemand > 0.4) return { level: 'Medium', score: averageDemand };
    return { level: 'Low', score: averageDemand };
  }

  generateDemandForecast(demandData) {
    // Mock demand forecast
    return {
      nextHour: { demand: 'High', confidence: 0.85 },
      next4Hours: { demand: 'Medium', confidence: 0.72 },
      nextDay: { demand: 'Low', confidence: 0.65 },
      nextWeek: { demand: 'Medium', confidence: 0.58 }
    };
  }

  identifyPeakHours(demandData) {
    return [
      { hour: '7:00-9:00', demand: 'Very High', multiplier: 1.4 },
      { hour: '17:00-19:00', demand: 'Very High', multiplier: 1.5 },
      { hour: '22:00-24:00', demand: 'High', multiplier: 1.3 },
      { hour: '12:00-14:00', demand: 'Medium', multiplier: 1.1 }
    ];
  }

  identifyDemandZones(demandData) {
    return [
      { zone: 'Downtown', demand: 'Very High', multiplier: 1.4 },
      { zone: 'Airport', demand: 'High', multiplier: 1.3 },
      { zone: 'University', demand: 'Medium', multiplier: 1.1 },
      { zone: 'Suburbs', demand: 'Low', multiplier: 0.9 }
    ];
  }

  analyzeDemandTrends(demandData) {
    return {
      trend: 'Increasing',
      change: '+12%',
      period: 'Last 7 days',
      factors: ['Weather', 'Events', 'Time of day']
    };
  }

  analyzeCompetitorPrices(competitorData) {
    return {
      uber: { average: 25.50, range: '22-32', trend: 'Stable' },
      lyft: { average: 24.75, range: '21-30', trend: 'Decreasing' },
      anyryde: { average: 26.25, range: '23-35', trend: 'Increasing' }
    };
  }

  calculateMarketPosition(competitorData) {
    return {
      position: 'Premium',
      advantage: '+$1.75 average',
      marketShare: '12%',
      growth: '+8% monthly'
    };
  }

  identifyPriceGaps(competitorData) {
    return [
      { gap: 'Peak hours', opportunity: '+$3.50', confidence: 0.85 },
      { gap: 'Weather events', opportunity: '+$2.75', confidence: 0.78 },
      { gap: 'Special events', opportunity: '+$4.25', confidence: 0.92 }
    ];
  }

  analyzeCompetitorStrategies(competitorData) {
    return {
      uber: 'Aggressive pricing with surge multipliers',
      lyft: 'Conservative pricing with loyalty programs',
      anyryde: 'Dynamic pricing with driver empowerment'
    };
  }

  calculateCompetitiveAdvantage(competitorData) {
    return {
      advantage: 'Driver-controlled pricing',
      strength: 'Flexible bidding system',
      weakness: 'Smaller driver network',
      opportunity: 'Premium service positioning'
    };
  }

  calculateEventPricing(events) {
    return events.map(event => ({
      event: event.name,
      recommendedMultiplier: 1.4,
      expectedDemand: 'Very High',
      pricingStrategy: 'Surge pricing with event bonus'
    }));
  }

  predictEventDemand(events) {
    return events.map(event => ({
      event: event.name,
      demandLevel: 'Very High',
      duration: '4 hours',
      expectedRides: 150
    }));
  }

  identifyEventZones(events) {
    return events.map(event => ({
      event: event.name,
      zone: event.location,
      radius: '2 miles',
      multiplier: 1.5
    }));
  }

  generateEventRecommendations(events) {
    return events.map(event => ({
      event: event.name,
      recommendation: 'Increase pricing by 40%',
      reason: 'High demand event',
      expectedEarnings: '+$45 per hour'
    }));
  }

  analyzeIncentivePerformance(incentives) {
    return {
      totalIncentives: incentives.length,
      activeIncentives: incentives.filter(i => i.status === 'active').length,
      averageEarnings: 28.50,
      incentiveImpact: '+$5.25 per ride'
    };
  }

  generateIncentiveRecommendations(incentives) {
    return [
      { type: 'Surge Bonus', recommendation: 'Enable during peak hours', impact: '+$3.50 per ride' },
      { type: 'Completion Bonus', recommendation: 'Set at $5 for 10+ rides', impact: '+$50 per day' },
      { type: 'Referral Bonus', recommendation: 'Increase to $75', impact: '+$25 per referral' }
    ];
  }

  calculateMarketEquilibrium(marketData) {
    return {
      equilibriumPrice: 26.75,
      currentPrice: 25.50,
      gap: '+$1.25',
      recommendation: 'Increase pricing to reach equilibrium'
    };
  }

  calculateOptimalPricing(marketData) {
    return {
      optimalBasePrice: 27.50,
      optimalSurgeMultiplier: 1.4,
      expectedRevenue: '+18%',
      confidence: 0.85
    };
  }

  analyzeSupplyDemandBalance(marketData) {
    return {
      balance: 'Demand exceeds supply',
      ratio: '1.3:1',
      recommendation: 'Increase pricing to balance market',
      impact: '+$2.50 per ride'
    };
  }

  calculateMarketEfficiency(marketData) {
    return {
      efficiency: '85%',
      optimization: 'High',
      recommendations: ['Dynamic pricing', 'Peak hour bonuses', 'Weather adjustments']
    };
  }

  generateOptimizationRecommendations(marketData) {
    return [
      { recommendation: 'Implement dynamic pricing', impact: '+15% revenue', confidence: 0.88 },
      { recommendation: 'Add peak hour bonuses', impact: '+8% driver retention', confidence: 0.75 },
      { recommendation: 'Weather-based adjustments', impact: '+12% earnings', confidence: 0.82 }
    ];
  }

  analyzePricingTrends(pricingHistory) {
    return {
      trend: 'Increasing',
      change: '+8.5%',
      period: 'Last 30 days',
      volatility: 'Low'
    };
  }

  analyzePricingPerformance(pricingHistory) {
    return {
      averagePrice: 26.25,
      priceRange: '22-35',
      acceptanceRate: '94%',
      revenueImpact: '+12%'
    };
  }

  identifyPricingPatterns(pricingHistory) {
    return [
      { pattern: 'Peak hour pricing', frequency: 'Daily', impact: '+$3.50' },
      { pattern: 'Weather pricing', frequency: 'Weekly', impact: '+$2.75' },
      { pattern: 'Event pricing', frequency: 'Monthly', impact: '+$4.25' }
    ];
  }

  calculatePricingOptimization(pricingHistory) {
    return {
      optimization: 'High',
      recommendations: ['Increase base pricing', 'Implement surge pricing', 'Add event bonuses'],
      expectedImpact: '+18% revenue'
    };
  }

  // Real-time pricing methods
  async subscribeToPricingUpdates(userId, callback) {
    const pricingRef = collection(db, 'pricingUpdates');
    const pricingQuery = query(
      pricingRef,
      where('driverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    return onSnapshot(pricingQuery, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(updates);
    }, (error) => {
      console.error('Error in pricing updates subscription:', error);
      callback([], error);
    });
  }

  async updatePricingStrategy(userId, strategy) {
    const strategyRef = collection(db, 'pricingStrategies');
    return await addDoc(strategyRef, {
      driverId: userId,
      strategy,
      timestamp: new Date(),
      status: 'active'
    });
  }

  async getRealTimePricing(userId, location) {
    // Get real-time pricing recommendations based on current conditions
    const demand = await this.getDemandPrediction(userId, '1h');
    const weather = await this.getWeatherImpact(userId);
    const events = await this.getEventPricing(userId);
    
    return {
      recommendedPrice: this.calculateRecommendedPrice(demand, weather, events),
      confidence: 0.85,
      factors: ['High demand', 'Weather conditions', 'Nearby events'],
      timestamp: Date.now()
    };
  }

  calculateRecommendedPrice(demand, weather, events) {
    let basePrice = 25.00;
    let multiplier = 1.0;
    
    // Apply demand multiplier
    if (demand.currentDemand.level === 'Very High') multiplier *= 1.3;
    else if (demand.currentDemand.level === 'High') multiplier *= 1.2;
    else if (demand.currentDemand.level === 'Medium') multiplier *= 1.1;
    
    // Apply weather multiplier
    if (weather.currentWeather.impact === 'High') multiplier *= 1.2;
    else if (weather.currentWeather.impact === 'Medium') multiplier *= 1.1;
    
    // Apply event multiplier
    if (events.upcomingEvents.length > 0) multiplier *= 1.15;
    
    return {
      basePrice: basePrice,
      recommendedPrice: basePrice * multiplier,
      multiplier: multiplier,
      increase: `+${((multiplier - 1) * 100).toFixed(0)}%`
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();
export default dynamicPricingService; 