import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDynamicPricingDashboard, clearDynamicPricingError } from '../../store/slices/dynamicPricingSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
  { label: '24h', value: '24h' },
];

const DynamicPricingDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, realTimePricing, pricingAlerts, marketInsights } = useSelector(state => state.dynamicPricing);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchDynamicPricingDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearDynamicPricingError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI Dynamic Pricing</Text>
      
      {/* Real-time Pricing Card */}
      {realTimePricing && (
        <View style={styles.realTimeCard}>
          <View style={styles.realTimeHeader}>
            <Ionicons name="flash" size={24} color="#F59E0B" />
            <Text style={styles.realTimeTitle}>Real-Time Pricing</Text>
          </View>
          <View style={styles.realTimeContent}>
            <Text style={styles.recommendedPrice}>
              ${realTimePricing.recommendedPrice?.recommendedPrice?.toFixed(2) || '25.00'}
            </Text>
            <Text style={styles.priceIncrease}>
              {realTimePricing.recommendedPrice?.increase || '+0%'} from base
            </Text>
            <Text style={styles.confidence}>
              Confidence: {(realTimePricing.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Market Insights Card */}
      {marketInsights && (
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <Text style={styles.insightsTitle}>Market Insights</Text>
          </View>
          <View style={styles.insightsContent}>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Market Efficiency</Text>
              <Text style={styles.insightValue}>{marketInsights.marketEfficiency?.efficiency || '85%'}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Supply/Demand</Text>
              <Text style={styles.insightValue}>{marketInsights.supplyDemandBalance?.balance || 'Balanced'}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Optimal Price</Text>
              <Text style={styles.insightValue}>${marketInsights.optimalPricing?.optimalBasePrice || '27.50'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Pricing Alerts */}
      {pricingAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Pricing Alerts</Text>
          {pricingAlerts.slice(0, 3).map((alert, index) => (
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
          <Section title="Demand Prediction" data={dashboard.demandPrediction} />
          <Section title="Competitor Analysis" data={dashboard.competitorAnalysis} />
          <Section title="Weather Impact" data={dashboard.weatherImpact} />
          <Section title="Event Pricing" data={dashboard.eventPricing} />
          <Section title="Driver Incentives" data={dashboard.driverIncentives} />
          <Section title="Market Optimization" data={dashboard.marketOptimization} />
          <Section title="Pricing Recommendations" data={dashboard.pricingRecommendations} />
          <Section title="Historical Pricing" data={dashboard.historicalPricing} />
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
  realTimeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  realTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  realTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  realTimeContent: {
    alignItems: 'center',
  },
  recommendedPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  priceIncrease: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '400',
  },
  insightsCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  insightsContent: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightLabel: {
    color: '#065F46',
    fontWeight: '500',
  },
  insightValue: {
    color: '#065F46',
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

export default DynamicPricingDashboard; 