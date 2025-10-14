import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import {
  loadButtonConfig,
  saveButtonConfig,
  resetButtonConfig,
  getPresetConfigs,
  createButtonConfig,
  validateButtonConfig,
  BUTTON_TYPES,
  MIN_BID_AMOUNT,
  MAX_BID_AMOUNT,
} from '@/utils/bidAdjustmentConfig';

/**
 * Bid Adjustment Settings Modal
 * Allows drivers to customize their quick adjustment buttons
 */
const BidAdjustmentSettingsModal = ({ visible, onClose }) => {
  const [increaseButtons, setIncreaseButtons] = useState([]);
  const [decreaseButtons, setDecreaseButtons] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('moderate');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    const config = await loadButtonConfig();
    setIncreaseButtons(config.increaseButtons);
    setDecreaseButtons(config.decreaseButtons);
    setHasUnsavedChanges(false);
  };

  const handleSave = async () => {
    const success = await saveButtonConfig(increaseButtons, decreaseButtons);
    if (success) {
      Alert.alert('Success', 'Button configuration saved successfully!');
      setHasUnsavedChanges(false);
      onClose();
    } else {
      Alert.alert('Error', 'Could not save configuration. Please try again.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset to default button configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetButtonConfig();
            await loadConfig();
          },
        },
      ]
    );
  };

  const applyPreset = (presetKey) => {
    const presets = getPresetConfigs();
    const preset = presets[presetKey];
    if (preset) {
      setIncreaseButtons(preset.increaseButtons);
      setDecreaseButtons(preset.decreaseButtons);
      setSelectedPreset(presetKey);
      setHasUnsavedChanges(true);
    }
  };

  const updateButton = (direction, index, field, value) => {
    const buttons = direction === 'increase' ? [...increaseButtons] : [...decreaseButtons];
    buttons[index] = { ...buttons[index], [field]: value };
    
    // Update label if type or value changed
    if (field === 'type' || field === 'value') {
      const prefix = direction === 'increase' ? '+' : '-';
      const suffix = buttons[index].type === BUTTON_TYPES.PERCENTAGE ? '%' : '';
      const dollarSign = buttons[index].type === BUTTON_TYPES.AMOUNT ? '$' : '';
      buttons[index].label = `${prefix}${dollarSign}${buttons[index].value}${suffix}`;
    }
    
    if (direction === 'increase') {
      setIncreaseButtons(buttons);
    } else {
      setDecreaseButtons(buttons);
    }
    setHasUnsavedChanges(true);
  };

  const renderButtonEditor = (button, index, direction) => {
    return (
      <View key={button.id} style={styles.buttonEditor}>
        <View style={styles.buttonEditorRow}>
          <Text style={styles.buttonEditorLabel}>Type:</Text>
          <View style={styles.buttonTypeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                button.type === BUTTON_TYPES.AMOUNT && styles.typeButtonActive,
              ]}
              onPress={() => updateButton(direction, index, 'type', BUTTON_TYPES.AMOUNT)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  button.type === BUTTON_TYPES.AMOUNT && styles.typeButtonTextActive,
                ]}
              >
                Amount
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                button.type === BUTTON_TYPES.PERCENTAGE && styles.typeButtonActive,
              ]}
              onPress={() => updateButton(direction, index, 'type', BUTTON_TYPES.PERCENTAGE)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  button.type === BUTTON_TYPES.PERCENTAGE && styles.typeButtonTextActive,
                ]}
              >
                Percentage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonEditorRow}>
          <Text style={styles.buttonEditorLabel}>Value:</Text>
          <TextInput
            style={styles.valueInput}
            value={String(button.value)}
            onChangeText={(text) => {
              const value = parseFloat(text) || 0;
              updateButton(direction, index, 'value', value);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
          <Text style={styles.valueUnit}>
            {button.type === BUTTON_TYPES.PERCENTAGE ? '%' : '$'}
          </Text>
        </View>

        <View style={styles.buttonPreview}>
          <Text style={styles.buttonPreviewLabel}>Preview:</Text>
          <View
            style={[
              styles.previewButton,
              direction === 'increase' ? styles.previewIncrease : styles.previewDecrease,
            ]}
          >
            <Text style={styles.previewButtonText}>{button.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const presets = getPresetConfigs();

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.secondary[700]} />
          </TouchableOpacity>
          <Text style={styles.title}>Bid Adjustment Buttons</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Presets Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            <View style={styles.presetsContainer}>
              {Object.entries(presets).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.presetCard,
                    selectedPreset === key && styles.presetCardActive,
                  ]}
                  onPress={() => applyPreset(key)}
                >
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetDescription}>{preset.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Increase Buttons Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Increase Buttons (Green)</Text>
            <Text style={styles.sectionDescription}>
              Tap these to increase your bid amount
            </Text>
            {increaseButtons.map((button, index) =>
              renderButtonEditor(button, index, 'increase')
            )}
          </View>

          {/* Decrease Buttons Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Decrease Buttons (Red)</Text>
            <Text style={styles.sectionDescription}>
              Tap these to decrease your bid amount
            </Text>
            {decreaseButtons.map((button, index) =>
              renderButtonEditor(button, index, 'decrease')
            )}
          </View>

          {/* Info Section */}
          <View style={[styles.section, styles.infoSection]}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>How it works:</Text>
              <Text style={styles.infoDescription}>
                • Amount buttons add/subtract a fixed dollar amount{'\n'}
                • Percentage buttons adjust based on current bid{'\n'}
                • Min bid: ${MIN_BID_AMOUNT.toFixed(2)}, Max bid: ${MAX_BID_AMOUNT.toFixed(2)}{'\n'}
                • Buttons will never go below/above these limits{'\n'}
                • Changes save when you tap "Save Changes"
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {hasUnsavedChanges && (
            <Text style={styles.unsavedText}>You have unsaved changes</Text>
          )}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
  },
  resetButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.secondary[200],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 12,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  buttonEditor: {
    backgroundColor: COLORS.secondary[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonEditorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[700],
    width: 60,
  },
  buttonTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#16A34A', // Green background for selected option
    borderColor: '#15803D',
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  valueInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  valueUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[700],
    marginLeft: 8,
    width: 20,
  },
  buttonPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  previewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  previewIncrease: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  previewDecrease: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: COLORS.secondary[700],
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  unsavedText: {
    fontSize: 12,
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.secondary[100],
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.secondary[300],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BidAdjustmentSettingsModal;

