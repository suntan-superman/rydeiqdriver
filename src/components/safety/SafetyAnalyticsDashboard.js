import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import enhancedSafetyService from '../../services/enhancedSafetyService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SafetyAnalyticsDashboard = ({ driverId, onClose, visible = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [error, setError] = useState(null);

  const timeRangeOptions = [
    { value: '7d', label: '7 Days', icon: 'calendar-outline' },
    { value: '30d', label: '30 Days', icon: 'calendar' },
    { value: '90d', label: '90 Days', icon: 'calendar-sharp' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadAnalytics();
    }
  }, [visible, driverId, selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await enhancedSafetyService.getSafetyAnalytics(selectedTimeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading safety analytics:', error);
      setError('Failed to load safety analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const handleTimeRangeChange = (timeRange) => {
    setSelectedTimeRange(timeRange);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return COLORS.success[600];
    if (score >= 70) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getSafetyScoreIcon = (score) => {
    if (score >= 90) return 'shield-checkmark';
    if (score >= 70) return 'shield';
    return 'shield-outline';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return COLORS.error[600];
      case 'medium': return COLORS.warning[600];
      case 'low': return COLORS.success[600];
      default: return COLORS.gray[600];
    }
  };

  const getIncidentTypeIcon = (type) => {
    switch (type) {
      case 'speeding': return 'speedometer';
      case 'hard_acceleration': return 'trending-up';
      case 'hard_braking': return 'trending-down';
      default: return 'warning';
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Safety Analytics</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary[600]]}
            tintColor={COLORS.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <View style={styles.timeRangeButtons}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === option.value && styles.timeRangeButtonActive
                ]}
                onPress={() => handleTimeRangeChange(option.value)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={16} 
                  color={selectedTimeRange === option.value ? 'white' : COLORS.gray[600]} 
                />
                <Text style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === option.value && styles.timeRangeButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading && !analytics ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading safety analytics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
            <Text style={styles.errorTitle}>Failed to Load Analytics</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : analytics ? (
          <>
            {/* Safety Score Overview */}
            <View style={styles.safetyScoreCard}>
              <View style={styles.safetyScoreHeader}>
                <Ionicons 
                  name={getSafetyScoreIcon(analytics.currentSafetyScore)} 
                  size={32} 
                  color={getSafetyScoreColor(analytics.currentSafetyScore)} 
                />
                <View style={styles.safetyScoreInfo}>
                  <Text style={styles.safetyScoreTitle}>Current Safety Score</Text>
                  <Text style={styles.safetyScoreSubtitle}>
                    Based on recent driving behavior
                  </Text>
                </View>
              </View>
              <Text style={[styles.safetyScoreValue, { color: getSafetyScoreColor(analytics.currentSafetyScore) }]}>
                {analytics.currentSafetyScore}
              </Text>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, styles.incidentsCard]}>
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="warning" size={20} color={COLORS.warning[600]} />
                    <Text style={styles.summaryCardTitle}>Total Incidents</Text>
                  </View>
                  <Text style={styles.summaryCardValue}>
                    {analytics.totalIncidents}
                  </Text>
                  <Text style={styles.summaryCardSubtext}>
                    {selectedTimeRange} period
                  </Text>
                </View>

                <View style={[styles.summaryCard, styles.reportsCard]}>
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="document-text" size={20} color={COLORS.primary[600]} />
                    <Text style={styles.summaryCardTitle}>Reports Filed</Text>
                  </View>
                  <Text style={styles.summaryCardValue}>
                    {analytics.totalReports}
                  </Text>
                  <Text style={styles.summaryCardSubtext}>
                    Incident reports
                  </Text>
                </View>
              </View>
            </View>

            {/* Incident Types Breakdown */}
            {Object.keys(analytics.incidentTypes).length > 0 && (
              <View style={styles.incidentTypesCard}>
                <Text style={styles.sectionTitle}>Incident Types</Text>
                
                {Object.entries(analytics.incidentTypes).map(([type, count]) => (
                  <View key={type} style={styles.incidentTypeRow}>
                    <View style={styles.incidentTypeInfo}>
                      <Ionicons 
                        name={getIncidentTypeIcon(type)} 
                        size={20} 
                        color={COLORS.warning[600]} 
                      />
                      <Text style={styles.incidentTypeName}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </View>
                    <Text style={styles.incidentTypeCount}>{count}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Severity Breakdown */}
            <View style={styles.severityCard}>
              <Text style={styles.sectionTitle}>Severity Breakdown</Text>
              
              <View style={styles.severityRow}>
                <View style={styles.severityItem}>
                  <View style={[styles.severityIndicator, { backgroundColor: COLORS.error[600] }]} />
                  <Text style={styles.severityLabel}>High</Text>
                  <Text style={styles.severityCount}>{analytics.severityBreakdown.high}</Text>
                </View>
                
                <View style={styles.severityItem}>
                  <View style={[styles.severityIndicator, { backgroundColor: COLORS.warning[600] }]} />
                  <Text style={styles.severityLabel}>Medium</Text>
                  <Text style={styles.severityCount}>{analytics.severityBreakdown.medium}</Text>
                </View>
                
                <View style={styles.severityItem}>
                  <View style={[styles.severityIndicator, { backgroundColor: COLORS.success[600] }]} />
                  <Text style={styles.severityLabel}>Low</Text>
                  <Text style={styles.severityCount}>{analytics.severityBreakdown.low}</Text>
                </View>
              </View>
            </View>

            {/* Recommendations */}
            {analytics.recommendations && analytics.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.sectionTitle}>Safety Recommendations</Text>
                
                {analytics.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationHeader}>
                      <Ionicons 
                        name={recommendation.priority === 'high' ? 'alert-circle' : 'information-circle'} 
                        size={18} 
                        color={recommendation.priority === 'high' ? COLORS.error[600] : COLORS.warning[600]} 
                      />
                      <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                    </View>
                    <Text style={styles.recommendationDescription}>
                      {recommendation.description}
                    </Text>
                    <Text style={styles.recommendationAction}>
                      💡 {recommendation.action}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Safety Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.sectionTitle}>Safety Tips</Text>
              
              <View style={styles.tipItem}>
                <Ionicons name="speedometer" size={16} color={COLORS.primary[600]} />
                <Text style={styles.tipText}>
                  Maintain safe speeds and use cruise control when possible
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Ionicons name="car" size={16} color={COLORS.primary[600]} />
                <Text style={styles.tipText}>
                  Keep a safe following distance to avoid hard braking
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Ionicons name="shield" size={16} color={COLORS.primary[600]} />
                <Text style={styles.tipText}>
                  Report incidents promptly to maintain accurate safety records
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Ionicons name="location" size={16} color={COLORS.primary[600]} />
                <Text style={styles.tipText}>
                  Keep emergency contacts updated for quick assistance
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary[600],
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  timeRangeButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyScoreCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  safetyScoreInfo: {
    flex: 1,
  },
  safetyScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  safetyScoreSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  safetyScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentsCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning[500],
  },
  reportsCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  summaryCardSubtext: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  incidentTypesCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  incidentTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incidentTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  incidentTypeCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.warning[600],
  },
  severityCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  severityItem: {
    alignItems: 'center',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  severityCount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  recommendationsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  recommendationDescription: {
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 11,
    color: COLORS.primary[600],
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SafetyAnalyticsDashboard;
