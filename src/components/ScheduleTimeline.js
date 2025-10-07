import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { 
  formatTime, 
  formatTimeRange, 
  formatDuration,
  getGapAvailabilityStatus,
  generateDailyInsights,
  estimatePotentialEarnings
} from '@/utils/scheduleAnalyzer';

/**
 * Schedule Timeline Component
 * Visual timeline showing rides and gaps throughout the day
 */
const ScheduleTimeline = ({ dailyAnalysis, onRideTap, onGapTap }) => {
  const { scheduledRides, gaps, statistics } = dailyAnalysis;
  const [showInsights, setShowInsights] = useState(true);
  
  const insights = generateDailyInsights(dailyAnalysis);
  const potentialEarnings = estimatePotentialEarnings(statistics.totalAvailableMinutes);

  // Combine rides and gaps into timeline items, sorted by time
  const timelineItems = [];
  
  // Add all gaps
  gaps.forEach(gap => {
    timelineItems.push({ type: 'gap', data: gap, time: gap.startTime });
  });
  
  // Add all rides
  scheduledRides.forEach(ride => {
    timelineItems.push({ type: 'ride', data: ride, time: ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime });
  });
  
  // Sort by time
  timelineItems.sort((a, b) => {
    const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
    const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
    return timeA - timeB;
  });

  const renderGap = (gap) => {
    const status = getGapAvailabilityStatus(gap);
    
    return (
      <TouchableOpacity
        key={gap.id}
        style={styles.gapContainer}
        onPress={() => onGapTap?.(gap)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineMarker}>
          <View style={[styles.gapDot, { backgroundColor: status.color }]} />
          <View style={[styles.timelineLine, styles.dottedLine]} />
        </View>
        
        <View style={[styles.gapCard, { borderLeftColor: status.color }]}>
          <View style={styles.gapHeader}>
            <Text style={styles.gapIcon}>{status.icon}</Text>
            <View style={styles.gapInfo}>
              <Text style={styles.gapTitle}>Available</Text>
              <Text style={styles.gapTime}>
                {formatTime(gap.startTime)} - {formatTime(gap.endTime)}
              </Text>
            </View>
          </View>
          
          <View style={styles.gapDetails}>
            <View style={styles.gapStat}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.gapStatText}>{formatDuration(gap.usableTime)}</Text>
            </View>
            
            {gap.suggestedRideCount > 0 && (
              <View style={styles.gapStat}>
                <Ionicons name="car-outline" size={14} color={status.color} />
                <Text style={[styles.gapStatText, { color: status.color }]}>
                  Could fit {gap.suggestedRideCount} ride{gap.suggestedRideCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRide = (ride) => {
    const isMe = ride.requestType === 'medical';
    const rideColor = isMe ? COLORS.error?.[500] || '#EF4444' : COLORS.primary?.[500] || '#3B82F6';
    const pickupTime = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
    const pickupDate = pickupTime?.toDate ? pickupTime.toDate() : new Date(pickupTime);
    const endTime = new Date(pickupDate.getTime() + (ride.estimatedDuration || 60) * 60000);
    
    return (
      <TouchableOpacity
        key={ride.id}
        style={styles.rideContainer}
        onPress={() => onRideTap?.(ride)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineMarker}>
          <View style={[styles.rideDot, { backgroundColor: rideColor }]} />
          <View style={[styles.timelineLine, { backgroundColor: rideColor }]} />
        </View>
        
        <View style={[styles.rideCard, { borderLeftColor: rideColor }]}>
          <View style={styles.rideHeader}>
            <View style={[styles.rideIconContainer, { backgroundColor: rideColor + '15' }]}>
              <Ionicons 
                name={isMe ? 'medical' : 'car'} 
                size={18} 
                color={rideColor} 
              />
            </View>
            <View style={styles.rideInfo}>
              <Text style={styles.rideTitle}>
                {isMe ? ride.appointmentType || 'Medical Transport' : 'Scheduled Ride'}
              </Text>
              <Text style={styles.rideTime}>
                {formatTimeRange(pickupDate, endTime)}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: rideColor + '20' }]}>
              <Text style={[styles.statusText, { color: rideColor }]}>
                {ride.status === 'confirmed' ? 'Confirmed' : 'Assigned'}
              </Text>
            </View>
          </View>
          
          <View style={styles.rideDetails}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {ride.pickupLocation?.address || ride.pickup?.address || ride.pickup}
              </Text>
            </View>
            
            {ride.dropoffLocation && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {ride.dropoffLocation?.address || ride.dropoff?.address || ride.dropoff}
                </Text>
              </View>
            )}
            
            <View style={styles.durationRow}>
              <Ionicons name="timer-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.durationText}>
                {formatDuration(ride.estimatedDuration || 60)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (scheduledRides.length === 0) {
    return (
      <View style={styles.emptyTimeline}>
        <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>No rides scheduled</Text>
        <Text style={styles.emptySubtitle}>
          Your entire day is available for regular rides!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Day Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Scheduled</Text>
          <Text style={styles.summaryValue}>{statistics.rideCount} rides</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Committed Time</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(statistics.totalScheduledMinutes)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Available</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success?.[600] || '#059669' }]}>
            {formatDuration(statistics.totalAvailableMinutes)}
          </Text>
        </View>
      </View>

      {/* Insights Panel */}
      {insights.length > 0 && showInsights && (
        <TouchableOpacity 
          style={styles.insightsPanel}
          onPress={() => setShowInsights(false)}
          activeOpacity={0.9}
        >
          <View style={styles.insightsPanelHeader}>
            <Text style={styles.insightsPanelTitle}>💡 Today's Insights</Text>
            <TouchableOpacity onPress={() => setShowInsights(false)}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {insights.slice(0, 2).map((insight, index) => (
            <Text key={index} style={styles.insightItem}>
              {insight.icon} {insight.text}
            </Text>
          ))}
          {potentialEarnings > 0 && (
            <View style={styles.earningsInsight}>
              <Ionicons name="cash" size={16} color={COLORS.success?.[600] || '#059669'} />
              <Text style={styles.earningsText}>
                Potential: <Text style={styles.earningsAmount}>${potentialEarnings}</Text> extra today
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Timeline */}
      <View style={styles.timeline}>
        {timelineItems.map(item => 
          item.type === 'gap' ? renderGap(item.data) : renderRide(item.data)
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.white || '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border || '#E5E7EB',
    marginHorizontal: 8,
  },
  timeline: {
    paddingTop: 10,
  },
  timelineMarker: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rideDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white || '#FFFFFF',
  },
  gapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white || '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginVertical: 4,
  },
  dottedLine: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gray300 || '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  gapContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  gapCard: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
  },
  gapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gapIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  gapInfo: {
    flex: 1,
  },
  gapTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  gapTime: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 1,
  },
  gapDetails: {
    marginTop: 4,
  },
  gapStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  gapStatText: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  rideContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  rideCard: {
    flex: 1,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rideIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rideInfo: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  rideTime: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rideDetails: {
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textPrimary || '#111827',
    marginLeft: 4,
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  durationText: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
    marginLeft: 4,
  },
  emptyTimeline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  insightsPanel: {
    backgroundColor: COLORS.primary?.[50] || '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary?.[200] || '#BFDBFE',
  },
  insightsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
  },
  insightItem: {
    fontSize: 11,
    color: COLORS.primary?.[700] || '#1D4ED8',
    marginBottom: 4,
    lineHeight: 16,
  },
  earningsInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary?.[200] || '#BFDBFE',
    gap: 6,
  },
  earningsText: {
    fontSize: 12,
    color: COLORS.success?.[700] || '#047857',
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success?.[800] || '#065F46',
  },
});


export default ScheduleTimeline;

