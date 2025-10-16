/**
 * Natural Language Parser
 * Parses voice commands and natural language input
 */

// Number words mapping
const NUMBER_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100
};

// Scheduled ride reminder responses
const REMINDER_CONFIRM_WORDS = ['confirm', 'confirmed', 'yes', 'okay', 'ok', 'got it', 'acknowledged', 'acknowledge', 'understood', 'understand'];
const REMINDER_CANCEL_WORDS = ['cancel', 'cancel ride', 'cancel the ride', 'not going', "can't make it", 'unable'];
const REMINDER_DETAILS_WORDS = ['details', 'more details', 'tell me more', 'more info', 'information'];
const REMINDER_NAVIGATE_WORDS = ['navigate', 'navigation', 'directions', 'map', 'route', 'take me there', 'guide me'];

// Active ride status words
const ARRIVED_WORDS = ['arrived', "i'm here", 'im here', 'here', 'at location', 'at pickup'];
const START_TRIP_WORDS = ['start trip', 'begin trip', 'start ride', 'begin ride', 'start', 'begin', 'lets go', "let's go"];
const COMPLETE_TRIP_WORDS = ['complete trip', 'finish trip', 'complete ride', 'finish ride', 'complete', 'finish', 'done', 'arrived at destination', 'at destination'];
const PROBLEM_WORDS = ['problem', 'issue', 'help', 'need help', 'trouble', 'emergency'];

// Going online/offline
const GO_ONLINE_WORDS = ['go online', 'online', 'start driving', 'start working', 'ready to drive', 'ready'];
const GO_OFFLINE_WORDS = ['go offline', 'offline', 'stop driving', 'stop working', 'done driving', 'finish driving'];

// Stats queries
const EARNINGS_WORDS = ['earnings', 'earned', 'money', 'income', 'how much', 'made today', 'todays earnings', 'today earnings'];
const RATING_WORDS = ['rating', 'my rating', 'star rating', 'stars', 'score'];
const TRIPS_WORDS = ['trips', 'rides', 'how many trips', 'trip count', 'ride count'];
const ACCEPTANCE_WORDS = ['acceptance', 'acceptance rate', 'accept rate'];

// Emergency words
const EMERGENCY_WORDS = ['emergency', 'help', '911', 'nine one one', 'call police', 'call 911'];
const SAFETY_WORDS = ['safety', 'safety concern', 'feel unsafe', 'uncomfortable', 'not safe'];

// Normalize text
function normalize(text) {
  return (text || '').toLowerCase().trim();
}

// Check if text contains any of the words
function containsAny(text, words) {
  const normalized = normalize(text);
  return words.some(word => normalized.includes(word));
}

/**
 * Parse amount from natural language
 * Examples: "fifteen dollars", "twenty-five fifty", "35", "10.50"
 */
export function parseAmountFromText(text) {
  const normalized = normalize(text);
  
  // Try to extract numeric value first (easiest case)
  const numericMatch = normalized.match(/(\d+\.?\d*)/);
  if (numericMatch) {
    return parseFloat(numericMatch[1]);
  }
  
  // Parse word-based numbers
  // Handle "twenty-five" or "twenty five" patterns
  const words = normalized.replace(/[^a-z\s]/g, '').split(/\s+/);
  let total = 0;
  let current = 0;
  
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      const value = NUMBER_WORDS[word];
      
      if (value === 100) {
        current = current === 0 ? 100 : current * 100;
      } else if (value >= 20) {
        current += value;
      } else {
        current += value;
      }
    } else if (word === 'and') {
      continue;
    } else {
      // Found non-number word, finalize current
      if (current > 0) {
        total += current;
        current = 0;
      }
    }
  }
  
  total += current;
  
  return total > 0 ? total : null;
}

/**
 * Parse scheduled ride reminder response
 */
export function parseReminderResponse(text) {
  if (containsAny(text, REMINDER_CONFIRM_WORDS)) {
    return { action: 'confirm', confidence: 'high' };
  }
  if (containsAny(text, REMINDER_CANCEL_WORDS)) {
    return { action: 'cancel_ride', confidence: 'high' };
  }
  if (containsAny(text, REMINDER_DETAILS_WORDS)) {
    return { action: 'details', confidence: 'high' };
  }
  if (containsAny(text, REMINDER_NAVIGATE_WORDS)) {
    return { action: 'navigate', confidence: 'high' };
  }
  return { action: 'unknown', confidence: 'low' };
}

/**
 * Parse active ride status command
 */
export function parseActiveRideCommand(text) {
  if (containsAny(text, ARRIVED_WORDS)) {
    return { action: 'arrived', confidence: 'high' };
  }
  if (containsAny(text, START_TRIP_WORDS)) {
    return { action: 'start_trip', confidence: 'high' };
  }
  if (containsAny(text, COMPLETE_TRIP_WORDS)) {
    return { action: 'complete_trip', confidence: 'high' };
  }
  if (containsAny(text, PROBLEM_WORDS)) {
    return { action: 'problem', confidence: 'high' };
  }
  return { action: 'unknown', confidence: 'low' };
}

/**
 * Parse driver status command (online/offline)
 */
export function parseDriverStatusCommand(text) {
  if (containsAny(text, GO_ONLINE_WORDS)) {
    return { action: 'go_online', confidence: 'high' };
  }
  if (containsAny(text, GO_OFFLINE_WORDS)) {
    return { action: 'go_offline', confidence: 'high' };
  }
  return { action: 'unknown', confidence: 'low' };
}

/**
 * Parse stats query
 */
export function parseStatsQuery(text) {
  if (containsAny(text, EARNINGS_WORDS)) {
    return { action: 'earnings', confidence: 'high' };
  }
  if (containsAny(text, RATING_WORDS)) {
    return { action: 'rating', confidence: 'high' };
  }
  if (containsAny(text, TRIPS_WORDS)) {
    return { action: 'trips', confidence: 'high' };
  }
  if (containsAny(text, ACCEPTANCE_WORDS)) {
    return { action: 'acceptance', confidence: 'high' };
  }
  return { action: 'unknown', confidence: 'low' };
}

/**
 * Parse emergency command
 */
export function parseEmergencyCommand(text) {
  if (containsAny(text, EMERGENCY_WORDS)) {
    return { action: 'emergency', urgency: 'critical', confidence: 'high' };
  }
  if (containsAny(text, SAFETY_WORDS)) {
    return { action: 'safety_concern', urgency: 'high', confidence: 'high' };
  }
  return { action: 'unknown', urgency: 'none', confidence: 'low' };
}

/**
 * General purpose command parser - routes to specific parsers
 */
export function parseCommand(text, context) {
  const normalized = normalize(text);
  
  // Always check for emergency first (highest priority)
  const emergencyResult = parseEmergencyCommand(normalized);
  if (emergencyResult.action !== 'unknown') {
    return { ...emergencyResult, originalText: text, context: 'emergency' };
  }
  
  // Context-specific parsing
  switch (context) {
    case 'scheduled_reminder':
      return { ...parseReminderResponse(normalized), originalText: text, context };
    
    case 'pickup_arrival':
    case 'start_trip':
    case 'active_ride':
      return { ...parseActiveRideCommand(normalized), originalText: text, context };
    
    case 'driver_status':
      return { ...parseDriverStatusCommand(normalized), originalText: text, context };
    
    case 'stats_query':
      return { ...parseStatsQuery(normalized), originalText: text, context };
    
    case 'bid_amount':
      const amount = parseAmountFromText(normalized);
      return {
        action: amount ? 'bid_amount' : 'unknown',
        amount,
        confidence: amount ? 'high' : 'low',
        originalText: text,
        context
      };
    
    default:
      return { action: 'unknown', confidence: 'low', originalText: text, context };
  }
}

export default {
  parseAmountFromText,
  parseReminderResponse,
  parseActiveRideCommand,
  parseDriverStatusCommand,
  parseStatsQuery,
  parseEmergencyCommand,
  parseCommand
};

