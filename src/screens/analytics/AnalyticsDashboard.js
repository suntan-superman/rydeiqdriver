import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import * as Haptics from 'expo-haptics';

// Import chart components (we'll create these)
import EarningsChart from '../../components/analytics/EarningsChart';
import TimeBlockPerformance from '../../components/analytics/TimeBlockPerformance';
import BidSuccessRate from '../../components/analytics/BidSuccessRate';
import ReliabilityScore from '../../components/analytics/ReliabilityScore';
import MarketComparison from '../../components/analytics/MarketComparison';
import InsightsCard from '../../components/analytics/InsightsCard';
import RecommendationsCard from '../../components/analytics/RecommendationsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnalyticsDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [error, setError] = useState(null);

  const timeRangeOptions = [
    { value: '7d', label: '7 Days', icon: 'calendar-outline' },
    { value: '30d', label: '30 Days', icon: 'calendar' },
    { value: '90d', label: '90 Days', icon: 'calendar-sharp' },
    { value: '1y', label: '1 Year', icon: 'calendar-number' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      // Validate user before making analytics call
      const driverId = user?.uid || user?.id;
      if (!driverId) {
        setError('User ID not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const data = await analyticsService.getDriverAnalytics(driverId, {
        timeRange: selectedTimeRange,
        includePredictions: true,
        includeMarketComparison: true
      });
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading && !analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
          <Text style={styles.errorTitle}>Failed to Load Analytics</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? COLORS.gray[400] : COLORS.primary[600]} 
          />
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

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.earningsCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="cash" size={20} color={COLORS.success[600]} />
                <Text style={styles.summaryCardTitle}>Total Earnings</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(analyticsData?.earnings?.totalEarnings || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {analyticsData?.earnings?.totalRides || 0} rides
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.successCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[600]} />
                <Text style={styles.summaryCardTitle}>Success Rate</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {formatPercentage(analyticsData?.bidding?.successRate || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {analyticsData?.bidding?.acceptedBids || 0}/{analyticsData?.bidding?.totalBids || 0} bids
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.reliabilityCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.warning[600]} />
                <Text style={styles.summaryCardTitle}>Reliability</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {analyticsData?.reliability?.currentScore || 0}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {formatPercentage(analyticsData?.reliability?.acceptanceRate || 0)} acceptance
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.averageCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="trending-up" size={20} color={COLORS.info[600]} />
                <Text style={styles.summaryCardTitle}>Avg per Ride</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(analyticsData?.earnings?.averageEarningsPerRide || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                Per completed ride
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {analyticsData?.insights && analyticsData.insights.length > 0 && (
          <InsightsCard insights={analyticsData.insights} />
        )}

        {/* Recommendations */}
        {analyticsData?.recommendations && analyticsData.recommendations.length > 0 && (
          <RecommendationsCard recommendations={analyticsData.recommendations} />
        )}

        {/* Earnings Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Earnings Trend</Text>
          <EarningsChart 
            data={analyticsData?.earnings?.dailyEarnings || []}
            timeRange={selectedTimeRange}
          />
        </View>

        {/* Time Block Performance */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Performance by Time Block</Text>
          <TimeBlockPerformance 
            data={analyticsData?.earnings?.timeBlockEarnings || {}}
            bidData={analyticsData?.bidding?.timeBlockPerformance || {}}
          />
        </View>

        {/* Bid Success Rate */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Bid Success Analysis</Text>
          <BidSuccessRate 
            data={analyticsData?.bidding?.bidAmountAnalysis || {}}
            successRate={analyticsData?.bidding?.successRate || 0}
          />
        </View>

        {/* Reliability Score */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Reliability Metrics</Text>
          <ReliabilityScore 
            data={analyticsData?.reliability || {}}
            trends={analyticsData?.performance?.trends || {}}
          />
        </View>

        {/* Market Comparison */}
        {analyticsData?.market && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Market Comparison</Text>
            <MarketComparison 
              data={analyticsData.market}
              driverEarnings={analyticsData.earnings}
            />
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  refreshButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
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
  earningsCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success[500],
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
  },
  reliabilityCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning[500],
  },
  averageCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info[500],
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
  chartContainer: {
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
  bottomSpacing: {
    height: 20,
  },
});

export default AnalyticsDashboard;
