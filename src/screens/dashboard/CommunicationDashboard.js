import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommunicationDashboard, clearCommunicationError } from '../../store/slices/communicationSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
];

const CommunicationDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, unreadMessages, unreadNotifications } = useSelector(state => state.communication);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchCommunicationDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearCommunicationError());
  }, [dispatch, user?.uid, timeRange]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Communication Dashboard</Text>
      
      {/* Unread Counts */}
      <View style={styles.unreadCounts}>
        <View style={styles.unreadItem}>
          <Ionicons name="mail" size={20} color="#3B82F6" />
          <Text style={styles.unreadText}>{unreadMessages} unread messages</Text>
        </View>
        <View style={styles.unreadItem}>
          <Ionicons name="notifications" size={20} color="#EF4444" />
          <Text style={styles.unreadText}>{unreadNotifications} unread notifications</Text>
        </View>
      </View>

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
          <Section title="In-App Messaging" data={dashboard.messaging} />
          <Section title="Voice Calls" data={dashboard.voiceCalls} />
          <Section title="Chat Rooms" data={dashboard.chatRooms} />
          <Section title="Notifications" data={dashboard.notifications} />
          <Section title="Message History" data={dashboard.messageHistory} />
          <Section title="Communication Analytics" data={dashboard.analytics} />
          <Section title="Communication Tools" data={dashboard.tools} />
          <Section title="Communication Preferences" data={dashboard.preferences} />
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
  unreadCounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  unreadItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    backgroundColor: '#3B82F6',
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

export default CommunicationDashboard; 