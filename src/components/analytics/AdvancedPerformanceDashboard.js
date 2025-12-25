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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import advancedPerformanceAnalyticsService from '../../services/advancedPerformanceAnalyticsService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AdvancedPerformanceDashboard = ({ driverId, onClose, visible = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [peerComparison, setPeerComparison] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'analytics' },
    { id: 'trends', title: 'Trends', icon: 'trending-up' },
    { id: 'goals', title: 'Goals', icon: 'flag' },
    { id: 'peers', title: 'Peers', icon: 'people' },
    { id: 'predictions', title: 'Predictions', icon: 'star' },
    { id: 'insights', title: 'Insights', icon: 'bulb' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadPerformanceData();
    }
  }, [visible, driverId]);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all performance data in parallel
      const [scoreData, trendsData, goalsData, peerData, predictionsData, insightsData] = await Promise.all([
        advancedPerformanceAnalyticsService.calculateDriverScore(driverId),
        advancedPerformanceAnalyticsService.getPerformanceTrends(driverId),
        advancedPerformanceAnalyticsService.getDriverGoals(driverId),
        advancedPerformanceAnalyticsService.getPeerComparison(driverId),
        advancedPerformanceAnalyticsService.generatePredictions(driverId),
        advancedPerformanceAnalyticsService.generateActionableInsights(driverId)
      ]);

      setPerformanceData({
        score: scoreData,
        trends: trendsData
      });
      setGoals(goalsData);
      setPeerComparison(peerData);
      setPredictions(predictionsData);
      setInsights(insightsData);

    } catch (error) {
      console.error('Error loading performance data:', error);
      setError('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPerformanceData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Overall Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Overall Performance Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{performanceData?.score?.overall || 0}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Earnings</Text>
            <Text style={styles.scoreItemValue}>{performanceData?.score?.earnings?.score || 0}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Safety</Text>
            <Text style={styles.scoreItemValue}>{performanceData?.score?.safety?.score || 0}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Reliability</Text>
            <Text style={styles.scoreItemValue}>{performanceData?.score?.reliability?.score || 0}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Efficiency</Text>
            <Text style={styles.scoreItemValue}>{performanceData?.score?.efficiency?.score || 0}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.success[600]} />
          <Text style={styles.statValue}>+5.2%</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color={COLORS.warning[600]} />
          <Text style={styles.statValue}>85th</Text>
          <Text style={styles.statLabel}>Percentile</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flag" size={24} color={COLORS.primary[600]} />
          <Text style={styles.statValue}>3/5</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bulb" size={24} color={COLORS.info[600]} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Insights</Text>
        </View>
      </View>

      {/* Recent Achievements */}
      <View style={styles.achievementsCard}>
        <Text style={styles.cardTitle}>Recent Achievements</Text>
        <View style={styles.achievementList}>
          <View style={styles.achievementItem}>
            <Ionicons name="medal" size={20} color={COLORS.warning[600]} />
            <Text style={styles.achievementText}>Perfect Safety Week</Text>
            <Text style={styles.achievementDate}>2 days ago</Text>
          </View>
          <View style={styles.achievementItem}>
            <Ionicons name="trending-up" size={20} color={COLORS.success[600]} />
            <Text style={styles.achievementText}>Earnings Goal Met</Text>
            <Text style={styles.achievementDate}>1 week ago</Text>
          </View>
          <View style={styles.achievementItem}>
            <Ionicons name="star" size={20} color={COLORS.primary[600]} />
            <Text style={styles.achievementText}>Top 10% Driver</Text>
            <Text style={styles.achievementDate}>2 weeks ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTrendsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Performance Trends</Text>
      
      {/* Trend Charts Placeholder */}
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={48} color={COLORS.gray[400]} />
        <Text style={styles.chartPlaceholderText}>Performance Charts</Text>
        <Text style={styles.chartPlaceholderSubtext}>Visual trend analysis coming soon</Text>
      </View>

      {/* Trend Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.cardTitle}>Trend Insights</Text>
        <View style={styles.insightList}>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
            <Text style={styles.insightText}>Earnings up 12% this month</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-down" size={16} color={COLORS.error[600]} />
            <Text style={styles.insightText}>Efficiency down 3% this week</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
            <Text style={styles.insightText}>Safety score improving</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGoalsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.goalsHeader}>
        <Text style={styles.sectionTitle}>Your Goals</Text>
        <TouchableOpacity style={styles.addGoalButton}>
          <Ionicons name="add" size={20} color={COLORS.primary[600]} />
          <Text style={styles.addGoalText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      <View style={styles.goalsList}>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Monthly Earnings Target</Text>
            <Text style={styles.goalStatus}>Active</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>75% Complete</Text>
          </View>
          <Text style={styles.goalDescription}>Target: $3,000 | Current: $2,250</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Safety Score Improvement</Text>
            <Text style={styles.goalStatus}>Active</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.progressText}>60% Complete</Text>
          </View>
          <Text style={styles.goalDescription}>Target: 95+ | Current: 92</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Fuel Efficiency Goal</Text>
            <Text style={[styles.goalStatus, { color: COLORS.success[600] }]}>Completed</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>100% Complete</Text>
          </View>
          <Text style={styles.goalDescription}>Target: 30 MPG | Achieved: 32 MPG</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderPeersTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Peer Comparison</Text>
      
      {/* Percentile Ranking */}
      <View style={styles.percentileCard}>
        <Text style={styles.percentileTitle}>Your Ranking</Text>
        <View style={styles.percentileContainer}>
          <Text style={styles.percentileValue}>85th</Text>
          <Text style={styles.percentileLabel}>Percentile</Text>
        </View>
        <Text style={styles.percentileDescription}>
          You're performing better than 85% of drivers in your area
        </Text>
      </View>

      {/* Comparison Metrics */}
      <View style={styles.comparisonCard}>
        <Text style={styles.cardTitle}>Performance vs. Peers</Text>
        <View style={styles.comparisonList}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Earnings</Text>
            <View style={styles.comparisonBar}>
              <View style={[styles.comparisonFill, { width: '85%' }]} />
            </View>
            <Text style={styles.comparisonValue}>+15%</Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Safety</Text>
            <View style={styles.comparisonBar}>
              <View style={[styles.comparisonFill, { width: '92%' }]} />
            </View>
            <Text style={styles.comparisonValue}>+8%</Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Reliability</Text>
            <View style={styles.comparisonBar}>
              <View style={[styles.comparisonFill, { width: '78%' }]} />
            </View>
            <Text style={styles.comparisonValue}>+5%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPredictionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Performance Predictions</Text>
      
      {/* Prediction Cards */}
      <View style={styles.predictionCard}>
        <Text style={styles.predictionTitle}>Next 30 Days</Text>
        <View style={styles.predictionGrid}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Earnings</Text>
            <Text style={styles.predictionValue}>$2,800</Text>
            <Text style={styles.predictionConfidence}>85% confidence</Text>
          </View>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Safety Score</Text>
            <Text style={styles.predictionValue}>96</Text>
            <Text style={styles.predictionConfidence}>90% confidence</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>AI Recommendations</Text>
        <View style={styles.recommendationList}>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.recommendationText}>Focus on peak hours (7-9 AM, 5-7 PM) for higher earnings</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.info[600]} />
            <Text style={styles.recommendationText}>Consider fuel-efficient routes to improve efficiency score</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.success[600]} />
            <Text style={styles.recommendationText}>Your safety performance is excellent - maintain current practices</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Actionable Insights</Text>
      
      {/* High Priority Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>High Priority</Text>
        <View style={styles.insightList}>
          <View style={styles.insightItem}>
            <Ionicons name="warning" size={16} color={COLORS.error[600]} />
            <Text style={styles.insightText}>Efficiency score declining - review route optimization</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
            <Text style={styles.insightText}>Earnings opportunity: Weekend shifts show 20% higher rates</Text>
          </View>
        </View>
      </View>

      {/* Medium Priority Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Medium Priority</Text>
        <View style={styles.insightList}>
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.insightText}>Consider updating vehicle maintenance schedule</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color={COLORS.info[600]} />
            <Text style={styles.insightText}>Reliability score could improve with better time management</Text>
          </View>
        </View>
      </View>

      {/* Low Priority Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Low Priority</Text>
        <View style={styles.insightList}>
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color={COLORS.gray[600]} />
            <Text style={styles.insightText}>Consider joining driver community for tips</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'trends': return renderTrendsTab();
      case 'goals': return renderGoalsTab();
      case 'peers': return renderPeersTab();
      case 'predictions': return renderPredictionsTab();
      case 'insights': return renderInsightsTab();
      default: return renderOverviewTab();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Analytics</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? COLORS.primary[600] : COLORS.secondary[600]}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary[600]} />
              <Text style={styles.loadingText}>Loading performance data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadPerformanceData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.tabContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary[600]]}
                />
              }
            >
              {renderTabContent()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  refreshButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error[600],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  scoreLabel: {
    fontSize: 24,
    color: COLORS.secondary[600],
    marginLeft: 4,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  scoreItemValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginRight: '4%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  achievementsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  achievementList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 12,
  },
  achievementDate: {
    fontSize: 12,
    color: COLORS.secondary[500],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  chartPlaceholder: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[700],
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.secondary[500],
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 12,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addGoalText: {
    fontSize: 14,
    color: COLORS.primary[600],
    marginLeft: 4,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  goalStatus: {
    fontSize: 12,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  goalProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[600],
  },
  progressText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  percentileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  percentileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  percentileContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  percentileValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  percentileLabel: {
    fontSize: 18,
    color: COLORS.secondary[600],
    marginLeft: 4,
  },
  percentileDescription: {
    fontSize: 14,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  comparisonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  comparisonList: {
    gap: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonLabel: {
    width: 80,
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  comparisonBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  comparisonFill: {
    height: '100%',
    backgroundColor: COLORS.primary[600],
  },
  comparisonValue: {
    width: 50,
    fontSize: 14,
    color: COLORS.success[600],
    textAlign: 'right',
    fontWeight: '600',
  },
  predictionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  predictionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  predictionItem: {
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  predictionConfidence: {
    fontSize: 10,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  recommendationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
});

export default AdvancedPerformanceDashboard;
