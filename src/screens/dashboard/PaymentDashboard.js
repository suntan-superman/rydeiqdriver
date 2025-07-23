import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentDashboard, clearPaymentError } from '../../store/slices/paymentSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
];

const PaymentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, accountBalance, pendingPayments, paymentAlerts } = useSelector(state => state.payment);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchPaymentDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearPaymentError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Payment & Banking</Text>
      
      {/* Account Balance */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet" size={24} color="#10B981" />
          <Text style={styles.balanceTitle}>Total Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>${accountBalance.toFixed(2)}</Text>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={styles.balanceValue}>${pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceValue}>${(accountBalance - pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Alerts */}
      {paymentAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Payment Alerts</Text>
          {paymentAlerts.slice(0, 3).map((alert, index) => (
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
          <Section title="Payment Processing" data={dashboard.paymentProcessing} />
          <Section title="Banking Integration" data={dashboard.bankingIntegration} />
          <Section title="Financial Analytics" data={dashboard.financialAnalytics} />
          <Section title="Payment History" data={dashboard.paymentHistory} />
          <Section title="Transaction Management" data={dashboard.transactionManagement} />
          <Section title="Financial Reporting" data={dashboard.financialReporting} />
          <Section title="Payment Methods" data={dashboard.paymentMethods} />
          <Section title="Tax Management" data={dashboard.taxManagement} />
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
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
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

export default PaymentDashboard; 