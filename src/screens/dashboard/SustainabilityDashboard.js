import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSustainabilityDashboard, clearSustainabilityError } from '../../store/slices/sustainabilitySlice';
import { useAuth } from '@/contexts/AuthContext';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
];

const SustainabilityDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.sustainability);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchSustainabilityDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearSustainabilityError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sustainability Dashboard</Text>
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
          <Section title="Carbon Footprint" data={dashboard.carbonFootprint} />
          <Section title="Green Initiatives" data={dashboard.greenInitiatives} />
          <Section title="Eco-Friendly Drivers" data={dashboard.ecoDrivers} />
          <Section title="Analytics" data={dashboard.analytics} />
          <Section title="Carbon Offsets" data={dashboard.carbonOffsets} />
          <Section title="Environmental Impact" data={dashboard.environmentalImpact} />
          <Section title="Green Rewards" data={dashboard.greenRewards} />
          <Section title="Goals" data={dashboard.goals} />
          <Section title="Recommendations" data={dashboard.recommendations} />
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
  if (Array.isArray(value)) return value.length === 0 ? 'None' : value.join(', ');
  if (typeof value === 'object' && value !== null) return '[Object]';
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

export default SustainabilityDashboard; 