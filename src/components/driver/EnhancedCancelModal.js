// Enhanced Cancel Modal Component
// Allows drivers to select cancel reason with clear indication of score impact

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { CANCEL_REASONS, RELIABILITY_CONFIG } from '@/constants/reliabilityConfig';

const EnhancedCancelModal = ({ 
  visible, 
  rideId,
  onCancel, 
  onConfirm, 
  onClose 
}) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
  };

  const handleConfirm = () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for canceling this ride.');
      return;
    }

    const isExempt = selectedReason.exempt;
    const willApplyCooldown = !isExempt;

    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel this ride?\n\n${
        willApplyCooldown 
          ? `⚠️ This will start a ${RELIABILITY_CONFIG.CANCEL_GLOBAL_COOLDOWN_SEC / 60} minute cooldown and may affect your reliability score.`
          : '✅ This cancellation is exempt and will not affect your score.'
      }`,
      [
        {
          text: 'Go Back',
          style: 'cancel'
        },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await onConfirm(selectedReason.code, selectedReason.label);
              setSelectedReason(null);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cancel Ride</Text>
            <TouchableOpacity 
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.warningText}>
              Canceling may affect your reliability score and trigger a cooldown period. 
              Select an appropriate reason below.
            </Text>
          </View>

          {/* Reason List */}
          <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Cancellation Reason</Text>
            
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.code}
                style={[
                  styles.reasonCard,
                  selectedReason?.code === reason.code && styles.reasonCardSelected
                ]}
                onPress={() => handleReasonSelect(reason)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={styles.reasonLeft}>
                  <View style={[
                    styles.radioButton,
                    selectedReason?.code === reason.code && styles.radioButtonSelected
                  ]}>
                    {selectedReason?.code === reason.code && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.reasonContent}>
                    <View style={styles.reasonHeader}>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                      {reason.exempt && (
                        <View style={styles.exemptBadge}>
                          <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
                          <Text style={styles.exemptBadgeText}>Exempt</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                    {!reason.exempt && (
                      <View style={styles.impactWarning}>
                        <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
                        <Text style={styles.impactWarningText}>
                          May trigger cooldown & affect score
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Keep Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedReason || isSubmitting) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Cancel Ride</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    padding: 12,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary[700],
    marginLeft: 8,
    lineHeight: 18,
  },
  reasonList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[600],
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonCard: {
    borderWidth: 1.5,
    borderColor: COLORS.secondary[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  reasonCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[500] + '05',
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.secondary[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonSelected: {
    borderColor: COLORS.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary[500],
  },
  reasonContent: {
    flex: 1,
    marginLeft: 12,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
    flex: 1,
  },
  exemptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  exemptBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 4,
  },
  reasonDescription: {
    fontSize: 13,
    color: COLORS.secondary[600],
    lineHeight: 18,
  },
  impactWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  impactWarningText: {
    fontSize: 11,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[100],
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.secondary[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.secondary[300],
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default EnhancedCancelModal;

