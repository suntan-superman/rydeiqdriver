import { calculateDistance } from './location';

/**
 * @fileoverview Service for calculating driver bid suggestions based on distance,
 * time-of-day pricing, and customizable rate settings.
 * 
 * This service is the core pricing engine for the driver app, enabling the
 * "name your price" bidding model that differentiates AnyRyde from traditional
 * ride-sharing platforms.
 * 
 * @module BidCalculationService
 * @see {@link ../../../docs/features/bidding-system.md} for full documentation
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude coordinate
 * @property {number} lng - Longitude coordinate
 */

/**
 * @typedef {Object} Location
 * @property {string} address - Human-readable address
 * @property {Coordinates} coordinates - Geographic coordinates
 */

/**
 * @typedef {Object} TimeBlock
 * @property {string} id - Unique identifier (e.g., 'morning_rush', 'evening_rush')
 * @property {string} name - Display name (e.g., 'Morning Rush')
 * @property {string} start - Start time in HH:MM format
 * @property {string} end - End time in HH:MM format
 * @property {number} pickup - Rate per mile for pickup distance
 * @property {number} destination - Rate per mile for trip distance
 * @property {boolean} enabled - Whether this time block is active
 */

/**
 * @typedef {Object} RateSettings
 * @property {Object} defaultRate - Default rates when no time block applies
 * @property {number} defaultRate.pickup - Default pickup rate ($/mile)
 * @property {number} defaultRate.destination - Default destination rate ($/mile)
 * @property {TimeBlock[]} timeBlocks - Array of time-based rate adjustments
 * @property {boolean} autoBidEnabled - Whether to auto-submit bids (future feature)
 */

/**
 * @typedef {Object} BidCalculationResult
 * @property {number} suggestedBid - Calculated bid amount in dollars
 * @property {Object} calculationDetails - Breakdown of the calculation
 * @property {number} calculationDetails.pickupDistance - Distance to pickup (miles)
 * @property {number} calculationDetails.rideDistance - Trip distance (miles)
 * @property {number} calculationDetails.pickupRate - Applied pickup rate ($/mile)
 * @property {number} calculationDetails.destinationRate - Applied destination rate ($/mile)
 * @property {number} calculationDetails.pickupCost - Total pickup cost ($)
 * @property {number} calculationDetails.destinationCost - Total trip cost ($)
 * @property {TimeBlock|null} appliedTimeBlock - Time block used, or null if default
 * @property {Date} scheduledTime - Time used for rate calculation
 * @property {boolean} isValid - Whether calculation succeeded
 * @property {string} [error] - Error message if isValid is false
 */

/**
 * Service for calculating suggested bids for ride requests.
 * Implements time-based dynamic pricing with configurable rate blocks.
 * 
 * @example
 * // Basic usage
 * import bidCalculationService from './bidCalculationService';
 * 
 * const result = bidCalculationService.calculateSuggestedBid(
 *   rideRequest,
 *   driverRateSettings,
 *   { latitude: 37.7749, longitude: -122.4194 }
 * );
 * 
 * console.log(`Suggested bid: $${result.suggestedBid}`);
 */
class BidCalculationService {
  /**
   * Creates a new BidCalculationService instance with default rate settings.
   * The default rates provide baseline pricing when a driver hasn't customized their settings.
   */
  constructor() {
    /** @type {RateSettings} */
    this.defaultRateSettings = {
      defaultRate: {
        pickup: 1.00,
        destination: 2.00,
      },
      timeBlocks: [
        {
          id: 'morning_rush',
          name: 'Morning Rush',
          start: '06:00',
          end: '09:00',
          pickup: 1.25,
          destination: 2.50,
          enabled: true,
        },
        {
          id: 'lunch_rush',
          name: 'Lunch Rush',
          start: '11:30',
          end: '13:00',
          pickup: 1.10,
          destination: 2.25,
          enabled: true,
        },
        {
          id: 'evening_rush',
          name: 'Evening Rush',
          start: '16:00',
          end: '18:00',
          pickup: 1.30,
          destination: 2.75,
          enabled: true,
        },
        {
          id: 'late_night',
          name: 'Late Night',
          start: '01:00',
          end: '03:00',
          pickup: 1.50,
          destination: 3.00,
          enabled: true,
        },
      ],
      autoBidEnabled: false,
    };
  }

  /**
   * Calculate suggested bid for a ride request based on distances and rate settings.
   * This is the primary method for determining what a driver should charge.
   * 
   * Formula: (Pickup Distance × Pickup Rate) + (Ride Distance × Destination Rate)
   * 
   * @param {Object} rideData - Ride request data
   * @param {Location} rideData.pickup - Pickup location with address and coordinates
   * @param {Location} rideData.destination - Destination location with address and coordinates
   * @param {Date|string} [rideData.scheduledTime] - When the ride is scheduled (defaults to now)
   * @param {RateSettings} rateSettings - Driver's customized rate settings
   * @param {Object} driverLocation - Driver's current GPS location
   * @param {number} driverLocation.latitude - Driver's latitude
   * @param {number} driverLocation.longitude - Driver's longitude
   * @returns {BidCalculationResult} Calculation result with suggested bid and breakdown
   * 
   * @example
   * const result = service.calculateSuggestedBid(
   *   {
   *     pickup: { address: '123 Main St', coordinates: { lat: 37.7749, lng: -122.4194 } },
   *     destination: { address: '456 Oak Ave', coordinates: { lat: 37.7849, lng: -122.4094 } },
   *     scheduledTime: new Date('2025-01-15T17:30:00')  // 5:30 PM - evening rush
   *   },
   *   driverRateSettings,
   *   { latitude: 37.7700, longitude: -122.4200 }
   * );
   */
  calculateSuggestedBid(rideData, rateSettings, driverLocation) {
    try {
      // Calculate distances
      const pickupDistance = this.calculatePickupDistance(driverLocation, rideData.pickup);
      const rideDistance = this.calculateRideDistance(rideData.pickup, rideData.destination);

      // Determine applicable rate based on scheduled time
      const scheduledTime = rideData.scheduledTime || new Date();
      const applicableRate = this.getApplicableRate(scheduledTime, rateSettings);

      // Calculate costs
      const pickupCost = pickupDistance * applicableRate.pickup;
      const destinationCost = rideDistance * applicableRate.destination;
      const totalBid = pickupCost + destinationCost;

      return {
        suggestedBid: Math.round(totalBid * 100) / 100, // Round to 2 decimal places
        calculationDetails: {
          pickupDistance: Math.round(pickupDistance * 10) / 10, // Round to 1 decimal
          rideDistance: Math.round(rideDistance * 10) / 10,
          pickupRate: applicableRate.pickup,
          destinationRate: applicableRate.destination,
          pickupCost: Math.round(pickupCost * 100) / 100,
          destinationCost: Math.round(destinationCost * 100) / 100,
        },
        appliedTimeBlock: applicableRate.timeBlock,
        scheduledTime: scheduledTime,
        isValid: true,
      };
    } catch (error) {
      console.error('Error calculating suggested bid:', error);
      return {
        suggestedBid: 0,
        calculationDetails: null,
        appliedTimeBlock: null,
        scheduledTime: null,
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate the straight-line distance from driver to pickup location.
   * Uses the Haversine formula for geographic distance calculation.
   * 
   * @param {Object} driverLocation - Driver's current GPS position
   * @param {number} driverLocation.latitude - Driver's latitude
   * @param {number} driverLocation.longitude - Driver's longitude
   * @param {Location} pickupLocation - Pickup location from ride request
   * @returns {number} Distance in miles
   * @throws {Error} If driver location or pickup location is missing
   */
  calculatePickupDistance(driverLocation, pickupLocation) {
    if (!driverLocation || !pickupLocation) {
      throw new Error('Driver location or pickup location is missing');
    }

    return calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      pickupLocation.coordinates.lat,
      pickupLocation.coordinates.lng
    );
  }

  /**
   * Calculate the straight-line distance from pickup to destination.
   * Uses the Haversine formula for geographic distance calculation.
   * 
   * @param {Location} pickupLocation - Pickup location from ride request
   * @param {Location} destinationLocation - Destination location from ride request
   * @returns {number} Distance in miles
   * @throws {Error} If pickup or destination location is missing
   */
  calculateRideDistance(pickupLocation, destinationLocation) {
    if (!pickupLocation || !destinationLocation) {
      throw new Error('Pickup or destination location is missing');
    }

    return calculateDistance(
      pickupLocation.coordinates.lat,
      pickupLocation.coordinates.lng,
      destinationLocation.coordinates.lat,
      destinationLocation.coordinates.lng
    );
  }

  /**
   * Determine which rate to apply based on the scheduled time.
   * Checks enabled time blocks to find one that matches, otherwise returns default rates.
   * 
   * Time blocks allow drivers to charge premium rates during busy periods
   * (rush hours, late night, etc.) while offering standard rates at other times.
   * 
   * @param {Date|string} scheduledTime - When the ride is scheduled
   * @param {RateSettings} rateSettings - Driver's rate configuration
   * @returns {Object} Applicable rate with pickup and destination rates
   * @returns {number} return.pickup - Rate per mile for pickup distance
   * @returns {number} return.destination - Rate per mile for trip distance
   * @returns {TimeBlock|null} return.timeBlock - Matched time block, or null if default
   */
  getApplicableRate(scheduledTime, rateSettings) {
    const settings = rateSettings || this.defaultRateSettings;
    const time = new Date(scheduledTime);
    const currentTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

    // Find matching time block
    const applicableTimeBlock = settings.timeBlocks.find(block => {
      if (!block.enabled) return false;
      return this.isTimeInRange(currentTime, block.start, block.end);
    });

    if (applicableTimeBlock) {
      return {
        pickup: applicableTimeBlock.pickup,
        destination: applicableTimeBlock.destination,
        timeBlock: applicableTimeBlock,
      };
    }

    // Fall back to default rate
    return {
      pickup: settings.defaultRate.pickup,
      destination: settings.defaultRate.destination,
      timeBlock: null,
    };
  }

  /**
   * Check if a time falls within a specified range.
   * Handles overnight ranges (e.g., 23:00 to 02:00) correctly.
   * 
   * @param {string} currentTime - Time to check in HH:MM format
   * @param {string} startTime - Range start in HH:MM format
   * @param {string} endTime - Range end in HH:MM format
   * @returns {boolean} True if currentTime is within the range
   * 
   * @example
   * // Regular range
   * isTimeInRange('07:30', '06:00', '09:00'); // true
   * 
   * // Overnight range
   * isTimeInRange('01:30', '23:00', '03:00'); // true
   */
  isTimeInRange(currentTime, startTime, endTime) {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    // Handle overnight ranges (e.g., 23:00 to 02:00)
    if (start > end) {
      return current >= start || current <= end;
    }

    return current >= start && current <= end;
  }

  /**
   * Convert a time string (HH:MM) to total minutes from midnight.
   * Used internally for time range comparisons.
   * 
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Total minutes from midnight (0-1439)
   * @private
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if accepting a new ride would conflict with a ride currently in progress.
   * Calculates estimated drop-off time based on remaining distance and average speed.
   * 
   * @param {Object} currentRide - Currently active ride data
   * @param {Location} currentRide.pickup - Current ride pickup location
   * @param {Location} currentRide.destination - Current ride destination
   * @param {Date} currentRide.startTime - When the current ride started
   * @param {Object} newRideRequest - Potential new ride request
   * @param {Date|string} newRideRequest.scheduledTime - When the new ride is requested
   * @returns {Object} Conflict analysis result
   * @returns {boolean} return.hasConflict - Whether there is a scheduling conflict
   * @returns {Date} [return.currentRideDropoffTime] - Estimated dropoff time for current ride
   * @returns {Date} [return.newRidePickupTime] - When new ride needs pickup
   * @returns {number} [return.conflictMinutes] - Minutes of overlap
   */
  checkInRideConflict(currentRide, newRideRequest) {
    if (!currentRide || !newRideRequest) {
      return { hasConflict: false };
    }

    // Calculate estimated drop-off time for current ride
    const currentRideDistance = this.calculateRideDistance(
      currentRide.pickup,
      currentRide.destination
    );
    
    // Estimate time based on average speed (25 mph in city)
    const estimatedDropoffTime = new Date(
      currentRide.startTime.getTime() + (currentRideDistance / 25) * 60 * 60 * 1000
    );

    // Check if new ride pickup is before current ride drop-off
    const newRidePickupTime = new Date(newRideRequest.scheduledTime);
    
    if (newRidePickupTime < estimatedDropoffTime) {
      return {
        hasConflict: true,
        currentRideDropoffTime: estimatedDropoffTime,
        newRidePickupTime: newRidePickupTime,
        conflictMinutes: Math.round((estimatedDropoffTime - newRidePickupTime) / (1000 * 60)),
      };
    }

    return { hasConflict: false };
  }

  /**
   * Validate driver's rate settings before saving.
   * Ensures all rates are positive and time formats are valid.
   * 
   * @param {RateSettings} rateSettings - Settings to validate
   * @returns {Object} Validation result
   * @returns {boolean} return.isValid - Whether settings are valid
   * @returns {string[]} return.errors - Array of validation error messages
   */
  validateRateSettings(rateSettings) {
    const errors = [];

    // Validate default rates
    if (!rateSettings.defaultRate || 
        rateSettings.defaultRate.pickup <= 0 || 
        rateSettings.defaultRate.destination <= 0) {
      errors.push('Default rates must be greater than $0.00');
    }

    // Validate time blocks
    if (rateSettings.timeBlocks) {
      rateSettings.timeBlocks.forEach((block, index) => {
        if (block.enabled) {
          // Validate rates
          if (block.pickup <= 0 || block.destination <= 0) {
            errors.push(`Time block ${index + 1}: Rates must be greater than $0.00`);
          }

          // Validate time format
          if (!this.isValidTimeFormat(block.start) || !this.isValidTimeFormat(block.end)) {
            errors.push(`Time block ${index + 1}: Invalid time format. Use HH:MM format`);
          }

          // Validate time range
          if (this.timeToMinutes(block.start) === this.timeToMinutes(block.end)) {
            errors.push(`Time block ${index + 1}: Start and end times cannot be the same`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate that a string is in HH:MM time format.
   * 
   * @param {string} timeString - String to validate
   * @returns {boolean} True if string matches HH:MM format (00:00 to 23:59)
   * @private
   */
  isValidTimeFormat(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Get rate settings with fallback to defaults.
   * Used when driver hasn't customized their settings.
   * 
   * @param {RateSettings|null} [userSettings=null] - Driver's custom settings
   * @returns {RateSettings} User settings or default settings
   */
  getRateSettings(userSettings = null) {
    return userSettings || this.defaultRateSettings;
  }

  /**
   * Format a 24-hour time string for user display (12-hour with AM/PM).
   * 
   * @param {string} timeString - Time in HH:MM format (e.g., '17:30')
   * @returns {string} Formatted time (e.g., '5:30 PM')
   */
  formatTimeForDisplay(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Get the UI color associated with a time block for visual differentiation.
   * 
   * @param {TimeBlock|null} timeBlock - Time block to get color for
   * @returns {string} Hex color code for the time block
   */
  getTimeBlockColor(timeBlock) {
    if (!timeBlock) return '#6B7280'; // gray-500
    
    const colors = {
      'morning_rush': '#F59E0B', // warning-500
      'lunch_rush': '#3B82F6',   // info-500
      'evening_rush': '#EF4444',  // error-500
      'late_night': '#8B5CF6',   // primary-500
    };
    
    return colors[timeBlock.id] || '#6B7280';
  }

  /**
   * Compare a suggested bid against market average pricing (future feature).
   * Helps drivers understand if their rates are competitive.
   * 
   * @param {number} suggestedBid - Driver's calculated bid amount
   * @param {Object|null} [marketData=null] - Market average data
   * @param {number} marketData.averageBid - Average bid amount in the area
   * @returns {Object|null} Comparison result, or null if no market data
   * @returns {number} return.marketAverage - Market average bid amount
   * @returns {number} return.difference - Dollar difference from average
   * @returns {number} return.percentageDifference - Percentage difference
   * @returns {boolean} return.isAboveAverage - True if bid is above market
   * @returns {boolean} return.isBelowAverage - True if bid is below market
   */
  compareWithMarketAverage(suggestedBid, marketData = null) {
    if (!marketData || !marketData.averageBid) {
      return null;
    }

    const difference = suggestedBid - marketData.averageBid;
    const percentageDifference = (difference / marketData.averageBid) * 100;

    return {
      marketAverage: marketData.averageBid,
      difference: Math.round(difference * 100) / 100,
      percentageDifference: Math.round(percentageDifference * 10) / 10,
      isAboveAverage: difference > 0,
      isBelowAverage: difference < 0,
    };
  }
}

// Export singleton instance
export default new BidCalculationService();
