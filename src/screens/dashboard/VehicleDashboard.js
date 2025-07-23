import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleDashboard, clearVehicleError } from '../../store/slices/vehicleSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
];

const VehicleDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, currentLocation, maintenanceAlerts } = useSelector(state => state.vehicle);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchVehicleDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearVehicleError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vehicle Management</Text>
      
      {/* Vehicle Health Status */}
      {dashboard?.vehicleHealth && (
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Ionicons name="car" size={24} color="#10B981" />
            <Text style={styles.healthTitle}>Vehicle Health</Text>
            <Text style={styles.healthScore}>{dashboard.vehicleHealth.overallHealth}%</Text>
          </View>
          <View style={styles.healthBars}>
            <View style={styles.healthBar}>
              <Text style={styles.healthLabel}>Engine</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${dashboard.vehicleHealth.engineHealth}%` }]} />
              </View>
              <Text style={styles.healthValue}>{dashboard.vehicleHealth.engineHealth}%</Text>
            </View>
            <View style={styles.healthBar}>
              <Text style={styles.healthLabel}>Tires</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${dashboard.vehicleHealth.tireHealth}%` }]} />
              </View>
              <Text style={styles.healthValue}>{dashboard.vehicleHealth.tireHealth}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Maintenance Alerts */}
      {maintenanceAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Maintenance Alerts</Text>
          {maintenanceAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
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
          <Section title="Vehicle Tracking" data={dashboard.vehicleTracking} />
          <Section title="Maintenance Scheduling" data={dashboard.maintenance} />
          <Section title="Fuel Management" data={dashboard.fuelManagement} />
          <Section title="Vehicle Analytics" data={dashboard.analytics} />
          <Section title="Insurance Tracking" data={dashboard.insurance} />
          <Section title="Vehicle Documentation" data={dashboard.documentation} />
          <Section title="Cost Tracking" data={dashboard.costTracking} />
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
  healthCard: {
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
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  healthScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  healthBars: {
    gap: 8,
  },
  healthBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthLabel: {
    width: 60,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  healthValue: {
    width: 35,
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
  },
  alertsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
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

export default VehicleDashboard; 