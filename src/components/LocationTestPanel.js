import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import SimpleLocationService from '../services/simpleLocationService';

const LocationTestPanel = ({ visible, onClose }) => {
  const [latitude, setLatitude] = useState('35.3733'); // Bakersfield default
  const [longitude, setLongitude] = useState('-119.0187');
  const [updating, setUpdating] = useState(false);

  const presetLocations = [
    { name: 'Bakersfield, CA', lat: '35.3733', lng: '-119.0187' },
    { name: 'Los Angeles, CA', lat: '34.0522', lng: '-118.2437' },
    { name: 'San Francisco, CA', lat: '37.7749', lng: '-122.4194' },
    { name: 'Sacramento, CA', lat: '38.5816', lng: '-121.4944' }
  ];

  const updateLocation = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Coordinates out of range');
      return;
    }

    setUpdating(true);
    try {
      // Set emulator location
      SimpleLocationService.setEmulatorLocation(lat, lng);
      
      // Force immediate update
      await SimpleLocationService.forceLocationUpdate();
      
      Alert.alert('Success', `Driver location updated to ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', `Failed to update location: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const setPresetLocation = (preset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Location Override</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            For emulator testing: Override driver location to test different cities
          </Text>

          {/* Preset Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            {presetLocations.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => setPresetLocation(preset)}
              >
                <Text style={styles.presetButtonText}>{preset.name}</Text>
                <Text style={styles.presetCoords}>
                  {preset.lat}, {preset.lng}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Coordinates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Coordinates</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="35.3733"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="-119.0187"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Current Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Location Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Ionicons name="location" size={16} color={COLORS.primary[600]} />
                              <Text style={styles.statusText}>
                Location tracking: {SimpleLocationService.getTrackingStatus().isTracking ? 'Active' : 'Inactive'}
              </Text>
              </View>
              <Text style={styles.statusNote}>
                Location updates will be sent to Firebase every 60 seconds for emulator
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={updateLocation}
            disabled={updating}
          >
            <Ionicons 
              name={updating ? "hourglass" : "location"} 
              size={16} 
              color="white" 
            />
            <Text style={styles.updateButtonText}>
              {updating ? 'Updating...' : 'Update Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 12,
  },
  presetButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  presetCoords: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  statusSection: {
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: 8,
    fontWeight: '500',
  },
  statusNote: {
    fontSize: 12,
    color: COLORS.gray[500],
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  updateButton: {
    backgroundColor: COLORS.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default LocationTestPanel;
