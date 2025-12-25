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
import { calculateDistance } from './location';
import * as Location from 'expo-location';

class RouteOptimizationService {
  constructor() {
    this.db = db;
    this.trafficData = {};
    this.routeCache = new Map();
    this.optimizationSettings = {
      preferHighways: true,
      avoidTolls: false,
      avoidHighways: false,
      fuelEfficient: true,
      realTimeTraffic: true,
      multiStopOptimization: true
    };
    this.trafficUpdateInterval = null;
    this.routeHistory = [];
  }

  /**
   * Initialize route optimization service
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      
      // Load optimization settings
      await this.loadOptimizationSettings();
      
      // Initialize traffic monitoring
      await this.initializeTrafficMonitoring();
      
      // Load route history
      await this.loadRouteHistory();
      
      console.log('✅ Route Optimization Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Route Optimization Service:', error);
      return false;
    }
  }

  /**
   * Get optimized route between two points
   * @param {Object} origin - Origin coordinates {latitude, longitude}
   * @param {Object} destination - Destination coordinates {latitude, longitude}
   * @param {Object} options - Route optimization options
   * @returns {Promise<Object>} Optimized route data
   */
  async getOptimizedRoute(origin, destination, options = {}) {
    try {
      const routeKey = this.generateRouteKey(origin, destination, options);
      
      // Check cache first
      if (this.routeCache.has(routeKey)) {
        const cachedRoute = this.routeCache.get(routeKey);
        if (Date.now() - cachedRoute.timestamp < 300000) { // 5 minutes cache
          return cachedRoute.data;
        }
      }

      // Get multiple route options
      const routeOptions = await this.getRouteOptions(origin, destination, options);
      
      // Optimize routes based on current conditions
      const optimizedRoutes = await this.optimizeRoutes(routeOptions, options);
      
      // Select best route
      const bestRoute = this.selectBestRoute(optimizedRoutes, options);
      
      // Cache the result
      this.routeCache.set(routeKey, {
        data: bestRoute,
        timestamp: Date.now()
      });

      // Save route to history
      await this.saveRouteToHistory(bestRoute);

      return bestRoute;
    } catch (error) {
      console.error('Error getting optimized route:', error);
      return this.getFallbackRoute(origin, destination);
    }
  }

  /**
   * Get multiple route options
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} options - Route options
   * @returns {Promise<Array>} Array of route options
   */
  async getRouteOptions(origin, destination, options) {
    const routes = [];

    try {
      // Get routes from different providers/strategies
      const [fastestRoute, shortestRoute, fuelEfficientRoute, scenicRoute] = await Promise.all([
        this.getFastestRoute(origin, destination, options),
        this.getShortestRoute(origin, destination, options),
        this.getFuelEfficientRoute(origin, destination, options),
        this.getScenicRoute(origin, destination, options)
      ]);

      routes.push(fastestRoute, shortestRoute, fuelEfficientRoute, scenicRoute);

      // Filter out null routes
      return routes.filter(route => route !== null);
    } catch (error) {
      console.error('Error getting route options:', error);
      return [this.getFallbackRoute(origin, destination)];
    }
  }

  /**
   * Get fastest route (prioritizing speed)
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Fastest route
   */
  async getFastestRoute(origin, destination, options) {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      // Simulate route calculation with traffic data
      const baseTime = distance * 2; // 2 minutes per mile base time
      const trafficFactor = this.getTrafficFactor(origin, destination);
      const estimatedTime = baseTime * trafficFactor;

      return {
        id: 'fastest',
        name: 'Fastest Route',
        type: 'fastest',
        distance: distance,
        estimatedTime: estimatedTime,
        fuelCost: distance * 0.15, // $0.15 per mile
        waypoints: [origin, destination],
        instructions: this.generateRouteInstructions(origin, destination, 'fastest'),
        trafficConditions: this.getTrafficConditions(origin, destination),
        tolls: this.calculateTolls(origin, destination),
        highways: this.getHighwayUsage(origin, destination),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Error getting fastest route:', error);
      return null;
    }
  }

  /**
   * Get shortest route (prioritizing distance)
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Shortest route
   */
  async getShortestRoute(origin, destination, options) {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      // Shortest route might be slower due to local roads
      const baseTime = distance * 2.5; // 2.5 minutes per mile for local roads
      const trafficFactor = this.getTrafficFactor(origin, destination, 'local');
      const estimatedTime = baseTime * trafficFactor;

      return {
        id: 'shortest',
        name: 'Shortest Route',
        type: 'shortest',
        distance: distance * 0.9, // Slightly shorter
        estimatedTime: estimatedTime,
        fuelCost: distance * 0.9 * 0.12, // Lower fuel cost per mile
        waypoints: [origin, destination],
        instructions: this.generateRouteInstructions(origin, destination, 'shortest'),
        trafficConditions: this.getTrafficConditions(origin, destination, 'local'),
        tolls: 0, // No tolls on shortest route
        highways: 0, // No highways on shortest route
        confidence: 0.90
      };
    } catch (error) {
      console.error('Error getting shortest route:', error);
      return null;
    }
  }

  /**
   * Get fuel-efficient route
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Fuel-efficient route
   */
  async getFuelEfficientRoute(origin, destination, options) {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      // Fuel-efficient route balances distance and speed
      const baseTime = distance * 2.2; // 2.2 minutes per mile
      const trafficFactor = this.getTrafficFactor(origin, destination, 'balanced');
      const estimatedTime = baseTime * trafficFactor;

      return {
        id: 'fuel-efficient',
        name: 'Fuel Efficient',
        type: 'fuel-efficient',
        distance: distance,
        estimatedTime: estimatedTime,
        fuelCost: distance * 0.10, // Lower fuel cost
        waypoints: [origin, destination],
        instructions: this.generateRouteInstructions(origin, destination, 'fuel-efficient'),
        trafficConditions: this.getTrafficConditions(origin, destination, 'balanced'),
        tolls: this.calculateTolls(origin, destination) * 0.5, // Fewer tolls
        highways: this.getHighwayUsage(origin, destination) * 0.7, // Less highway usage
        confidence: 0.80
      };
    } catch (error) {
      console.error('Error getting fuel-efficient route:', error);
      return null;
    }
  }

  /**
   * Get scenic route
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Scenic route
   */
  async getScenicRoute(origin, destination, options) {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      // Scenic route is longer but more pleasant
      const baseTime = distance * 3; // 3 minutes per mile for scenic route
      const trafficFactor = this.getTrafficFactor(origin, destination, 'scenic');
      const estimatedTime = baseTime * trafficFactor;

      return {
        id: 'scenic',
        name: 'Scenic Route',
        type: 'scenic',
        distance: distance * 1.3, // 30% longer
        estimatedTime: estimatedTime,
        fuelCost: distance * 1.3 * 0.14, // Higher fuel cost due to longer distance
        waypoints: [origin, destination],
        instructions: this.generateRouteInstructions(origin, destination, 'scenic'),
        trafficConditions: this.getTrafficConditions(origin, destination, 'scenic'),
        tolls: 0, // No tolls on scenic route
        highways: 0, // No highways on scenic route
        confidence: 0.75
      };
    } catch (error) {
      console.error('Error getting scenic route:', error);
      return null;
    }
  }

  /**
   * Optimize routes based on current conditions
   * @param {Array} routes - Array of route options
   * @param {Object} options - Optimization options
   * @returns {Promise<Array>} Optimized routes
   */
  async optimizeRoutes(routes, options) {
    try {
      const optimizedRoutes = [];

      for (const route of routes) {
        // Apply real-time traffic adjustments
        const trafficAdjustedRoute = await this.applyTrafficAdjustments(route);
        
        // Apply fuel efficiency optimizations
        const fuelOptimizedRoute = await this.applyFuelOptimizations(trafficAdjustedRoute);
        
        // Apply driver preferences
        const personalizedRoute = await this.applyDriverPreferences(fuelOptimizedRoute);
        
        // Calculate route score
        const scoredRoute = this.calculateRouteScore(personalizedRoute, options);
        
        optimizedRoutes.push(scoredRoute);
      }

      return optimizedRoutes.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error optimizing routes:', error);
      return routes;
    }
  }

  /**
   * Select the best route from optimized options
   * @param {Array} routes - Array of optimized routes
   * @param {Object} options - Selection options
   * @returns {Object} Best route
   */
  selectBestRoute(routes, options) {
    if (routes.length === 0) {
      return null;
    }

    // If only one route, return it
    if (routes.length === 1) {
      return routes[0];
    }

    // Select based on preferences
    const preferences = options.preferences || {};
    
    if (preferences.prioritize === 'time') {
      return routes.find(r => r.type === 'fastest') || routes[0];
    } else if (preferences.prioritize === 'distance') {
      return routes.find(r => r.type === 'shortest') || routes[0];
    } else if (preferences.prioritize === 'fuel') {
      return routes.find(r => r.type === 'fuel-efficient') || routes[0];
    } else if (preferences.prioritize === 'scenic') {
      return routes.find(r => r.type === 'scenic') || routes[0];
    }

    // Default: return highest scored route
    return routes[0];
  }

  /**
   * Get multi-stop optimized route
   * @param {Object} origin - Origin coordinates
   * @param {Array} stops - Array of stop coordinates
   * @param {Object} destination - Final destination coordinates
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Multi-stop optimized route
   */
  async getMultiStopRoute(origin, stops, destination, options = {}) {
    try {
      // Optimize stop sequence using TSP (Traveling Salesman Problem) approximation
      const optimizedSequence = await this.optimizeStopSequence(origin, stops, destination);
      
      // Calculate route segments
      const routeSegments = [];
      let totalDistance = 0;
      let totalTime = 0;
      let totalFuelCost = 0;

      for (let i = 0; i < optimizedSequence.length - 1; i++) {
        const segment = await this.getOptimizedRoute(
          optimizedSequence[i], 
          optimizedSequence[i + 1], 
          options
        );
        
        routeSegments.push(segment);
        totalDistance += segment.distance;
        totalTime += segment.estimatedTime;
        totalFuelCost += segment.fuelCost;
      }

      return {
        id: 'multi-stop',
        name: 'Multi-Stop Route',
        type: 'multi-stop',
        distance: totalDistance,
        estimatedTime: totalTime,
        fuelCost: totalFuelCost,
        waypoints: optimizedSequence,
        segments: routeSegments,
        instructions: this.generateMultiStopInstructions(routeSegments),
        trafficConditions: this.getMultiStopTrafficConditions(routeSegments),
        tolls: routeSegments.reduce((sum, segment) => sum + segment.tolls, 0),
        highways: routeSegments.reduce((sum, segment) => sum + segment.highways, 0),
        confidence: 0.85,
        score: this.calculateMultiStopScore(routeSegments, options)
      };
    } catch (error) {
      console.error('Error getting multi-stop route:', error);
      return this.getFallbackMultiStopRoute(origin, stops, destination);
    }
  }

  /**
   * Optimize stop sequence using TSP approximation
   * @param {Object} origin - Origin coordinates
   * @param {Array} stops - Array of stop coordinates
   * @param {Object} destination - Final destination coordinates
   * @returns {Promise<Array>} Optimized stop sequence
   */
  async optimizeStopSequence(origin, stops, destination) {
    try {
      // Create distance matrix
      const allPoints = [origin, ...stops, destination];
      const distanceMatrix = this.createDistanceMatrix(allPoints);
      
      // Use nearest neighbor algorithm for TSP approximation
      const sequence = [origin];
      const remaining = [...stops, destination];
      let current = origin;
      
      while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = calculateDistance(
          current.latitude, current.longitude,
          remaining[0].latitude, remaining[0].longitude
        );
        
        for (let i = 1; i < remaining.length; i++) {
          const distance = calculateDistance(
            current.latitude, current.longitude,
            remaining[i].latitude, remaining[i].longitude
          );
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
        
        current = remaining[nearestIndex];
        sequence.push(current);
        remaining.splice(nearestIndex, 1);
      }
      
      return sequence;
    } catch (error) {
      console.error('Error optimizing stop sequence:', error);
      return [origin, ...stops, destination];
    }
  }

  /**
   * Get real-time traffic data
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @returns {Promise<Object>} Traffic data
   */
  async getTrafficData(origin, destination) {
    try {
      // In a real implementation, this would call a traffic API
      // For now, we'll simulate traffic data
      const trafficData = {
        congestionLevel: Math.random() * 4, // 0-4 scale
        averageSpeed: 25 + Math.random() * 30, // 25-55 mph
        incidents: this.generateTrafficIncidents(origin, destination),
        roadConditions: this.getRoadConditions(origin, destination),
        lastUpdated: new Date()
      };

      return trafficData;
    } catch (error) {
      console.error('Error getting traffic data:', error);
      return this.getDefaultTrafficData();
    }
  }

  /**
   * Get ETA prediction
   * @param {Object} route - Route data
   * @param {Object} currentLocation - Current location
   * @param {Object} options - ETA options
   * @returns {Promise<Object>} ETA prediction
   */
  async getETAPrediction(route, currentLocation, options = {}) {
    try {
      const currentTime = new Date();
      const baseETA = new Date(currentTime.getTime() + route.estimatedTime * 60000);
      
      // Apply traffic adjustments
      const trafficAdjustment = this.calculateTrafficAdjustment(route, currentTime);
      const adjustedETA = new Date(baseETA.getTime() + trafficAdjustment * 60000);
      
      // Apply historical data adjustments
      const historicalAdjustment = await this.getHistoricalAdjustment(route, currentTime);
      const finalETA = new Date(adjustedETA.getTime() + historicalAdjustment * 60000);
      
      return {
        baseETA: baseETA,
        adjustedETA: adjustedETA,
        finalETA: finalETA,
        confidence: this.calculateETAConfidence(route, trafficAdjustment, historicalAdjustment),
        factors: {
          traffic: trafficAdjustment,
          historical: historicalAdjustment,
          weather: 0, // Weather factor (not implemented yet)
          events: 0   // Special events factor (not implemented yet)
        }
      };
    } catch (error) {
      console.error('Error getting ETA prediction:', error);
      return this.getDefaultETAPrediction(route);
    }
  }

  /**
   * Get alternative routes
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @param {Object} currentRoute - Current route to compare against
   * @param {Object} options - Alternative route options
   * @returns {Promise<Array>} Array of alternative routes
   */
  async getAlternativeRoutes(origin, destination, currentRoute, options = {}) {
    try {
      const alternatives = [];
      
      // Get different route types
      const routeTypes = ['fastest', 'shortest', 'fuel-efficient', 'scenic'];
      
      for (const type of routeTypes) {
        if (type !== currentRoute.type) {
          const route = await this.getRouteByType(origin, destination, type, options);
          if (route && this.isSignificantlyDifferent(route, currentRoute)) {
            alternatives.push(route);
          }
        }
      }
      
      // Sort by score
      return alternatives.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting alternative routes:', error);
      return [];
    }
  }

  // Helper methods
  generateRouteKey(origin, destination, options) {
    return `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}-${JSON.stringify(options)}`;
  }

  getTrafficFactor(origin, destination, routeType = 'default') {
    // Simulate traffic factor based on route type and time
    const baseFactor = 1.0;
    const timeFactor = this.getTimeBasedTrafficFactor();
    const routeTypeFactor = this.getRouteTypeTrafficFactor(routeType);
    
    return baseFactor * timeFactor * routeTypeFactor;
  }

  getTimeBasedTrafficFactor() {
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) return 1.5; // Morning rush
    if (hour >= 17 && hour <= 19) return 1.4; // Evening rush
    if (hour >= 12 && hour <= 13) return 1.2; // Lunch time
    return 1.0; // Normal traffic
  }

  getRouteTypeTrafficFactor(routeType) {
    const factors = {
      'fastest': 1.0,
      'shortest': 1.3,
      'fuel-efficient': 1.1,
      'scenic': 1.5,
      'local': 1.4,
      'balanced': 1.1
    };
    return factors[routeType] || 1.0;
  }

  getTrafficConditions(origin, destination, routeType = 'default') {
    return {
      level: Math.floor(Math.random() * 5), // 0-4 scale
      description: this.getTrafficDescription(routeType),
      color: this.getTrafficColor(routeType)
    };
  }

  getTrafficDescription(routeType) {
    const descriptions = {
      'fastest': 'Moderate traffic on highways',
      'shortest': 'Heavy traffic on local roads',
      'fuel-efficient': 'Light to moderate traffic',
      'scenic': 'Light traffic on scenic routes',
      'local': 'Heavy traffic on local roads',
      'balanced': 'Moderate traffic conditions'
    };
    return descriptions[routeType] || 'Normal traffic conditions';
  }

  getTrafficColor(routeType) {
    const colors = {
      'fastest': '#4CAF50', // Green
      'shortest': '#FF9800', // Orange
      'fuel-efficient': '#2196F3', // Blue
      'scenic': '#9C27B0', // Purple
      'local': '#F44336', // Red
      'balanced': '#FFC107' // Amber
    };
    return colors[routeType] || '#4CAF50';
  }

  calculateTolls(origin, destination) {
    // Simulate toll calculation
    const distance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    return distance > 10 ? Math.random() * 5 : 0; // $0-5 for longer routes
  }

  getHighwayUsage(origin, destination) {
    // Simulate highway usage percentage
    const distance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    return distance > 5 ? Math.min(0.8, distance / 20) : 0; // More highways for longer routes
  }

  generateRouteInstructions(origin, destination, routeType) {
    // Generate basic route instructions
    const distance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    
    return [
      {
        step: 1,
        instruction: `Start from origin`,
        distance: 0,
        duration: 0
      },
      {
        step: 2,
        instruction: `Follow ${routeType} route for ${distance.toFixed(1)} miles`,
        distance: distance,
        duration: distance * 2
      },
      {
        step: 3,
        instruction: `Arrive at destination`,
        distance: 0,
        duration: 0
      }
    ];
  }

  generateMultiStopInstructions(segments) {
    const instructions = [];
    let step = 1;
    
    for (const segment of segments) {
      instructions.push({
        step: step++,
        instruction: `Drive ${segment.distance.toFixed(1)} miles to next stop`,
        distance: segment.distance,
        duration: segment.estimatedTime
      });
    }
    
    return instructions;
  }

  getMultiStopTrafficConditions(segments) {
    const conditions = segments.map(segment => segment.trafficConditions);
    return {
      overall: this.calculateOverallTrafficConditions(conditions),
      segments: conditions
    };
  }

  calculateOverallTrafficConditions(conditions) {
    const averageLevel = conditions.reduce((sum, condition) => sum + condition.level, 0) / conditions.length;
    return {
      level: Math.round(averageLevel),
      description: this.getTrafficDescription('balanced'),
      color: this.getTrafficColor('balanced')
    };
  }

  calculateMultiStopScore(segments, options) {
    const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
    const totalTime = segments.reduce((sum, segment) => sum + segment.estimatedTime, 0);
    const totalFuelCost = segments.reduce((sum, segment) => sum + segment.fuelCost, 0);
    
    // Calculate efficiency score
    const efficiencyScore = 100 - (totalTime / totalDistance) * 10;
    const fuelScore = 100 - (totalFuelCost / totalDistance) * 100;
    
    return (efficiencyScore + fuelScore) / 2;
  }

  createDistanceMatrix(points) {
    const matrix = [];
    for (let i = 0; i < points.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = calculateDistance(
            points[i].latitude, points[i].longitude,
            points[j].latitude, points[j].longitude
          );
        }
      }
    }
    return matrix;
  }

  generateTrafficIncidents(origin, destination) {
    // Simulate traffic incidents
    const incidents = [];
    const numIncidents = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numIncidents; i++) {
      incidents.push({
        type: ['accident', 'construction', 'road_closed'][Math.floor(Math.random() * 3)],
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        description: 'Traffic incident affecting route',
        impact: Math.random() * 30 // 0-30 minutes delay
      });
    }
    
    return incidents;
  }

  getRoadConditions(origin, destination) {
    return {
      surface: 'good',
      weather: 'clear',
      visibility: 'good'
    };
  }

  getDefaultTrafficData() {
    return {
      congestionLevel: 2,
      averageSpeed: 35,
      incidents: [],
      roadConditions: {
        surface: 'good',
        weather: 'clear',
        visibility: 'good'
      },
      lastUpdated: new Date()
    };
  }

  applyTrafficAdjustments(route) {
    const trafficFactor = this.getTrafficFactor(route.waypoints[0], route.waypoints[route.waypoints.length - 1]);
    return {
      ...route,
      estimatedTime: route.estimatedTime * trafficFactor,
      trafficAdjusted: true
    };
  }

  applyFuelOptimizations(route) {
    // Apply fuel efficiency optimizations
    return {
      ...route,
      fuelCost: route.fuelCost * 0.95, // 5% fuel savings
      fuelOptimized: true
    };
  }

  applyDriverPreferences(route) {
    // Apply driver-specific preferences
    return {
      ...route,
      personalized: true
    };
  }

  calculateRouteScore(route, options) {
    const timeScore = Math.max(0, 100 - route.estimatedTime * 2);
    const distanceScore = Math.max(0, 100 - route.distance * 5);
    const fuelScore = Math.max(0, 100 - route.fuelCost * 20);
    const trafficScore = Math.max(0, 100 - route.trafficConditions.level * 20);
    
    return {
      ...route,
      score: (timeScore + distanceScore + fuelScore + trafficScore) / 4
    };
  }

  calculateTrafficAdjustment(route, currentTime) {
    const hour = currentTime.getHours();
    const trafficFactor = this.getTimeBasedTrafficFactor();
    return (trafficFactor - 1) * route.estimatedTime;
  }

  async getHistoricalAdjustment(route, currentTime) {
    // Simulate historical data adjustment
    return Math.random() * 5 - 2.5; // -2.5 to +2.5 minutes
  }

  calculateETAConfidence(route, trafficAdjustment, historicalAdjustment) {
    const baseConfidence = 0.8;
    const trafficConfidence = Math.max(0.5, 1 - Math.abs(trafficAdjustment) / 30);
    const historicalConfidence = Math.max(0.5, 1 - Math.abs(historicalAdjustment) / 10);
    
    return (baseConfidence + trafficConfidence + historicalConfidence) / 3;
  }

  getDefaultETAPrediction(route) {
    const currentTime = new Date();
    const eta = new Date(currentTime.getTime() + route.estimatedTime * 60000);
    
    return {
      baseETA: eta,
      adjustedETA: eta,
      finalETA: eta,
      confidence: 0.7,
      factors: {
        traffic: 0,
        historical: 0,
        weather: 0,
        events: 0
      }
    };
  }

  async getRouteByType(origin, destination, type, options) {
    switch (type) {
      case 'fastest':
        return await this.getFastestRoute(origin, destination, options);
      case 'shortest':
        return await this.getShortestRoute(origin, destination, options);
      case 'fuel-efficient':
        return await this.getFuelEfficientRoute(origin, destination, options);
      case 'scenic':
        return await this.getScenicRoute(origin, destination, options);
      default:
        return null;
    }
  }

  isSignificantlyDifferent(route1, route2) {
    const timeDiff = Math.abs(route1.estimatedTime - route2.estimatedTime);
    const distanceDiff = Math.abs(route1.distance - route2.distance);
    
    return timeDiff > 5 || distanceDiff > 2; // 5 minutes or 2 miles difference
  }

  getFallbackRoute(origin, destination) {
    const distance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    
    return {
      id: 'fallback',
      name: 'Direct Route',
      type: 'fallback',
      distance: distance,
      estimatedTime: distance * 2,
      fuelCost: distance * 0.15,
      waypoints: [origin, destination],
      instructions: this.generateRouteInstructions(origin, destination, 'fallback'),
      trafficConditions: this.getTrafficConditions(origin, destination, 'fallback'),
      tolls: 0,
      highways: 0,
      confidence: 0.5,
      score: 50
    };
  }

  getFallbackMultiStopRoute(origin, stops, destination) {
    return {
      id: 'fallback-multi',
      name: 'Multi-Stop Route',
      type: 'multi-stop',
      distance: 0,
      estimatedTime: 0,
      fuelCost: 0,
      waypoints: [origin, ...stops, destination],
      segments: [],
      instructions: [],
      trafficConditions: this.getTrafficConditions(origin, destination, 'fallback'),
      tolls: 0,
      highways: 0,
      confidence: 0.5,
      score: 50
    };
  }

  async saveRouteToHistory(route) {
    try {
      if (!this.driverId) return;
      
      const routeData = {
        driverId: this.driverId,
        ...route,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(this.db, 'routeHistory'), routeData);
    } catch (error) {
      console.error('Error saving route to history:', error);
    }
  }

  async loadRouteHistory() {
    try {
      if (!this.driverId) return;
      
      const historyQuery = query(
        collection(this.db, 'routeHistory'),
        where('driverId', '==', this.driverId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(historyQuery);
      this.routeHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading route history:', error);
      this.routeHistory = [];
    }
  }

  async loadOptimizationSettings() {
    try {
      if (!this.driverId) return;
      
      const settingsDoc = await getDoc(doc(this.db, 'driverRouteSettings', this.driverId));
      if (settingsDoc.exists()) {
        this.optimizationSettings = { ...this.optimizationSettings, ...settingsDoc.data() };
      }
    } catch (error) {
      console.error('Error loading optimization settings:', error);
    }
  }

  async initializeTrafficMonitoring() {
    // Initialize traffic data monitoring
    this.trafficData = await this.getTrafficData({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 });
  }
}

// Export singleton instance
export default new RouteOptimizationService();
