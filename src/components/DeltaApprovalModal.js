import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Safe import for COLORS
let COLORS;
try {
  COLORS = require('@/constants').COLORS;
} catch (e) {
  COLORS = {
    primary: '#10B981',
    success: '#10B981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
}

/**
 * DeltaApprovalModal
 * Shows when rider adds/removes a stop during active ride
 * Driver can approve, edit (+/- 20%), or request new bid
 * Implements the "Auto-Adjust with Guardrails" compensation model
 */
const DeltaApprovalModal = ({
  visible,
  onClose,
  delta,
  onApprove,
  onDecline,
  onRequestNewBid,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState('');

  // Reset when modal opens
  React.useEffect(() => {
    if (visible && delta) {
      setIsEditing(false);
      setEditedAmount(Math.abs(delta.suggested || delta.deltaFare || 0).toFixed(2));
    }
  }, [visible, delta]);

  if (!delta) return null;

  const isAddStop = delta.kind === 'add_stop' || (delta.suggested >= 0);
  const suggestedFare = delta.suggested || delta.deltaFare || 0;
  const absoluteSuggested = Math.abs(suggestedFare);
  const minAllowed = absoluteSuggested * 0.8; // -20%
  const maxAllowed = absoluteSuggested * 1.2; // +20%

  const handleApprove = () => {
    if (isEditing) {
      const amount = parseFloat(editedAmount);
      
      if (isNaN(amount) || amount < 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }

      if (amount < minAllowed || amount > maxAllowed) {
        Alert.alert(
          'Invalid Amount',
          `Amount must be between $${minAllowed.toFixed(2)} and $${maxAllowed.toFixed(2)} (±20% of suggested).\n\nTo change beyond this range, request a new bid.`,
          [{ text: 'OK' }]
        );
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const finalAmount = isAddStop ? amount : -amount;
      onApprove(finalAmount);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onApprove(suggestedFare);
    }
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Decline Change',
      `Decline this ${isAddStop ? 'stop addition' : 'stop removal'}?\n\nRider will be notified and can choose to keep the original route or cancel the ride.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => onDecline()
        }
      ]
    );
  };

  const handleNewBid = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Request New Bid',
      'This change is too large for the auto-adjust model. Request a new bid from the rider?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request New Bid',
          onPress: () => onRequestNewBid()
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.headerIcon,
              { backgroundColor: isAddStop ? '#ecfdf5' : '#fef2f2' }
            ]}>
              <Ionicons 
                name={isAddStop ? "add-circle" : "remove-circle"} 
                size={28} 
                color={isAddStop ? "#10b981" : "#ef4444"} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>
                {isAddStop ? 'Stop Added by Rider' : 'Stop Removed by Rider'}
              </Text>
              <Text style={styles.subtitle}>Review and approve change</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stop Address */}
            <View style={styles.addressCard}>
              <Text style={styles.addressLabel}>
                {isAddStop ? 'New Stop Address:' : 'Removed Stop:'}
              </Text>
              <Text style={styles.addressText}>
                {delta.stopAddress || delta.newStop?.address || 'Address not available'}
              </Text>
            </View>

            {/* Delta Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Route Changes</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="speedometer" size={18} color="#6b7280" />
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={[
                  styles.detailValue,
                  { color: delta.calc?.dMiles > 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {delta.calc?.dMiles > 0 ? '+' : ''}{delta.calc?.dMiles?.toFixed(1) || '0'} mi
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time" size={18} color="#6b7280" />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={[
                  styles.detailValue,
                  { color: delta.calc?.dMins > 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {delta.calc?.dMins > 0 ? '+' : ''}{delta.calc?.dMins || 0} min
                </Text>
              </View>

              {isAddStop && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={18} color="#6b7280" />
                  <Text style={styles.detailLabel}>Stop Fee</Text>
                  <Text style={styles.detailValue}>+$3.00</Text>
                </View>
              )}

              {delta.calc?.dWaitMins !== undefined && delta.calc.dWaitMins > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="hourglass" size={18} color="#6b7280" />
                  <Text style={styles.detailLabel}>Wait Time Allowance</Text>
                  <Text style={styles.detailValue}>
                    {delta.calc.dWaitMins} min grace
                  </Text>
                </View>
              )}
            </View>

            {/* Fare Change */}
            {!isEditing ? (
              <View style={styles.fareCard}>
                <Text style={styles.fareLabel}>Suggested Fare Change</Text>
                <Text style={[
                  styles.fareAmount,
                  { color: suggestedFare >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {suggestedFare >= 0 ? '+' : ''}${Math.abs(suggestedFare).toFixed(2)}
                </Text>
                
                {/* Edit Button */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsEditing(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={styles.editButton}
                >
                  <Ionicons name="create" size={16} color="#3b82f6" />
                  <Text style={styles.editButtonText}>Edit Amount (±20%)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fareCard}>
                <Text style={styles.fareLabel}>Enter Custom Amount</Text>
                
                <View style={styles.editContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.fareInput}
                    value={editedAmount}
                    onChangeText={setEditedAmount}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    autoFocus
                  />
                </View>
                
                <Text style={styles.rangeText}>
                  Allowed range: ${minAllowed.toFixed(2)} - ${maxAllowed.toFixed(2)}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => {
                    setIsEditing(false);
                    setEditedAmount(absoluteSuggested.toFixed(2));
                  }}
                  style={styles.cancelEditButton}
                >
                  <Text style={styles.cancelEditText}>Cancel Edit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Auto-Accept Info */}
            {delta.driverAutoAccept && !isEditing && (
              <View style={styles.autoAcceptInfo}>
                <Ionicons name="flash" size={16} color="#10b981" />
                <Text style={styles.autoAcceptText}>
                  Within your auto-accept threshold
                </Text>
              </View>
            )}

            {/* Large Change Warning */}
            {delta.isLargeChange && (
              <View style={styles.largeChangeWarning}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.largeChangeText}>
                  Large change ({delta.percentChange?.toFixed(0)}%). Consider requesting new bid.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.approveButton}
              onPress={handleApprove}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color="white" />
              <Text style={styles.approveButtonText}>
                {isEditing ? 'Approve $' + editedAmount : 'Accept Change'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.declineButton}
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              {delta.percentChange > 20 && (
                <TouchableOpacity 
                  style={styles.newBidButton}
                  onPress={handleNewBid}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#3b82f6" />
                  <Text style={styles.newBidButtonText}>New Bid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  addressCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  fareCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  fareLabel: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fareAmount: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -1,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '700',
    color: '#374151',
    marginRight: 8,
  },
  fareInput: {
    fontSize: 40,
    fontWeight: '700',
    color: '#374151',
    borderBottomWidth: 3,
    borderBottomColor: '#10b981',
    minWidth: 140,
    textAlign: 'center',
    paddingVertical: 4,
  },
  rangeText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  cancelEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelEditText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  autoAcceptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  autoAcceptText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  largeChangeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  largeChangeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600',
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    gap: 8,
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  newBidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    gap: 8,
  },
  newBidButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default DeltaApprovalModal;

