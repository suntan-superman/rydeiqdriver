import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGamificationDashboard, clearGamificationError } from '../../store/slices/gamificationSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
  { label: '24h', value: '24h' },
];

const GamificationDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, currentPoints, currentTier, achievements, activeChallenges, recentUnlocks, gamificationAlerts, leaderboardPosition, streakCount } = useSelector(state => state.gamification);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchGamificationDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearGamificationError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gamification Hub</Text>
      
      {/* Points & Tier Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <Text style={styles.pointsTitle}>Your Progress</Text>
        </View>
        <View style={styles.pointsContent}>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Points</Text>
            <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Tier</Text>
            <Text style={styles.pointsValue}>{currentTier}</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Streak</Text>
            <Text style={styles.pointsValue}>{streakCount} days</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard Position */}
      {leaderboardPosition && (
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <Ionicons name="trophy" size={24} color="#10B981" />
            <Text style={styles.leaderboardTitle}>Leaderboard Rank</Text>
          </View>
          <View style={styles.leaderboardContent}>
            <Text style={styles.rankText}>#{leaderboardPosition.global}</Text>
            <Text style={styles.rankLabel}>Global Rank</Text>
            <Text style={styles.scoreText}>{leaderboardPosition.score} points</Text>
          </View>
        </View>
      )}

      {/* Recent Achievements */}
      {recentUnlocks.length > 0 && (
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          {recentUnlocks.slice(0, 3).map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Ionicons name="medal" size={16} color="#F59E0B" />
              <Text style={styles.achievementText}>{achievement.name || 'Achievement Unlocked'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <View style={styles.challengesCard}>
          <Text style={styles.challengesTitle}>Active Challenges</Text>
          {activeChallenges.slice(0, 3).map((challenge, index) => (
            <View key={index} style={styles.challengeItem}>
              <Ionicons name="flag" size={16} color="#EF4444" />
              <Text style={styles.challengeText}>{challenge.name || 'Challenge'}</Text>
              <Text style={styles.challengeProgress}>{challenge.progress || 0}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Gamification Alerts */}
      {gamificationAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Gamification Alerts</Text>
          {gamificationAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="notifications" size={16} color="#EF4444" />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.timeRangeRow}>
        {TIME_RANGES.map(tr => (
          <TouchableOpacity
            key={tr.value}
            style={[styles.timeRangeButton, timeRange === tr.value && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange(tr.value)}
          >
            <Text style={[styles.timeRangeText, timeRange === tr.value && styles.timeRangeTextActive]}>{tr.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {isLoading && <ActivityIndicator size="large" style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!isLoading && !error && dashboard && (
        <>
          <Section title="Achievement System" data={dashboard.achievementSystem} />
          <Section title="Leaderboards" data={dashboard.leaderboards} />
          <Section title="Rewards Program" data={dashboard.rewardsProgram} />
          <Section title="Challenges" data={dashboard.challenges} />
          <Section title="Social Features" data={dashboard.socialFeatures} />
          <Section title="Loyalty Program" data={dashboard.loyaltyProgram} />
          <Section title="Progress Tracking" data={dashboard.progressTracking} />
          <Section title="Gamification Analytics" data={dashboard.gamificationAnalytics} />
        </>
      )}
    </ScrollView>
  );
};

const Section = ({ title, data }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data && typeof data === 'object' && Object.keys(data).length > 0 ? (
      Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{formatKey(key)}</Text>
          <Text style={styles.value}>{formatValue(value)}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.empty}>No data</Text>
    )}
  </View>
);

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

function formatValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (value.length <= 3) return value.map(item => item.name || item.title || item).join(', ');
    return `${value.length} items`;
  }
  if (typeof value === 'object' && value !== null) {
    if (value.name || value.title) return value.name || value.title;
    if (value.level || value.demand) return `${value.level || value.demand}`;
    if (value.average || value.price) return `$${value.average || value.price}`;
    if (value.current || value.total) return `${value.current}/${value.total}`;
    if (value.percentage) return `${value.percentage.toFixed(1)}%`;
    return '[Object]';
  }
  return value === undefined || value === null ? '—' : value;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  pointsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  pointsContent: {
    gap: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    color: '#92400E',
    fontWeight: '500',
  },
  pointsValue: {
    color: '#92400E',
    fontWeight: '600',
  },
  leaderboardCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  leaderboardContent: {
    alignItems: 'center',
  },
  rankText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  rankLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '600',
  },
  achievementsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  challengesCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  challengesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeText: {
    fontSize: 14,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  challengeProgress: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  alertsCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  timeRangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#F59E0B',
  },
  timeRangeText: {
    color: '#374151',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  loading: {
    marginVertical: 40,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    color: '#111827',
    fontWeight: '600',
  },
  empty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default GamificationDashboard; 