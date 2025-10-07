import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { analyzeWeekSchedule, formatDuration } from '@/utils/scheduleAnalyzer';

/**
 * Multi-Day Optimizer Component
 * Provides intelligent suggestions for optimizing schedule across multiple days
 */
const MultiDayOptimizer = ({ allRides, onApplySuggestion }) => {
  const weekAnalysis = analyzeWeekSchedule(allRides);

  // Find optimization opportunities
  const getOptimizationSuggestions = () => {
    const suggestions = [];

    // Find completely free days
    const freeDays = weekAnalysis.filter(day => day.statistics.rideCount === 0);
    if (freeDays.length > 0) {
      suggestions.push({
        id: 'free_days',
        priority: 'high',
        icon: '🎯',
        title: `${freeDays.length} Day${freeDays.length !== 1 ? 's' : ''} Completely Free!`,
        description: `${freeDays.map(d => d.date.toLocaleDateString('en-US', { weekday: 'short' })).join(', ')} ${freeDays.length === 1 ? 'is' : 'are'} wide open for regular rides.`,
        action: 'Plan to focus on these days for maximum earnings',
        color: COLORS.success?.[600] || '#059669'
      });
    }

    // Find best consecutive free days
    let consecutiveFree = 0;
    let maxConsecutive = 0;
    weekAnalysis.forEach(day => {
      if (day.statistics.rideCount === 0) {
        consecutiveFree++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveFree);
      } else {
        consecutiveFree = 0;
      }
    });

    if (maxConsecutive >= 2) {
      suggestions.push({
        id: 'consecutive_free',
        priority: 'high',
        icon: '📅',
        title: `${maxConsecutive} Days in a Row Free!`,
        description: 'Perfect opportunity to build momentum and maximize weekly earnings.',
        action: 'Consider going online for extended periods on these days',
        color: COLORS.primary?.[600] || '#2563EB'
      });
    }

    // Find unbalanced schedule
    const busyDays = weekAnalysis.filter(day => day.statistics.utilizationPercentage > 60);
    if (busyDays.length >= 3 && freeDays.length >= 2) {
      suggestions.push({
        id: 'balance',
        priority: 'medium',
        icon: '⚖️',
        title: 'Unbalanced Week Detected',
        description: 'You have heavy days and completely free days. Consider spreading rides more evenly.',
        action: 'Try to balance your commitments across the week',
        color: COLORS.warning?.[600] || '#D97706'
      });
    }

    // Find days with large gaps
    const daysWithGaps = weekAnalysis.filter(day => 
      day.statistics.rideCount > 0 && day.statistics.totalAvailableMinutes >= 180
    );

    if (daysWithGaps.length > 0) {
      const totalGapTime = daysWithGaps.reduce(
        (sum, day) => sum + day.statistics.totalAvailableMinutes,
        0
      );
      suggestions.push({
        id: 'gaps',
        priority: 'high',
        icon: '⏰',
        title: `${formatDuration(totalGapTime)} of Gaps This Week`,
        description: `${daysWithGaps.length} day${daysWithGaps.length !== 1 ? 's' : ''} have large gaps between rides.`,
        action: 'Accept short rides during these gaps to maximize earnings',
        color: COLORS.success?.[600] || '#059669'
      });
    }

    // Weekend availability
    const weekend = weekAnalysis.slice(5, 7); // Saturday and Sunday
    const weekendFree = weekend.filter(day => day.statistics.rideCount === 0);
    if (weekendFree.length === 2) {
      suggestions.push({
        id: 'weekend',
        priority: 'medium',
        icon: '🎉',
        title: 'Weekend Completely Free!',
        description: 'Saturday and Sunday are both available.',
        action: 'Weekends often have higher demand - great earning opportunity',
        color: COLORS.primary?.[600] || '#2563EB'
      });
    }

    return suggestions;
  };

  const suggestions = getOptimizationSuggestions();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 Smart Optimizer</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered suggestions to maximize your weekly earnings
        </Text>
      </View>

      {suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success?.[500] || '#10B981'} />
          <Text style={styles.emptyTitle}>Schedule Looks Great!</Text>
          <Text style={styles.emptyText}>
            Your schedule is well-optimized. Keep up the good work!
          </Text>
        </View>
      ) : (
        suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={[styles.suggestionCard, { borderLeftColor: suggestion.color }]}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionInfo}>
                <View style={styles.suggestionTitleRow}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  {suggestion.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>HOT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
            </View>

            <View style={styles.suggestionAction}>
              <Ionicons name="bulb" size={14} color={suggestion.color} />
              <Text style={[styles.suggestionActionText, { color: suggestion.color }]}>
                {suggestion.action}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.quickStatsTitle}>⚡ Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {weekAnalysis.reduce((sum, day) => sum + day.statistics.rideCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Week Rides</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {weekAnalysis.filter(day => day.statistics.rideCount === 0).length}
            </Text>
            <Text style={styles.statLabel}>Free Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {(weekAnalysis.reduce((sum, day) => sum + day.statistics.totalAvailableMinutes, 0) / 60).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Hours Free</Text>
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
  content: {
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
    lineHeight: 16,
  },
  suggestionCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: COLORS.error?.[500] || '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white || '#FFFFFF',
  },
  suggestionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  suggestionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  suggestionActionText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  quickStats: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary?.[600] || '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
  },
});

export default MultiDayOptimizer;

