/**
 * Emergency Modal Component
 * Displays emergency options for drivers in critical situations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const EmergencyModal = ({ visible, onClose, currentRide = null, driverLocation = null }) => {
  const [selectedType, setSelectedType] = useState(null);

  const emergencyTypes = [
    {
      id: 'police',
      icon: 'shield',
      iconColor: '#DC2626',
      title: 'Police Emergency',
      description: 'Immediate danger or crime',
      number: '911',
    },
    {
      id: 'medical',
      icon: 'medical',
      iconColor: '#EF4444',
      title: 'Medical Emergency',
      description: 'Medical assistance needed',
      number: '911',
    },
    {
      id: 'roadside',
      icon: 'car',
      iconColor: '#F59E0B',
      title: 'Roadside Assistance',
      description: 'Vehicle breakdown or flat tire',
      number: '1-800-AAA-HELP',
    },
    {
      id: 'safety',
      icon: 'warning',
      iconColor: '#EAB308',
      title: 'Safety Concern',
      description: 'Feel unsafe or uncomfortable',
      action: 'safety_protocol',
    },
  ];

  const handleEmergencyType = async (type) => {
    setSelectedType(type.id);

    if (type.action === 'safety_protocol') {
      handleSafetyProtocol();
      return;
    }

    // Show confirmation before calling
    Alert.alert(
      `Call ${type.title}?`,
      `This will call ${type.number}. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedType(null),
        },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => makeEmergencyCall(type.number),
        },
      ]
    );
  };

  const makeEmergencyCall = async (phoneNumber) => {
    try {
      const url = Platform.OS === 'ios' 
        ? `telprompt:${phoneNumber}`
        : `tel:${phoneNumber}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        onClose();
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('❌ Error making emergency call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    } finally {
      setSelectedType(null);
    }
  };

  const handleSafetyProtocol = () => {
    Alert.alert(
      '⚠️ Safety Protocol Activated',
      'Your location is being shared with dispatch. What would you like to do?',
      [
        {
          text: 'End Current Ride',
          onPress: () => {
            // TODO: Implement end ride logic
            console.log('🛑 Ending ride due to safety concern');
            Alert.alert('Ride Ended', 'The current ride has been ended. You are now offline.');
            onClose();
          },
        },
        {
          text: 'Call Support',
          onPress: () => {
            makeEmergencyCall('1-800-ANYRYDE'); // TODO: Use actual support number
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedType(null),
        },
      ]
    );
  };

  const callSupport = () => {
    makeEmergencyCall('1-800-ANYRYDE'); // TODO: Use actual support number
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="warning" size={32} color="#DC2626" />
            </View>
            <Text style={styles.title}>Emergency Assistance</Text>
            <Text style={styles.subtitle}>Select the type of help you need</Text>
          </View>

          {/* Emergency Options */}
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {emergencyTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionCard,
                  selectedType === type.id && styles.optionCardSelected,
                ]}
                onPress={() => handleEmergencyType(type)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${type.iconColor}20` }]}>
                  <Ionicons name={type.icon} size={28} color={type.iconColor} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{type.title}</Text>
                  <Text style={styles.optionDescription}>{type.description}</Text>
                  {type.number && (
                    <Text style={styles.optionNumber}>{type.number}</Text>
                  )}
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Current Ride Info (if applicable) */}
          {currentRide && (
            <View style={styles.rideInfo}>
              <Text style={styles.rideInfoTitle}>Current Ride:</Text>
              <Text style={styles.rideInfoText}>
                {currentRide.pickup?.address || 'Unknown location'}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={callSupport}
            >
              <Ionicons name="call" size={16} color={COLORS.primary?.[500] || '#3B82F6'} />
              <Text style={styles.supportButtonText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: 320,
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.primary?.[500] || '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary || '#6B7280',
    marginBottom: 4,
  },
  optionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary?.[500] || '#3B82F6',
  },
  rideInfo: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rideInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
    marginBottom: 4,
  },
  rideInfoText: {
    fontSize: 14,
    color: COLORS.textPrimary || '#111827',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary?.[500] || '#3B82F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background || '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
  },
});

export default EmergencyModal;

