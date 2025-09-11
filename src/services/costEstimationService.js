// Enhanced Cost Estimation Service for AnyRyde Driver App
// Provides detailed cost analysis for ride requests with two-phase estimation

// Import Firebase to get current driver location
import { auth, db } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getFuelPrices } from '@/services/api/fuelPriceService';
import { getVehicleMPG, calculateFuelCost, calculateProfitEstimate } from '@/utils/fuelEstimation';

class CostEstimationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current driver location from Firebase with enhanced error handling
   * @returns {Object} Driver location coordinates
   */
  async getCurrentDriverLocation() {
    try {
      // Add safety checks for Firebase availability
      if (!auth || !db) {
        return this.getFallbackLocation();
      }

      const user = auth.currentUser;
      if (!user) {
        return this.getFallbackLocation();
      }

      // Add timeout to prevent hanging on physical devices
      const locationPromise = this.getLocationFromFirestore(user.uid);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase location fetch timeout')), 5000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]);
      return location;

    } catch (error) {
      return this.getFallbackLocation();
    }
  }

  /**
   * Get location from Firestore with proper error handling
   */
  async getLocationFromFirestore(userId) {
    const driverRef = doc(db, 'drivers', userId);
    const driverDoc = await getDoc(driverRef);
    
    if (!driverDoc.exists()) {
      throw new Error('Driver document not found');
    }

    const driverData = driverDoc.data();
    const location = driverData.location;

    if (!location) {
      throw new Error('Driver location not available in document');
    }

    // Handle both GeoPoint and plain object formats
    return {
      latitude: location.latitude || location._lat || 35.3733,
      longitude: location.longitude || location._long || -119.0187,
      accuracy: 10,
      timestamp: Date.now()
    };
  }

  /**
   * Get fallback location for when Firebase fails
   */
  getFallbackLocation() {
    return {
      latitude: 35.3733,
      longitude: -119.0187,
      accuracy: 10,
      timestamp: Date.now(),
      isFallback: true
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - First latitude
   * @param {number} lng1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lng2 - Second longitude
   * @returns {number} Distance in miles
   */
  calculateDistance = (lat1, lng1, lat2, lng2) => {
    try {
      // Validate inputs
      if (typeof lat1 !== 'number' || typeof lng1 !== 'number' || 
          typeof lat2 !== 'number' || typeof lng2 !== 'number') {
        return 3.0; // fallback distance
      }

      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Return reasonable fallback if calculation failed
      return isNaN(distance) ? 3.0 : distance;
    } catch (error) {
      return 3.0; // fallback distance
    }
  }

  /**
   * Calculate pickup distance (driver location to pickup)
   * @param {Object} driverLocation - Driver's current location
   * @param {Object} pickup - Pickup location
   * @returns {number} Distance in miles
   */
  calculatePickupDistance = (driverLocation, pickup) => {
    if (!driverLocation || !pickup) {
      return 2.5; // fallback
    }

    // Handle different pickup location formats
    let pickupLat, pickupLng;
    if (pickup.coordinates) {
      pickupLat = pickup.coordinates.latitude || pickup.coordinates.lat;
      pickupLng = pickup.coordinates.longitude || pickup.coordinates.lng;
    } else {
      pickupLat = pickup.latitude || pickup.lat;
      pickupLng = pickup.longitude || pickup.lng;
    }

    const driverLat = driverLocation.latitude;
    const driverLng = driverLocation.longitude;

    if (!pickupLat || !pickupLng || !driverLat || !driverLng) {
      return 2.5; // fallback
    }

    try {
      const distance = this.calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
      return Math.max(0.1, isNaN(distance) ? 2.5 : distance); // Minimum 0.1 miles
    } catch (error) {
      return 2.5; // fallback
    }
  }

  /**
   * Calculate trip distance (pickup to destination)
   * @param {Object} pickup - Pickup location
   * @param {Object} destination - Destination location
   * @returns {number} Distance in miles
   */
  calculateTripDistance = (pickup, destination) => {
    if (!pickup || !destination) {
      return 3.0; // fallback
    }

    // Handle different location formats
    let pickupLat, pickupLng, destLat, destLng;
    
    if (pickup.coordinates) {
      pickupLat = pickup.coordinates.latitude || pickup.coordinates.lat;
      pickupLng = pickup.coordinates.longitude || pickup.coordinates.lng;
    } else {
      pickupLat = pickup.latitude || pickup.lat;
      pickupLng = pickup.longitude || pickup.lng;
    }

    if (destination.coordinates) {
      destLat = destination.coordinates.latitude || destination.coordinates.lat;
      destLng = destination.coordinates.longitude || destination.coordinates.lng;
    } else {
      destLat = destination.latitude || destination.lat;
      destLng = destination.longitude || destination.lng;
    }

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return 3.0; // fallback
    }

    try {
      const distance = this.calculateDistance(pickupLat, pickupLng, destLat, destLng);
      return Math.max(0.1, isNaN(distance) ? 3.0 : distance); // Minimum 0.1 miles
    } catch (error) {
      return 3.0; // fallback
    }
  }

  /**
   * Calculate comprehensive cost estimates for a ride request
   * @param {Object} rideRequest - Ride request data
   * @param {Object} driverVehicle - Driver's vehicle information
   * @param {Object} driverLocation - Driver's current location (optional)
   * @returns {Object} Detailed cost analysis
   */
  async calculateRideCosts(rideRequest, driverVehicle, driverLocation = null) {
    try {
      // Get driver's current location if not provided - with timeout protection
      if (!driverLocation) {
        try {
              driverLocation = await this.getCurrentDriverLocation();
        } catch (locationError) {
          // Use fallback location silently for physical device
          driverLocation = this.getFallbackLocation();
        }
      }

      // Validate location data before proceeding
      if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
        driverLocation = this.getFallbackLocation();
      }

      // Calculate distances with comprehensive error protection
      let pickupDistance = 2.5; // fallback
      let tripDistance = 3.0; // fallback
      
      try {
        if (rideRequest.pickup && typeof this.calculatePickupDistance === 'function') {
          pickupDistance = this.calculatePickupDistance(driverLocation, rideRequest.pickup);
          if (isNaN(pickupDistance) || pickupDistance <= 0) {
            pickupDistance = 2.5; // fallback for invalid result
          }
        }
      } catch (error) {
        pickupDistance = 2.5; // fallback
      }
      
      try {
        if (rideRequest.pickup && rideRequest.destination && typeof this.calculateTripDistance === 'function') {
          tripDistance = this.calculateTripDistance(rideRequest.pickup, rideRequest.destination);
          if (isNaN(tripDistance) || tripDistance <= 0) {
            tripDistance = 3.0; // fallback for invalid result
          }
        }
      } catch (error) {
        tripDistance = 3.0; // fallback
      }

      // Get fuel prices for driver's location
      const fuelPrices = await getFuelPrices(driverLocation);

      // Calculate pickup cost (driver to pickup)
      const pickupCost = await this.calculatePhaseCost({
        distance: pickupDistance,
        vehicle: driverVehicle,
        fuelPrices,
        location: driverLocation,
        phase: 'pickup',
        trafficFactor: this.estimateTrafficFactor('pickup', rideRequest)
      });

      // Calculate trip cost (pickup to destination)
      const tripCost = await this.calculatePhaseCost({
        distance: tripDistance,
        vehicle: driverVehicle,
        fuelPrices,
        location: rideRequest.pickup.coordinates,
        phase: 'trip',
        trafficFactor: this.estimateTrafficFactor('trip', rideRequest)
      });

      // Calculate total costs and profit analysis
      const totalCost = pickupCost.totalCost + tripCost.totalCost;
      const totalDistance = pickupDistance + tripDistance;

      // Calculate profit for company bid
      const profitAnalysis = await this.calculateProfitAnalysis({
        bidAmount: rideRequest.companyBid,
        pickupCost,
        tripCost,
        totalDistance,
        vehicle: driverVehicle
      });

      return {
        pickup: {
          distance: pickupDistance,
          cost: pickupCost,
          estimatedTime: this.estimateTravelTime(pickupDistance, 'pickup')
        },
        trip: {
          distance: tripDistance,
          cost: tripCost,
          estimatedTime: this.estimateTravelTime(tripDistance, 'trip')
        },
        total: {
          distance: totalDistance,
          cost: totalCost,
          totalCost: totalCost,
          fuelCost: pickupCost.totalCost + tripCost.totalCost,
          otherExpenses: this.calculateOtherExpenses(totalDistance)
        },
        profitAnalysis,
        recommendations: this.generateRecommendations(pickupCost, tripCost, profitAnalysis),
        fuelPrices: {
          source: fuelPrices.source,
          lastUpdated: fuelPrices.lastUpdated,
          location: fuelPrices.location
        }
      };

    } catch (error) {
      console.error('Error calculating ride costs:', error);
      return this.getFallbackEstimate(rideRequest);
    }
  }

  /**
   * Calculate cost for a specific phase (pickup or trip)
   */
  async calculatePhaseCost({
    distance,
    vehicle,
    fuelPrices,
    location,
    phase,
    trafficFactor = 1.0
  }) {
    // Get vehicle efficiency data
    const mpgData = await getVehicleMPG(
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.vehicleType,
      vehicle.driverId
    );

    // Calculate fuel cost
    const fuelCost = await calculateFuelCost({
      distance,
      vehicle,
      trafficFactor,
      customFuelPrices: fuelPrices,
      location
    });

    // Check if fuelCost has an error
    if (fuelCost.error) {
      return {
        totalCost: 0,
        fuelCost: fuelCost,
        otherExpenses: this.calculateOtherExpenses(distance),
        vehicleEfficiency: {
          mpg: mpgData.combined,
          fuelType: mpgData.fuelType,
          dataSource: mpgData.source
        },
        trafficImpact: {
          factor: trafficFactor,
          effectiveMPG: 0
        }
      };
    }

    // Calculate other expenses for this phase
    const otherExpenses = this.calculateOtherExpenses(distance);

    return {
      totalCost: fuelCost.totalCost + otherExpenses.total,
      fuelCost: fuelCost,
      otherExpenses,
      vehicleEfficiency: {
        mpg: mpgData.combined,
        fuelType: mpgData.fuelType,
        dataSource: mpgData.source
      },
      trafficImpact: {
        factor: trafficFactor,
        effectiveMPG: fuelCost.trafficImpact?.effectiveMPG || 0
      }
    };
  }

  /**
   * Calculate profit analysis for the entire ride
   */
  async calculateProfitAnalysis({
    bidAmount,
    pickupCost,
    tripCost,
    totalDistance,
    vehicle
  }) {
    const totalExpenses = pickupCost.totalCost + tripCost.totalCost;
    const commission = bidAmount * 0.15; // 15% platform commission
    const totalCosts = totalExpenses + commission;

    const netProfit = bidAmount - totalCosts;
    const profitMargin = (netProfit / bidAmount) * 100;
    const profitPerMile = totalDistance > 0 ? netProfit / totalDistance : 0;

    return {
      bidAmount,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      profitPerMile: Math.round(profitPerMile * 100) / 100,
      breakdown: {
        grossEarnings: bidAmount,
        pickupCost: pickupCost.totalCost,
        tripCost: tripCost.totalCost,
        commission: Math.round(commission * 100) / 100,
        totalExpenses: Math.round(totalCosts * 100) / 100
      },
      recommendations: this.generateProfitRecommendations(netProfit, profitMargin, bidAmount)
    };
  }

  // Duplicate methods removed - using arrow function versions above

  /**
   * Estimate traffic factor based on ride data and phase
   */
  estimateTrafficFactor(phase, rideRequest) {
    // Base traffic factors
    const baseFactors = {
      pickup: 1.1, // Light traffic for pickup
      trip: 1.2    // Moderate traffic for trip
    };

    let factor = baseFactors[phase] || 1.0;

    // Adjust based on time of day (if available)
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) factor *= 1.2; // Morning rush
    if (hour >= 17 && hour <= 19) factor *= 1.3; // Evening rush

    // Adjust based on distance
    const distance = phase === 'pickup' ? 
      this.calculatePickupDistance(null, rideRequest.pickup) :
      this.calculateTripDistance(rideRequest.pickup, rideRequest.destination);

    if (distance > 10) factor *= 1.1; // Longer distances may have more traffic

    return Math.min(factor, 1.5); // Cap at 1.5x
  }

  /**
   * Calculate other expenses (wear, insurance, etc.)
   */
  calculateOtherExpenses(distance) {
    const wearTearPerMile = 0.10; // $0.10 per mile
    const insurancePerMile = 0.05; // $0.05 per mile
    const maintenancePerMile = 0.03; // $0.03 per mile

    return {
      wearTear: distance * wearTearPerMile,
      insurance: distance * insurancePerMile,
      maintenance: distance * maintenancePerMile,
      total: distance * (wearTearPerMile + insurancePerMile + maintenancePerMile)
    };
  }

  /**
   * Estimate travel time based on distance and phase
   */
  estimateTravelTime(distance, phase) {
    const avgSpeed = phase === 'pickup' ? 25 : 30; // mph
    const timeInHours = distance / avgSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    return {
      minutes: timeInMinutes,
      hours: timeInHours,
      formatted: `${timeInMinutes} min`
    };
  }

  /**
   * Generate recommendations based on cost analysis
   */
  generateRecommendations(pickupCost, tripCost, profitAnalysis) {
    const recommendations = [];

    // Check if pickup cost is high
    if (pickupCost.totalCost > 5) {
      recommendations.push({
        type: 'warning',
        message: 'High pickup cost - consider if the distance is worth it',
        action: 'evaluate_pickup_distance'
      });
    }

    // Check if trip cost is reasonable
    const costPerMile = tripCost.totalCost / (tripCost.fuelCost.costBreakdown.fuelNeeded || 1);
    if (costPerMile > 0.50) {
      recommendations.push({
        type: 'info',
        message: 'High cost per mile - consider fuel efficiency',
        action: 'check_vehicle_efficiency'
      });
    }

    // Add profit-based recommendations
    if (profitAnalysis.netProfit < 0) {
      recommendations.push({
        type: 'error',
        message: 'This ride may result in a loss',
        action: 'increase_bid',
        suggestedIncrease: Math.abs(profitAnalysis.netProfit) + 2
      });
    } else if (profitAnalysis.profitMargin < 15) {
      recommendations.push({
        type: 'caution',
        message: 'Low profit margin - consider if worth your time',
        action: 'evaluate_time_investment'
      });
    } else if (profitAnalysis.profitMargin > 40) {
      recommendations.push({
        type: 'success',
        message: 'Excellent profit margin!',
        action: 'accept_quickly'
      });
    }

    return recommendations;
  }

  /**
   * Generate profit-specific recommendations
   */
  generateProfitRecommendations(netProfit, profitMargin, bidAmount) {
    const recommendations = [];

    if (netProfit < 0) {
      recommendations.push({
        type: 'warning',
        message: 'This bid may result in a loss. Consider increasing your bid.',
        action: 'increase_bid',
        suggestedIncrease: Math.abs(netProfit) + 2
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

    return recommendations;
  }

  /**
   * Get fallback estimate when calculation fails
   */
  getFallbackEstimate(rideRequest) {
    const totalDistance = 5; // Assume 5 miles
    const fuelCost = totalDistance * 0.15; // $0.15 per mile
    const otherExpenses = totalDistance * 0.18; // $0.18 per mile
    const totalCost = fuelCost + otherExpenses;

    return {
      pickup: {
        distance: 2,
        cost: { totalCost: fuelCost * 0.4 },
        estimatedTime: { minutes: 8, formatted: '8 min' }
      },
      trip: {
        distance: 3,
        cost: { totalCost: fuelCost * 0.6 },
        estimatedTime: { minutes: 12, formatted: '12 min' }
      },
      total: {
        distance: totalDistance,
        cost: totalCost,
        totalCost: totalCost,
        fuelCost,
        otherExpenses: { total: otherExpenses }
      },
      profitAnalysis: {
        netProfit: (rideRequest.companyBid || 20) - totalCost,
        profitMargin: 20,
        recommendations: []
      },
      recommendations: [],
      fuelPrices: {
        source: 'fallback',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Get optimal bid suggestion based on cost analysis
   */
  async getOptimalBidSuggestion(rideRequest, driverVehicle, driverLocation = null) {
    const costAnalysis = await this.calculateRideCosts(rideRequest, driverVehicle, driverLocation);
    
    const targetProfit = 10; // $10 target profit
    const commissionRate = 0.15; // 15% commission
    
    // Calculate minimum bid to achieve target profit
    const totalExpenses = costAnalysis.total.cost;
    const minimumBid = (targetProfit + totalExpenses) / (1 - commissionRate);
    
    // Round to nearest quarter
    const suggestedBid = Math.round(minimumBid * 4) / 4;
    
    // Ensure minimum of company bid - 10%
    const minimumBidThreshold = rideRequest.companyBid * 0.9;
    const optimalBid = Math.max(suggestedBid, minimumBidThreshold);
    
    return {
      suggestedBid: Math.round(optimalBid * 100) / 100,
      companyBid: rideRequest.companyBid,
      difference: optimalBid - rideRequest.companyBid,
      reasoning: `Optimized for $${targetProfit} profit with ${Math.round((1 - commissionRate) * 100)}% take-home`,
      costAnalysis
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const costEstimationService = new CostEstimationService();
export default costEstimationService; 