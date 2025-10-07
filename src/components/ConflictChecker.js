import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { checkRideConflict, formatTime, formatDuration } from '@/utils/scheduleAnalyzer';

/**
 * Conflict Checker Component
 * Shows real-time conflict detection when viewing a ride request
 */
const ConflictChecker = ({ rideRequest, scheduledRides }) => {
  if (!rideRequest || !scheduledRides || scheduledRides.length === 0) {
    // No conflicts if no scheduled rides
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.safeCard]}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success?.[600] || '#059669'} />
          </View>
          <View style={styles.content}>
            <Text style={styles.safeTitle}>✅ Safe to Accept</Text>
            <Text style={styles.safeText}>
              No scheduling conflicts detected. You're free to accept this ride!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const conflictAnalysis = checkRideConflict(rideRequest, scheduledRides);

  if (!conflictAnalysis.hasConflict) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.safeCard]}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success?.[600] || '#059669'} />
          </View>
          <View style={styles.content}>
            <Text style={styles.safeTitle}>✅ Safe to Accept</Text>
            <Text style={styles.safeText}>
              No conflicts with your scheduled rides. You're good to go!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Has conflicts - show appropriate warning
  const getRiskStyle = () => {
    switch (conflictAnalysis.riskLevel) {
      case 'critical':
        return {
          cardStyle: styles.criticalCard,
          titleStyle: styles.criticalTitle,
          textStyle: styles.criticalText,
          iconName: 'close-circle',
          iconColor: COLORS.error?.[600] || '#DC2626'
        };
      case 'high':
        return {
          cardStyle: styles.warningCard,
          titleStyle: styles.warningTitle,
          textStyle: styles.warningText,
          iconName: 'warning',
          iconColor: COLORS.warning?.[600] || '#D97706'
        };
      case 'medium':
        return {
          cardStyle: styles.cautionCard,
          titleStyle: styles.cautionTitle,
          textStyle: styles.cautionText,
          iconName: 'alert-circle',
          iconColor: COLORS.primary?.[600] || '#2563EB'
        };
      default:
        return {
          cardStyle: styles.cautionCard,
          titleStyle: styles.cautionTitle,
          textStyle: styles.cautionText,
          iconName: 'information-circle',
          iconColor: COLORS.primary?.[600] || '#2563EB'
        };
    }
  };

  const riskStyle = getRiskStyle();

  return (
    <View style={styles.container}>
      <View style={[styles.card, riskStyle.cardStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name={riskStyle.iconName} size={32} color={riskStyle.iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={riskStyle.titleStyle}>
            {conflictAnalysis.riskLevel === 'critical' ? '🚫 Cannot Accept' : 
             conflictAnalysis.riskLevel === 'high' ? '⚠️ High Risk' : 
             '⚠️ Caution'}
          </Text>
          <Text style={riskStyle.textStyle}>
            {conflictAnalysis.recommendation}
          </Text>
          
          {/* Show conflicting rides */}
          {conflictAnalysis.conflictingRides.length > 0 && (
            <View style={styles.conflictDetails}>
              <Text style={styles.conflictDetailsTitle}>
                Conflicts with:
              </Text>
              {conflictAnalysis.conflictingRides.map((ride, index) => (
                <View key={index} style={styles.conflictRide}>
                  <Ionicons 
                    name={ride.requestType === 'medical' ? 'medical' : 'car'} 
                    size={14} 
                    color={COLORS.textSecondary} 
                  />
                  <Text style={styles.conflictRideText}>
                    {ride.requestType === 'medical' 
                      ? ride.appointmentType || 'Medical Transport'
                      : 'Scheduled Ride'
                    } at {formatTime(ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safeCard: {
    backgroundColor: COLORS.success?.[50] || '#ECFDF5',
    borderLeftColor: COLORS.success?.[600] || '#059669',
  },
  criticalCard: {
    backgroundColor: COLORS.error?.[50] || '#FEF2F2',
    borderLeftColor: COLORS.error?.[600] || '#DC2626',
  },
  warningCard: {
    backgroundColor: COLORS.warning?.[50] || '#FFFBEB',
    borderLeftColor: COLORS.warning?.[600] || '#D97706',
  },
  cautionCard: {
    backgroundColor: COLORS.primary?.[50] || '#EFF6FF',
    borderLeftColor: COLORS.primary?.[600] || '#2563EB',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  safeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success?.[800] || '#065F46',
    marginBottom: 4,
  },
  safeText: {
    fontSize: 12,
    color: COLORS.success?.[700] || '#047857',
    lineHeight: 16,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error?.[800] || '#991B1B',
    marginBottom: 4,
  },
  criticalText: {
    fontSize: 12,
    color: COLORS.error?.[700] || '#B91C1C',
    lineHeight: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning?.[800] || '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.warning?.[700] || '#B45309',
    lineHeight: 16,
  },
  cautionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
    marginBottom: 4,
  },
  cautionText: {
    fontSize: 12,
    color: COLORS.primary?.[700] || '#1D4ED8',
    lineHeight: 16,
  },
  conflictDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  conflictDetailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary || '#6B7280',
    marginBottom: 6,
  },
  conflictRide: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  conflictRideText: {
    fontSize: 11,
    color: COLORS.textPrimary || '#111827',
  },
});

export default ConflictChecker;

