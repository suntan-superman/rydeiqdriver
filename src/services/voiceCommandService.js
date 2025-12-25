/**
 * Voice Command Service
 * Handles voice recognition for hands-free driver interactions
 */

// Safe import for Voice module
let Voice;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  console.warn('⚠️ @react-native-voice/voice not available:', e.message);
  Voice = null;
}

import { Platform, PermissionsAndroid } from 'react-native';

// Import emergency service for checking keywords
let emergencyVoiceService = null;
try {
  emergencyVoiceService = require('./emergencyVoiceService').default;
} catch (e) {
  console.warn('Emergency voice service not available');
}

// Command vocabularies
const ACCEPT_WORDS = ['accept', 'yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'affirmative', 'take it', 'take'];
const DECLINE_WORDS = ['decline', 'no', 'nope', 'pass', 'skip', 'reject', 'negative', "don't", 'do not', 'not interested'];
const CONFIRM_WORDS = ['confirm', 'confirmed', 'yes', 'correct', 'right', 'sure'];
const CANCEL_WORDS = ['cancel', 'no', 'wrong', 'undo', 'go back', 'nevermind'];

// Phase 2 - Active Ride Commands
const ARRIVED_WORDS = ['arrived', "i'm here", 'im here', 'here', 'at location', 'at pickup'];
const START_TRIP_WORDS = ['start trip', 'begin trip', 'start ride', 'begin ride', 'start', 'begin', 'lets go', "let's go"];
const COMPLETE_TRIP_WORDS = ['complete trip', 'finish trip', 'complete ride', 'finish ride', 'complete', 'finish', 'done', 'arrived at destination', 'at destination'];
const PROBLEM_WORDS = ['problem', 'issue', 'help', 'need help', 'trouble'];

// Normalize text for matching
function normalize(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim();
}

class VoiceCommandService {
  constructor() {
    this.isListening = false;
    this.currentContext = null; // 'ride_request', 'confirmation', etc.
    this.onCommandCallback = null;
    this.commandTimeout = null;
    this.locale = 'en-US';
    this.isAvailable = false; // Track if Voice module is available
  }

  /**
   * Initialize voice recognition
   */
  async initialize() {
    try {
      // Check if Voice module is available (requires dev build)
      if (!Voice || typeof Voice.start !== 'function') {
        console.warn('⚠️ Voice module not available. Voice commands disabled.');
        console.warn('📱 Run "npx expo run:android" to enable voice features.');
        this.isAvailable = false;
        return false;
      }

      // Request permissions on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'AnyRyde needs microphone access for voice commands',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Microphone permission denied');
          return false;
        }
      }

      // Set up event handlers ONLY if Voice is available
      if (Voice && typeof Voice.on === 'function') {
        try {
          Voice.on('start', this.onSpeechStart.bind(this));
          Voice.on('end', this.onSpeechEnd.bind(this));
          Voice.on('results', this.onSpeechResults.bind(this));
          Voice.on('error', this.onSpeechError.bind(this));
        } catch (listenerError) {
          console.warn('⚠️ Could not set up Voice listeners:', listenerError.message);
          // Continue anyway - some methods might still work
        }
      }

      this.isAvailable = true;
      console.log('✅ Voice command service initialized');
      return true;
    } catch (error) {
      console.error('❌ Voice initialization error:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(context, callback, timeoutMs = 10000) {
    try {
      if (!this.isAvailable) {
        console.warn('⚠️ Voice not available, skipping voice commands');
        return false;
      }

      if (this.isListening) {
        await this.stopListening();
      }

      this.currentContext = context;
      this.onCommandCallback = callback;
      this.isListening = true;

      if (Voice && typeof Voice.start === 'function') {
        try {
          await Voice.start(this.locale);
          console.log(`🎤 Listening for ${context} commands...`);
        } catch (voiceError) {
          console.warn('⚠️ Voice.start failed:', voiceError.message);
          this.isListening = false;
          return false;
        }
      } else {
        console.warn('⚠️ Voice.start not available');
        return false;
      }

      // Auto-stop after timeout
      this.commandTimeout = setTimeout(() => {
        this.stopListening();
        if (this.onCommandCallback) {
          this.onCommandCallback({ type: 'timeout', command: null });
        }
      }, timeoutMs);

      return true;
    } catch (error) {
      console.error('❌ Start listening error:', error);
      this.isListening = false;
      return false;
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout);
        this.commandTimeout = null;
      }

      if (this.isAvailable && Voice && typeof Voice.stop === 'function') {
        try {
          await Voice.stop();
        } catch (voiceError) {
          console.warn('⚠️ Voice.stop failed:', voiceError.message);
        }
      }
      
      this.isListening = false;
      this.currentContext = null;
      console.log('🔇 Stopped listening');
    } catch (error) {
      console.error('❌ Stop listening error:', error);
    }
  }

  /**
   * Parse voice command based on context
   */
  parseCommand(text, context) {
    const normalized = normalize(text);
    console.log(`🔍 Parsing "${normalized}" in context: ${context}`);

    switch (context) {
      case 'ride_request':
        if (ACCEPT_WORDS.some(word => normalized.includes(word))) {
          return { action: 'accept', confidence: 'high', originalText: text };
        }
        if (DECLINE_WORDS.some(word => normalized.includes(word))) {
          return { action: 'decline', confidence: 'high', originalText: text };
        }
        break;

      case 'confirmation':
        if (CONFIRM_WORDS.some(word => normalized.includes(word))) {
          return { action: 'confirm', confidence: 'high', originalText: text };
        }
        if (CANCEL_WORDS.some(word => normalized.includes(word))) {
          return { action: 'cancel', confidence: 'high', originalText: text };
        }
        break;

      // Phase 2 - Active Ride Contexts
      case 'pickup_arrival':
        if (ARRIVED_WORDS.some(word => normalized.includes(word))) {
          return { action: 'arrived', confidence: 'high', originalText: text };
        }
        break;

      case 'start_trip':
        if (START_TRIP_WORDS.some(word => normalized.includes(word))) {
          return { action: 'start_trip', confidence: 'high', originalText: text };
        }
        break;

      case 'active_ride':
        if (COMPLETE_TRIP_WORDS.some(word => normalized.includes(word))) {
          return { action: 'complete_trip', confidence: 'high', originalText: text };
        }
        if (PROBLEM_WORDS.some(word => normalized.includes(word))) {
          return { action: 'problem', confidence: 'high', originalText: text };
        }
        break;

      case 'ride_issue':
        if (PROBLEM_WORDS.some(word => normalized.includes(word))) {
          return { action: 'problem', confidence: 'high', originalText: text };
        }
        break;

      // For other contexts, let the natural language parser handle it
      case 'scheduled_reminder':
      case 'driver_status':
      case 'stats_query':
      case 'bid_amount':
        // These are handled by naturalLanguageParser
        return { action: 'pass_to_parser', confidence: 'high', originalText: text };

      default:
        break;
    }

    return { action: 'unknown', confidence: 'low', originalText: text };
  }

  /**
   * Event: Speech started
   */
  onSpeechStart(e) {
    console.log('🎤 Speech started');
  }

  /**
   * Event: Speech ended
   */
  onSpeechEnd(e) {
    console.log('🔇 Speech ended');
  }

  /**
   * Event: Speech results received
   */
  onSpeechResults(e) {
    const results = e.value || [];
    const bestMatch = results[0] || '';
    
    console.log('📝 Heard:', bestMatch);
    console.log('📋 All results:', results);

    if (!bestMatch || !this.currentContext) {
      return;
    }

    // PRIORITY CHECK: Always check for emergency keywords first
    if (emergencyVoiceService) {
      const emergencyResult = emergencyVoiceService.checkForEmergency(bestMatch);
      if (emergencyResult && emergencyResult.action !== 'unknown') {
        console.log('🚨 EMERGENCY DETECTED - handling immediately');
        this.stopListening();
        
        // Trigger emergency handling
        emergencyVoiceService.handleEmergency(emergencyResult, bestMatch);
        
        // Also notify the callback so UI can respond
        if (this.onCommandCallback) {
          this.onCommandCallback({
            type: 'emergency',
            command: emergencyResult.action,
            text: bestMatch,
            confidence: 'high',
            urgency: emergencyResult.urgency
          });
        }
        return;
      }
    }

    // Normal command processing
    const command = this.parseCommand(bestMatch, this.currentContext);
    
    if (command.action !== 'unknown') {
      this.stopListening();
      
      if (this.onCommandCallback) {
        this.onCommandCallback({
          type: 'success',
          command: command.action,
          text: bestMatch,
          confidence: command.confidence
        });
      }
    }
  }

  /**
   * Event: Speech error
   */
  onSpeechError(e) {
    console.error('❌ Speech error:', e.error);
    this.isListening = false;
    
    if (this.onCommandCallback) {
      this.onCommandCallback({
        type: 'error',
        error: e.error,
        message: e.error?.message || 'Speech recognition error'
      });
    }
  }

  /**
   * Clean up and remove listeners
   */
  async destroy() {
    try {
      // Stop listening first - safe even if Voice is null
      try {
        await this.stopListening();
      } catch (stopError) {
        console.warn('⚠️ Error during stopListening in destroy:', stopError.message);
      }
      
      // Only call Voice methods if Voice is definitely not null and has the method
      if (Voice && Voice !== null) {
        try {
          if (typeof Voice.destroy === 'function') {
            await Voice.destroy();
          }
        } catch (destroyError) {
          console.warn('⚠️ Error calling Voice.destroy():', destroyError.message);
        }
        
        try {
          if (typeof Voice.removeAllListeners === 'function') {
            Voice.removeAllListeners();
          }
        } catch (removeError) {
          console.warn('⚠️ Error calling Voice.removeAllListeners():', removeError.message);
        }
      }
      
      // Clear local state
      this.isListening = false;
      this.currentContext = null;
      this.onCommandCallback = null;
      this.isAvailable = false;
      console.log('🗑️ Voice command service destroyed');
    } catch (error) {
      console.error('❌ Destroy error:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getListeningState() {
    return this.isListening;
  }

  /**
   * Get current context
   */
  getCurrentContext() {
    return this.currentContext;
  }
}

// Export singleton instance
const voiceCommandService = new VoiceCommandService();
export { voiceCommandService };
export default voiceCommandService;

