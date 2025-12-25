/**
 * 🧠 PREDICTIVE ANALYTICS DASHBOARD
 * 
 * Industry-leading AI-powered dashboard showing:
 * - Earnings predictions with confidence levels
 * - Demand forecasting by location and time
 * - Optimal timing recommendations
 * - Weather impact analysis
 * - Smart AI recommendations
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import predictiveAnalyticsService from '../../services/ai/predictiveAnalyticsService';

const { width } = Dimensions.get('window');

const PredictiveAnalyticsDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earnings');
  const [analyticsData, setAnalyticsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);
      
      // Initialize the AI service
      const initialized = await predictiveAnalyticsService.initialize(user?.uid);
      
      if (initialized) {
        await loadAnalyticsData();
      } else {
        Alert.alert('AI Service Unavailable', 'Predictive analytics are temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
      Alert.alert('Error', 'Failed to load predictive analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const [earnings, demand, timing, weather, recommendations] = await Promise.all([
        predictiveAnalyticsService.predictEarnings('today'),
        predictiveAnalyticsService.predictDemand({ lat: 40.7128, lng: -74.0060 }, 'today'),
        predictiveAnalyticsService.getOptimalTiming('downtown', 7),
        predictiveAnalyticsService.getWeatherImpact({ lat: 40.7128, lng: -74.0060 }, 'today'),
        predictiveAnalyticsService.getSmartRecommendations(user?.uid)
      ]);

      setAnalyticsData({
        earnings,
        demand,
        timing,
        weather,
        recommendations
      });
    } catch (error) {
      console.error('❌ Failed to load analytics data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const renderEarningsTab = () => {
    const { earnings } = analyticsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.earningsCard}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.earningsGradient}
          >
            <View style={styles.earningsHeader}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.earningsTitle}>Today's Earnings Prediction</Text>
            </View>
            <Text style={styles.earningsAmount}>
              ${earnings?.predictedEarnings || 0}
            </Text>
            <Text style={styles.earningsConfidence}>
              {Math.round((earnings?.confidence || 0) * 100)}% Confidence
            </Text>
          </LinearGradient>
        </View>

        {earnings?.factors && (
          <View style={styles.factorsCard}>
            <Text style={styles.cardTitle}>Key Factors</Text>
            {earnings.factors.map((factor, index) => (
              <View key={index} style={styles.factorRow}>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorName}>{factor.factor}</Text>
                  <Text style={styles.factorValue}>{factor.value}</Text>
                </View>
                <View style={[
                  styles.impactBadge,
                  { backgroundColor: factor.impact === 'High' ? '#4CAF50' : factor.impact === 'Medium' ? '#FF9800' : '#F44336' }
                ]}>
                  <Text style={styles.impactText}>{factor.impact}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {earnings?.recommendations && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>AI Recommendations</Text>
            {earnings.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="bulb" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDemandTab = () => {
    const { demand } = analyticsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.demandCard}>
          <View style={styles.demandHeader}>
            <Ionicons name="location" size={24} color="#2196F3" />
            <Text style={styles.demandTitle}>Demand Forecast</Text>
          </View>
          <View style={styles.demandLevel}>
            <Text style={styles.demandLevelText}>{demand?.demandLevel || 'Medium'}</Text>
            <Text style={styles.demandConfidence}>
              {Math.round((demand?.confidence || 0) * 100)}% Confidence
            </Text>
          </View>
        </View>

        {demand?.peakHours && (
          <View style={styles.peakHoursCard}>
            <Text style={styles.cardTitle}>Peak Hours</Text>
            {demand.peakHours.map((hour, index) => (
              <View key={index} style={styles.peakHourItem}>
                <Ionicons name="time" size={16} color="#FF9800" />
                <Text style={styles.peakHourText}>{hour}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTimingTab = () => {
    const { timing } = analyticsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.timingCard}>
          <View style={styles.timingHeader}>
            <Ionicons name="calendar" size={24} color="#9C27B0" />
            <Text style={styles.timingTitle}>Optimal Timing</Text>
          </View>
          
          {timing?.bestDays && (
            <View style={styles.timingSection}>
              <Text style={styles.sectionTitle}>Best Days</Text>
              <View style={styles.daysContainer}>
                {timing.bestDays.map((day, index) => (
                  <View key={index} style={styles.dayBadge}>
                    <Text style={styles.dayText}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {timing?.bestHours && (
            <View style={styles.timingSection}>
              <Text style={styles.sectionTitle}>Best Hours</Text>
              {timing.bestHours.map((hour, index) => (
                <View key={index} style={styles.hourItem}>
                  <Ionicons name="clock" size={16} color="#4CAF50" />
                  <Text style={styles.hourText}>{hour}</Text>
                </View>
              ))}
            </View>
          )}

          {timing?.earningsPotential && (
            <View style={styles.earningsPotentialCard}>
              <Text style={styles.potentialTitle}>Earnings Potential</Text>
              <Text style={styles.potentialAmount}>{timing.earningsPotential}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderWeatherTab = () => {
    const { weather } = analyticsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Ionicons name="partly-sunny" size={24} color="#FF9800" />
            <Text style={styles.weatherTitle}>Weather Impact</Text>
          </View>
          
          <View style={styles.weatherLevel}>
            <Text style={styles.weatherLevelText}>{weather?.impactLevel || 'Medium'}</Text>
            <Text style={styles.weatherConfidence}>
              {Math.round((weather?.confidence || 0) * 100)}% Confidence
            </Text>
          </View>

          {weather?.weatherFactors && (
            <View style={styles.weatherFactors}>
              {weather.weatherFactors.map((factor, index) => (
                <View key={index} style={styles.weatherFactor}>
                  <Text style={styles.weatherFactorName}>{factor.factor}</Text>
                  <Text style={[
                    styles.weatherFactorValue,
                    { color: factor.impact === 'Positive' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {factor.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRecommendationsTab = () => {
    const { recommendations } = analyticsData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.recommendationsCard}>
          <View style={styles.recommendationsHeader}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
          </View>
          
          {recommendations?.recommendations?.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <View style={[
                  styles.impactBadge,
                  { backgroundColor: rec.impact === 'High' ? '#4CAF50' : rec.impact === 'Medium' ? '#FF9800' : '#F44336' }
                ]}>
                  <Text style={styles.impactText}>{rec.impact}</Text>
                </View>
              </View>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>{rec.action}</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'earnings':
        return renderEarningsTab();
      case 'demand':
        return renderDemandTab();
      case 'timing':
        return renderTimingTab();
      case 'weather':
        return renderWeatherTab();
      case 'recommendations':
        return renderRecommendationsTab();
      default:
        return renderEarningsTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading AI Analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>AI Analytics</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'earnings', label: 'Earnings', icon: 'trending-up' },
            { id: 'demand', label: 'Demand', icon: 'location' },
            { id: 'timing', label: 'Timing', icon: 'calendar' },
            { id: 'weather', label: 'Weather', icon: 'partly-sunny' },
            { id: 'recommendations', label: 'AI Tips', icon: 'bulb' }
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        
        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={20} color="#4CAF50" />
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>
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
  // Earnings Tab Styles
  earningsCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  earningsGradient: {
    padding: 20,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  earningsConfidence: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  factorsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    fontSize: 14,
    color: '#333',
  },
  factorValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Demand Tab Styles
  demandCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  demandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  demandLevel: {
    alignItems: 'center',
  },
  demandLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  demandConfidence: {
    fontSize: 14,
    color: '#666',
  },
  peakHoursCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  peakHourText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Timing Tab Styles
  timingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  timingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  timingSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  hourText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  earningsPotentialCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  potentialTitle: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  potentialAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // Weather Tab Styles
  weatherCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  weatherLevel: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  weatherConfidence: {
    fontSize: 14,
    color: '#666',
  },
  weatherFactors: {
    marginTop: 16,
  },
  weatherFactor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weatherFactorName: {
    fontSize: 14,
    color: '#333',
  },
  weatherFactorValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Recommendations Tab Styles
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  recommendationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Common Styles
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  refreshText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default PredictiveAnalyticsDashboard;
