/**
 * Emergency Voice Service
 * Provides safety features for drivers
 * Works through the existing voice command service to avoid conflicts
 */

import { Alert, Linking, Platform } from 'react-native';
import speechService from './speechService';
import { parseEmergencyCommand } from '@/utils/naturalLanguageParser';

class EmergencyVoiceService {
  constructor() {
    this.isEnabled = false;
    this.onEmergencyCallback = null;
  }

  /**
   * Initialize emergency voice service
   */
  async initialize() {
    try {
      this.isEnabled = true;
      console.log('✅ Emergency voice service initialized');
      return true;
    } catch (error) {
      console.error('❌ Emergency voice initialization error:', error);
      return false;
    }
  }

  /**
   * Register emergency callback
   * Emergency detection happens through the main voiceCommandService
   */
  async startGlobalListener(onEmergencyCallback) {
    try {
      this.onEmergencyCallback = onEmergencyCallback;
      this.isEnabled = true;
      console.log('✅ Emergency callback registered (using main voice service)');
      return true;
    } catch (error) {
      console.error('❌ Error registering emergency callback:', error);
      return false;
    }
  }

  /**
   * Stop global emergency listener
   */
  async stopGlobalListener() {
    try {
      this.isEnabled = false;
      this.onEmergencyCallback = null;
      console.log('🔇 Emergency callback unregistered');
    } catch (error) {
      console.error('❌ Error stopping global emergency listener:', error);
    }
  }

  /**
   * Check if text contains emergency keywords
   * This is called by voiceCommandService for every voice input
   */
  checkForEmergency(text) {
    if (!this.isEnabled) return null;

    const parsed = parseEmergencyCommand(text);
    
    if (parsed.action !== 'unknown') {
      console.log(`🚨 EMERGENCY DETECTED: ${parsed.action} (urgency: ${parsed.urgency})`);
      return parsed;
    }

    return null;
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
    this.onEmergencyCallback = null;
    console.log('🗑️ Emergency voice service destroyed');
  }
}

// Export singleton instance
const emergencyVoiceService = new EmergencyVoiceService();
export { emergencyVoiceService };
export default emergencyVoiceService;

