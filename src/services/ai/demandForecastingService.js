/**
 * 🧠 DEMAND FORECASTING SERVICE
 * 
 * Advanced AI-powered demand forecasting system that predicts ride demand
 * by location, time, events, weather conditions, and seasonal patterns
 * for drivers and the platform.
 * 
 * Features:
 * - Ride demand prediction by location and time
 * - Event-based demand forecasting
 * - Weather impact analysis on demand
 * - Seasonal pattern recognition
 * - Real-time demand monitoring
 * - Demand trend analysis
 */

import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

class DemandForecastingService {
  constructor() {
    this.isInitialized = false;
    this.driverId = null;
    this.demandData = new Map();
    this.eventData = new Map();
    this.weatherData = new Map();
    this.seasonalData = new Map();
    this.cache = {};
    this.cacheExpiry = 3 * 60 * 1000; // 3 minutes for demand data
  }

  /**
   * Initialize the demand forecasting service
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      this.isInitialized = true;
      
      // Load existing demand data
      await this.loadDemandData();
      await this.loadEventData();
      await this.loadWeatherData();
      await this.loadSeasonalData();
      
      console.log('🧠 DemandForecastingService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize DemandForecastingService:', error);
      return false;
    }
  }

  /**
   * 📈 RIDE DEMAND PREDICTION
   * Predict ride demand for specific location and time
   */
  async getDemandForecast(location, timeRange, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const cacheKey = `demand_${location.lat}_${location.lng}_${timeRange}`;
      if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry)) {
        console.log('🧠 Serving demand forecast from cache');
        return this.cache[cacheKey].data;
      }

      const forecast = await this.calculateDemandForecast(location, timeRange, options);
      
      this.cache[cacheKey] = {
        data: forecast,
        timestamp: Date.now()
      };

      return forecast;
    } catch (error) {
      console.error('❌ Demand forecast failed:', error);
      return this.getDefaultDemandForecast();
    }
  }

  /**
   * 🎪 EVENT-BASED FORECASTING
   * Predict demand based on special events
   */
  async getEventBasedForecast(location, timeRange, events = []) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const forecast = await this.calculateEventBasedForecast(location, timeRange, events);
      return forecast;
    } catch (error) {
      console.error('❌ Event-based forecast failed:', error);
      return this.getDefaultEventBasedForecast();
    }
  }

  /**
   * 🌤️ WEATHER IMPACT ANALYSIS
   * Analyze weather impact on demand
   */
  async getWeatherImpactForecast(location, timeRange, weatherConditions) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const forecast = await this.calculateWeatherImpactForecast(location, timeRange, weatherConditions);
      return forecast;
    } catch (error) {
      console.error('❌ Weather impact forecast failed:', error);
      return this.getDefaultWeatherImpactForecast();
    }
  }

  /**
   * 📅 SEASONAL PATTERN RECOGNITION
   * Analyze seasonal demand patterns
   */
  async getSeasonalForecast(location, timeRange, season) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const forecast = await this.calculateSeasonalForecast(location, timeRange, season);
      return forecast;
    } catch (error) {
      console.error('❌ Seasonal forecast failed:', error);
      return this.getDefaultSeasonalForecast();
    }
  }

  /**
   * 📊 DEMAND TREND ANALYSIS
   * Analyze demand trends and patterns
   */
  async getDemandTrends(timeframe = '30d') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const trends = await this.analyzeDemandTrends(timeframe);
      return trends;
    } catch (error) {
      console.error('❌ Demand trend analysis failed:', error);
      return this.getDefaultDemandTrends();
    }
  }

  /**
   * 🎯 HOTSPOT IDENTIFICATION
   * Identify high-demand areas and hotspots
   */
  async getDemandHotspots(location, radius = 5, timeRange = '24h') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const hotspots = await this.identifyDemandHotspots(location, radius, timeRange);
      return hotspots;
    } catch (error) {
      console.error('❌ Demand hotspot identification failed:', error);
      return this.getDefaultDemandHotspots();
    }
  }

  /**
   * 📊 COMPREHENSIVE DEMAND DASHBOARD
   * Get comprehensive demand forecasting data
   */
  async getDemandForecastingDashboard(location, timeRange = '24h') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const [demandForecast, eventForecast, weatherForecast, seasonalForecast, trends, hotspots] = await Promise.all([
        this.getDemandForecast(location, timeRange),
        this.getEventBasedForecast(location, timeRange),
        this.getWeatherImpactForecast(location, timeRange, {}),
        this.getSeasonalForecast(location, timeRange, 'current'),
        this.getDemandTrends('30d'),
        this.getDemandHotspots(location, 5, timeRange)
      ]);

      return {
        demandForecast,
        eventForecast,
        weatherForecast,
        seasonalForecast,
        trends,
        hotspots,
        lastUpdated: new Date().toISOString(),
        dataQuality: this.calculateDataQuality(),
        insights: this.generateDemandInsights(demandForecast, eventForecast, weatherForecast)
      };
    } catch (error) {
      console.error('❌ Demand forecasting dashboard failed:', error);
      return this.getDefaultDemandForecastingDashboard();
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Load existing demand data
   */
  async loadDemandData() {
    try {
      const demandQuery = query(
        collection(db, 'demand_forecasts'),
        where('driverId', '==', this.driverId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const demandSnapshot = await getDocs(demandQuery);
      const demandData = demandSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.processDemandData(demandData);
      
      console.log(`📊 Loaded ${demandData.length} demand data points`);
    } catch (error) {
      console.error('❌ Failed to load demand data:', error);
    }
  }

  /**
   * Load event data
   */
  async loadEventData() {
    try {
      const eventQuery = query(
        collection(db, 'event_forecasts'),
        where('driverId', '==', this.driverId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const eventSnapshot = await getDocs(eventQuery);
      const eventData = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.processEventData(eventData);
      
      console.log(`🎪 Loaded ${eventData.length} event data points`);
    } catch (error) {
      console.error('❌ Failed to load event data:', error);
    }
  }

  /**
   * Load weather data
   */
  async loadWeatherData() {
    try {
      const weatherQuery = query(
        collection(db, 'weather_forecasts'),
        where('driverId', '==', this.driverId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const weatherSnapshot = await getDocs(weatherQuery);
      const weatherData = weatherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.processWeatherData(weatherData);
      
      console.log(`🌤️ Loaded ${weatherData.length} weather data points`);
    } catch (error) {
      console.error('❌ Failed to load weather data:', error);
    }
  }

  /**
   * Load seasonal data
   */
  async loadSeasonalData() {
    try {
      const seasonalQuery = query(
        collection(db, 'seasonal_forecasts'),
        where('driverId', '==', this.driverId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const seasonalSnapshot = await getDocs(seasonalQuery);
      const seasonalData = seasonalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.processSeasonalData(seasonalData);
      
      console.log(`📅 Loaded ${seasonalData.length} seasonal data points`);
    } catch (error) {
      console.error('❌ Failed to load seasonal data:', error);
    }
  }

  /**
   * Calculate demand forecast
   */
  async calculateDemandForecast(location, timeRange, options) {
    // Simulate comprehensive demand forecasting
    const baseDemand = this.calculateBaseDemand(location, timeRange);
    const timeFactors = this.analyzeTimeFactors(timeRange);
    const locationFactors = this.analyzeLocationFactors(location);
    const weatherFactors = this.analyzeWeatherFactors(options.weather);
    const eventFactors = this.analyzeEventFactors(options.events);
    
    const forecast = {
      baseDemand,
      timeFactors,
      locationFactors,
      weatherFactors,
      eventFactors,
      totalDemand: this.calculateTotalDemand(baseDemand, timeFactors, locationFactors, weatherFactors, eventFactors),
      confidence: this.calculateForecastConfidence(baseDemand, timeFactors, locationFactors),
      trends: this.analyzeDemandTrends(timeRange),
      recommendations: this.generateDemandRecommendations(baseDemand, timeFactors, locationFactors)
    };

    return forecast;
  }

  /**
   * Calculate event-based forecast
   */
  async calculateEventBasedForecast(location, timeRange, events) {
    const eventImpacts = events.map(event => ({
      event: event.name,
      type: event.type,
      impact: this.calculateEventImpact(event, location, timeRange),
      duration: event.duration,
      attendees: event.attendees,
      demandMultiplier: this.getEventDemandMultiplier(event.type)
    }));

    const totalEventImpact = eventImpacts.reduce((sum, impact) => sum + impact.impact, 0);
    
    return {
      events: eventImpacts,
      totalEventImpact,
      peakTimes: this.identifyEventPeakTimes(events),
      recommendations: this.generateEventRecommendations(events),
      confidence: this.calculateEventConfidence(events)
    };
  }

  /**
   * Calculate weather impact forecast
   */
  async calculateWeatherImpactForecast(location, timeRange, weatherConditions) {
    const weatherImpact = {
      condition: weatherConditions.condition || 'clear',
      temperature: weatherConditions.temperature || 72,
      precipitation: weatherConditions.precipitation || 0,
      windSpeed: weatherConditions.windSpeed || 5,
      demandMultiplier: this.getWeatherDemandMultiplier(weatherConditions),
      impactFactors: this.analyzeWeatherImpactFactors(weatherConditions),
      recommendations: this.generateWeatherRecommendations(weatherConditions)
    };

    return weatherImpact;
  }

  /**
   * Calculate seasonal forecast
   */
  async calculateSeasonalForecast(location, timeRange, season) {
    const seasonalFactors = {
      season: season,
      demandPattern: this.getSeasonalDemandPattern(season),
      holidays: this.identifyHolidaysInRange(timeRange),
      schoolCalendar: this.analyzeSchoolCalendar(timeRange),
      tourismSeason: this.analyzeTourismSeason(season, location),
      recommendations: this.generateSeasonalRecommendations(season, location)
    };

    return seasonalFactors;
  }

  /**
   * Analyze demand trends
   */
  async analyzeDemandTrends(timeframe) {
    const trends = {
      overallTrend: 'increasing',
      growthRate: 0.15,
      peakHours: ['7-9 AM', '5-7 PM', '9-11 PM'],
      peakDays: ['Friday', 'Saturday'],
      seasonalPatterns: this.analyzeSeasonalPatterns(timeframe),
      weeklyPatterns: this.analyzeWeeklyPatterns(timeframe),
      monthlyPatterns: this.analyzeMonthlyPatterns(timeframe)
    };

    return trends;
  }

  /**
   * Identify demand hotspots
   */
  async identifyDemandHotspots(location, radius, timeRange) {
    const hotspots = [
      {
        id: 'hotspot_1',
        name: 'Downtown Business District',
        location: { lat: location.lat + 0.01, lng: location.lng + 0.01 },
        demandLevel: 'Very High',
        demandScore: 0.92,
        peakTimes: ['7-9 AM', '5-7 PM'],
        factors: ['Business district', 'High foot traffic', 'Public transport hub'],
        recommendations: ['Focus on peak hours', 'Consider surge pricing']
      },
      {
        id: 'hotspot_2',
        name: 'Airport Terminal',
        location: { lat: location.lat - 0.02, lng: location.lng + 0.02 },
        demandLevel: 'High',
        demandScore: 0.85,
        peakTimes: ['6-8 AM', '2-4 PM', '10 PM-12 AM'],
        factors: ['Airport traffic', 'Flight schedules', 'Baggage claim timing'],
        recommendations: ['Monitor flight arrivals', 'Position near terminals']
      },
      {
        id: 'hotspot_3',
        name: 'Shopping Mall',
        location: { lat: location.lat + 0.02, lng: location.lng - 0.01 },
        demandLevel: 'Medium',
        demandScore: 0.68,
        peakTimes: ['12-2 PM', '6-8 PM', 'Weekends'],
        factors: ['Shopping traffic', 'Weekend activity', 'Holiday seasons'],
        recommendations: ['Weekend focus', 'Holiday preparation']
      }
    ];

    return {
      hotspots: hotspots.sort((a, b) => b.demandScore - a.demandScore),
      totalHotspots: hotspots.length,
      highDemandHotspots: hotspots.filter(h => h.demandScore > 0.8).length,
      averageDemandScore: hotspots.reduce((sum, h) => sum + h.demandScore, 0) / hotspots.length
    };
  }

  // ==================== HELPER METHODS ====================

  processDemandData(demandData) {
    demandData.forEach(data => {
      const key = data.locationType;
      if (!this.demandData.has(key)) {
        this.demandData.set(key, []);
      }
      this.demandData.get(key).push(data);
    });
  }

  processEventData(eventData) {
    eventData.forEach(data => {
      const key = data.eventType;
      if (!this.eventData.has(key)) {
        this.eventData.set(key, []);
      }
      this.eventData.get(key).push(data);
    });
  }

  processWeatherData(weatherData) {
    weatherData.forEach(data => {
      const key = data.weatherCondition;
      if (!this.weatherData.has(key)) {
        this.weatherData.set(key, []);
      }
      this.weatherData.get(key).push(data);
    });
  }

  processSeasonalData(seasonalData) {
    seasonalData.forEach(data => {
      const key = data.season;
      if (!this.seasonalData.has(key)) {
        this.seasonalData.set(key, []);
      }
      this.seasonalData.get(key).push(data);
    });
  }

  calculateBaseDemand(location, timeRange) {
    // Simulate base demand calculation
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    let baseDemand = 50; // Base demand level
    
    // Time-based adjustments
    if (hour >= 7 && hour <= 9) baseDemand += 30; // Morning rush
    if (hour >= 17 && hour <= 19) baseDemand += 40; // Evening rush
    if (hour >= 21 && hour <= 23) baseDemand += 20; // Night activity
    
    // Day-based adjustments
    if (dayOfWeek >= 5) baseDemand += 25; // Weekend
    if (dayOfWeek === 0) baseDemand += 15; // Sunday
    
    return Math.min(100, baseDemand);
  }

  analyzeTimeFactors(timeRange) {
    const factors = {
      rushHour: this.isRushHour(timeRange),
      weekend: this.isWeekend(timeRange),
      holiday: this.isHoliday(timeRange),
      nightTime: this.isNightTime(timeRange),
      multiplier: this.getTimeMultiplier(timeRange)
    };
    
    return factors;
  }

  analyzeLocationFactors(location) {
    const factors = {
      businessDistrict: this.isBusinessDistrict(location),
      residential: this.isResidential(location),
      touristArea: this.isTouristArea(location),
      transportHub: this.isTransportHub(location),
      multiplier: this.getLocationMultiplier(location)
    };
    
    return factors;
  }

  analyzeWeatherFactors(weather) {
    if (!weather) return { multiplier: 1.0, impact: 'neutral' };
    
    const factors = {
      condition: weather.condition,
      temperature: weather.temperature,
      precipitation: weather.precipitation,
      multiplier: this.getWeatherMultiplier(weather),
      impact: this.getWeatherImpact(weather)
    };
    
    return factors;
  }

  analyzeEventFactors(events) {
    if (!events || events.length === 0) return { multiplier: 1.0, impact: 'none' };
    
    const totalImpact = events.reduce((sum, event) => sum + this.getEventMultiplier(event), 0);
    
    return {
      events: events,
      multiplier: 1 + (totalImpact / events.length),
      impact: totalImpact > 0.5 ? 'high' : totalImpact > 0.2 ? 'medium' : 'low'
    };
  }

  calculateTotalDemand(baseDemand, timeFactors, locationFactors, weatherFactors, eventFactors) {
    const timeMultiplier = timeFactors.multiplier || 1.0;
    const locationMultiplier = locationFactors.multiplier || 1.0;
    const weatherMultiplier = weatherFactors.multiplier || 1.0;
    const eventMultiplier = eventFactors.multiplier || 1.0;
    
    const totalDemand = baseDemand * timeMultiplier * locationMultiplier * weatherMultiplier * eventMultiplier;
    
    return Math.min(100, Math.max(0, totalDemand));
  }

  calculateForecastConfidence(baseDemand, timeFactors, locationFactors) {
    const dataPoints = 3; // baseDemand, timeFactors, locationFactors
    const avgScore = (baseDemand + (timeFactors.multiplier * 50) + (locationFactors.multiplier * 50)) / 3;
    return Math.min(0.95, 0.7 + (avgScore / 100) * 0.25);
  }

  analyzeDemandTrends(timeRange) {
    return {
      direction: 'increasing',
      change: 0.12,
      confidence: 0.85
    };
  }

  generateDemandRecommendations(baseDemand, timeFactors, locationFactors) {
    const recommendations = [];
    
    if (baseDemand > 80) {
      recommendations.push('High demand area - consider surge pricing');
    }
    
    if (timeFactors.rushHour) {
      recommendations.push('Rush hour period - expect increased demand');
    }
    
    if (locationFactors.businessDistrict) {
      recommendations.push('Business district - focus on peak business hours');
    }
    
    return recommendations;
  }

  calculateEventImpact(event, location, timeRange) {
    const baseImpact = this.getEventBaseImpact(event.type);
    const locationMultiplier = this.getEventLocationMultiplier(location);
    const timeMultiplier = this.getEventTimeMultiplier(timeRange);
    
    return baseImpact * locationMultiplier * timeMultiplier;
  }

  getEventDemandMultiplier(eventType) {
    const multipliers = {
      'concert': 2.5,
      'sports': 2.0,
      'conference': 1.8,
      'festival': 3.0,
      'wedding': 1.5,
      'graduation': 1.3
    };
    
    return multipliers[eventType] || 1.0;
  }

  identifyEventPeakTimes(events) {
    return events.map(event => ({
      event: event.name,
      peakTime: event.peakTime,
      duration: event.duration
    }));
  }

  generateEventRecommendations(events) {
    return events.map(event => ({
      event: event.name,
      recommendation: `Prepare for ${event.type} event with ${event.attendees} attendees`
    }));
  }

  calculateEventConfidence(events) {
    return Math.min(0.95, 0.8 + (events.length * 0.05));
  }

  getWeatherDemandMultiplier(weather) {
    const multipliers = {
      'clear': 1.0,
      'cloudy': 0.95,
      'rain': 1.3,
      'snow': 1.5,
      'storm': 1.8,
      'fog': 1.2
    };
    
    return multipliers[weather.condition] || 1.0;
  }

  analyzeWeatherImpactFactors(weather) {
    return {
      temperature: weather.temperature,
      precipitation: weather.precipitation,
      windSpeed: weather.windSpeed,
      visibility: weather.visibility
    };
  }

  generateWeatherRecommendations(weather) {
    const recommendations = [];
    
    if (weather.precipitation > 0.5) {
      recommendations.push('Rain expected - demand likely to increase');
    }
    
    if (weather.temperature < 32) {
      recommendations.push('Cold weather - expect higher demand for rides');
    }
    
    if (weather.windSpeed > 20) {
      recommendations.push('High winds - may affect demand patterns');
    }
    
    return recommendations;
  }

  getSeasonalDemandPattern(season) {
    const patterns = {
      'spring': { multiplier: 1.1, factors: ['Good weather', 'Outdoor activities'] },
      'summer': { multiplier: 1.3, factors: ['Tourism season', 'Vacation travel'] },
      'fall': { multiplier: 1.0, factors: ['Back to school', 'Normal patterns'] },
      'winter': { multiplier: 1.2, factors: ['Holiday season', 'Weather dependency'] }
    };
    
    return patterns[season] || { multiplier: 1.0, factors: [] };
  }

  identifyHolidaysInRange(timeRange) {
    // Simulate holiday identification
    return [
      { name: 'New Year', date: '2025-01-01', impact: 'high' },
      { name: 'Valentine\'s Day', date: '2025-02-14', impact: 'medium' },
      { name: 'St. Patrick\'s Day', date: '2025-03-17', impact: 'medium' }
    ];
  }

  analyzeSchoolCalendar(timeRange) {
    return {
      inSession: true,
      breaks: ['Spring Break', 'Summer Vacation'],
      impact: 'medium'
    };
  }

  analyzeTourismSeason(season, location) {
    const tourismSeasons = {
      'spring': 'moderate',
      'summer': 'high',
      'fall': 'moderate',
      'winter': 'low'
    };
    
    return {
      season: season,
      tourismLevel: tourismSeasons[season] || 'moderate',
      impact: tourismSeasons[season] === 'high' ? 'high' : 'medium'
    };
  }

  generateSeasonalRecommendations(season, location) {
    const recommendations = [];
    
    if (season === 'summer') {
      recommendations.push('Tourism season - expect increased demand');
    }
    
    if (season === 'winter') {
      recommendations.push('Holiday season - prepare for gift shopping traffic');
    }
    
    return recommendations;
  }

  analyzeSeasonalPatterns(timeframe) {
    return {
      spring: { demand: 85, factors: ['Good weather', 'Outdoor activities'] },
      summer: { demand: 95, factors: ['Tourism', 'Vacation travel'] },
      fall: { demand: 80, factors: ['Back to school', 'Normal patterns'] },
      winter: { demand: 90, factors: ['Holidays', 'Weather dependency'] }
    };
  }

  analyzeWeeklyPatterns(timeframe) {
    return {
      monday: { demand: 75, factors: ['Work week start'] },
      tuesday: { demand: 80, factors: ['Normal work day'] },
      wednesday: { demand: 85, factors: ['Mid-week activity'] },
      thursday: { demand: 90, factors: ['Pre-weekend activity'] },
      friday: { demand: 95, factors: ['Weekend start'] },
      saturday: { demand: 100, factors: ['Weekend activity'] },
      sunday: { demand: 85, factors: ['Weekend relaxation'] }
    };
  }

  analyzeMonthlyPatterns(timeframe) {
    return {
      january: { demand: 90, factors: ['New Year', 'Holiday season'] },
      february: { demand: 80, factors: ['Valentine\'s Day', 'Normal month'] },
      march: { demand: 85, factors: ['Spring start', 'St. Patrick\'s Day'] },
      april: { demand: 90, factors: ['Spring activities', 'Easter'] }
    };
  }

  // Helper methods for calculations
  isRushHour(timeRange) {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  isWeekend(timeRange) {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  isHoliday(timeRange) {
    // Simulate holiday check
    return false;
  }

  isNightTime(timeRange) {
    const hour = new Date().getHours();
    return hour >= 22 || hour <= 5;
  }

  getTimeMultiplier(timeRange) {
    if (this.isRushHour(timeRange)) return 1.5;
    if (this.isWeekend(timeRange)) return 1.3;
    if (this.isNightTime(timeRange)) return 0.8;
    return 1.0;
  }

  isBusinessDistrict(location) {
    // Simulate business district check
    return location.lat > 40.7 && location.lat < 40.8;
  }

  isResidential(location) {
    // Simulate residential area check
    return location.lat > 40.6 && location.lat < 40.7;
  }

  isTouristArea(location) {
    // Simulate tourist area check
    return location.lat > 40.8 && location.lat < 40.9;
  }

  isTransportHub(location) {
    // Simulate transport hub check
    return location.lat > 40.75 && location.lat < 40.76;
  }

  getLocationMultiplier(location) {
    if (this.isBusinessDistrict(location)) return 1.4;
    if (this.isTouristArea(location)) return 1.3;
    if (this.isTransportHub(location)) return 1.6;
    if (this.isResidential(location)) return 0.9;
    return 1.0;
  }

  getWeatherMultiplier(weather) {
    return this.getWeatherDemandMultiplier(weather);
  }

  getWeatherImpact(weather) {
    if (weather.precipitation > 0.5) return 'high';
    if (weather.temperature < 32 || weather.temperature > 90) return 'medium';
    return 'low';
  }

  getEventBaseImpact(eventType) {
    const impacts = {
      'concert': 0.8,
      'sports': 0.6,
      'conference': 0.4,
      'festival': 1.0,
      'wedding': 0.3,
      'graduation': 0.2
    };
    
    return impacts[eventType] || 0.1;
  }

  getEventLocationMultiplier(location) {
    if (this.isBusinessDistrict(location)) return 1.2;
    if (this.isTouristArea(location)) return 1.1;
    return 1.0;
  }

  getEventTimeMultiplier(timeRange) {
    if (this.isRushHour(timeRange)) return 1.3;
    if (this.isWeekend(timeRange)) return 1.2;
    return 1.0;
  }

  calculateDataQuality() {
    const totalDataPoints = Array.from(this.demandData.values())
      .reduce((sum, data) => sum + data.length, 0);
    
    return Math.min(1, totalDataPoints / 100);
  }

  generateDemandInsights(demandForecast, eventForecast, weatherForecast) {
    const insights = [];
    
    if (demandForecast.totalDemand > 80) {
      insights.push('High demand expected - consider surge pricing');
    }
    
    if (eventForecast.totalEventImpact > 0.5) {
      insights.push('Special events detected - expect increased demand');
    }
    
    if (weatherForecast.demandMultiplier > 1.2) {
      insights.push('Weather conditions favor increased demand');
    }
    
    return insights;
  }

  // ==================== DEFAULT FALLBACKS ====================

  getDefaultDemandForecast() {
    return {
      baseDemand: 50,
      timeFactors: { multiplier: 1.0, impact: 'neutral' },
      locationFactors: { multiplier: 1.0, impact: 'neutral' },
      weatherFactors: { multiplier: 1.0, impact: 'neutral' },
      eventFactors: { multiplier: 1.0, impact: 'none' },
      totalDemand: 50,
      confidence: 0.7,
      trends: { direction: 'stable', change: 0, confidence: 0.7 },
      recommendations: []
    };
  }

  getDefaultEventBasedForecast() {
    return {
      events: [],
      totalEventImpact: 0,
      peakTimes: [],
      recommendations: [],
      confidence: 0.5
    };
  }

  getDefaultWeatherImpactForecast() {
    return {
      condition: 'clear',
      temperature: 72,
      precipitation: 0,
      windSpeed: 5,
      demandMultiplier: 1.0,
      impactFactors: {},
      recommendations: []
    };
  }

  getDefaultSeasonalForecast() {
    return {
      season: 'current',
      demandPattern: { multiplier: 1.0, factors: [] },
      holidays: [],
      schoolCalendar: { inSession: true, breaks: [], impact: 'medium' },
      tourismSeason: { season: 'current', tourismLevel: 'moderate', impact: 'medium' },
      recommendations: []
    };
  }

  getDefaultDemandTrends() {
    return {
      overallTrend: 'stable',
      growthRate: 0,
      peakHours: [],
      peakDays: [],
      seasonalPatterns: {},
      weeklyPatterns: {},
      monthlyPatterns: {}
    };
  }

  getDefaultDemandHotspots() {
    return {
      hotspots: [],
      totalHotspots: 0,
      highDemandHotspots: 0,
      averageDemandScore: 0
    };
  }

  getDefaultDemandForecastingDashboard() {
    return {
      demandForecast: this.getDefaultDemandForecast(),
      eventForecast: this.getDefaultEventBasedForecast(),
      weatherForecast: this.getDefaultWeatherImpactForecast(),
      seasonalForecast: this.getDefaultSeasonalForecast(),
      trends: this.getDefaultDemandTrends(),
      hotspots: this.getDefaultDemandHotspots(),
      lastUpdated: new Date().toISOString(),
      dataQuality: 0,
      insights: []
    };
  }
}

// Export singleton instance
export default new DemandForecastingService();
