import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { speechService } from '@/services/speechService';

/**
 * Speech Settings Modal
 * Allows drivers to configure voice notification preferences
 */
const SpeechSettingsModal = ({ visible, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const currentSettings = speechService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading speech settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaster = async (value) => {
    await speechService.updateSetting('enabled', value);
    setSettings({ ...settings, enabled: value });
    
    if (value) {
      // Test speech when enabled
      await speechService.speak('Voice notifications enabled', null);
    }
  };

  const handleToggleEvent = async (eventKey, value) => {
    await speechService.updateEventSetting(eventKey, value);
    setSettings({
      ...settings,
      events: { ...settings.events, [eventKey]: value }
    });
  };

  const handleVoiceChange = async (voice) => {
    await speechService.updateSetting('voice', voice);
    setSettings({ ...settings, voice });
    
    // Test new voice
    const message = voice === 'male' 
      ? 'Male voice selected' 
      : 'Female voice selected';
    await speechService.speak(message, null);
  };

  const handleTestSpeech = async () => {
    await speechService.speakNewRideRequest('123 Main Street', '456 Oak Avenue');
  };

  if (loading || !settings) {
    return null;
  }

  const eventLabels = {
    newRideRequest: 'New Ride Requests',
    bidAccepted: 'Bid Accepted',
    rideCancelled: 'Ride Cancelled',
    rideCompleted: 'Ride Completed',
    bidRejected: 'Bid Rejected',
    biddingExpired: 'Bidding Expired',
    arrivingAtPickup: 'Arriving at Pickup',
    passengerPickedUp: 'Passenger Picked Up',
    approachingDestination: 'Approaching Destination',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔊 Voice Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.secondary[700]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Master Toggle */}
          <View style={styles.section}>
            <View style={styles.masterToggleRow}>
              <View style={styles.masterToggleInfo}>
                <Text style={styles.masterToggleLabel}>Enable Voice Notifications</Text>
                <Text style={styles.masterToggleDescription}>
                  Hear important ride updates spoken aloud
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleMaster}
                trackColor={{ false: COLORS.secondary[300], true: COLORS.success }}
                thumbColor="white"
              />
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* Voice Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Voice Selection</Text>
                <View style={styles.voiceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.voiceOption,
                      settings.voice === 'female' && styles.voiceOptionActive
                    ]}
                    onPress={() => handleVoiceChange('female')}
                  >
                    <Ionicons 
                      name="woman" 
                      size={24} 
                      color={settings.voice === 'female' ? 'white' : COLORS.secondary[600]} 
                    />
                    <Text style={[
                      styles.voiceOptionText,
                      settings.voice === 'female' && styles.voiceOptionTextActive
                    ]}>
                      Female Voice
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.voiceOption,
                      settings.voice === 'male' && styles.voiceOptionActive
                    ]}
                    onPress={() => handleVoiceChange('male')}
                  >
                    <Ionicons 
                      name="man" 
                      size={24} 
                      color={settings.voice === 'male' ? 'white' : COLORS.secondary[600]} 
                    />
                    <Text style={[
                      styles.voiceOptionText,
                      settings.voice === 'male' && styles.voiceOptionTextActive
                    ]}>
                      Male Voice
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Event Toggles */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notification Events</Text>
                <Text style={styles.sectionDescription}>
                  Choose which events you want to hear
                </Text>

                {Object.entries(eventLabels).map(([key, label]) => (
                  <View key={key} style={styles.eventRow}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventLabel}>{label}</Text>
                      {['newRideRequest', 'bidAccepted', 'rideCancelled', 'rideCompleted'].includes(key) && (
                        <Text style={styles.eventBadge}>Recommended</Text>
                      )}
                    </View>
                    <Switch
                      value={settings.events[key]}
                      onValueChange={(value) => handleToggleEvent(key, value)}
                      trackColor={{ false: COLORS.secondary[300], true: COLORS.success }}
                      thumbColor="white"
                    />
                  </View>
                ))}
              </View>

              {/* Test Button */}
              <View style={styles.section}>
                <TouchableOpacity style={styles.testButton} onPress={handleTestSpeech}>
                  <Ionicons name="volume-high" size={20} color="white" />
                  <Text style={styles.testButtonText}>Test Voice Notification</Text>
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={styles.infoSection}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Voice notifications will queue and play one after another. 
                  They will not interrupt your music or phone calls.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 16,
  },
  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  masterToggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  masterToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  masterToggleDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  voiceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  voiceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary[200],
  },
  voiceOptionActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  voiceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  voiceOptionTextActive: {
    color: 'white',
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventLabel: {
    fontSize: 15,
    color: COLORS.secondary[900],
  },
  eventBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: `${COLORS.primary}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary[700],
    lineHeight: 20,
  },
});

export default SpeechSettingsModal;

