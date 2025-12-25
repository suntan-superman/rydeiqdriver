import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';

const InRideConflictAlert = ({
  visible,
  conflictData,
  onAccept,
  onDecline,
  onClose,
}) => {
  if (!visible || !conflictData) return null;

  const { currentRideDropoffTime, newRidePickupTime, conflictMinutes } = conflictData;

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAccept = () => {
    Alert.alert(
      'Accept Conflicting Ride',
      'This ride will overlap with your current trip. You may need to adjust your schedule or risk being late. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Anyway',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onAccept();
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDecline();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.alertContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="warning" size={32} color={COLORS.error[600]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Ride Conflict Detected</Text>
            <Text style={styles.headerSubtitle}>
              This ride overlaps with your current trip
            </Text>
          </View>
        </View>

        {/* Conflict Details */}
        <View style={styles.conflictDetails}>
          <View style={styles.timeConflictCard}>
            <View style={styles.timeConflictHeader}>
              <Ionicons name="time-outline" size={20} color={COLORS.error[600]} />
              <Text style={styles.timeConflictTitle}>Time Conflict</Text>
            </View>
            
            <View style={styles.timeDetails}>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Current ride ends:</Text>
                <Text style={styles.timeValue}>{formatTime(currentRideDropoffTime)}</Text>
              </View>
              
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>New ride starts:</Text>
                <Text style={styles.timeValue}>{formatTime(newRidePickupTime)}</Text>
              </View>
              
              <View style={styles.conflictRow}>
                <Text style={styles.conflictLabel}>Overlap:</Text>
                <Text style={styles.conflictValue}>
                  {conflictMinutes} minutes
                </Text>
              </View>
            </View>
          </View>

          {/* Warning Message */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning[600]} />
              <Text style={styles.warningTitle}>Important Considerations</Text>
            </View>
            
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>
                • You may be late for the new ride pickup
              </Text>
              <Text style={styles.warningItem}>
                • Current rider may be delayed at drop-off
              </Text>
              <Text style={styles.warningItem}>
                • Consider traffic and route optimization
              </Text>
              <Text style={styles.warningItem}>
                • Your reliability rating may be affected
              </Text>
            </View>
          </View>

          {/* Suggestions */}
          <View style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.info[600]} />
              <Text style={styles.suggestionsTitle}>Suggestions</Text>
            </View>
            
            <View style={styles.suggestionsList}>
              <Text style={styles.suggestionItem}>
                • Contact current rider about potential delay
              </Text>
              <Text style={styles.suggestionItem}>
                • Use navigation to optimize route
              </Text>
              <Text style={styles.suggestionItem}>
                • Consider declining if timing is too tight
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.declineButtonText}>Decline Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text style={styles.acceptButtonText}>Accept Anyway</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color={COLORS.gray[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  conflictDetails: {
    padding: 20,
    gap: 16,
  },
  timeConflictCard: {
    backgroundColor: COLORS.error[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.error[200],
  },
  timeConflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeConflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error[800],
    marginLeft: 8,
  },
  timeDetails: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.error[700],
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error[800],
  },
  conflictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.error[300],
  },
  conflictLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error[800],
  },
  conflictValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error[900],
  },
  warningCard: {
    backgroundColor: COLORS.warning[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning[200],
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning[800],
    marginLeft: 8,
  },
  warningList: {
    gap: 6,
  },
  warningItem: {
    fontSize: 14,
    color: COLORS.warning[700],
    lineHeight: 18,
  },
  suggestionsCard: {
    backgroundColor: COLORS.info[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.info[200],
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.info[800],
    marginLeft: 8,
  },
  suggestionsList: {
    gap: 6,
  },
  suggestionItem: {
    fontSize: 14,
    color: COLORS.info[700],
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  acceptButton: {
    backgroundColor: COLORS.error[600],
    shadowColor: COLORS.error[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InRideConflictAlert;
