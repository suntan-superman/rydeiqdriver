// Driver Reliability & Anti-Gaming System Configuration
// Centralized config for scoring, cooldowns, and exemptions

/**
 * Reliability Score Configuration
 * Separate from 5-star ratings, based on bid behavior and execution
 */
export const RELIABILITY_CONFIG = {
  // Scoring Window
  SCORE_WINDOW_DAYS: 90, // Rolling window for score calculation
  SCORE_MIN_AWARDED: 20, // Minimum awarded rides for score calculation
  
  // Score Weights (must sum to 1.0)
  SCORE_WEIGHTS: {
    AR: 0.30,  // Acceptance Rate (awarded rides accepted / awarded rides)
    CR: 0.30,  // Cancellation Rate (driver cancels / accepted rides) - inverted
    OTA: 0.25, // On-Time Arrival (pickups within threshold)
    BH: 0.15   // Bid Honoring (awarded bids not canceled before pickup)
  },
  
  // Cooldown Settings
  CANCEL_GLOBAL_COOLDOWN_SEC: 120, // 2 minutes cooldown after cancel
  CANCEL_COOLDOWN_EXEMPT_CODES: [
    'RIDER_NO_SHOW',
    'PLATFORM_FAULT',
    'EMERGENCY_APPROVED',
    'RIDER_CANCELED'
  ],
  
  // Bid Throttling
  BID_EDIT_LIMIT_PER_RIDE: 3, // Max bid edits on same ride
  BID_EDIT_LIMIT_WINDOW_SEC: 120, // Within 2 minutes
  
  // On-Time Threshold
  ON_TIME_THRESHOLD_MIN: 3, // Pickup within 3 minutes of ETA = on-time
  
  // Exempt Cancel Codes (won't affect score)
  EXEMPT_CANCEL_CODES: [
    'RIDER_NO_SHOW',
    'PLATFORM_FAULT',
    'EMERGENCY_APPROVED',
    'EMERGENCY_MEDICAL',
    'VEHICLE_BREAKDOWN',
    'RIDER_CANCELED'
  ],
  
  // Score Ranges & Labels
  SCORE_RANGES: {
    EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: '#10B981' },
    GOOD: { min: 75, max: 89, label: 'Good', color: '#3B82F6' },
    WATCH: { min: 60, max: 74, label: 'Watch', color: '#F59E0B' },
    AT_RISK: { min: 0, max: 59, label: 'At Risk', color: '#EF4444' }
  }
};

/**
 * Cancel Reason Codes with metadata
 */
export const CANCEL_REASONS = [
  {
    code: 'RIDER_NO_SHOW',
    label: 'Rider No-Show',
    description: 'Rider did not arrive at pickup location',
    exempt: true,
    requiresValidation: true
  },
  {
    code: 'RIDER_CANCELED',
    label: 'Rider Canceled',
    description: 'Rider canceled the ride',
    exempt: true,
    requiresValidation: false
  },
  {
    code: 'VEHICLE_ISSUE',
    label: 'Vehicle Issue',
    description: 'Vehicle breakdown or mechanical problem',
    exempt: true,
    requiresValidation: true
  },
  {
    code: 'EMERGENCY_MEDICAL',
    label: 'Medical Emergency',
    description: 'Driver or passenger medical emergency',
    exempt: true,
    requiresValidation: true
  },
  {
    code: 'EMERGENCY_APPROVED',
    label: 'Other Emergency',
    description: 'Other verified emergency',
    exempt: true,
    requiresValidation: true
  },
  {
    code: 'PLATFORM_FAULT',
    label: 'Platform/App Issue',
    description: 'App malfunction or system error',
    exempt: true,
    requiresValidation: true
  },
  {
    code: 'DOUBLE_BOOKED',
    label: 'Double Booked',
    description: 'Accidentally accepted multiple rides',
    exempt: false,
    requiresValidation: false
  },
  {
    code: 'PRICE_DISPUTE',
    label: 'Price Disagreement',
    description: 'Disagreement about fare amount',
    exempt: false,
    requiresValidation: false
  },
  {
    code: 'UNSAFE_CONDITIONS',
    label: 'Unsafe Conditions',
    description: 'Weather, traffic, or safety concerns',
    exempt: false,
    requiresValidation: true
  },
  {
    code: 'PERSONAL_REASON',
    label: 'Personal Reason',
    description: 'Other personal circumstances',
    exempt: false,
    requiresValidation: false
  },
  {
    code: 'OTHER',
    label: 'Other',
    description: 'Other reason not listed',
    exempt: false,
    requiresValidation: false
  }
];

/**
 * Get score range for a given score value
 */
export const getScoreRange = (score) => {
  if (score >= 90) return RELIABILITY_CONFIG.SCORE_RANGES.EXCELLENT;
  if (score >= 75) return RELIABILITY_CONFIG.SCORE_RANGES.GOOD;
  if (score >= 60) return RELIABILITY_CONFIG.SCORE_RANGES.WATCH;
  return RELIABILITY_CONFIG.SCORE_RANGES.AT_RISK;
};

/**
 * Check if a cancel reason code is exempt
 */
export const isExemptCancelCode = (code) => {
  return RELIABILITY_CONFIG.EXEMPT_CANCEL_CODES.includes(code);
};

/**
 * Get cancel reason by code
 */
export const getCancelReason = (code) => {
  return CANCEL_REASONS.find(r => r.code === code);
};

/**
 * Calculate reliability score from metrics
 */
export const calculateReliabilityScore = (metrics) => {
  const {
    awarded = 0,
    accepted = 0,
    driver_cancels = 0,
    ontime_pickups = 0,
    total_pickups = 0,
    honored_bids = 0
  } = metrics;

  // Need minimum data for score
  if (awarded < RELIABILITY_CONFIG.SCORE_MIN_AWARDED) {
    return null; // Not enough data
  }

  // Calculate component scores
  const ar = awarded > 0 ? accepted / awarded : 0; // Acceptance Rate
  const cr = accepted > 0 ? 1 - (driver_cancels / accepted) : 1; // Cancellation Rate (inverted)
  const ota = total_pickups > 0 ? ontime_pickups / total_pickups : 0; // On-Time Arrival
  const bh = awarded > 0 ? honored_bids / awarded : 0; // Bid Honoring

  // Apply weights
  const weights = RELIABILITY_CONFIG.SCORE_WEIGHTS;
  const score = 100 * (
    weights.AR * Math.min(Math.max(ar, 0), 1) +
    weights.CR * Math.min(Math.max(cr, 0), 1) +
    weights.OTA * Math.min(Math.max(ota, 0), 1) +
    weights.BH * Math.min(Math.max(bh, 0), 1)
  );

  return Math.round(score);
};

export default RELIABILITY_CONFIG;

