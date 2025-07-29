import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGamificationDashboard, clearGamificationError } from '../../store/slices/gamificationSlice';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '../../components/common/DashboardHeader';
import EmptyState from '../../components/common/EmptyState';

const GamificationDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.gamification);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchGamificationDashboard({ userId: user.uid }));
    }
    return () => dispatch(clearGamificationError());
  }, [dispatch, user?.uid]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (user?.uid) {
      dispatch(fetchGamificationDashboard({ userId: user.uid }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Gamification" 
        onBack={handleBack}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading gamification data...</Text>
          </View>
        )}
        
        {error && (
          <EmptyState
            title="Unable to Load Gamification Data"
            message="There was an issue loading your gamification information. Please try again."
            icon="alert-circle-outline"
            actionText="Try Again"
            onAction={handleRetry}
            showAction={true}
          />
        )}
        
        {!isLoading && !error && !dashboard && (
          <EmptyState
            title="No Gamification Data Available"
            message="Gamification features will appear here once you start using the app and earning achievements."
            icon="trophy-outline"
            actionText="Refresh"
            onAction={handleRetry}
            showAction={true}
          />
        )}
        
        {!isLoading && !error && dashboard && (
          <>
            <Section title="Achievements" data={dashboard.achievements} />
            <Section title="Leaderboards" data={dashboard.leaderboards} />
            <Section title="Rewards" data={dashboard.rewards} />
            <Section title="Challenges" data={dashboard.challenges} />
            <Section title="Social Features" data={dashboard.socialFeatures} />
            <Section title="Loyalty Programs" data={dashboard.loyaltyPrograms} />
            <Section title="Progress Tracking" data={dashboard.progressTracking} />
            <Section title="Gamification Analytics" data={dashboard.analytics} />
          </>
        )}
      </ScrollView>
    </View>
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
      <Text style={styles.empty}>No data available</Text>
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
    if (value.score || value.points) return `${value.score || value.points} pts`;
    if (value.level || value.rank) return `${value.level || value.rank}`;
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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