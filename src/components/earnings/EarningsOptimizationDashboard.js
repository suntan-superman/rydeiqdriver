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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import earningsOptimizationService from '../../services/earningsOptimizationService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EarningsOptimizationDashboard = ({ driverId, onClose, visible = false }) => {
  const [optimizationData, setOptimizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  const timeRangeOptions = [
    { value: '7d', label: '7 Days', icon: 'calendar-outline' },
    { value: '30d', label: '30 Days', icon: 'calendar' },
    { value: '90d', label: '90 Days', icon: 'calendar-sharp' },
  ];

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'analytics' },
    { id: 'recommendations', title: 'Recommendations', icon: 'bulb' },
    { id: 'forecast', title: 'Forecast', icon: 'trending-up' },
    { id: 'goals', title: 'Goals', icon: 'flag' },
    { id: 'market', title: 'Market', icon: 'bar-chart' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadOptimizationData();
    }
  }, [visible, driverId, selectedTimeRange]);

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await earningsOptimizationService.getEarningsOptimizationAnalysis(selectedTimeRange);
      setOptimizationData(data);
    } catch (error) {
      console.error('Error loading optimization data:', error);
      setError('Failed to load earnings optimization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOptimizationData();
    setIsRefreshing(false);
  };

  const handleTimeRangeChange = (timeRange) => {
    setSelectedTimeRange(timeRange);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.error[600];
      case 'medium': return COLORS.warning[600];
      case 'low': return COLORS.success[600];
      default: return COLORS.gray[600];
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return COLORS.success[600];
      case 'medium': return COLORS.warning[600];
      case 'low': return COLORS.error[600];
      default: return COLORS.gray[600];
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Earnings Optimization</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.id ? 'white' : COLORS.gray[600]} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
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
        {isLoading && !optimizationData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading optimization data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
            <Text style={styles.errorTitle}>Failed to Load Data</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOptimizationData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : optimizationData ? (
          <>
            {activeTab === 'overview' && (
              <View style={styles.overviewContainer}>
                {/* Performance Metrics */}
                <View style={styles.metricsContainer}>
                  <Text style={styles.sectionTitle}>Performance Metrics</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>
                        {formatPercentage(optimizationData.performanceMetrics?.efficiency || 0)}
                      </Text>
                      <Text style={styles.metricLabel}>Efficiency</Text>
                      <Text style={styles.metricSubtext}>Earnings per hour</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>
                        {formatPercentage(optimizationData.performanceMetrics?.profitability || 0)}
                      </Text>
                      <Text style={styles.metricLabel}>Profitability</Text>
                      <Text style={styles.metricSubtext}>Profit margin</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>
                        {formatPercentage(optimizationData.performanceMetrics?.consistency || 0)}
                      </Text>
                      <Text style={styles.metricLabel}>Consistency</Text>
                      <Text style={styles.metricSubtext}>Earnings stability</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>
                        {formatPercentage(optimizationData.performanceMetrics?.growth || 0)}
                      </Text>
                      <Text style={styles.metricLabel}>Growth</Text>
                      <Text style={styles.metricSubtext}>Earnings trend</Text>
                    </View>
                  </View>

                  <View style={styles.overallScoreCard}>
                    <Text style={styles.overallScoreLabel}>Overall Performance</Text>
                    <Text style={[
                      styles.overallScoreValue,
                      { color: getConfidenceColor(optimizationData.performanceMetrics?.overall > 75 ? 'high' : optimizationData.performanceMetrics?.overall > 50 ? 'medium' : 'low') }
                    ]}>
                      {formatPercentage(optimizationData.performanceMetrics?.overall || 0)}
                    </Text>
                  </View>
                </View>

                {/* Current Earnings Summary */}
                <View style={styles.earningsSummaryCard}>
                  <Text style={styles.sectionTitle}>Current Earnings</Text>
                  
                  <View style={styles.earningsRow}>
                    <View style={styles.earningsItem}>
                      <Text style={styles.earningsValue}>
                        {formatCurrency(optimizationData.currentEarnings?.totalEarnings || 0)}
                      </Text>
                      <Text style={styles.earningsLabel}>Total Earnings</Text>
                    </View>

                    <View style={styles.earningsItem}>
                      <Text style={styles.earningsValue}>
                        {formatCurrency(optimizationData.currentEarnings?.averageEarningsPerHour || 0)}
                      </Text>
                      <Text style={styles.earningsLabel}>Per Hour</Text>
                    </View>
                  </View>

                  <View style={styles.earningsRow}>
                    <View style={styles.earningsItem}>
                      <Text style={styles.earningsValue}>
                        {optimizationData.currentEarnings?.totalRides || 0}
                      </Text>
                      <Text style={styles.earningsLabel}>Total Rides</Text>
                    </View>

                    <View style={styles.earningsItem}>
                      <Text style={styles.earningsValue}>
                        {formatCurrency(optimizationData.currentEarnings?.averageEarningsPerRide || 0)}
                      </Text>
                      <Text style={styles.earningsLabel}>Per Ride</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'recommendations' && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
                
                {optimizationData.optimizationRecommendations?.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={64} color={COLORS.success[500]} />
                    <Text style={styles.emptyTitle}>All Optimized!</Text>
                    <Text style={styles.emptyText}>
                      Your earnings are already optimized. Keep up the great work!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.recommendationsList}>
                    {optimizationData.optimizationRecommendations?.map((recommendation, index) => (
                      <View key={index} style={styles.recommendationCard}>
                        <View style={styles.recommendationHeader}>
                          <View style={styles.recommendationInfo}>
                            <Ionicons 
                              name={getPriorityIcon(recommendation.priority)} 
                              size={20} 
                              color={getPriorityColor(recommendation.priority)} 
                            />
                            <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                          </View>
                          
                          <View style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(recommendation.priority) }
                          ]}>
                            <Text style={styles.priorityText}>{recommendation.priority}</Text>
                          </View>
                        </View>

                        <Text style={styles.recommendationDescription}>
                          {recommendation.description}
                        </Text>

                        <Text style={styles.recommendationAction}>
                          💡 {recommendation.action}
                        </Text>

                        {recommendation.potentialImpact && (
                          <View style={styles.impactContainer}>
                            <Text style={styles.impactLabel}>Potential Impact:</Text>
                            <Text style={[
                              styles.impactValue,
                              { color: getPriorityColor(recommendation.potentialImpact) }
                            ]}>
                              {recommendation.potentialImpact.toUpperCase()}
                            </Text>
                          </View>
                        )}

                        {recommendation.estimatedIncrease && (
                          <View style={styles.increaseContainer}>
                            <Text style={styles.increaseLabel}>Estimated Increase:</Text>
                            <Text style={styles.increaseValue}>
                              {recommendation.estimatedIncrease}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'forecast' && (
              <View style={styles.forecastContainer}>
                <Text style={styles.sectionTitle}>Earnings Forecast</Text>
                
                <View style={styles.forecastCard}>
                  <View style={styles.forecastHeader}>
                    <Text style={styles.forecastTitle}>Projected Earnings</Text>
                    <View style={[
                      styles.confidenceBadge,
                      { backgroundColor: getConfidenceColor(optimizationData.earningsForecast?.confidence) }
                    ]}>
                      <Text style={styles.confidenceText}>
                        {optimizationData.earningsForecast?.confidence?.toUpperCase()} CONFIDENCE
                      </Text>
                    </View>
                  </View>

                  <View style={styles.forecastPeriods}>
                    <View style={styles.forecastPeriod}>
                      <Text style={styles.forecastPeriodLabel}>Next Week</Text>
                      <Text style={styles.forecastPeriodValue}>
                        {formatCurrency(optimizationData.earningsForecast?.nextWeek || 0)}
                      </Text>
                    </View>

                    <View style={styles.forecastPeriod}>
                      <Text style={styles.forecastPeriodLabel}>Next Month</Text>
                      <Text style={styles.forecastPeriodValue}>
                        {formatCurrency(optimizationData.earningsForecast?.nextMonth || 0)}
                      </Text>
                    </View>

                    <View style={styles.forecastPeriod}>
                      <Text style={styles.forecastPeriodLabel}>Next Quarter</Text>
                      <Text style={styles.forecastPeriodValue}>
                        {formatCurrency(optimizationData.earningsForecast?.nextQuarter || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Scenario Analysis */}
                <View style={styles.scenariosCard}>
                  <Text style={styles.scenariosTitle}>Scenario Analysis</Text>
                  
                  <View style={styles.scenarioItem}>
                    <View style={styles.scenarioHeader}>
                      <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
                      <Text style={styles.scenarioLabel}>Optimistic</Text>
                    </View>
                    <Text style={styles.scenarioValue}>
                      {formatCurrency(optimizationData.earningsForecast?.scenarios?.optimistic || 0)}
                    </Text>
                  </View>

                  <View style={styles.scenarioItem}>
                    <View style={styles.scenarioHeader}>
                      <Ionicons name="trending-up" size={16} color={COLORS.primary[600]} />
                      <Text style={styles.scenarioLabel}>Realistic</Text>
                    </View>
                    <Text style={styles.scenarioValue}>
                      {formatCurrency(optimizationData.earningsForecast?.scenarios?.realistic || 0)}
                    </Text>
                  </View>

                  <View style={styles.scenarioItem}>
                    <View style={styles.scenarioHeader}>
                      <Ionicons name="trending-down" size={16} color={COLORS.warning[600]} />
                      <Text style={styles.scenarioLabel}>Pessimistic</Text>
                    </View>
                    <Text style={styles.scenarioValue}>
                      {formatCurrency(optimizationData.earningsForecast?.scenarios?.pessimistic || 0)}
                    </Text>
                  </View>
                </View>

                {/* Forecast Factors */}
                {optimizationData.earningsForecast?.factors?.length > 0 && (
                  <View style={styles.factorsCard}>
                    <Text style={styles.factorsTitle}>Forecast Factors</Text>
                    {optimizationData.earningsForecast.factors.map((factor, index) => (
                      <View key={index} style={styles.factorItem}>
                        <Ionicons name="information-circle" size={16} color={COLORS.info[600]} />
                        <Text style={styles.factorText}>{factor}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'goals' && (
              <View style={styles.goalsContainer}>
                <Text style={styles.sectionTitle}>Earnings Goals</Text>
                
                {optimizationData.goalTracking?.activeGoals?.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="flag-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>No Active Goals</Text>
                    <Text style={styles.emptyText}>
                      Set earnings goals to track your progress and stay motivated
                    </Text>
                  </View>
                ) : (
                  <View style={styles.goalsList}>
                    {optimizationData.goalTracking?.activeGoals?.map((goal, index) => (
                      <View key={index} style={styles.goalCard}>
                        <View style={styles.goalHeader}>
                          <Text style={styles.goalTitle}>{goal.name}</Text>
                          <Text style={styles.goalTarget}>
                            {formatCurrency(goal.targetAmount)}
                          </Text>
                        </View>

                        <View style={styles.goalProgress}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { width: `${Math.min(goal.progress, 100)}%` }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {formatPercentage(goal.progress)}
                          </Text>
                        </View>

                        <View style={styles.goalDetails}>
                          <Text style={styles.goalRemaining}>
                            Remaining: {formatCurrency(goal.remaining)}
                          </Text>
                          <View style={[
                            styles.goalStatus,
                            { backgroundColor: goal.onTrack ? COLORS.success[100] : COLORS.warning[100] }
                          ]}>
                            <Text style={[
                              styles.goalStatusText,
                              { color: goal.onTrack ? COLORS.success[700] : COLORS.warning[700] }
                            ]}>
                              {goal.onTrack ? 'On Track' : 'Behind'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'market' && (
              <View style={styles.marketContainer}>
                <Text style={styles.sectionTitle}>Market Analysis</Text>
                
                {/* Demand Trends */}
                <View style={styles.marketCard}>
                  <Text style={styles.marketCardTitle}>Demand Trends</Text>
                  
                  <View style={styles.demandSection}>
                    <Text style={styles.demandLabel}>Peak Hours</Text>
                    <Text style={styles.demandValue}>
                      {optimizationData.marketAnalysis?.demandTrends?.peakHours?.join(', ') || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.demandSection}>
                    <Text style={styles.demandLabel}>Average Demand</Text>
                    <Text style={styles.demandValue}>
                      {optimizationData.marketAnalysis?.demandTrends?.averageDemand?.toFixed(1) || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Pricing Insights */}
                <View style={styles.marketCard}>
                  <Text style={styles.marketCardTitle}>Pricing Insights</Text>
                  
                  <View style={styles.pricingSection}>
                    <Text style={styles.pricingLabel}>Market Average Rate</Text>
                    <Text style={styles.pricingValue}>
                      {formatCurrency(optimizationData.marketAnalysis?.pricingInsights?.averageMarketRate || 0)}
                    </Text>
                  </View>

                  {optimizationData.marketAnalysis?.pricingInsights?.pricingTrends?.direction && (
                    <View style={styles.pricingSection}>
                      <Text style={styles.pricingLabel}>Pricing Trend</Text>
                      <View style={styles.trendContainer}>
                        <Ionicons 
                          name={optimizationData.marketAnalysis.pricingInsights.pricingTrends.direction === 'increasing' ? 'trending-up' : 'trending-down'} 
                          size={16} 
                          color={optimizationData.marketAnalysis.pricingInsights.pricingTrends.direction === 'increasing' ? COLORS.success[600] : COLORS.error[600]} 
                        />
                        <Text style={[
                          styles.trendText,
                          { color: optimizationData.marketAnalysis.pricingInsights.pricingTrends.direction === 'increasing' ? COLORS.success[600] : COLORS.error[600] }
                        ]}>
                          {optimizationData.marketAnalysis.pricingInsights.pricingTrends.direction} 
                          ({formatPercentage(optimizationData.marketAnalysis.pricingInsights.pricingTrends.percentage || 0)})
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Surge Opportunities */}
                <View style={styles.marketCard}>
                  <Text style={styles.marketCardTitle}>Surge Opportunities</Text>
                  
                  <View style={styles.surgeSection}>
                    <Text style={styles.surgeLabel}>Surge Frequency</Text>
                    <Text style={styles.surgeValue}>
                      {formatPercentage((optimizationData.marketAnalysis?.surgeOpportunities?.surgeFrequency || 0) * 100)}
                    </Text>
                  </View>

                  <View style={styles.surgeSection}>
                    <Text style={styles.surgeLabel}>Average Surge Multiplier</Text>
                    <Text style={styles.surgeValue}>
                      {optimizationData.marketAnalysis?.surgeOpportunities?.averageSurgeMultiplier?.toFixed(1)}x
                    </Text>
                  </View>
                </View>

                {/* Market Recommendations */}
                {optimizationData.marketAnalysis?.marketRecommendations?.length > 0 && (
                  <View style={styles.recommendationsCard}>
                    <Text style={styles.recommendationsCardTitle}>Market Recommendations</Text>
                    {optimizationData.marketAnalysis.marketRecommendations.map((recommendation, index) => (
                      <View key={index} style={styles.marketRecommendationItem}>
                        <Ionicons name="bulb" size={16} color={COLORS.primary[600]} />
                        <Text style={styles.marketRecommendationText}>{recommendation}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
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
  timeRangeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary[600],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  overviewContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  metricsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  overallScoreCard: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  overallScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  overallScoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  earningsSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  recommendationsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 12,
    color: COLORS.primary[600],
    fontStyle: 'italic',
    marginBottom: 8,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  impactValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  increaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  increaseLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  increaseValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success[600],
  },
  forecastContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  forecastCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  forecastPeriods: {
    gap: 12,
  },
  forecastPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  forecastPeriodLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  forecastPeriodValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  scenariosCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenariosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scenarioLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  scenarioValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  factorsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  factorText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  goalTarget: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[600],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
    textAlign: 'center',
  },
  goalDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalRemaining: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  goalStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  marketContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  marketCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  demandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  demandLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  demandValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  surgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  surgeLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  surgeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  marketRecommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  marketRecommendationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EarningsOptimizationDashboard;
