/**
 * 🧠 SMART RECOMMENDATIONS DASHBOARD
 * 
 * Industry-leading AI-powered recommendations dashboard showing:
 * - Route optimization suggestions
 * - Dynamic pricing recommendations
 * - Predictive maintenance alerts
 * - Personalized AI insights
 * - Market intelligence
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
import smartRecommendationsService from '../../services/ai/smartRecommendationsService';

const { width } = Dimensions.get('window');

const SmartRecommendationsDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');
  const [recommendationsData, setRecommendationsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeRecommendations();
  }, []);

  const initializeRecommendations = async () => {
    try {
      setLoading(true);
      
      // Initialize the AI service
      const initialized = await smartRecommendationsService.initialize(user?.uid);
      
      if (initialized) {
        await loadRecommendationsData();
      } else {
        Alert.alert('AI Service Unavailable', 'Smart recommendations are temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize recommendations:', error);
      Alert.alert('Error', 'Failed to load smart recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendationsData = async () => {
    try {
      const [personalized, route, pricing, maintenance, market] = await Promise.all([
        smartRecommendationsService.getPersonalizedRecommendations(),
        smartRecommendationsService.getRouteRecommendations(
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7589, lng: -73.9851 }
        ),
        smartRecommendationsService.getPricingRecommendations(
          { lat: 40.7128, lng: -74.0060 },
          new Date()
        ),
        smartRecommendationsService.getMaintenanceRecommendations('vehicle_123'),
        smartRecommendationsService.getMarketRecommendations(
          { lat: 40.7128, lng: -74.0060 },
          new Date()
        )
      ]);

      setRecommendationsData({
        personalized,
        route,
        pricing,
        maintenance,
        market
      });
    } catch (error) {
      console.error('❌ Failed to load recommendations data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendationsData();
    setRefreshing(false);
  };

  const handleRecommendationAction = async (recommendation, action) => {
    try {
      // Simulate action execution
      console.log(`🎯 Executing action: ${action} for recommendation: ${recommendation.title}`);
      
      // Learn from driver action
      await smartRecommendationsService.learnFromDriverAction(
        action,
        'positive', // Assume positive outcome for demo
        { recommendation: recommendation.title }
      );
      
      Alert.alert('Action Executed', `Applied: ${recommendation.title}`);
    } catch (error) {
      console.error('❌ Failed to execute action:', error);
      Alert.alert('Error', 'Failed to execute action');
    }
  };

  const renderPersonalizedTab = () => {
    const { personalized } = recommendationsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.insightsCard}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.insightsGradient}
          >
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb" size={24} color="white" />
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            <Text style={styles.personalizationScore}>
              Personalization: {Math.round(personalized?.personalizationScore || 0)}%
            </Text>
            <Text style={styles.confidenceLevel}>
              {Math.round((personalized?.confidence || 0) * 100)}% Confidence
            </Text>
          </LinearGradient>
        </View>

        {personalized?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIcon}>
                <Ionicons 
                  name={getRecommendationIcon(rec.type)} 
                  size={20} 
                  color={getRecommendationColor(rec.impact)} 
                />
              </View>
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDescription}>{rec.description}</Text>
              </View>
              <View style={[
                styles.impactBadge,
                { backgroundColor: getImpactColor(rec.impact) }
              ]}>
                <Text style={styles.impactText}>{rec.impact}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleRecommendationAction(rec, rec.action)}
            >
              <Text style={styles.actionText}>{rec.action}</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
            
            <View style={styles.confidenceBar}>
              <View style={styles.confidenceBarBg}>
                <View style={[
                  styles.confidenceBarFill,
                  { width: `${(rec.confidence || 0.5) * 100}%` }
                ]} />
              </View>
              <Text style={styles.confidenceText}>
                {Math.round((rec.confidence || 0.5) * 100)}% confidence
              </Text>
            </View>
          </View>
        ))}

        {personalized?.behaviorInsights && (
          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>Behavioral Insights</Text>
            {personalized.behaviorInsights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Ionicons name="analytics" size={16} color="#4CAF50" />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRouteTab = () => {
    const { route } = recommendationsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.routeHeader}>
          <Ionicons name="map" size={24} color="#2196F3" />
          <Text style={styles.routeTitle}>Route Optimization</Text>
        </View>

        {route?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeName}>{rec.name}</Text>
              <View style={styles.routeRank}>
                <Text style={styles.rankText}>#{rec.rank}</Text>
              </View>
            </View>
            
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{rec.distance} mi</Text>
                <Text style={styles.routeStatLabel}>Distance</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{rec.duration} min</Text>
                <Text style={styles.routeStatLabel}>Duration</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>${rec.earnings}</Text>
                <Text style={styles.routeStatLabel}>Earnings</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{rec.score}</Text>
                <Text style={styles.routeStatLabel}>Score</Text>
              </View>
            </View>

            <View style={styles.routeDetails}>
              <View style={styles.routeDetail}>
                <Ionicons name="car" size={16} color="#666" />
                <Text style={styles.routeDetailText}>Traffic: {rec.trafficLevel}</Text>
              </View>
              <View style={styles.routeDetail}>
                <Ionicons name="trending-up" size={16} color="#666" />
                <Text style={styles.routeDetailText}>Difficulty: {rec.difficulty}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.routeActionButton}
              onPress={() => handleRecommendationAction(rec, rec.recommendation.action)}
            >
              <Text style={styles.routeActionText}>{rec.recommendation.action}</Text>
              <Ionicons name="navigate" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        {route?.factors && (
          <View style={styles.factorsCard}>
            <Text style={styles.cardTitle}>Route Factors</Text>
            {route.factors.map((factor, index) => (
              <View key={index} style={styles.factorRow}>
                <Text style={styles.factorName}>{factor.factor}</Text>
                <Text style={styles.factorValue}>{factor.value}</Text>
                <View style={[
                  styles.factorImpact,
                  { backgroundColor: factor.impact === 'High' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.factorImpactText}>{factor.impact}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPricingTab = () => {
    const { pricing } = recommendationsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.pricingHeader}>
          <Ionicons name="trending-up" size={24} color="#FF9800" />
          <Text style={styles.pricingTitle}>Dynamic Pricing</Text>
        </View>

        {pricing?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.pricingCard}>
            <View style={styles.pricingCardHeader}>
              <Text style={styles.pricingTitle}>{rec.title}</Text>
              <View style={[
                styles.impactBadge,
                { backgroundColor: getImpactColor(rec.impact) }
              ]}>
                <Text style={styles.impactText}>{rec.impact}</Text>
              </View>
            </View>
            <Text style={styles.pricingDescription}>{rec.description}</Text>
            
            {rec.factors && (
              <View style={styles.pricingFactors}>
                {Object.entries(rec.factors).map(([key, value]) => (
                  <View key={key} style={styles.pricingFactor}>
                    <Text style={styles.pricingFactorLabel}>{key}:</Text>
                    <Text style={styles.pricingFactorValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.pricingActionButton}
              onPress={() => handleRecommendationAction(rec, rec.action)}
            >
              <Text style={styles.pricingActionText}>{rec.action}</Text>
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        {pricing?.marketAnalysis && (
          <View style={styles.marketAnalysisCard}>
            <Text style={styles.cardTitle}>Market Analysis</Text>
            <View style={styles.marketData}>
              <View style={styles.marketDataItem}>
                <Text style={styles.marketDataLabel}>Uber Price:</Text>
                <Text style={styles.marketDataValue}>${pricing.marketAnalysis.competitorPrices?.uber}</Text>
              </View>
              <View style={styles.marketDataItem}>
                <Text style={styles.marketDataLabel}>Lyft Price:</Text>
                <Text style={styles.marketDataValue}>${pricing.marketAnalysis.competitorPrices?.lyft}</Text>
              </View>
              <View style={styles.marketDataItem}>
                <Text style={styles.marketDataLabel}>Demand:</Text>
                <Text style={styles.marketDataValue}>{pricing.demandAnalysis?.demandLevel}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMaintenanceTab = () => {
    const { maintenance } = recommendationsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.maintenanceHeader}>
          <Ionicons name="construct" size={24} color="#9C27B0" />
          <Text style={styles.maintenanceTitle}>Vehicle Maintenance</Text>
        </View>

        <View style={styles.vehicleHealthCard}>
          <Text style={styles.healthTitle}>Vehicle Health</Text>
          <Text style={styles.healthScore}>{maintenance?.vehicleHealth || 0}%</Text>
          <View style={styles.healthBar}>
            <View style={[
              styles.healthBarFill,
              { width: `${maintenance?.vehicleHealth || 0}%` }
            ]} />
          </View>
        </View>

        {maintenance?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.maintenanceCard}>
            <View style={styles.maintenanceCardHeader}>
              <Text style={styles.maintenanceTitle}>{rec.title}</Text>
              <View style={[
                styles.urgencyBadge,
                { backgroundColor: getUrgencyColor(rec.urgency) }
              ]}>
                <Text style={styles.urgencyText}>{rec.urgency}</Text>
              </View>
            </View>
            <Text style={styles.maintenanceDescription}>{rec.description}</Text>
            
            <View style={styles.maintenanceDetails}>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.maintenanceDetailText}>{rec.timeframe}</Text>
              </View>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="card" size={16} color="#666" />
                <Text style={styles.maintenanceDetailText}>${rec.estimatedCost}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.maintenanceActionButton}
              onPress={() => handleRecommendationAction(rec, rec.action)}
            >
              <Text style={styles.maintenanceActionText}>{rec.action}</Text>
              <Ionicons name="calendar" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        {maintenance?.costEstimate && (
          <View style={styles.costEstimateCard}>
            <Text style={styles.costTitle}>Total Estimated Cost</Text>
            <Text style={styles.costAmount}>${maintenance.costEstimate}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMarketTab = () => {
    const { market } = recommendationsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.marketHeader}>
          <Ionicons name="trending-up" size={24} color="#E91E63" />
          <Text style={styles.marketTitle}>Market Intelligence</Text>
        </View>

        {market?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.marketCard}>
            <View style={styles.marketCardHeader}>
              <Text style={styles.marketTitle}>{rec.title}</Text>
              <View style={[
                styles.impactBadge,
                { backgroundColor: getImpactColor(rec.impact) }
              ]}>
                <Text style={styles.impactText}>{rec.impact}</Text>
              </View>
            </View>
            <Text style={styles.marketDescription}>{rec.description}</Text>
            
            <TouchableOpacity 
              style={styles.marketActionButton}
              onPress={() => handleRecommendationAction(rec, rec.action)}
            >
              <Text style={styles.marketActionText}>{rec.action}</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        {market?.opportunities && (
          <View style={styles.opportunitiesCard}>
            <Text style={styles.cardTitle}>Market Opportunities</Text>
            {market.opportunities.map((opportunity, index) => (
              <View key={index} style={styles.opportunityItem}>
                <Ionicons name="star" size={16} color="#FF9800" />
                <Text style={styles.opportunityText}>{opportunity.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personalized':
        return renderPersonalizedTab();
      case 'route':
        return renderRouteTab();
      case 'pricing':
        return renderPricingTab();
      case 'maintenance':
        return renderMaintenanceTab();
      case 'market':
        return renderMarketTab();
      default:
        return renderPersonalizedTab();
    }
  };

  // Helper functions
  const getRecommendationIcon = (type) => {
    const icons = {
      'behavioral': 'analytics',
      'goal': 'target',
      'route': 'map',
      'pricing': 'trending-up',
      'maintenance': 'construct',
      'market': 'trending-up',
      'general': 'bulb'
    };
    return icons[type] || 'bulb';
  };

  const getRecommendationColor = (impact) => {
    const colors = {
      'High': '#4CAF50',
      'Medium': '#FF9800',
      'Low': '#F44336'
    };
    return colors[impact] || '#666';
  };

  const getImpactColor = (impact) => {
    const colors = {
      'High': '#4CAF50',
      'Medium': '#FF9800',
      'Low': '#F44336'
    };
    return colors[impact] || '#666';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'High': '#F44336',
      'Medium': '#FF9800',
      'Low': '#4CAF50'
    };
    return colors[urgency] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading AI Recommendations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Smart Recommendations</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'personalized', label: 'AI Insights', icon: 'bulb' },
            { id: 'route', label: 'Routes', icon: 'map' },
            { id: 'pricing', label: 'Pricing', icon: 'trending-up' },
            { id: 'maintenance', label: 'Maintenance', icon: 'construct' },
            { id: 'market', label: 'Market', icon: 'analytics' }
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
  // Insights Card
  insightsCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  insightsGradient: {
    padding: 20,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  personalizationScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  confidenceLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Recommendation Cards
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  impactText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  confidenceBar: {
    marginTop: 12,
  },
  confidenceBarBg: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  // Route Cards
  routeCard: {
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeRank: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  routeDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  routeDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  routeActionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  routeActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Common styles
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Add more styles as needed...
});

export default SmartRecommendationsDashboard;
