import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { formatDuration, getSummaryStats, generateDailyInsights } from '@/utils/scheduleAnalyzer';

/**
 * Availability Insights Component
 * Shows intelligent insights about driver's schedule and availability
 */
const AvailabilityInsights = ({ dailyAnalysis }) => {
  if (!dailyAnalysis || dailyAnalysis.scheduledRides.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No rides scheduled - entire day is available!
        </Text>
      </View>
    );
  }

  const summary = getSummaryStats(dailyAnalysis);
  const insights = generateDailyInsights(dailyAnalysis);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Ionicons name="calendar" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
          <Text style={styles.summaryNumber}>{summary.scheduledRides}</Text>
          <Text style={styles.summaryLabel}>Scheduled Rides</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="time" size={20} color={COLORS.error?.[500] || '#EF4444'} />
          <Text style={styles.summaryNumber}>{summary.committedHours} hrs</Text>
          <Text style={styles.summaryLabel}>Committed</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="hourglass" size={20} color={COLORS.success?.[500] || '#10B981'} />
          <Text style={styles.summaryNumber}>{summary.availableHours} hrs</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
      </View>

      {/* Utilization Bar */}
      <View style={styles.utilizationContainer}>
        <View style={styles.utilizationHeader}>
          <Text style={styles.utilizationLabel}>Schedule Utilization</Text>
          <Text style={styles.utilizationPercentage}>{summary.utilizationPercentage}%</Text>
        </View>
        <View style={styles.utilizationBar}>
          <View 
            style={[
              styles.utilizationFill, 
              { 
                width: `${summary.utilizationPercentage}%`,
                backgroundColor: summary.utilizationPercentage > 70 
                  ? COLORS.error?.[500] || '#EF4444'
                  : summary.utilizationPercentage > 40
                  ? COLORS.warning?.[500] || '#F59E0B'
                  : COLORS.success?.[500] || '#10B981'
              }
            ]} 
          />
        </View>
        <View style={styles.utilizationLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error?.[500] || '#EF4444' }]} />
            <Text style={styles.legendText}>Busy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success?.[500] || '#10B981' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>💡 Smart Insights</Text>
          {insights.map((insight, index) => (
            <View 
              key={index}
              style={[
                styles.insightCard,
                insight.priority === 'warning' && styles.insightWarning,
                insight.priority === 'high' && styles.insightHigh
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Potential Earnings */}
      {summary.potentialEarnings > 0 && (
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Ionicons name="cash" size={24} color={COLORS.success?.[600] || '#059669'} />
            <Text style={styles.earningsTitle}>Earning Potential</Text>
          </View>
          <Text style={styles.earningsAmount}>${summary.potentialEarnings}</Text>
          <Text style={styles.earningsSubtext}>
            Estimated additional earnings if you fill your available gaps
          </Text>
        </View>
      )}

      {/* Gaps Summary */}
      {summary.gaps > 0 && (
        <View style={styles.gapsSummary}>
          <View style={styles.gapsSummaryHeader}>
            <Ionicons name="list-circle" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
            <Text style={styles.gapsSummaryTitle}>Available Time Slots</Text>
          </View>
          <Text style={styles.gapsSummaryText}>
            You have <Text style={styles.highlight}>{summary.gaps} time gap{summary.gaps !== 1 ? 's' : ''}</Text> where you could accept additional rides.
          </Text>
          <Text style={styles.gapsSuggestion}>
            Switch to Timeline view to see exactly when you're available! 📊
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  content: {
    padding: 12,
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
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginTop: 6,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
  },
  utilizationContainer: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  utilizationPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  utilizationBar: {
    height: 8,
    backgroundColor: COLORS.gray200 || '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary || '#6B7280',
  },
  insightsContainer: {
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary?.[500] || '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  insightHigh: {
    borderLeftColor: COLORS.success?.[500] || '#10B981',
    backgroundColor: '#F0FDF4',
  },
  insightWarning: {
    borderLeftColor: COLORS.warning?.[500] || '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary || '#111827',
    lineHeight: 16,
  },
  earningsCard: {
    backgroundColor: COLORS.success?.[50] || '#ECFDF5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success?.[200] || '#A7F3D0',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success?.[800] || '#065F46',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success?.[700] || '#047857',
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 11,
    color: COLORS.success?.[700] || '#047857',
    lineHeight: 15,
  },
  gapsSummary: {
    backgroundColor: COLORS.primary?.[50] || '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary?.[200] || '#BFDBFE',
  },
  gapsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  gapsSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
  },
  gapsSummaryText: {
    fontSize: 12,
    color: COLORS.primary?.[700] || '#1D4ED8',
    lineHeight: 16,
    marginBottom: 6,
  },
  gapsSuggestion: {
    fontSize: 11,
    color: COLORS.primary?.[600] || '#2563EB',
    fontStyle: 'italic',
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
  },
});

export default AvailabilityInsights;

