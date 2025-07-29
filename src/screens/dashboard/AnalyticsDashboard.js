import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalyticsDashboard, clearAnalyticsError } from '../../store/slices/analyticsSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DashboardHeader from '../../components/common/DashboardHeader';
import EmptyState from '../../components/common/EmptyState';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
  { label: '24h', value: '24h' },
];

const AnalyticsDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.analytics);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchAnalyticsDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearAnalyticsError());
  }, [dispatch, user?.uid, timeRange]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (user?.uid) {
      dispatch(fetchAnalyticsDashboard({ userId: user.uid, timeRange }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Analytics Dashboard" 
        onBack={handleBack}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading analytics data...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to Load Data</Text>
            <Text style={styles.errorMessage}>
              {error.includes('index') 
                ? 'Analytics data is being set up. Please try again later.'
                : error
              }
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isLoading && !error && !dashboard && (
          <EmptyState
            title="No Analytics Data"
            message="Analytics data will appear here once you start using the app and generating activity."
            icon="analytics-outline"
            actionText="Refresh"
            onAction={handleRetry}
            showAction={true}
          />
        )}
        
        {!isLoading && !error && dashboard && (
          <>
            <Section title="Performance Analytics" data={dashboard.performanceAnalytics} />
            <Section title="Earnings Analytics" data={dashboard.earningsAnalytics} />
            <Section title="Ride Analytics" data={dashboard.rideAnalytics} />
            <Section title="Customer Analytics" data={dashboard.customerAnalytics} />
            <Section title="Safety Analytics" data={dashboard.safetyAnalytics} />
            <Section title="Efficiency Analytics" data={dashboard.efficiencyAnalytics} />
            <Section title="Market Analytics" data={dashboard.marketAnalytics} />
            <Section title="Predictive Analytics" data={dashboard.predictiveAnalytics} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
    backgroundColor: '#10B981',
  },
  timeRangeText: {
    color: '#374151',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#fff',
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

export default AnalyticsDashboard; 