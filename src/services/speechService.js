/**
 * Speech Service for AnyRyde Driver App
 * Handles text-to-speech notifications with queue management
 */

// Safe imports
let Speech, AsyncStorage;

try {
  Speech = require('expo-speech');
} catch (e) {
  console.warn('⚠️ expo-speech not available:', e.message);
  Speech = {
    speak: () => Promise.resolve(),
    stop: () => {},
    getAvailableVoicesAsync: () => Promise.resolve([]),
    isSpeakingAsync: () => Promise.resolve(false),
  };
}

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('⚠️ AsyncStorage not available:', e.message);
  AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  };
}

// Storage keys
const SPEECH_SETTINGS_KEY = '@anyryde_speech_settings';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  voice: 'female', // 'male' or 'female'
  rate: 1.0, // Speech rate (0.5 - 2.0)
  pitch: 1.0, // Speech pitch (0.5 - 2.0)
  
  // Event-specific toggles (Driver App)
  events: {
    newRideRequest: true,          // High priority
    bidAccepted: true,             // High priority
    rideCancelled: true,           // High priority
    rideCompleted: true,           // High priority
    bidRejected: false,            // Low priority - default OFF
    biddingExpired: false,         // Low priority - default OFF
    arrivingAtPickup: true,        // Medium priority
    passengerPickedUp: true,       // Medium priority
    approachingDestination: true,  // Medium priority
  }
};

class SpeechService {
  constructor() {
    this.messageQueue = [];
    this.isSpeaking = false;
    this.settings = { ...DEFAULT_SETTINGS };
    this.initialized = false;
  }

  /**
   * Initialize the service and load settings
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadSettings();
      this.initialized = true;
      console.log('✅ SpeechService initialized');
    } catch (error) {
      console.error('❌ Error initializing SpeechService:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(SPEECH_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Error loading speech settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(this.settings));
      console.log('✅ Speech settings saved');
    } catch (error) {
      console.error('❌ Error saving speech settings:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update a specific setting
   */
  async updateSetting(key, value) {
    await this.saveSettings({ [key]: value });
  }

  /**
   * Update an event-specific setting
   */
  async updateEventSetting(eventKey, enabled) {
    const events = { ...this.settings.events, [eventKey]: enabled };
    await this.saveSettings({ events });
  }

  /**
   * Get voice options based on platform
   */
  getVoiceIdentifier() {
    // Different platforms have different voice identifiers
    // iOS and Android have different built-in voices
    const { voice } = this.settings;
    
    // For iOS
    // Female: 'com.apple.ttsbundle.Samantha-compact'
    // Male: 'com.apple.ttsbundle.Alex-compact'
    
    // For Android
    // System will pick based on language, we can't easily specify gender
    // But we can try different languages that tend to be male/female
    
    // Expo-speech will use default voice if identifier not found
    return voice === 'male' 
      ? 'com.apple.ttsbundle.Alex-compact' 
      : 'com.apple.ttsbundle.Samantha-compact';
  }

  /**
   * Speak a message (adds to queue)
   * @param {string} message - Text to speak
   * @param {string} eventType - Type of event (for checking if enabled)
   * @param {object} options - Additional speech options
   */
  async speak(message, eventType = null, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if speech is globally enabled
    if (!this.settings.enabled) {
      return;
    }

    // Check if this specific event type is enabled
    if (eventType && this.settings.events[eventType] === false) {
      return;
    }

    // Add to queue
    this.messageQueue.push({ message, options });
    
    // Process queue if not already speaking
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  /**
   * Process the message queue
   */
  async processQueue() {
    if (this.messageQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const { message, options } = this.messageQueue.shift();

    const speechOptions = {
      language: 'en-US',
      pitch: this.settings.pitch,
      rate: this.settings.rate,
      voice: this.getVoiceIdentifier(),
      ...options,
      onDone: () => {
        // Process next message in queue
        this.processQueue();
      },
      onError: (error) => {
        console.error('❌ Speech error:', error);
        // Continue with next message
        this.processQueue();
      },
    };

    try {
      await Speech.speak(message, speechOptions);
    } catch (error) {
      console.error('❌ Error speaking:', error);
      this.processQueue();
    }
  }

  /**
   * Stop current speech and clear queue
   */
  async stop() {
    this.messageQueue = [];
    this.isSpeaking = false;
    try {
      await Speech.stop();
    } catch (error) {
      console.error('❌ Error stopping speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow() {
    return this.isSpeaking;
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return this.messageQueue.length;
  }

  // ============================================================
  // DRIVER APP SPECIFIC EVENT METHODS
  // ============================================================

  /**
   * Speak for new ride request
   */
  async speakNewRideRequest(pickup, destination) {
    const message = `New ride request received. Pickup at ${pickup}`;
    await this.speak(message, 'newRideRequest');
  }

  /**
   * Speak for bid accepted
   */
  async speakBidAccepted(amount) {
    const message = `Congratulations! Your bid of $${amount} has been accepted`;
    await this.speak(message, 'bidAccepted');
  }

  /**
   * Speak for bid rejected
   */
  async speakBidRejected() {
    const message = 'Another driver\'s bid was accepted';
    await this.speak(message, 'bidRejected');
  }

  /**
   * Speak for ride cancelled
   */
  async speakRideCancelled(cancelledBy = 'rider') {
    const message = cancelledBy === 'rider' 
      ? 'The rider has cancelled this ride'
      : 'Ride has been cancelled';
    await this.speak(message, 'rideCancelled');
  }

  /**
   * Speak for ride completed
   */
  async speakRideCompleted(earnings) {
    const message = earnings 
      ? `Ride completed! You earned $${earnings.toFixed(2)}`
      : 'Ride completed!';
    await this.speak(message, 'rideCompleted');
  }

  /**
   * Speak for bidding expired
   */
  async speakBiddingExpired() {
    const message = 'Bidding time has expired';
    await this.speak(message, 'biddingExpired');
  }

  /**
   * Speak for arriving at pickup
   */
  async speakArrivingAtPickup() {
    const message = 'Arriving at pickup location';
    await this.speak(message, 'arrivingAtPickup');
  }

  /**
   * Speak for passenger picked up
   */
  async speakPassengerPickedUp() {
    const message = 'Ride started';
    await this.speak(message, 'passengerPickedUp');
  }

  /**
   * Speak for approaching destination
   */
  async speakApproachingDestination() {
    const message = 'Approaching destination';
    await this.speak(message, 'approachingDestination');
  }
}

// Export singleton instance
let speechService;
try {
  speechService = new SpeechService();
} catch (error) {
  console.error('❌ Failed to create SpeechService instance:', error);
  // Create a stub service if instantiation fails
  speechService = {
    getSettings: () => ({ enabled: false, voice: 'female', events: {} }),
    updateSetting: () => Promise.resolve(),
    updateEventSetting: () => Promise.resolve(),
    speak: () => Promise.resolve(),
    stop: () => {},
    speakNewRideRequest: () => Promise.resolve(),
    speakBidAccepted: () => Promise.resolve(),
    speakBidRejected: () => Promise.resolve(),
    speakRideCancelled: () => Promise.resolve(),
    speakRideCompleted: () => Promise.resolve(),
    speakBiddingExpired: () => Promise.resolve(),
    speakArrivingAtPickup: () => Promise.resolve(),
    speakPassengerPickedUp: () => Promise.resolve(),
    speakApproachingDestination: () => Promise.resolve(),
  };
}

export { speechService };
export default speechService;

