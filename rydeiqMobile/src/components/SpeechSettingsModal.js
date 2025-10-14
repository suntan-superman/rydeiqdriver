import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Slider
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speechService } from '../services/speechService';

const COLORS = {
  primary: '#10B981',
  white: '#FFFFFF',
  secondary: {
    200: '#E5E7EB',
    300: '#D1D5DB',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

const SpeechSettingsModal = ({ visible, onClose }) => {
  const [settings, setSettings] = useState(speechService.getSettings());

  useEffect(() => {
    if (visible) {
      setSettings(speechService.getSettings());
    }
  }, [visible]);

  const handleToggleEnabled = (value) => {
    speechService.updateSetting('enabled', value);
    setSettings(speechService.getSettings());
    if (!value) {
      speechService.stop(); // Stop speech if disabled
    }
  };

  const handleVoiceChange = (voice) => {
    speechService.updateSetting('voice', voice);
    setSettings(speechService.getSettings());
    speechService.speak(`Testing ${voice} voice.`, 'general');
  };

  const handleSliderChange = (key, value) => {
    speechService.updateSetting(key, value);
    setSettings(speechService.getSettings());
  };

  const handleEventToggle = (eventKey, value) => {
    speechService.updateEventSetting(eventKey, value);
    setSettings(speechService.getSettings());
  };

  const renderEventToggle = (eventKey, label) => (
    <View style={styles.settingItem} key={eventKey}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        trackColor={{ false: COLORS.secondary[300], true: COLORS.primary }}
        thumbColor={settings.eventSettings[eventKey] ? COLORS.white : COLORS.white}
        ios_backgroundColor={COLORS.secondary[300]}
        onValueChange={(value) => handleEventToggle(eventKey, value)}
        value={settings.eventSettings[eventKey]}
      />
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.secondary[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Master Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enable Voice Notifications</Text>
              <Switch
                trackColor={{ false: COLORS.secondary[300], true: COLORS.primary }}
                thumbColor={settings.enabled ? COLORS.white : COLORS.white}
                ios_backgroundColor={COLORS.secondary[300]}
                onValueChange={handleToggleEnabled}
                value={settings.enabled}
              />
            </View>

            {/* Voice Selection */}
            {settings.enabled && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Voice</Text>
                <View style={styles.voiceSelector}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      settings.voice === 'male' && styles.voiceButtonActive,
                    ]}
                    onPress={() => handleVoiceChange('male')}
                  >
                    <Text style={[
                      styles.voiceButtonText,
                      settings.voice === 'male' && styles.voiceButtonTextActive,
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      settings.voice === 'female' && styles.voiceButtonActive,
                    ]}
                    onPress={() => handleVoiceChange('female')}
                  >
                    <Text style={[
                      styles.voiceButtonText,
                      settings.voice === 'female' && styles.voiceButtonTextActive,
                    ]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Volume, Pitch, Rate Sliders */}
            {settings.enabled && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Volume: {settings.volume.toFixed(1)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.1}
                    value={settings.volume}
                    onValueChange={(value) => handleSliderChange('volume', value)}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.secondary[300]}
                  />
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pitch: {settings.pitch.toFixed(1)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2}
                    step={0.1}
                    value={settings.pitch}
                    onValueChange={(value) => handleSliderChange('pitch', value)}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.secondary[300]}
                  />
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Rate: {settings.rate.toFixed(1)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2}
                    step={0.1}
                    value={settings.rate}
                    onValueChange={(value) => handleSliderChange('rate', value)}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.secondary[300]}
                  />
                </View>
              </>
            )}

            {/* Event Specific Toggles */}
            {settings.enabled && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events to Announce</Text>
                {renderEventToggle('bidReceived', 'New Bid Received')}
                {renderEventToggle('driverAccepted', 'Driver Accepted Your Ride')}
                {renderEventToggle('driverEnRoute', 'Driver En Route')}
                {renderEventToggle('driverArriving', 'Driver Arriving Soon')}
                {renderEventToggle('driverArrived', 'Driver Has Arrived')}
                {renderEventToggle('rideStarted', 'Ride Started')}
                {renderEventToggle('rideCancelled', 'Ride Cancelled')}
                {renderEventToggle('rideCompleted', 'Ride Completed')}
                {renderEventToggle('timeRunningOut', 'Bidding Time Running Out')}
                {renderEventToggle('noBidsReceived', 'No Bids Received')}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    width: '100%',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[800],
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.secondary[700],
  },
  voiceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.secondary[200],
    borderRadius: 8,
    padding: 5,
  },
  voiceButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: COLORS.primary,
  },
  voiceButtonText: {
    fontSize: 16,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  voiceButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default SpeechSettingsModal;

