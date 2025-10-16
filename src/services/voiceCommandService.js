/**
 * Voice Command Service
 * Handles voice recognition for hands-free driver interactions
 */

import Voice from '@react-native-voice/voice';
import { Platform, PermissionsAndroid } from 'react-native';

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
  return (text || '').toLowerCase().trim();
}

class VoiceCommandService {
  constructor() {
    this.isListening = false;
    this.currentContext = null; // 'ride_request', 'confirmation', etc.
    this.onCommandCallback = null;
    this.commandTimeout = null;
    this.locale = 'en-US';
  }

  /**
   * Initialize voice recognition
   */
  async initialize() {
    try {
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

      // Set up event handlers
      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);

      console.log('✅ Voice command service initialized');
      return true;
    } catch (error) {
      console.error('❌ Voice initialization error:', error);
      return false;
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(context, callback, timeoutMs = 10000) {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.currentContext = context;
      this.onCommandCallback = callback;
      this.isListening = true;

      await Voice.start(this.locale);
      console.log(`🎤 Listening for ${context} commands...`);

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

      await Voice.stop();
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
      await Voice.destroy();
      Voice.removeAllListeners();
      this.isListening = false;
      this.currentContext = null;
      this.onCommandCallback = null;
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

