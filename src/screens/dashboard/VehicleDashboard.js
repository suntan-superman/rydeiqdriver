import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleDashboard, clearVehicleError } from '../../store/slices/vehicleSlice';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '../../components/common/DashboardHeader';
import EmptyState from '../../components/common/EmptyState';

const VehicleDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.vehicle);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchVehicleDashboard({ userId: user.uid }));
    }
    return () => dispatch(clearVehicleError());
  }, [dispatch, user?.uid]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (user?.uid) {
      dispatch(fetchVehicleDashboard({ userId: user.uid }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Vehicle Management" 
        onBack={handleBack}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading vehicle data...</Text>
          </View>
        )}
        
        {error && (
          <EmptyState
            title="Unable to Load Vehicle Data"
            message="There was an issue loading your vehicle information. Please try again."
            icon="alert-circle-outline"
            actionText="Try Again"
            onAction={handleRetry}
            showAction={true}
          />
        )}
        
        {!isLoading && !error && !dashboard && (
          <EmptyState
            title="No Vehicle Data Available"
            message="Vehicle information will appear here once you register your vehicle and start using the app."
            icon="car-outline"
            actionText="Refresh"
            onAction={handleRetry}
            showAction={true}
          />
        )}
        
        {!isLoading && !error && dashboard && (
          <>
            <Section title="Vehicle Information" data={dashboard.vehicleInfo} />
            <Section title="Maintenance Status" data={dashboard.maintenanceStatus} />
            <Section title="Fuel Efficiency" data={dashboard.fuelEfficiency} />
            <Section title="Insurance Status" data={dashboard.insuranceStatus} />
            <Section title="Registration Status" data={dashboard.registrationStatus} />
            <Section title="Vehicle Analytics" data={dashboard.vehicleAnalytics} />
            <Section title="Maintenance History" data={dashboard.maintenanceHistory} />
            <Section title="Vehicle Recommendations" data={dashboard.recommendations} />
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
    if (value.status || value.condition) return `${value.status || value.condition}`;
    if (value.mileage || value.distance) return `${value.mileage || value.distance} km`;
    if (value.efficiency || value.mpg) return `${value.efficiency || value.mpg} mpg`;
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

export default VehicleDashboard; 