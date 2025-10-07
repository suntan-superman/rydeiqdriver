/**
 * Schedule Analyzer Utility
 * Analyzes driver schedules to find gaps, calculate availability,
 * and provide intelligent insights for ride acceptance
 */

const TRAVEL_BUFFER_MINUTES = 15; // Time buffer between rides for travel
const MIN_USABLE_GAP_MINUTES = 30; // Minimum gap worth considering
const DEFAULT_DAY_START_HOUR = 6; // 6 AM
const DEFAULT_DAY_END_HOUR = 23; // 11 PM
const DEFAULT_RIDE_DURATION = 60; // Default if not specified

/**
 * Get pickup time from ride (handles different field names)
 * @param {Object} ride - Ride object
 * @returns {Date} Pickup time as Date object
 */
export const getPickupTime = (ride) => {
  const timeField = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
  return timeField?.toDate ? timeField.toDate() : new Date(timeField);
};

/**
 * Estimate when a ride will end based on pickup time and estimated duration
 * @param {Object} ride - Ride object
 * @returns {Date} Estimated end time
 */
export const estimateRideEndTime = (ride) => {
  const pickupTime = getPickupTime(ride);
  const estimatedDuration = ride.estimatedDuration || DEFAULT_RIDE_DURATION;
  return new Date(pickupTime.getTime() + estimatedDuration * 60000);
};

/**
 * Calculate time gaps between scheduled rides for a specific day
 * @param {Array} scheduledRides - Array of rides for analysis
 * @param {Date} targetDate - Date to analyze (defaults to today)
 * @returns {Object} Analysis results with gaps and statistics
 */
export const calculateDailySchedule = (scheduledRides, targetDate = new Date()) => {
  // Set day boundaries
  const dayStart = new Date(targetDate);
  dayStart.setHours(DEFAULT_DAY_START_HOUR, 0, 0, 0);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(DEFAULT_DAY_END_HOUR, 0, 0, 0);
  
  // Filter rides for this specific day
  const ridesForDay = scheduledRides.filter(ride => {
    const pickupTime = getPickupTime(ride);
    return (
      pickupTime.getDate() === targetDate.getDate() &&
      pickupTime.getMonth() === targetDate.getMonth() &&
      pickupTime.getFullYear() === targetDate.getFullYear()
    );
  });
  
  // Sort rides by pickup time
  const sortedRides = [...ridesForDay].sort((a, b) => 
    getPickupTime(a) - getPickupTime(b)
  );
  
  const gaps = [];
  let totalScheduledMinutes = 0;
  
  // Calculate scheduled time
  sortedRides.forEach(ride => {
    totalScheduledMinutes += (ride.estimatedDuration || DEFAULT_RIDE_DURATION);
  });
  
  // Gap before first ride
  if (sortedRides.length > 0) {
    const firstRideStart = getPickupTime(sortedRides[0]);
    const firstGapDuration = (firstRideStart - dayStart) / 60000; // ms to minutes
    
    if (firstGapDuration >= MIN_USABLE_GAP_MINUTES) {
      gaps.push({
        id: 'gap_morning',
        startTime: dayStart,
        endTime: new Date(firstRideStart.getTime() - TRAVEL_BUFFER_MINUTES * 60000),
        durationMinutes: firstGapDuration,
        usableTime: Math.max(0, firstGapDuration - TRAVEL_BUFFER_MINUTES),
        type: 'before_first',
        beforeRide: null,
        afterRide: sortedRides[0],
        suggestedRideCount: Math.floor((firstGapDuration - TRAVEL_BUFFER_MINUTES) / 45)
      });
    }
  }
  
  // Gaps between rides
  for (let i = 0; i < sortedRides.length - 1; i++) {
    const currentRide = sortedRides[i];
    const nextRide = sortedRides[i + 1];
    
    const currentEnd = estimateRideEndTime(currentRide);
    const nextStart = getPickupTime(nextRide);
    
    const gapDuration = (nextStart - currentEnd) / 60000;
    
    if (gapDuration >= MIN_USABLE_GAP_MINUTES) {
      gaps.push({
        id: `gap_${i}`,
        startTime: new Date(currentEnd.getTime() + TRAVEL_BUFFER_MINUTES * 60000),
        endTime: new Date(nextStart.getTime() - TRAVEL_BUFFER_MINUTES * 60000),
        durationMinutes: gapDuration,
        usableTime: Math.max(0, gapDuration - (TRAVEL_BUFFER_MINUTES * 2)),
        type: 'between',
        beforeRide: currentRide,
        afterRide: nextRide,
        suggestedRideCount: Math.floor(Math.max(0, gapDuration - (TRAVEL_BUFFER_MINUTES * 2)) / 45)
      });
    }
  }
  
  // Gap after last ride
  if (sortedRides.length > 0) {
    const lastRide = sortedRides[sortedRides.length - 1];
    const lastRideEnd = estimateRideEndTime(lastRide);
    const lastGapDuration = (dayEnd - lastRideEnd) / 60000;
    
    if (lastGapDuration >= MIN_USABLE_GAP_MINUTES) {
      gaps.push({
        id: 'gap_evening',
        startTime: new Date(lastRideEnd.getTime() + TRAVEL_BUFFER_MINUTES * 60000),
        endTime: dayEnd,
        durationMinutes: lastGapDuration,
        usableTime: Math.max(0, lastGapDuration - TRAVEL_BUFFER_MINUTES),
        type: 'after_last',
        beforeRide: lastRide,
        afterRide: null,
        suggestedRideCount: Math.floor(Math.max(0, lastGapDuration - TRAVEL_BUFFER_MINUTES) / 45)
      });
    }
  }
  
  // Calculate total available time
  const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.usableTime, 0);
  const totalDayMinutes = (dayEnd - dayStart) / 60000;
  const utilizationPercentage = totalDayMinutes > 0 
    ? Math.round((totalScheduledMinutes / totalDayMinutes) * 100)
    : 0;
  
  // Calculate suggested additional rides
  const totalSuggestedRides = gaps.reduce((sum, gap) => sum + gap.suggestedRideCount, 0);
  
  return {
    date: targetDate,
    scheduledRides: sortedRides,
    gaps,
    statistics: {
      totalScheduledMinutes,
      totalAvailableMinutes: totalGapMinutes,
      totalDayMinutes,
      utilizationPercentage,
      rideCount: sortedRides.length,
      gapCount: gaps.length,
      suggestedAdditionalRides: totalSuggestedRides,
      hasAvailability: gaps.length > 0,
      isBusy: utilizationPercentage > 60,
      isFree: utilizationPercentage < 20
    }
  };
};

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min`;
};

/**
 * Format time to display (e.g., "2:30 PM")
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format time range (e.g., "2:30 PM - 4:00 PM")
 * @param {Date} start - Start time
 * @param {Date} end - End time
 * @returns {string} Formatted time range
 */
export const formatTimeRange = (start, end) => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

/**
 * Analyze entire week's availability
 * @param {Array} scheduledRides - All scheduled rides
 * @returns {Array} Array of daily analyses for next 7 days
 */
export const analyzeWeekSchedule = (scheduledRides) => {
  const weekAnalysis = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    
    const dayAnalysis = calculateDailySchedule(scheduledRides, targetDate);
    weekAnalysis.push(dayAnalysis);
  }
  
  return weekAnalysis;
};

/**
 * Get availability status for a gap
 * @param {Object} gap - Gap object
 * @returns {Object} Status information
 */
export const getGapAvailabilityStatus = (gap) => {
  if (gap.usableTime >= 180) {
    return {
      level: 'high',
      color: '#10B981', // Green
      label: 'Great availability',
      suggestion: 'Could fit 2-3 rides or longer trips',
      icon: '🟢'
    };
  } else if (gap.usableTime >= 90) {
    return {
      level: 'medium',
      color: '#3B82F6', // Blue
      label: 'Good availability',
      suggestion: 'Perfect for 1 standard ride',
      icon: '🔵'
    };
  } else if (gap.usableTime >= 45) {
    return {
      level: 'low',
      color: '#F59E0B', // Yellow
      label: 'Limited availability',
      suggestion: 'Only accept quick, nearby rides',
      icon: '🟡'
    };
  } else {
    return {
      level: 'minimal',
      color: '#EF4444', // Red
      label: 'Very tight',
      suggestion: 'Avoid accepting rides - high risk',
      icon: '🔴'
    };
  }
};

/**
 * Generate insights for the day
 * @param {Object} dailyAnalysis - Result from calculateDailySchedule
 * @returns {Array} Array of insight objects
 */
export const generateDailyInsights = (dailyAnalysis) => {
  const insights = [];
  const { statistics, gaps, scheduledRides } = dailyAnalysis;
  
  // Insight: Overall availability
  if (statistics.isFree) {
    insights.push({
      priority: 'high',
      icon: '🎯',
      text: `Day is mostly free! Great opportunity to maximize earnings.`,
      type: 'opportunity'
    });
  } else if (statistics.isBusy) {
    insights.push({
      priority: 'medium',
      icon: '⏰',
      text: `Busy day scheduled - ${statistics.rideCount} committed rides.`,
      type: 'info'
    });
  }
  
  // Insight: Available time
  if (statistics.totalAvailableMinutes > 0) {
    insights.push({
      priority: 'high',
      icon: '💡',
      text: `${formatDuration(statistics.totalAvailableMinutes)} available for additional rides.`,
      type: 'opportunity'
    });
  }
  
  // Insight: Suggested rides
  if (statistics.suggestedAdditionalRides > 0) {
    insights.push({
      priority: 'high',
      icon: '📈',
      text: `Could accept ${statistics.suggestedAdditionalRides}-${statistics.suggestedAdditionalRides + 2} more rides today.`,
      type: 'suggestion'
    });
  }
  
  // Insight: Best gaps
  const largeGaps = gaps.filter(g => g.usableTime >= 120);
  if (largeGaps.length > 0) {
    insights.push({
      priority: 'medium',
      icon: '⭐',
      text: `${largeGaps.length} large gap${largeGaps.length !== 1 ? 's' : ''} - perfect for longer rides!`,
      type: 'opportunity'
    });
  }
  
  // Warning: Tight schedule
  const tightGaps = gaps.filter(g => g.usableTime < 60);
  if (tightGaps.length > 0 && gaps.length > 0) {
    insights.push({
      priority: 'warning',
      icon: '⚠️',
      text: `${tightGaps.length} tight gap${tightGaps.length !== 1 ? 's' : ''} - be selective with ride acceptance.`,
      type: 'caution'
    });
  }
  
  return insights;
};

/**
 * Estimate potential earnings from available gaps
 * @param {number} availableMinutes - Total available minutes
 * @param {number} avgEarningsPerRide - Driver's average earnings per ride
 * @returns {number} Estimated potential earnings
 */
export const estimatePotentialEarnings = (availableMinutes, avgEarningsPerRide = 25) => {
  const avgRideDuration = 45; // minutes
  const estimatedRides = Math.floor(availableMinutes / avgRideDuration);
  return estimatedRides * avgEarningsPerRide;
};

/**
 * Check if a new ride would fit in the schedule without conflicts
 * @param {Object} newRide - Potential ride to check
 * @param {Array} scheduledRides - Current scheduled rides
 * @returns {Object} Conflict analysis
 */
export const checkRideConflict = (newRide, scheduledRides) => {
  const newRideStart = getPickupTime(newRide);
  const newRideEnd = estimateRideEndTime(newRide);
  
  const conflicts = {
    hasConflict: false,
    conflictType: null,
    conflictingRides: [],
    riskLevel: 'low',
    recommendation: 'Safe to accept'
  };
  
  scheduledRides.forEach(scheduled => {
    const scheduledStart = getPickupTime(scheduled);
    const scheduledEnd = estimateRideEndTime(scheduled);
    
    // Check for direct overlap
    if (
      (newRideStart >= scheduledStart && newRideStart < scheduledEnd) ||
      (newRideEnd > scheduledStart && newRideEnd <= scheduledEnd) ||
      (newRideStart <= scheduledStart && newRideEnd >= scheduledEnd)
    ) {
      conflicts.hasConflict = true;
      conflicts.conflictType = 'direct_overlap';
      conflicts.conflictingRides.push(scheduled);
      conflicts.riskLevel = 'critical';
      conflicts.recommendation = '🚫 Cannot accept - conflicts with committed ride';
      return;
    }
    
    // Check for tight transitions
    const bufferMs = TRAVEL_BUFFER_MINUTES * 60000;
    const timeBeforeScheduled = scheduledStart - newRideEnd;
    const timeAfterScheduled = newRideStart - scheduledEnd;
    
    if (timeBeforeScheduled > 0 && timeBeforeScheduled < bufferMs) {
      conflicts.hasConflict = true;
      conflicts.conflictType = 'tight_before';
      conflicts.conflictingRides.push(scheduled);
      conflicts.riskLevel = 'high';
      const minutes = Math.round(timeBeforeScheduled / 60000);
      conflicts.recommendation = `⚠️ Only ${minutes} min before committed ride - risky!`;
    }
    
    if (timeAfterScheduled > 0 && timeAfterScheduled < bufferMs) {
      conflicts.hasConflict = true;
      conflicts.conflictType = 'tight_after';
      conflicts.conflictingRides.push(scheduled);
      conflicts.riskLevel = 'high';
      const minutes = Math.round(timeAfterScheduled / 60000);
      conflicts.recommendation = `⚠️ Only ${minutes} min after committed ride - risky!`;
    }
  });
  
  return conflicts;
};

/**
 * Get summary statistics for display
 * @param {Object} dailyAnalysis - Result from calculateDailySchedule
 * @returns {Object} Summary stats for UI
 */
export const getSummaryStats = (dailyAnalysis) => {
  const { statistics, gaps } = dailyAnalysis;
  
  return {
    scheduledRides: statistics.rideCount,
    committedHours: (statistics.totalScheduledMinutes / 60).toFixed(1),
    availableHours: (statistics.totalAvailableMinutes / 60).toFixed(1),
    utilizationPercentage: statistics.utilizationPercentage,
    gaps: statistics.gapCount,
    suggestedRides: statistics.suggestedAdditionalRides,
    status: statistics.isFree ? 'free' : statistics.isBusy ? 'busy' : 'moderate',
    potentialEarnings: estimatePotentialEarnings(statistics.totalAvailableMinutes)
  };
};

export default {
  calculateDailySchedule,
  getPickupTime,
  estimateRideEndTime,
  formatDuration,
  formatTime,
  formatTimeRange,
  analyzeWeekSchedule,
  getGapAvailabilityStatus,
  generateDailyInsights,
  estimatePotentialEarnings,
  checkRideConflict,
  getSummaryStats
};

