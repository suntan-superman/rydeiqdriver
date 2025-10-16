/**
 * Emergency Voice Service
 * Global emergency listener that works even when voice is toggled off
 * Provides safety features for drivers
 */

import Voice from '@react-native-voice/voice';
import { Alert, Linking, Platform } from 'react-native';
import speechService from './speechService';
import { parseEmergencyCommand } from '@/utils/naturalLanguageParser';

class EmergencyVoiceService {
  constructor() {
    this.isListening = false;
    this.isEnabled = false;
    this.onEmergencyCallback = null;
    this.checkInterval = null;
  }

  /**
   * Initialize emergency voice service
   * This runs independently of the main voice command service
   */
  async initialize() {
    try {
      // Set up event handlers
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);

      console.log('✅ Emergency voice service initialized');
      return true;
    } catch (error) {
      console.error('❌ Emergency voice initialization error:', error);
      return false;
    }
  }

  /**
   * Start global emergency listener
   * This should be called when the app starts and runs continuously
   */
  async startGlobalListener(onEmergencyCallback) {
    try {
      this.onEmergencyCallback = onEmergencyCallback;
      this.isEnabled = true;

      // Start periodic listening (every 30 seconds for 5 seconds)
      // This allows emergency detection without draining battery
      this.checkInterval = setInterval(() => {
        if (this.isEnabled && !this.isListening) {
          this.startListening();
        }
      }, 30000); // Check every 30 seconds

      // Start first listening immediately
      await this.startListening();

      console.log('✅ Global emergency listener started');
      return true;
    } catch (error) {
      console.error('❌ Error starting global emergency listener:', error);
      return false;
    }
  }

  /**
   * Stop global emergency listener
   */
  async stopGlobalListener() {
    try {
      this.isEnabled = false;
      
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      await this.stopListening();
      
      console.log('🔇 Global emergency listener stopped');
    } catch (error) {
      console.error('❌ Error stopping global emergency listener:', error);
    }
  }

  /**
   * Start listening for emergency keywords
   */
  async startListening() {
    try {
      if (this.isListening) return;

      this.isListening = true;
      await Voice.start('en-US');
      
      // Auto-stop after 5 seconds
      setTimeout(async () => {
        if (this.isListening) {
          await this.stopListening();
        }
      }, 5000);
    } catch (error) {
      console.error('❌ Emergency listening error:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      if (!this.isListening) return;
      
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('❌ Stop emergency listening error:', error);
    }
  }

  /**
   * Handle speech results
   */
  onSpeechResults(e) {
    const results = e.value || [];
    const bestMatch = results[0] || '';
    
    if (!bestMatch) return;

    const parsed = parseEmergencyCommand(bestMatch);
    
    if (parsed.action !== 'unknown') {
      console.log(`🚨 EMERGENCY DETECTED: ${parsed.action} (urgency: ${parsed.urgency})`);
      this.handleEmergency(parsed, bestMatch);
    }
  }

  /**
   * Handle speech error
   */
  onSpeechError(e) {
    // Silently handle errors to avoid spamming logs
    this.isListening = false;
  }

  /**
   * Handle emergency detection
   */
  async handleEmergency(parsed, originalText) {
    try {
      // Stop listening immediately
      await this.stopListening();

      if (parsed.action === 'emergency') {
        await this.handleCriticalEmergency();
      } else if (parsed.action === 'safety_concern') {
        await this.handleSafetyConcern();
      }

      // Notify callback if set
      if (this.onEmergencyCallback) {
        this.onEmergencyCallback({
          action: parsed.action,
          urgency: parsed.urgency,
          originalText
        });
      }
    } catch (error) {
      console.error('❌ Error handling emergency:', error);
    }
  }

  /**
   * Handle critical emergency (911)
   */
  async handleCriticalEmergency() {
    await speechService.speak(
      'Emergency mode activated. Do you need police, medical, or roadside assistance?',
      null
    );

    Alert.alert(
      '🚨 Emergency Mode',
      'Emergency activated. What type of assistance do you need?',
      [
        {
          text: '🚔 Police',
          onPress: () => this.callEmergencyService('police')
        },
        {
          text: '🚑 Medical',
          onPress: () => this.callEmergencyService('medical')
        },
        {
          text: '🚗 Roadside',
          onPress: () => this.callEmergencyService('roadside')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Handle safety concern
   */
  async handleSafetyConcern() {
    await speechService.speak(
      'Safety mode activated. Your location is being shared. Would you like to end the current trip?',
      null
    );

    Alert.alert(
      '⚠️ Safety Mode',
      'Safety protocol activated. Your location is being shared with dispatch.',
      [
        {
          text: 'End Current Trip',
          onPress: () => {
            // TODO: Implement trip ending logic
            console.log('🛑 Ending trip due to safety concern');
          }
        },
        {
          text: 'Call Support',
          onPress: () => this.callSupport()
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Call emergency service
   */
  async callEmergencyService(type) {
    let phoneNumber = '';
    
    switch (type) {
      case 'police':
      case 'medical':
        phoneNumber = '911';
        break;
      case 'roadside':
        // TODO: Use actual roadside assistance number
        phoneNumber = '1-800-AAA-HELP';
        break;
      default:
        return;
    }

    try {
      const url = Platform.OS === 'ios' 
        ? `telprompt:${phoneNumber}`
        : `tel:${phoneNumber}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('❌ Error calling emergency service:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  }

  /**
   * Call support
   */
  async callSupport() {
    // TODO: Use actual support number
    const supportNumber = '1-800-ANYRYDE';
    
    try {
      const url = Platform.OS === 'ios'
        ? `telprompt:${supportNumber}`
        : `tel:${supportNumber}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('❌ Error calling support:', error);
    }
  }

  /**
   * Manually trigger emergency
   */
  async triggerEmergency(type = 'emergency') {
    if (type === 'emergency') {
      await this.handleCriticalEmergency();
    } else {
      await this.handleSafetyConcern();
    }
  }

  /**
   * Check if enabled
   */
  isActive() {
    return this.isEnabled;
  }

  /**
   * Cleanup
   */
  async destroy() {
    await this.stopGlobalListener();
    Voice.removeAllListeners();
    this.onEmergencyCallback = null;
    console.log('🗑️ Emergency voice service destroyed');
  }
}

// Export singleton instance
const emergencyVoiceService = new EmergencyVoiceService();
export { emergencyVoiceService };
export default emergencyVoiceService;

