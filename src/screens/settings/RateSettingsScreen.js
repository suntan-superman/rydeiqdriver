import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';
import rateSettingsService from '../../services/rateSettingsService';
import { useAuth } from '@/contexts/AuthContext';

const RateSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [rateSettings, setRateSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from storage/backend
  useEffect(() => {
    loadRateSettings();
  }, []);

  const loadRateSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await rateSettingsService.getRateSettings(user?.uid);
      setRateSettings(settings);
    } catch (error) {
      console.error('Error loading rate settings:', error);
      Alert.alert('Error', 'Failed to load rate settings. Using defaults.');
      // Load default settings as fallback
      const defaultSettings = rateSettingsService.getDefaultSettings();
      setRateSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRateSettings = async () => {
    try {
      setIsSaving(true);
      const success = await rateSettingsService.saveRateSettings(rateSettings, user?.uid);
      
      if (success) {
        setHasChanges(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Success', 'Rate settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving rate settings:', error);
      Alert.alert('Error', 'Failed to save rate settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTimeBlock = (blockId, field, value) => {
    setRateSettings(prev => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map(block =>
        block.id === blockId ? { ...block, [field]: value } : block
      ),
    }));
    setHasChanges(true);
  };

  const updateDefaultRate = (field, value) => {
    setRateSettings(prev => ({
      ...prev,
      defaultRate: { ...prev.defaultRate, [field]: parseFloat(value) || 0 },
    }));
    setHasChanges(true);
  };

  const toggleTimeBlock = (blockId) => {
    updateTimeBlock(blockId, 'enabled', !rateSettings.timeBlocks.find(b => b.id === blockId).enabled);
  };

  const toggleAutoBid = () => {
    setRateSettings(prev => ({
      ...prev,
      autoBidEnabled: !prev.autoBidEnabled,
    }));
    setHasChanges(true);
  };

  const validateTimeFormat = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSave = () => {
    // Validate all time formats
    const invalidTimes = rateSettings.timeBlocks.filter(block => 
      !validateTimeFormat(block.start) || !validateTimeFormat(block.end)
    );

    if (invalidTimes.length > 0) {
      Alert.alert('Invalid Time Format', 'Please use HH:MM format for all times (e.g., 06:00, 18:30)');
      return;
    }

    // Validate rates are positive
    const invalidRates = rateSettings.timeBlocks.filter(block => 
      block.pickup <= 0 || block.destination <= 0
    );

    if (invalidRates.length > 0) {
      Alert.alert('Invalid Rates', 'All rates must be greater than $0.00');
      return;
    }

    if (rateSettings.defaultRate.pickup <= 0 || rateSettings.defaultRate.destination <= 0) {
      Alert.alert('Invalid Default Rates', 'Default rates must be greater than $0.00');
      return;
    }

    saveRateSettings();
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all rate settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const defaultSettings = rateSettingsService.getDefaultSettings();
              setRateSettings(defaultSettings);
              setHasChanges(true);
            } catch (error) {
              console.error('Error resetting to defaults:', error);
              Alert.alert('Error', 'Failed to reset settings. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderTimeBlock = (block) => (
    <View key={block.id} style={styles.timeBlockCard}>
      <View style={styles.timeBlockHeader}>
        <View style={styles.timeBlockTitle}>
          <Text style={styles.timeBlockName}>{block.name}</Text>
          <Text style={styles.timeBlockTime}>
            {block.start} - {block.end}
          </Text>
        </View>
        <Switch
          value={block.enabled}
          onValueChange={() => toggleTimeBlock(block.id)}
          trackColor={{ false: COLORS.gray[300], true: COLORS.primary[300] }}
          thumbColor={block.enabled ? COLORS.primary[600] : COLORS.gray[500]}
        />
      </View>

      {block.enabled && (
        <View style={styles.timeBlockContent}>
          <View style={styles.rateRow}>
            <View style={styles.rateField}>
              <Text style={styles.rateLabel}>Pickup Rate</Text>
              <View style={styles.rateInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.rateInput}
                  value={block.pickup.toString()}
                  onChangeText={(value) => updateTimeBlock(block.id, 'pickup', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.rateUnit}>/mile</Text>
              </View>
            </View>

            <View style={styles.rateField}>
              <Text style={styles.rateLabel}>Destination Rate</Text>
              <View style={styles.rateInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.rateInput}
                  value={block.destination.toString()}
                  onChangeText={(value) => updateTimeBlock(block.id, 'destination', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.rateUnit}>/mile</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeInputRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TextInput
                style={styles.timeInput}
                value={block.start}
                onChangeText={(value) => updateTimeBlock(block.id, 'start', value)}
                placeholder="HH:MM"
                maxLength={5}
              />
            </View>

            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TextInput
                style={styles.timeInput}
                value={block.end}
                onChangeText={(value) => updateTimeBlock(block.id, 'end', value)}
                placeholder="HH:MM"
                maxLength={5}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading rate settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no settings loaded
  if (!rateSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
          <Text style={styles.errorTitle}>Failed to Load Settings</Text>
          <Text style={styles.errorText}>Unable to load your rate settings. Please try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRateSettings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Settings</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
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
        {/* Auto-Bid Toggle */}
        <View style={styles.autoBidCard}>
          <View style={styles.autoBidHeader}>
            <View style={styles.autoBidInfo}>
              <Text style={styles.autoBidTitle}>Automatic Bidding</Text>
              <Text style={styles.autoBidSubtitle}>
                Automatically bid based on your rate settings
              </Text>
            </View>
            <Switch
              value={rateSettings.autoBidEnabled}
              onValueChange={toggleAutoBid}
              trackColor={{ false: COLORS.gray[300], true: COLORS.primary[300] }}
              thumbColor={rateSettings.autoBidEnabled ? COLORS.primary[600] : COLORS.gray[500]}
            />
          </View>
        </View>

        {/* Default Rate */}
        <View style={styles.defaultRateCard}>
          <Text style={styles.sectionTitle}>Default Rate</Text>
          <Text style={styles.sectionSubtitle}>
            Used when no time block matches the scheduled ride time
          </Text>
          
          <View style={styles.rateRow}>
            <View style={styles.rateField}>
              <Text style={styles.rateLabel}>Pickup Rate</Text>
              <View style={styles.rateInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.rateInput}
                  value={rateSettings.defaultRate.pickup.toString()}
                  onChangeText={(value) => updateDefaultRate('pickup', value)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.rateUnit}>/mile</Text>
              </View>
            </View>

            <View style={styles.rateField}>
              <Text style={styles.rateLabel}>Destination Rate</Text>
              <View style={styles.rateInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.rateInput}
                  value={rateSettings.defaultRate.destination.toString()}
                  onChangeText={(value) => updateDefaultRate('destination', value)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.rateUnit}>/mile</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time Blocks */}
        <View style={styles.timeBlocksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Time-Based Rates</Text>
            <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
              <Ionicons name="refresh" size={16} color={COLORS.gray[600]} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Set different rates for different times of day
          </Text>

          {rateSettings.timeBlocks.map(renderTimeBlock)}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.info[600]} />
            <Text style={styles.infoTitle}>How It Works</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Rates are applied based on the scheduled ride time, not current time
            </Text>
            <Text style={styles.infoItem}>
              • Suggested bid = (pickup miles × pickup rate) + (ride miles × destination rate)
            </Text>
            <Text style={styles.infoItem}>
              • If no time block matches, the default rate is used
            </Text>
            <Text style={styles.infoItem}>
              • You can always edit the suggested bid before submitting
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
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
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: COLORS.gray[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  autoBidCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoBidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoBidInfo: {
    flex: 1,
  },
  autoBidTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  autoBidSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  defaultRateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  rateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rateField: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  rateInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  rateUnit: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  timeBlocksSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetButtonText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  timeBlockCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBlockTitle: {
    flex: 1,
  },
  timeBlockName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  timeBlockTime: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  timeBlockContent: {
    gap: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.info[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.info[200],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.info[800],
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: COLORS.info[700],
    lineHeight: 20,
  },
  headerRight: {
    width: 60, // Same width as back button for centering
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
});

export default RateSettingsScreen;
