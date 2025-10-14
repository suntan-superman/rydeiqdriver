/**
 * Bid Adjustment Button Configuration Utility
 * Manages customizable quick adjustment buttons for bid submission
 */

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('⚠️ AsyncStorage not available:', e.message);
  AsyncStorage = null;
}

const STORAGE_KEY = '@bid_adjustment_buttons';

/**
 * BID VALIDATION CONSTANTS
 * Ensures all bid adjustments stay within safe bounds
 */
export const MIN_BID_AMOUNT = 5.00;    // Minimum bid: $5.00
export const MAX_BID_AMOUNT = 500.00;  // Maximum bid: $500.00

/**
 * Default button configurations
 */
export const DEFAULT_INCREASE_BUTTONS = [
  { type: 'amount', value: 2, label: '+$2', id: 'inc_1' },
  { type: 'amount', value: 5, label: '+$5', id: 'inc_2' },
  { type: 'percentage', value: 10, label: '+10%', id: 'inc_3' }
];

export const DEFAULT_DECREASE_BUTTONS = [
  { type: 'amount', value: 2, label: '-$2', id: 'dec_1' },
  { type: 'amount', value: 5, label: '-$5', id: 'dec_2' },
  { type: 'percentage', value: 10, label: '-10%', id: 'dec_3' }
];

/**
 * Button type definitions
 */
export const BUTTON_TYPES = {
  AMOUNT: 'amount',        // Fixed dollar amount ($2, $5, $10)
  PERCENTAGE: 'percentage' // Percentage of current bid (5%, 10%, 15%)
};

/**
 * Load button configuration from storage
 * @returns {Promise<Object>} Configuration object with increaseButtons and decreaseButtons
 */
export const loadButtonConfig = async () => {
  if (!AsyncStorage) {
    return {
      increaseButtons: DEFAULT_INCREASE_BUTTONS,
      decreaseButtons: DEFAULT_DECREASE_BUTTONS
    };
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return {
        increaseButtons: config.increaseButtons || DEFAULT_INCREASE_BUTTONS,
        decreaseButtons: config.decreaseButtons || DEFAULT_DECREASE_BUTTONS
      };
    }
  } catch (error) {
    console.warn('Could not load button config:', error);
  }

  return {
    increaseButtons: DEFAULT_INCREASE_BUTTONS,
    decreaseButtons: DEFAULT_DECREASE_BUTTONS
  };
};

/**
 * Save button configuration to storage
 * @param {Array} increaseButtons - Array of increase button configs
 * @param {Array} decreaseButtons - Array of decrease button configs
 * @returns {Promise<boolean>} Success status
 */
export const saveButtonConfig = async (increaseButtons, decreaseButtons) => {
  if (!AsyncStorage) {
    console.warn('AsyncStorage not available, cannot save config');
    return false;
  }

  try {
    const config = {
      increaseButtons: increaseButtons || DEFAULT_INCREASE_BUTTONS,
      decreaseButtons: decreaseButtons || DEFAULT_DECREASE_BUTTONS,
      savedAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Could not save button config:', error);
    return false;
  }
};

/**
 * Reset button configuration to defaults
 * @returns {Promise<boolean>} Success status
 */
export const resetButtonConfig = async () => {
  return await saveButtonConfig(DEFAULT_INCREASE_BUTTONS, DEFAULT_DECREASE_BUTTONS);
};

/**
 * Validate button configuration
 * @param {Object} button - Button configuration to validate
 * @returns {Object} Validation result {isValid, error}
 */
export const validateButtonConfig = (button) => {
  // Check required fields
  if (!button.type || !button.value || !button.label || !button.id) {
    return {
      isValid: false,
      error: 'Missing required fields (type, value, label, id)'
    };
  }

  // Validate type
  if (!Object.values(BUTTON_TYPES).includes(button.type)) {
    return {
      isValid: false,
      error: `Invalid type. Must be one of: ${Object.values(BUTTON_TYPES).join(', ')}`
    };
  }

  // Validate value
  if (typeof button.value !== 'number' || button.value <= 0) {
    return {
      isValid: false,
      error: 'Value must be a positive number'
    };
  }

  // Type-specific validation
  if (button.type === BUTTON_TYPES.AMOUNT) {
    if (button.value > 100) {
      return {
        isValid: false,
        error: 'Amount buttons should be $100 or less'
      };
    }
  }

  if (button.type === BUTTON_TYPES.PERCENTAGE) {
    if (button.value > 50) {
      return {
        isValid: false,
        error: 'Percentage buttons should be 50% or less'
      };
    }
  }

  return { isValid: true };
};

/**
 * Create a new button configuration
 * @param {string} type - Button type (amount or percentage)
 * @param {number} value - Button value
 * @param {string} direction - 'increase' or 'decrease'
 * @returns {Object} Button configuration
 */
export const createButtonConfig = (type, value, direction = 'increase') => {
  const prefix = direction === 'increase' ? '+' : '-';
  const suffix = type === BUTTON_TYPES.PERCENTAGE ? '%' : '';
  const dollarSign = type === BUTTON_TYPES.AMOUNT ? '$' : '';
  
  return {
    type,
    value,
    label: `${prefix}${dollarSign}${value}${suffix}`,
    id: `${direction.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(7)}`
  };
};

/**
 * Get preset button configurations for common use cases
 * @returns {Object} Preset configurations
 */
export const getPresetConfigs = () => {
  return {
    conservative: {
      name: 'Conservative',
      description: 'Small adjustments for fine-tuning',
      increaseButtons: [
        { type: 'amount', value: 1, label: '+$1', id: 'preset_inc_1' },
        { type: 'amount', value: 2, label: '+$2', id: 'preset_inc_2' },
        { type: 'percentage', value: 5, label: '+5%', id: 'preset_inc_3' }
      ],
      decreaseButtons: [
        { type: 'amount', value: 1, label: '-$1', id: 'preset_dec_1' },
        { type: 'amount', value: 2, label: '-$2', id: 'preset_dec_2' },
        { type: 'percentage', value: 5, label: '-5%', id: 'preset_dec_3' }
      ]
    },
    moderate: {
      name: 'Moderate',
      description: 'Balanced adjustments (default)',
      increaseButtons: DEFAULT_INCREASE_BUTTONS,
      decreaseButtons: DEFAULT_DECREASE_BUTTONS
    },
    aggressive: {
      name: 'Aggressive',
      description: 'Larger adjustments for quick changes',
      increaseButtons: [
        { type: 'amount', value: 5, label: '+$5', id: 'preset_inc_1' },
        { type: 'amount', value: 10, label: '+$10', id: 'preset_inc_2' },
        { type: 'percentage', value: 20, label: '+20%', id: 'preset_inc_3' }
      ],
      decreaseButtons: [
        { type: 'amount', value: 5, label: '-$5', id: 'preset_dec_1' },
        { type: 'amount', value: 10, label: '-$10', id: 'preset_dec_2' },
        { type: 'percentage', value: 20, label: '-20%', id: 'preset_dec_3' }
      ]
    },
    percentage: {
      name: 'Percentage Based',
      description: 'All percentage adjustments',
      increaseButtons: [
        { type: 'percentage', value: 5, label: '+5%', id: 'preset_inc_1' },
        { type: 'percentage', value: 10, label: '+10%', id: 'preset_inc_2' },
        { type: 'percentage', value: 15, label: '+15%', id: 'preset_inc_3' }
      ],
      decreaseButtons: [
        { type: 'percentage', value: 5, label: '-5%', id: 'preset_dec_1' },
        { type: 'percentage', value: 10, label: '-10%', id: 'preset_dec_2' },
        { type: 'percentage', value: 15, label: '-15%', id: 'preset_dec_3' }
      ]
    }
  };
};

export default {
  loadButtonConfig,
  saveButtonConfig,
  resetButtonConfig,
  validateButtonConfig,
  createButtonConfig,
  getPresetConfigs,
  BUTTON_TYPES,
  DEFAULT_INCREASE_BUTTONS,
  DEFAULT_DECREASE_BUTTONS
};

