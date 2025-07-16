// Enhanced Vehicle Efficiency Profile Component
// Allows drivers to manage detailed fuel efficiency data

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleMPG } from '../../utils/fuelEstimation';
import { getDriverLearningStats, clearDriverLearningData } from '../../utils/driverEfficiencyLearning';

const COLORS = {
  primary: {
    50: '#F0FDF4',
    500: '#10B981',
    600: '#059669',
    700: '#047857'
  },
  secondary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF'
};

const VehicleEfficiencyProfile = ({
  vehicleData,
  driverId,
  onVehicleUpdate,
  onEfficiencyUpdate
}) => {
  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    vehicleType: 'standard',
    customEfficiency: null,
    useCustomEfficiency: false,
    fuelType: 'gasoline',
    ...vehicleData
  });

  const [databaseMPG, setDatabaseMPG] = useState(null);
  const [learningStats, setLearningStats] = useState(null);
  const [showEfficiencyModal, setShowEfficiencyModal] = useState(false);
  const [customMPG, setCustomMPG] = useState({
    city: '',
    highway: '',
    combined: ''
  });

  // Vehicle type options with detailed descriptions
  const VEHICLE_TYPES = [
    {
      value: 'standard',
      label: 'Standard Sedan/Hatchback',
      icon: 'car',
      description: 'Typical 4-door sedan or hatchback'
    },
    {
      value: 'premium',
      label: 'Premium/Luxury',
      icon: 'car-sport',
      description: 'High-end sedan, sports car, or luxury vehicle'
    },
    {
      value: 'suv',
      label: 'SUV/Crossover',
      icon: 'car',
      description: 'Sport utility vehicle or crossover'
    },
    {
      value: 'truck',
      label: 'Pickup Truck',
      icon: 'car',
      description: 'Pickup truck or large vehicle'
    },
    {
      value: 'hybrid',
      label: 'Hybrid Vehicle',
      icon: 'leaf',
      description: 'Gas-electric hybrid vehicle'
    },
    {
      value: 'electric',
      label: 'Electric Vehicle',
      icon: 'flash',
      description: 'Fully electric vehicle (EV)'
    },
    {
      value: 'wheelchair',
      label: 'Wheelchair Accessible',
      icon: 'accessibility',
      description: 'Modified for wheelchair accessibility'
    }
  ];

  const FUEL_TYPES = [
    { value: 'gasoline', label: 'Regular Gasoline', icon: 'car' },
    { value: 'premium', label: 'Premium Gasoline', icon: 'star' },
    { value: 'diesel', label: 'Diesel', icon: 'car' },
    { value: 'hybrid', label: 'Hybrid (Gas + Electric)', icon: 'leaf' },
    { value: 'electric', label: 'Electric', icon: 'flash' }
  ];

  // Load database MPG and learning stats when vehicle info changes
  useEffect(() => {
    if (vehicleInfo.make && vehicleInfo.model) {
      loadVehicleData();
    }
  }, [vehicleInfo.make, vehicleInfo.model, vehicleInfo.year]);

  // Load driver learning stats
  useEffect(() => {
    if (driverId) {
      loadLearningStats();
    }
  }, [driverId]);

  const loadVehicleData = () => {
    const mpgData = getVehicleMPG(
      vehicleInfo.make,
      vehicleInfo.model,
      vehicleInfo.year,
      vehicleInfo.vehicleType
    );
    setDatabaseMPG(mpgData);

    // Set custom MPG fields if using custom efficiency
    if (vehicleInfo.useCustomEfficiency && vehicleInfo.customEfficiency) {
      setCustomMPG({
        city: vehicleInfo.customEfficiency.city?.toString() || '',
        highway: vehicleInfo.customEfficiency.highway?.toString() || '',
        combined: vehicleInfo.customEfficiency.combined?.toString() || ''
      });
    }
  };

  const loadLearningStats = async () => {
    const stats = await getDriverLearningStats(driverId);
    setLearningStats(stats);
  };

  const handleVehicleInfoChange = (field, value) => {
    const updatedInfo = { ...vehicleInfo, [field]: value };
    setVehicleInfo(updatedInfo);
    onVehicleUpdate?.(updatedInfo);
  };

  const handleCustomEfficiencyToggle = (enabled) => {
    setVehicleInfo(prev => ({
      ...prev,
      useCustomEfficiency: enabled,
      customEfficiency: enabled ? {
        city: parseFloat(customMPG.city) || null,
        highway: parseFloat(customMPG.highway) || null,
        combined: parseFloat(customMPG.combined) || null
      } : null
    }));
  };

  const saveCustomEfficiency = () => {
    const city = parseFloat(customMPG.city);
    const highway = parseFloat(customMPG.highway);
    const combined = parseFloat(customMPG.combined);

    if (!city || !highway || !combined) {
      Alert.alert('Invalid Input', 'Please enter valid MPG values for all fields');
      return;
    }

    if (city > highway) {
      Alert.alert('Invalid Input', 'City MPG should typically be lower than highway MPG');
      return;
    }

    const customEfficiency = { city, highway, combined };
    
    setVehicleInfo(prev => ({
      ...prev,
      customEfficiency,
      useCustomEfficiency: true
    }));

    onEfficiencyUpdate?.(customEfficiency);
    setShowEfficiencyModal(false);
    
    Alert.alert('Success', 'Custom fuel efficiency saved successfully!');
  };

  const resetLearningData = () => {
    Alert.alert(
      'Reset Learning Data',
      'This will clear all your driving efficiency data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const result = await clearDriverLearningData(driverId);
            if (result.success) {
              setLearningStats(null);
              Alert.alert('Success', 'Learning data has been reset');
            } else {
              Alert.alert('Error', 'Failed to reset learning data');
            }
          }
        }
      ]
    );
  };

  const EfficiencyCard = ({ title, efficiency, source, icon, color }) => (
    <View style={styles.efficiencyCard}>
      <View style={styles.efficiencyHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.efficiencyTitle}>{title}</Text>
      </View>
      <Text style={styles.efficiencyValue}>
        {efficiency ? `${efficiency} MPG` : 'N/A'}
      </Text>
      <Text style={styles.efficiencySource}>{source}</Text>
    </View>
  );

  const LearningProgress = () => {
    if (!learningStats) return null;

    const progressPercentage = learningStats.learningProgress * 100;
    
    return (
      <View style={styles.learningCard}>
        <View style={styles.learningHeader}>
          <Ionicons name="school" size={20} color={COLORS.primary[500]} />
          <Text style={styles.learningTitle}>AI Learning Progress</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        
        <View style={styles.learningStats}>
          <View style={styles.learningStat}>
            <Text style={styles.learningStatLabel}>Trips Recorded</Text>
            <Text style={styles.learningStatValue}>{learningStats.totalTrips || 0}</Text>
          </View>
          <View style={styles.learningStat}>
            <Text style={styles.learningStatLabel}>Miles Driven</Text>
            <Text style={styles.learningStatValue}>
              {learningStats.totalDistance ? Math.round(learningStats.totalDistance) : 0}
            </Text>
          </View>
          <View style={styles.learningStat}>
            <Text style={styles.learningStatLabel}>Average MPG</Text>
            <Text style={styles.learningStatValue}>
              {learningStats.averageEfficiency || 'N/A'}
            </Text>
          </View>
        </View>

        {learningStats.hasLearningData && (
          <Text style={styles.learningDescription}>
            🎯 AI is now using your driving data to improve fuel estimates!
          </Text>
        )}

        {!learningStats.hasLearningData && (
          <Text style={styles.learningDescription}>
            Complete {10 - (learningStats.totalTrips || 0)} more trips to activate AI learning
          </Text>
        )}

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetLearningData}
        >
          <Text style={styles.resetButtonText}>Reset Learning Data</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Vehicle Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Make</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.make}
              onChangeText={(value) => handleVehicleInfoChange('make', value)}
              placeholder="e.g., Toyota"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Model</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.model}
              onChangeText={(value) => handleVehicleInfoChange('model', value)}
              placeholder="e.g., Camry"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.year}
              onChangeText={(value) => handleVehicleInfoChange('year', value)}
              placeholder="e.g., 2020"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Fuel Type</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                // Show fuel type picker modal
                Alert.alert('Feature Coming Soon', 'Fuel type selection will be available in the next update');
              }}
            >
              <Text style={styles.pickerButtonText}>
                {FUEL_TYPES.find(ft => ft.value === vehicleInfo.fuelType)?.label || 'Select'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.secondary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Vehicle Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Type</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.slice(0, 4).map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                vehicleInfo.vehicleType === type.value && styles.typeCardSelected
              ]}
              onPress={() => handleVehicleInfoChange('vehicleType', type.value)}
            >
              <Ionicons 
                name={type.icon} 
                size={24} 
                color={vehicleInfo.vehicleType === type.value ? COLORS.white : COLORS.primary[500]} 
              />
              <Text style={[
                styles.typeLabel,
                vehicleInfo.vehicleType === type.value && styles.typeLabelSelected
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fuel Efficiency Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fuel Efficiency</Text>
        
        <View style={styles.efficiencyGrid}>
          {databaseMPG && (
            <>
              <EfficiencyCard
                title="Database"
                efficiency={databaseMPG.combined}
                source={databaseMPG.source === 'database' ? 'Official EPA Data' : 'Estimated'}
                icon="library"
                color={COLORS.secondary[500]}
              />
              
              {vehicleInfo.useCustomEfficiency && vehicleInfo.customEfficiency && (
                <EfficiencyCard
                  title="Custom"
                  efficiency={vehicleInfo.customEfficiency.combined}
                  source="Your Input"
                  icon="create"
                  color={COLORS.warning}
                />
              )}
              
              {learningStats && learningStats.hasLearningData && (
                <EfficiencyCard
                  title="AI Learned"
                  efficiency={learningStats.averageEfficiency}
                  source="Your Driving Data"
                  icon="school"
                  color={COLORS.primary[500]}
                />
              )}
            </>
          )}
        </View>

        {/* Custom Efficiency Toggle */}
        <View style={styles.customEfficiencyRow}>
          <View style={styles.customEfficiencyInfo}>
            <Text style={styles.customEfficiencyTitle}>Use Custom Efficiency</Text>
            <Text style={styles.customEfficiencyDescription}>
              Override database values with your own MPG data
            </Text>
          </View>
          <Switch
            value={vehicleInfo.useCustomEfficiency}
            onValueChange={handleCustomEfficiencyToggle}
            trackColor={{ false: COLORS.secondary[200], true: COLORS.primary[200] }}
            thumbColor={vehicleInfo.useCustomEfficiency ? COLORS.primary[500] : COLORS.secondary[400]}
          />
        </View>

        {vehicleInfo.useCustomEfficiency && (
          <TouchableOpacity 
            style={styles.editEfficiencyButton}
            onPress={() => setShowEfficiencyModal(true)}
          >
            <Ionicons name="create" size={20} color={COLORS.primary[500]} />
            <Text style={styles.editEfficiencyText}>Edit Custom Efficiency</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Learning Progress */}
      <LearningProgress />

      {/* Custom Efficiency Modal */}
      <Modal
        visible={showEfficiencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEfficiencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Fuel Efficiency</Text>
              <TouchableOpacity onPress={() => setShowEfficiencyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Enter your vehicle's actual fuel efficiency based on your experience:
              </Text>

              <View style={styles.mpgInputs}>
                <View style={styles.mpgInput}>
                  <Text style={styles.mpgLabel}>City MPG</Text>
                  <TextInput
                    style={styles.mpgTextInput}
                    value={customMPG.city}
                    onChangeText={(value) => setCustomMPG(prev => ({ ...prev, city: value }))}
                    placeholder="25"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.mpgInput}>
                  <Text style={styles.mpgLabel}>Highway MPG</Text>
                  <TextInput
                    style={styles.mpgTextInput}
                    value={customMPG.highway}
                    onChangeText={(value) => setCustomMPG(prev => ({ ...prev, highway: value }))}
                    placeholder="35"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.mpgInput}>
                  <Text style={styles.mpgLabel}>Combined MPG</Text>
                  <TextInput
                    style={styles.mpgTextInput}
                    value={customMPG.combined}
                    onChangeText={(value) => setCustomMPG(prev => ({ ...prev, combined: value }))}
                    placeholder="29"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowEfficiencyModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveCustomEfficiency}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.secondary[700],
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary[200],
  },
  typeCardSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[600],
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[700],
    textAlign: 'center',
    marginTop: 8,
  },
  typeLabelSelected: {
    color: COLORS.white,
  },
  efficiencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  efficiencyCard: {
    width: '48%',
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginLeft: 6,
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  efficiencySource: {
    fontSize: 12,
    color: COLORS.secondary[500],
  },
  customEfficiencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  customEfficiencyInfo: {
    flex: 1,
  },
  customEfficiencyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  customEfficiencyDescription: {
    fontSize: 14,
    color: COLORS.secondary[500],
  },
  editEfficiencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  editEfficiencyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary[500],
    marginLeft: 8,
  },
  learningCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  learningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.secondary[200],
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 4,
  },
  learningStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  learningStat: {
    alignItems: 'center',
  },
  learningStatLabel: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginBottom: 4,
  },
  learningStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  learningDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  modalContent: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 20,
    lineHeight: 20,
  },
  mpgInputs: {
    marginBottom: 24,
  },
  mpgInput: {
    marginBottom: 16,
  },
  mpgLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  mpgTextInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.secondary[100],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[700],
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary[500],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
});

export default VehicleEfficiencyProfile; 