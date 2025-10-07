import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { formatDuration } from '@/utils/scheduleAnalyzer';

/**
 * Schedule Week View Component
 * Shows availability heatmap for the next 7 days
 */
const ScheduleWeekView = ({ weekAnalysis, onDayTap }) => {
  if (!weekAnalysis || weekAnalysis.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No week data available</Text>
      </View>
    );
  }

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateNumber = (date) => {
    return date.getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const getUtilizationColor = (percentage) => {
    if (percentage === 0) return COLORS.success?.[100] || '#D1FAE5'; // Very free
    if (percentage < 30) return COLORS.success?.[200] || '#A7F3D0'; // Free
    if (percentage < 50) return COLORS.primary?.[200] || '#BFDBFE'; // Moderate
    if (percentage < 70) return COLORS.warning?.[200] || '#FDE68A'; // Busy
    return COLORS.error?.[200] || '#FECACA'; // Very busy
  };

  const getUtilizationStatus = (percentage) => {
    if (percentage === 0) return { text: 'Wide Open!', icon: '🎯', color: COLORS.success?.[700] || '#047857' };
    if (percentage < 30) return { text: 'Mostly Free', icon: '🟢', color: COLORS.success?.[600] || '#059669' };
    if (percentage < 50) return { text: 'Moderate', icon: '🔵', color: COLORS.primary?.[600] || '#2563EB' };
    if (percentage < 70) return { text: 'Busy', icon: '🟡', color: COLORS.warning?.[600] || '#D97706' };
    return { text: 'Very Busy', icon: '🔴', color: COLORS.error?.[600] || '#DC2626' };
  };

  const getBestEarningDays = () => {
    // Find days with lowest utilization (most availability)
    const sortedByAvailability = [...weekAnalysis].sort(
      (a, b) => a.statistics.utilizationPercentage - b.statistics.utilizationPercentage
    );
    return sortedByAvailability.slice(0, 3);
  };

  const bestDays = getBestEarningDays();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Week Overview Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📆 This Week's Availability</Text>
        <Text style={styles.headerSubtitle}>
          Tap any day to see detailed timeline
        </Text>
      </View>

      {/* Week Days Grid */}
      <View style={styles.weekGrid}>
        {weekAnalysis.map((dayAnalysis, index) => {
          const status = getUtilizationStatus(dayAnalysis.statistics.utilizationPercentage);
          const isToday = index === 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                { backgroundColor: getUtilizationColor(dayAnalysis.statistics.utilizationPercentage) },
                isToday && styles.todayCard
              ]}
              onPress={() => onDayTap?.(dayAnalysis)}
              activeOpacity={0.7}
            >
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
              
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{getDayName(dayAnalysis.date)}</Text>
                <Text style={styles.dayDate}>
                  {getMonthName(dayAnalysis.date)} {getDateNumber(dayAnalysis.date)}
                </Text>
              </View>

              <View style={styles.dayStats}>
                <View style={styles.statRow}>
                  <Ionicons name="car" size={14} color={COLORS.textPrimary} />
                  <Text style={styles.statText}>
                    {dayAnalysis.statistics.rideCount} ride{dayAnalysis.statistics.rideCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.statSmall}>
                    {formatDuration(dayAnalysis.statistics.totalAvailableMinutes)} free
                  </Text>
                </View>
              </View>

              {/* Utilization Bar */}
              <View style={styles.miniUtilizationBar}>
                <View 
                  style={[
                    styles.miniUtilizationFill,
                    { 
                      width: `${dayAnalysis.statistics.utilizationPercentage}%`,
                      backgroundColor: status.color
                    }
                  ]}
                />
              </View>

              {/* Status Badge */}
              <View style={styles.statusRow}>
                <Text style={styles.statusIcon}>{status.icon}</Text>
                <Text style={[styles.statusLabel, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Best Days to Work */}
      <View style={styles.bestDaysContainer}>
        <Text style={styles.bestDaysTitle}>⭐ Best Days for Extra Rides</Text>
        {bestDays.map((dayAnalysis, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bestDayCard}
            onPress={() => onDayTap?.(dayAnalysis)}
          >
            <View style={styles.bestDayLeft}>
              <Text style={styles.bestDayRank}>#{index + 1}</Text>
              <View>
                <Text style={styles.bestDayName}>
                  {getDayName(dayAnalysis.date)}, {getMonthName(dayAnalysis.date)} {getDateNumber(dayAnalysis.date)}
                </Text>
                <Text style={styles.bestDayStats}>
                  {dayAnalysis.statistics.rideCount} scheduled • {formatDuration(dayAnalysis.statistics.totalAvailableMinutes)} available
                </Text>
              </View>
            </View>
            <View style={styles.bestDayRight}>
              <Text style={styles.bestDayPercentage}>
                {100 - dayAnalysis.statistics.utilizationPercentage}% free
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Week Summary */}
      <View style={styles.weekSummary}>
        <Text style={styles.weekSummaryTitle}>📊 Week Summary</Text>
        <View style={styles.weekSummaryGrid}>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryNumber}>
              {weekAnalysis.reduce((sum, day) => sum + day.statistics.rideCount, 0)}
            </Text>
            <Text style={styles.weekSummaryLabel}>Total Rides</Text>
          </View>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryNumber}>
              {(weekAnalysis.reduce((sum, day) => sum + day.statistics.totalScheduledMinutes, 0) / 60).toFixed(1)}
            </Text>
            <Text style={styles.weekSummaryLabel}>Hours Committed</Text>
          </View>
          <View style={styles.weekSummaryItem}>
            <Text style={[styles.weekSummaryNumber, { color: COLORS.success?.[600] || '#059669' }]}>
              {(weekAnalysis.reduce((sum, day) => sum + day.statistics.totalAvailableMinutes, 0) / 60).toFixed(1)}
            </Text>
            <Text style={styles.weekSummaryLabel}>Hours Available</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  scrollContent: {
    padding: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
  },
  weekGrid: {
    gap: 10,
    marginBottom: 20,
  },
  dayCard: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  todayCard: {
    borderWidth: 2,
    borderColor: COLORS.primary?.[500] || '#3B82F6',
  },
  todayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white || '#FFFFFF',
    textTransform: 'uppercase',
  },
  dayHeader: {
    marginBottom: 10,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  dayDate: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 2,
  },
  dayStats: {
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  statSmall: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
  },
  miniUtilizationBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniUtilizationFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bestDaysContainer: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  bestDaysTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 12,
  },
  bestDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.success?.[50] || '#ECFDF5',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success?.[500] || '#10B981',
  },
  bestDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bestDayRank: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success?.[600] || '#059669',
    width: 30,
  },
  bestDayName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  bestDayStats: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 2,
  },
  bestDayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestDayPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success?.[700] || '#047857',
  },
  weekSummary: {
    backgroundColor: COLORS.primary?.[50] || '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary?.[200] || '#BFDBFE',
  },
  weekSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
    marginBottom: 12,
  },
  weekSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  weekSummaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 8,
    padding: 10,
  },
  weekSummaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 2,
  },
  weekSummaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary || '#6B7280',
  },
});

export default ScheduleWeekView;

