/**
 * 🧠 DYNAMIC PRICING DASHBOARD
 * 
 * Advanced AI-powered dynamic pricing dashboard showing:
 * - Intelligent rate optimization based on demand, weather, events
 * - Competitive pricing analysis and market positioning
 * - Surge pricing intelligence and optimization
 * - Revenue optimization and earnings maximization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import dynamicPricingService from '../../services/ai/dynamicPricingService';

const { width } = Dimensions.get('window');

const DynamicPricingDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pricing');
  const [pricingData, setPricingData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeDynamicPricing();
  }, []);

  const initializeDynamicPricing = async () => {
    try {
      setLoading(true);
      
      // Initialize the dynamic pricing service
      const initialized = await dynamicPricingService.initialize(user?.uid);
      
      if (initialized) {
        await loadPricingData();
      } else {
        Alert.alert('Dynamic Pricing Unavailable', 'Dynamic pricing is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize dynamic pricing:', error);
      Alert.alert('Error', 'Failed to load dynamic pricing data');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingData = async () => {
    try {
      const dashboardData = await dynamicPricingService.getDynamicPricingDashboard(
        { lat: 40.7128, lng: -74.0060 }, // Default NYC location
        '24h'
      );
      setPricingData(dashboardData);
    } catch (error) {
      console.error('❌ Failed to load pricing data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPricingData();
    setRefreshing(false);
  };

  const renderPricingTab = () => {
    const { optimalPricing } = pricingData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.pricingScoreCard}>
          <LinearGradient
            colors={getPricingScoreColors(optimalPricing?.optimalRate || 0)}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Ionicons name="cash" size={24} color="white" />
              <Text style={styles.scoreTitle}>Optimal Pricing</Text>
            </View>
            <Text style={styles.scoreValue}>
              ${optimalPricing?.optimalRate?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.scoreLevel}>
              {getPricingLevel(optimalPricing?.optimalRate || 0)}
            </Text>
            <Text style={styles.scoreConfidence}>
              Confidence: {Math.round((optimalPricing?.confidence || 0) * 100)}%
            </Text>
          </LinearGradient>
        </View>

        {optimalPricing?.multipliers && (
          <View style={styles.multipliersCard}>
            <Text style={styles.cardTitle}>Pricing Multipliers</Text>
            {Object.entries(optimalPricing.multipliers).map(([factor, multiplier]) => (
              <View key={factor} style={styles.multiplierRow}>
                <Text style={styles.multiplierLabel}>{factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                <View style={styles.multiplierValueContainer}>
                  <Text style={styles.multiplierValue}>{multiplier?.toFixed(2)}x</Text>
                  <View style={[
                    styles.multiplierIndicator,
                    { backgroundColor: getMultiplierColor(multiplier) }
                  ]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {optimalPricing?.factors && (
          <View style={styles.factorsCard}>
            <Text style={styles.cardTitle}>Pricing Factors</Text>
            
            {optimalPricing.factors.location && (
              <View style={styles.factorSection}>
                <Text style={styles.factorSectionTitle}>Location</Text>
                {Object.entries(optimalPricing.factors.location).map(([key, value]) => (
                  <View key={key} style={styles.factorRow}>
                    <Text style={styles.factorLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                    <Text style={styles.factorValue}>{value ? 'Yes' : 'No'}</Text>
                  </View>
                ))}
              </View>
            )}

            {optimalPricing.factors.time && (
              <View style={styles.factorSection}>
                <Text style={styles.factorSectionTitle}>Time</Text>
                {Object.entries(optimalPricing.factors.time).map(([key, value]) => (
                  <View key={key} style={styles.factorRow}>
                    <Text style={styles.factorLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                    <Text style={styles.factorValue}>{value ? 'Yes' : 'No'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {optimalPricing?.recommendations && optimalPricing.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Pricing Recommendations</Text>
            {optimalPricing.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCompetitiveTab = () => {
    const { competitivePricing } = pricingData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.competitiveOverviewCard}>
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="trophy" size={24} color="white" />
              <Text style={styles.overviewTitle}>Competitive Analysis</Text>
            </View>
            <Text style={styles.overviewScore}>
              ${competitivePricing?.averageCompetitorRate?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.overviewSubtext}>
              {competitivePricing?.marketPosition || 'Unknown'} Position
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.competitiveMetricsCard}>
          <Text style={styles.cardTitle}>Market Metrics</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Competitor Rate</Text>
            <Text style={styles.metricValue}>${competitivePricing?.averageCompetitorRate?.toFixed(2) || '0.00'}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Market Position</Text>
            <View style={[
              styles.positionBadge,
              { backgroundColor: getPositionColor(competitivePricing?.marketPosition) }
            ]}>
              <Text style={styles.positionText}>{competitivePricing?.marketPosition || 'Unknown'}</Text>
            </View>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Competitive Advantage</Text>
            <Text style={[
              styles.advantageText,
              { color: (competitivePricing?.competitiveAdvantage || 0) >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {competitivePricing?.competitiveAdvantage > 0 ? '+' : ''}{competitivePricing?.competitiveAdvantage?.toFixed(1) || '0.0'}%
            </Text>
          </View>
        </View>

        {competitivePricing?.pricingGaps && competitivePricing.pricingGaps.length > 0 && (
          <View style={styles.gapsCard}>
            <Text style={styles.cardTitle}>Pricing Opportunities</Text>
            {competitivePricing.pricingGaps.map((gap, index) => (
              <View key={index} style={styles.gapItem}>
                <Ionicons name="trending-up" size={16} color="#4CAF50" />
                <Text style={styles.gapText}>{gap}</Text>
              </View>
            ))}
          </View>
        )}

        {competitivePricing?.recommendations && competitivePricing.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Competitive Recommendations</Text>
            {competitivePricing.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSurgeTab = () => {
    const { surgePricing } = pricingData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.surgeCard}>
          <LinearGradient
            colors={getSurgeColors(surgePricing?.surgeMultiplier || 1.0)}
            style={styles.surgeGradient}
          >
            <View style={styles.surgeHeader}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.surgeTitle}>Surge Pricing</Text>
            </View>
            <Text style={styles.surgeMultiplier}>
              {surgePricing?.surgeMultiplier?.toFixed(2) || '1.00'}x
            </Text>
            <Text style={styles.surgeRate}>
              ${surgePricing?.surgeRate?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.surgePercentage}>
              {surgePricing?.surgePercentage || 0}% Surge
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.surgeDetailsCard}>
          <Text style={styles.cardTitle}>Surge Details</Text>
          
          <View style={styles.surgeDetailRow}>
            <Text style={styles.surgeDetailLabel}>Demand Level</Text>
            <View style={[
              styles.demandLevelBadge,
              { backgroundColor: getDemandLevelColor(surgePricing?.demandLevel) }
            ]}>
              <Text style={styles.demandLevelText}>{surgePricing?.demandLevel || 'Medium'}</Text>
            </View>
          </View>
          
          <View style={styles.surgeDetailRow}>
            <Text style={styles.surgeDetailLabel}>Duration</Text>
            <Text style={styles.surgeDetailValue}>{surgePricing?.duration || '1 hour'}</Text>
          </View>
          
          <View style={styles.surgeDetailRow}>
            <Text style={styles.surgeDetailLabel}>Surge Rate</Text>
            <Text style={styles.surgeDetailValue}>${surgePricing?.surgeRate?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {surgePricing?.recommendations && surgePricing.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Surge Recommendations</Text>
            {surgePricing.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRevenueTab = () => {
    const { revenueOptimization } = pricingData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.revenueOverviewCard}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.overviewTitle}>Revenue Optimization</Text>
            </View>
            <Text style={styles.overviewScore}>
              +{revenueOptimization?.earningsIncrease?.percentage || 0}%
            </Text>
            <Text style={styles.overviewSubtext}>
              Potential Earnings Increase
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.earningsComparisonCard}>
          <Text style={styles.cardTitle}>Earnings Comparison</Text>
          
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Current Hourly</Text>
            <Text style={styles.earningsValue}>${revenueOptimization?.currentEarnings?.hourly?.toFixed(2) || '0.00'}</Text>
          </View>
          
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Optimized Hourly</Text>
            <Text style={[styles.earningsValue, { color: '#4CAF50' }]}>
              ${revenueOptimization?.optimizedEarnings?.hourly?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Increase</Text>
            <Text style={[styles.earningsValue, { color: '#4CAF50' }]}>
              +${revenueOptimization?.earningsIncrease?.hourly?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {revenueOptimization?.optimizationStrategies && revenueOptimization.optimizationStrategies.length > 0 && (
          <View style={styles.strategiesCard}>
            <Text style={styles.cardTitle}>Optimization Strategies</Text>
            {revenueOptimization.optimizationStrategies.map((strategy, index) => (
              <View key={index} style={styles.strategyCard}>
                <View style={styles.strategyHeader}>
                  <Text style={styles.strategyName}>{strategy.strategy}</Text>
                  <View style={[
                    styles.strategyImpactBadge,
                    { backgroundColor: getStrategyImpactColor(strategy.impact) }
                  ]}>
                    <Text style={styles.strategyImpactText}>{strategy.impact}</Text>
                  </View>
                </View>
                <Text style={styles.strategyDescription}>{strategy.description}</Text>
                <View style={styles.strategyEffort}>
                  <Ionicons name="time" size={16} color="#2196F3" />
                  <Text style={styles.strategyEffortText}>Effort: {strategy.effort}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {revenueOptimization?.recommendations && revenueOptimization.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Revenue Recommendations</Text>
            {revenueOptimization.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pricing':
        return renderPricingTab();
      case 'competitive':
        return renderCompetitiveTab();
      case 'surge':
        return renderSurgeTab();
      case 'revenue':
        return renderRevenueTab();
      default:
        return renderPricingTab();
    }
  };

  // Helper functions
  const getPricingScoreColors = (rate) => {
    if (rate >= 4.0) return ['#4CAF50', '#45a049'];
    if (rate >= 3.0) return ['#FF9800', '#F57C00'];
    if (rate >= 2.0) return ['#FF5722', '#E64A19'];
    return ['#F44336', '#D32F2F'];
  };

  const getPricingLevel = (rate) => {
    if (rate >= 4.0) return 'Premium';
    if (rate >= 3.0) return 'High';
    if (rate >= 2.0) return 'Medium';
    return 'Low';
  };

  const getMultiplierColor = (multiplier) => {
    if (multiplier >= 1.5) return '#4CAF50';
    if (multiplier >= 1.2) return '#8BC34A';
    if (multiplier >= 1.0) return '#FFC107';
    if (multiplier >= 0.8) return '#FF9800';
    return '#F44336';
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'premium': return '#4CAF50';
      case 'competitive': return '#2196F3';
      case 'budget': return '#FF9800';
      default: return '#666';
    }
  };

  const getSurgeColors = (multiplier) => {
    if (multiplier >= 2.0) return ['#F44336', '#D32F2F'];
    if (multiplier >= 1.5) return ['#FF9800', '#F57C00'];
    if (multiplier >= 1.2) return ['#FFC107', '#FFA000'];
    return ['#4CAF50', '#45a049'];
  };

  const getDemandLevelColor = (level) => {
    const colors = {
      'very_high': '#F44336',
      'high': '#FF9800',
      'medium': '#FFC107',
      'low': '#8BC34A',
      'very_low': '#4CAF50'
    };
    return colors[level] || '#666';
  };

  const getStrategyImpactColor = (impact) => {
    switch (impact) {
      case 'Very High': return '#4CAF50';
      case 'High': return '#8BC34A';
      case 'Medium': return '#FFC107';
      case 'Low': return '#FF9800';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Dynamic Pricing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Dynamic Pricing</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'pricing', label: 'Pricing', icon: 'cash' },
            { id: 'competitive', label: 'Competitive', icon: 'trophy' },
            { id: 'surge', label: 'Surge', icon: 'trending-up' },
            { id: 'revenue', label: 'Revenue', icon: 'trending-up' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.id ? '#4CAF50' : '#666'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  // Pricing Score Card
  pricingScoreCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  scoreLevel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  scoreConfidence: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Multipliers Card
  multipliersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  multiplierLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  multiplierValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiplierValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  multiplierIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Factors Card
  factorsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  factorSection: {
    marginBottom: 12,
  },
  factorSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  factorLabel: {
    fontSize: 14,
    color: '#666',
  },
  factorValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Recommendations Card
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Competitive Overview
  competitiveOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  overviewScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Competitive Metrics Card
  competitiveMetricsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  advantageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Gaps Card
  gapsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gapText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Surge Card
  surgeCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  surgeGradient: {
    padding: 20,
  },
  surgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  surgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  surgeMultiplier: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  surgeRate: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  surgePercentage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Surge Details Card
  surgeDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  surgeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  surgeDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  surgeDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  demandLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demandLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Revenue Overview
  revenueOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Earnings Comparison Card
  earningsComparisonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Strategies Card
  strategiesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  strategyCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  strategyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  strategyImpactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  strategyImpactText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  strategyDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  strategyEffort: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyEffortText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default DynamicPricingDashboard;
