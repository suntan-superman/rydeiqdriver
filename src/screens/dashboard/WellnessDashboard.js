import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWellnessDashboard, clearWellnessError } from '../../store/slices/wellnessSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES = [
  { label: '30d', value: '30d' },
  { label: '7d', value: '7d' },
  { label: '24h', value: '24h' },
];

const WellnessDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, currentWellnessScore, currentFatigueLevel, currentHealthScore, currentSleepScore, currentStressLevel, wellnessAlerts, safetyAlerts, emergencyAlerts, wellnessGoals, recentActivities } = useSelector(state => state.wellness);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchWellnessDashboard({ userId: user.uid, timeRange }));
    }
    return () => dispatch(clearWellnessError());
  }, [dispatch, user?.uid, timeRange]);

  const getFatigueColor = (level) => {
    if (level >= 80) return '#EF4444';
    if (level >= 60) return '#F59E0B';
    if (level >= 30) return '#10B981';
    return '#6B7280';
  };

  const getWellnessColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wellness & Safety Hub</Text>
      
      {/* Wellness Score Card */}
      <View style={styles.wellnessCard}>
        <View style={styles.wellnessHeader}>
          <Ionicons name="heart" size={24} color={getWellnessColor(currentWellnessScore)} />
          <Text style={styles.wellnessTitle}>Overall Wellness</Text>
        </View>
        <View style={styles.wellnessContent}>
          <Text style={[styles.wellnessScore, { color: getWellnessColor(currentWellnessScore) }]}>
            {currentWellnessScore.toFixed(0)}
          </Text>
          <Text style={styles.wellnessLabel}>Wellness Score</Text>
        </View>
      </View>

      {/* Health Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="fitness" size={20} color={getWellnessColor(currentHealthScore)} />
          <Text style={[styles.metricValue, { color: getWellnessColor(currentHealthScore) }]}>
            {currentHealthScore.toFixed(0)}
          </Text>
          <Text style={styles.metricLabel}>Health</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="bed" size={20} color={getWellnessColor(currentSleepScore)} />
          <Text style={[styles.metricValue, { color: getWellnessColor(currentSleepScore) }]}>
            {currentSleepScore.toFixed(0)}
          </Text>
          <Text style={styles.metricLabel}>Sleep</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="leaf" size={20} color={getWellnessColor(100 - currentStressLevel)} />
          <Text style={[styles.metricValue, { color: getWellnessColor(100 - currentStressLevel) }]}>
            {(100 - currentStressLevel).toFixed(0)}
          </Text>
          <Text style={styles.metricLabel}>Calm</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="alert-circle" size={20} color={getFatigueColor(currentFatigueLevel)} />
          <Text style={[styles.metricValue, { color: getFatigueColor(currentFatigueLevel) }]}>
            {currentFatigueLevel.toFixed(0)}
          </Text>
          <Text style={styles.metricLabel}>Fatigue</Text>
        </View>
      </View>

      {/* Fatigue Detection */}
      {dashboard?.fatigueDetection && (
        <View style={styles.fatigueCard}>
          <View style={styles.fatigueHeader}>
            <Ionicons name="eye" size={24} color={getFatigueColor(currentFatigueLevel)} />
            <Text style={styles.fatigueTitle}>Fatigue Detection</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getFatigueColor(currentFatigueLevel) }]} />
          </View>
          <View style={styles.fatigueContent}>
            <Text style={styles.fatigueStatus}>
              Status: {dashboard.fatigueDetection.currentStatus}
            </Text>
            <Text style={styles.fatigueLevel}>
              Level: {currentFatigueLevel.toFixed(1)}%
            </Text>
            <Text style={styles.fatigueAccuracy}>
              Detection Accuracy: {dashboard.fatigueDetection.detectionMethods.eyeTracking.accuracy}
            </Text>
          </View>
        </View>
      )}

      {/* Health Monitoring */}
      {dashboard?.healthMonitoring && (
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Ionicons name="medical" size={24} color="#10B981" />
            <Text style={styles.healthTitle}>Health Monitoring</Text>
          </View>
          <View style={styles.healthContent}>
            <Text style={styles.healthScore}>
              Health Score: {currentHealthScore.toFixed(0)}
            </Text>
            {dashboard.healthMonitoring.vitalSigns && (
              <View style={styles.vitalSigns}>
                <Text style={styles.vitalSign}>Heart Rate: {dashboard.healthMonitoring.vitalSigns.heartRate}</Text>
                <Text style={styles.vitalSign}>BP: {dashboard.healthMonitoring.vitalSigns.bloodPressure}</Text>
                <Text style={styles.vitalSign}>Temp: {dashboard.healthMonitoring.vitalSigns.temperature}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Safety Alerts</Text>
          {safetyAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={styles.alertText}>{alert.message || 'Safety alert'}</Text>
              <Text style={styles.alertSeverity}>{alert.severity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Wellness Alerts */}
      {wellnessAlerts.length > 0 && (
        <View style={styles.wellnessAlertsCard}>
          <Text style={styles.wellnessAlertsTitle}>Wellness Alerts</Text>
          {wellnessAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="notifications" size={16} color="#F59E0B" />
              <Text style={styles.alertText}>{alert.message}</Text>
              <Text style={styles.alertSeverity}>{alert.severity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Alerts</Text>
          {emergencyAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.emergencyItem}>
              <Ionicons name="alert" size={16} color="#EF4444" />
              <Text style={styles.emergencyText}>{alert.message || 'Emergency alert'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Wellness Goals */}
      {wellnessGoals.length > 0 && (
        <View style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>Wellness Goals</Text>
          {wellnessGoals.slice(0, 3).map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <Text style={styles.goalText}>{goal.goal}</Text>
              <View style={styles.goalProgress}>
                <View style={[styles.progressBar, { width: `${goal.progress}%` }]} />
                <Text style={styles.goalProgressText}>{goal.progress}/{goal.target}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <View style={styles.activitiesCard}>
          <Text style={styles.activitiesTitle}>Recent Activities</Text>
          {recentActivities.slice(0, 3).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.activityText}>{activity.title || activity.type}</Text>
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
          <Section title="Fatigue Detection" data={dashboard.fatigueDetection} />
          <Section title="Health Monitoring" data={dashboard.healthMonitoring} />
          <Section title="Wellness Tracking" data={dashboard.wellnessTracking} />
          <Section title="Safety Alerts" data={dashboard.safetyAlerts} />
          <Section title="Stress Management" data={dashboard.stressManagement} />
          <Section title="Sleep Tracking" data={dashboard.sleepTracking} />
          <Section title="Nutrition Guidance" data={dashboard.nutritionGuidance} />
          <Section title="Mental Health Support" data={dashboard.mentalHealthSupport} />
          <Section title="Wellness Analytics" data={dashboard.wellnessAnalytics} />
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
  wellnessCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wellnessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  wellnessContent: {
    alignItems: 'center',
  },
  wellnessScore: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  wellnessLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  fatigueCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fatigueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fatigueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fatigueContent: {
    gap: 4,
  },
  fatigueStatus: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  fatigueLevel: {
    fontSize: 12,
    color: '#92400E',
  },
  fatigueAccuracy: {
    fontSize: 12,
    color: '#92400E',
  },
  healthCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  healthContent: {
    gap: 4,
  },
  healthScore: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
  },
  vitalSigns: {
    marginTop: 8,
  },
  vitalSign: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 2,
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
  alertSeverity: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  wellnessAlertsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  wellnessAlertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  goalsCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#581C87',
    marginBottom: 8,
  },
  goalItem: {
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#581C87',
    marginBottom: 4,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginRight: 8,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#581C87',
    fontWeight: '600',
  },
  activitiesCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#065F46',
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

export default WellnessDashboard; 