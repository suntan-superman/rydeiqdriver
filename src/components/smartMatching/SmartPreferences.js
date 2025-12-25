import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import smartMatchingService from '../../services/smartMatchingService';
import * as Haptics from 'expo-haptics';

const SmartPreferences = ({ driverId, onClose, visible = false }) => {
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const timeBlocks = [
    { id: 'morning_rush', name: 'Morning Rush (6-9 AM)', icon: 'sunny' },
    { id: 'lunch_rush', name: 'Lunch Rush (11:30 AM-1 PM)', icon: 'restaurant' },
    { id: 'evening_rush', name: 'Evening Rush (4-6 PM)', icon: 'moon' },
    { id: 'late_night', name: 'Late Night (1-3 AM)', icon: 'moon-outline' },
    { id: 'default', name: 'Standard Hours', icon: 'time' },
  ];

  const rideTypes = [
    { id: 'standard', name: 'Standard Rides', icon: 'car' },
    { id: 'premium', name: 'Premium Rides', icon: 'diamond' },
    { id: 'shared', name: 'Shared Rides', icon: 'people' },
    { id: 'scheduled', name: 'Scheduled Rides', icon: 'calendar' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadPreferences();
    }
  }, [visible, driverId]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await smartMatchingService.getDriverPreferences(driverId);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await smartMatchingService.saveDriverPreferences(driverId, preferences);
      setHasChanges(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', 'Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const toggleTimeBlock = (blockId, category) => {
    const currentBlocks = preferences[category] || [];
    const updatedBlocks = currentBlocks.includes(blockId)
      ? currentBlocks.filter(id => id !== blockId)
      : [...currentBlocks, blockId];
    
    updatePreference(category, updatedBlocks);
  };

  const toggleRideType = (typeId) => {
    const currentTypes = preferences.preferredRideTypes || [];
    const updatedTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(id => id !== typeId)
      : [...currentTypes, typeId];
    
    updatePreference('preferredRideTypes', updatedTypes);
  };

  const updateScoreWeight = (weightKey, value) => {
    const updatedWeights = {
      ...preferences.scoreWeights,
      [weightKey]: parseFloat(value) / 100
    };
    updatePreference('scoreWeights', updatedWeights);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all preferences to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultPrefs = smartMatchingService.getDefaultPreferences();
            setPreferences(defaultPrefs);
            setHasChanges(true);
          },
        },
      ]
    );
  };

  if (!visible) return null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Preferences</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Preferences</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
          <Text style={styles.errorTitle}>Failed to Load Preferences</Text>
          <Text style={styles.errorText}>Unable to load your smart matching preferences.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Preferences</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[styles.saveButtonText, (!hasChanges || isSaving) && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Learning Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.primary[600]} />
            <Text style={styles.sectionTitle}>Smart Learning</Text>
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Enable Learning</Text>
              <Text style={styles.toggleSubtitle}>
                Allow the system to learn from your behavior and improve recommendations
              </Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
              thumbColor={preferences.learningEnabled ? COLORS.primary[600] : COLORS.gray[500]}
              ios_backgroundColor={COLORS.gray[300]}
              onValueChange={(value) => updatePreference('learningEnabled', value)}
              value={preferences.learningEnabled}
            />
          </View>
        </View>

        {/* Preferred Time Blocks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={COLORS.primary[600]} />
            <Text style={styles.sectionTitle}>Preferred Time Blocks</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select your most preferred time periods for driving
          </Text>
          
          {timeBlocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              style={[
                styles.optionItem,
                preferences.preferredTimeBlocks?.includes(block.id) && styles.optionItemSelected
              ]}
              onPress={() => toggleTimeBlock(block.id, 'preferredTimeBlocks')}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={block.icon} 
                  size={20} 
                  color={preferences.preferredTimeBlocks?.includes(block.id) ? COLORS.primary[600] : COLORS.gray[600]} 
                />
                <Text style={[
                  styles.optionText,
                  preferences.preferredTimeBlocks?.includes(block.id) && styles.optionTextSelected
                ]}>
                  {block.name}
                </Text>
              </View>
              {preferences.preferredTimeBlocks?.includes(block.id) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Acceptable Time Blocks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.warning[600]} />
            <Text style={styles.sectionTitle}>Acceptable Time Blocks</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Time periods you're willing to drive but not preferred
          </Text>
          
          {timeBlocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              style={[
                styles.optionItem,
                preferences.acceptableTimeBlocks?.includes(block.id) && styles.optionItemSelected
              ]}
              onPress={() => toggleTimeBlock(block.id, 'acceptableTimeBlocks')}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={block.icon} 
                  size={20} 
                  color={preferences.acceptableTimeBlocks?.includes(block.id) ? COLORS.warning[600] : COLORS.gray[600]} 
                />
                <Text style={[
                  styles.optionText,
                  preferences.acceptableTimeBlocks?.includes(block.id) && styles.optionTextSelected
                ]}>
                  {block.name}
                </Text>
              </View>
              {preferences.acceptableTimeBlocks?.includes(block.id) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.warning[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferred Ride Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car" size={20} color={COLORS.primary[600]} />
            <Text style={styles.sectionTitle}>Preferred Ride Types</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Types of rides you prefer to accept
          </Text>
          
          {rideTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionItem,
                preferences.preferredRideTypes?.includes(type.id) && styles.optionItemSelected
              ]}
              onPress={() => toggleRideType(type.id)}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={type.icon} 
                  size={20} 
                  color={preferences.preferredRideTypes?.includes(type.id) ? COLORS.primary[600] : COLORS.gray[600]} 
                />
                <Text style={[
                  styles.optionText,
                  preferences.preferredRideTypes?.includes(type.id) && styles.optionTextSelected
                ]}>
                  {type.name}
                </Text>
              </View>
              {preferences.preferredRideTypes?.includes(type.id) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Earnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={20} color={COLORS.success[600]} />
            <Text style={styles.sectionTitle}>Target Earnings</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Your target earnings per ride (used for scoring)
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Target per Ride:</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <Text style={styles.inputValue}>
                {preferences.targetEarningsPerRide?.toFixed(2) || '15.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Max Pickup Distance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary[600]} />
            <Text style={styles.sectionTitle}>Maximum Pickup Distance</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Maximum distance you're willing to travel for pickup
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Max Distance:</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputValue}>
                {preferences.maxPickupDistance || 5} miles
              </Text>
            </View>
          </View>
        </View>

        {/* Score Weights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color={COLORS.primary[600]} />
            <Text style={styles.sectionTitle}>Scoring Weights</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Adjust how much each factor influences ride recommendations
          </Text>
          
          {Object.entries(preferences.scoreWeights || {}).map(([key, weight]) => (
            <View key={key} style={styles.weightRow}>
              <Text style={styles.weightLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <Text style={styles.weightValue}>
                {Math.round(weight * 100)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={20} color={COLORS.error[600]} />
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  saveButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: COLORS.gray[500],
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  optionTextSelected: {
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginRight: 4,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  weightLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  weightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error[600],
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error[600],
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SmartPreferences;
