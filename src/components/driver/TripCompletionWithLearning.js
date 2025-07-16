// Trip Completion with AI Learning Component
// Demonstrates how completed trips contribute to fuel efficiency learning

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recordTripEfficiency } from '../../utils/driverEfficiencyLearning';

const COLORS = {
  primary: {
    500: '#10B981',
    600: '#059669'
  },
  secondary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    700: '#374151',
    900: '#111827'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF'
};

const TripCompletionWithLearning = ({
  visible,
  onClose,
  tripData,
  driverId,
  onTripComplete
}) => {
  const [fuelData, setFuelData] = useState({
    fuelUsed: '',
    fuelType: 'gasoline',
    estimatedFuelCost: '',
    actualFuelCost: ''
  });

  const [tripConditions, setTripConditions] = useState({
    weather: 'clear',
    temperature: '',
    trafficLevel: 'normal',
    roadType: 'mixed'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [learningResult, setLearningResult] = useState(null);

  // Calculate estimated fuel usage when modal opens
  useEffect(() => {
    if (visible && tripData) {
      calculateEstimatedFuel();
    }
  }, [visible, tripData]);

  const calculateEstimatedFuel = () => {
    // Simple estimation: assume 30 MPG for demo
    const estimatedGallons = (tripData.distance / 30).toFixed(2);
    const estimatedCost = (estimatedGallons * 3.45).toFixed(2);
    
    setFuelData(prev => ({
      ...prev,
      fuelUsed: estimatedGallons,
      estimatedFuelCost: estimatedCost
    }));
  };

  const handleTripCompletion = async () => {
    if (!fuelData.fuelUsed || parseFloat(fuelData.fuelUsed) <= 0) {
      Alert.alert('Invalid Data', 'Please enter a valid fuel usage amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // Record trip efficiency for AI learning
      const learningData = {
        tripId: tripData.id,
        vehicle: tripData.vehicle,
        distance: tripData.distance,
        fuelUsed: parseFloat(fuelData.fuelUsed),
        fuelType: fuelData.fuelType,
        duration: tripData.duration,
        conditions: {
          weather: tripConditions.weather,
          temperature: tripConditions.temperature ? parseFloat(tripConditions.temperature) : null,
          trafficLevel: tripConditions.trafficLevel,
          roadType: tripConditions.roadType
        },
        driverId: driverId
      };

      const result = await recordTripEfficiency(learningData);
      
      if (result.success) {
        setLearningResult(result);
        
        // Show success message with learning info
        Alert.alert(
          'Trip Completed!',
          `Actual efficiency: ${result.actualEfficiency.toFixed(1)} MPG\n\nThis data will help improve your future fuel estimates.`,
          [
            {
              text: 'Great!',
              onPress: () => {
                onTripComplete?.(tripData, result);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to record trip data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process trip completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const WEATHER_OPTIONS = [
    { value: 'clear', label: 'Clear', icon: 'sunny' },
    { value: 'cloudy', label: 'Cloudy', icon: 'cloudy' },
    { value: 'rainy', label: 'Rainy', icon: 'rainy' },
    { value: 'snowy', label: 'Snowy', icon: 'snow' }
  ];

  const TRAFFIC_OPTIONS = [
    { value: 'light', label: 'Light Traffic', color: COLORS.success },
    { value: 'normal', label: 'Normal Traffic', color: COLORS.warning },
    { value: 'heavy', label: 'Heavy Traffic', color: COLORS.error }
  ];

  const ROAD_OPTIONS = [
    { value: 'city', label: 'City Streets' },
    { value: 'highway', label: 'Highway' },
    { value: 'mixed', label: 'Mixed' }
  ];

  if (!visible || !tripData) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Trip</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.secondary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            
            {/* Trip Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Distance</Text>
                  <Text style={styles.summaryValue}>{tripData.distance} miles</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{tripData.duration} min</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Earnings</Text>
                  <Text style={styles.summaryValue}>${tripData.earnings}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Vehicle</Text>
                  <Text style={styles.summaryValue}>
                    {tripData.vehicle?.make} {tripData.vehicle?.model}
                  </Text>
                </View>
              </View>
            </View>

            {/* Fuel Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fuel Usage</Text>
              <Text style={styles.sectionDescription}>
                Help AI learn your driving efficiency by providing actual fuel usage
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fuel Used (gallons)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fuelData.fuelUsed}
                  onChangeText={(value) => setFuelData(prev => ({ ...prev, fuelUsed: value }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputHint}>
                  Estimated: {fuelData.fuelUsed} gallons based on 30 MPG
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Actual Fuel Cost (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fuelData.actualFuelCost}
                  onChangeText={(value) => setFuelData(prev => ({ ...prev, actualFuelCost: value }))}
                  placeholder="$0.00"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputHint}>
                  Estimated: ${fuelData.estimatedFuelCost}
                </Text>
              </View>
            </View>

            {/* Trip Conditions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Conditions</Text>
              <Text style={styles.sectionDescription}>
                These conditions help AI provide better estimates
              </Text>

              {/* Weather */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weather</Text>
                <View style={styles.optionsGrid}>
                  {WEATHER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tripConditions.weather === option.value && styles.optionButtonSelected
                      ]}
                      onPress={() => setTripConditions(prev => ({ ...prev, weather: option.value }))}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={tripConditions.weather === option.value ? COLORS.white : COLORS.secondary[500]} 
                      />
                      <Text style={[
                        styles.optionText,
                        tripConditions.weather === option.value && styles.optionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Traffic Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Traffic Level</Text>
                <View style={styles.optionsRow}>
                  {TRAFFIC_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.trafficOption,
                        tripConditions.trafficLevel === option.value && {
                          backgroundColor: option.color,
                          borderColor: option.color
                        }
                      ]}
                      onPress={() => setTripConditions(prev => ({ ...prev, trafficLevel: option.value }))}
                    >
                      <Text style={[
                        styles.trafficText,
                        tripConditions.trafficLevel === option.value && { color: COLORS.white }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Temperature */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temperature (°F) - Optional</Text>
                <TextInput
                  style={styles.textInput}
                  value={tripConditions.temperature}
                  onChangeText={(value) => setTripConditions(prev => ({ ...prev, temperature: value }))}
                  placeholder="72"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* AI Learning Info */}
            <View style={styles.learningInfo}>
              <View style={styles.learningHeader}>
                <Ionicons name="school" size={20} color={COLORS.primary[500]} />
                <Text style={styles.learningTitle}>AI Learning</Text>
              </View>
              <Text style={styles.learningText}>
                This data will be used to improve fuel cost estimates for future trips with similar conditions.
              </Text>
              <View style={styles.learningBenefits}>
                <Text style={styles.benefitItem}>• More accurate profit calculations</Text>
                <Text style={styles.benefitItem}>• Personalized efficiency estimates</Text>
                <Text style={styles.benefitItem}>• Better bidding suggestions</Text>
              </View>
            </View>

          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]}
              onPress={handleTripCompletion}
              disabled={isSubmitting}
            >
              <Text style={styles.completeButtonText}>
                {isSubmitting ? 'Processing...' : 'Complete Trip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  modalContent: {
    flex: 1,
    padding: 16,
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
    color: COLORS.secondary[500],
    marginBottom: 16,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginTop: 4,
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[600],
  },
  optionText: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 8,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trafficOption: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
  },
  trafficText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[700],
    textAlign: 'center',
  },
  learningInfo: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[600],
    marginLeft: 8,
  },
  learningText: {
    fontSize: 14,
    color: COLORS.secondary[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  learningBenefits: {
    marginLeft: 8,
  },
  benefitItem: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[100],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.secondary[100],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[700],
  },
  completeButton: {
    flex: 2,
    backgroundColor: COLORS.primary[500],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  completeButtonDisabled: {
    backgroundColor: COLORS.secondary[300],
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default TripCompletionWithLearning; 