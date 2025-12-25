/**
 * 🧠 ADVANCED ROUTE OPTIMIZATION DASHBOARD
 * 
 * Advanced AI-powered route optimization dashboard showing:
 * - Multi-factor route planning with traffic, fuel, earnings optimization
 * - Real-time traffic integration and dynamic route adjustments
 * - Multi-stop optimization for efficient sequencing
 * - Fuel-efficient routing and consumption optimization
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
import routeOptimizationService from '../../services/ai/routeOptimizationService';

const { width } = Dimensions.get('window');

const RouteOptimizationDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('optimization');
  const [routeData, setRouteData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeRouteOptimization();
  }, []);

  const initializeRouteOptimization = async () => {
    try {
      setLoading(true);
      
      // Initialize the route optimization service
      const initialized = await routeOptimizationService.initialize(user?.uid);
      
      if (initialized) {
        await loadRouteData();
      } else {
        Alert.alert('Route Optimization Unavailable', 'Route optimization is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize route optimization:', error);
      Alert.alert('Error', 'Failed to load route optimization data');
    } finally {
      setLoading(false);
    }
  };

  const loadRouteData = async () => {
    try {
      const dashboardData = await routeOptimizationService.getRouteOptimizationDashboard(
        { lat: 40.7128, lng: -74.0060 }, // Default NYC origin
        { lat: 40.7589, lng: -73.9851 }  // Default NYC destination
      );
      setRouteData(dashboardData);
    } catch (error) {
      console.error('❌ Failed to load route data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRouteData();
    setRefreshing(false);
  };

  const renderOptimizationTab = () => {
    const { optimalRoute } = routeData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.optimizationCard}>
          <LinearGradient
            colors={getOptimizationColors(optimalRoute?.totalScore || 0)}
            style={styles.optimizationGradient}
          >
            <View style={styles.optimizationHeader}>
              <Ionicons name="navigate" size={24} color="white" />
              <Text style={styles.optimizationTitle}>Route Optimization</Text>
            </View>
            <Text style={styles.optimizationScore}>
              {Math.round(optimalRoute?.totalScore || 0)}%
            </Text>
            <Text style={styles.optimizationLevel}>
              {getOptimizationLevel(optimalRoute?.totalScore || 0)}
            </Text>
            <Text style={styles.optimizationDistance}>
              {optimalRoute?.distance?.toFixed(1) || '0.0'} miles
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.routeDetailsCard}>
          <Text style={styles.cardTitle}>Route Details</Text>
          
          <View style={styles.routeDetailRow}>
            <Text style={styles.routeDetailLabel}>Distance</Text>
            <Text style={styles.routeDetailValue}>{optimalRoute?.distance?.toFixed(1) || '0.0'} miles</Text>
          </View>
          
          <View style={styles.routeDetailRow}>
            <Text style={styles.routeDetailLabel}>Duration</Text>
            <Text style={styles.routeDetailValue}>{Math.round(optimalRoute?.duration || 0)} minutes</Text>
          </View>
          
          <View style={styles.routeDetailRow}>
            <Text style={styles.routeDetailLabel}>Traffic Optimized</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: optimalRoute?.trafficOptimized ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{optimalRoute?.trafficOptimized ? 'Yes' : 'No'}</Text>
            </View>
          </View>
          
          <View style={styles.routeDetailRow}>
            <Text style={styles.routeDetailLabel}>Fuel Optimized</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: optimalRoute?.fuelOptimized ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{optimalRoute?.fuelOptimized ? 'Yes' : 'No'}</Text>
            </View>
          </View>
          
          <View style={styles.routeDetailRow}>
            <Text style={styles.routeDetailLabel}>Earnings Optimized</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: optimalRoute?.earningsOptimized ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{optimalRoute?.earningsOptimized ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {optimalRoute?.recommendations && optimalRoute.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Route Recommendations</Text>
            {optimalRoute.recommendations.map((rec, index) => (
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

  const renderTrafficTab = () => {
    const { trafficRoute } = routeData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.trafficCard}>
          <LinearGradient
            colors={getTrafficColors(trafficRoute?.trafficLevel || 'normal')}
            style={styles.trafficGradient}
          >
            <View style={styles.trafficHeader}>
              <Ionicons name="traffic" size={24} color="white" />
              <Text style={styles.trafficTitle}>Traffic Optimization</Text>
            </View>
            <Text style={styles.trafficLevel}>
              {trafficRoute?.trafficLevel || 'Normal'}
            </Text>
            <Text style={styles.trafficScore}>
              Score: {Math.round(trafficRoute?.trafficScore || 0)}%
            </Text>
            <Text style={styles.trafficDuration}>
              {Math.round(trafficRoute?.duration || 0)} minutes
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.trafficDetailsCard}>
          <Text style={styles.cardTitle}>Traffic Details</Text>
          
          <View style={styles.trafficDetailRow}>
            <Text style={styles.trafficDetailLabel}>Traffic Level</Text>
            <View style={[
              styles.trafficLevelBadge,
              { backgroundColor: getTrafficLevelColor(trafficRoute?.trafficLevel) }
            ]}>
              <Text style={styles.trafficLevelText}>{trafficRoute?.trafficLevel || 'Normal'}</Text>
            </View>
          </View>
          
          <View style={styles.trafficDetailRow}>
            <Text style={styles.trafficDetailLabel}>Congestion</Text>
            <Text style={styles.trafficDetailValue}>{trafficRoute?.congestion || 0}%</Text>
          </View>
          
          <View style={styles.trafficDetailRow}>
            <Text style={styles.trafficDetailLabel}>Optimized</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: trafficRoute?.trafficAdjusted ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{trafficRoute?.trafficAdjusted ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {trafficRoute?.trafficRecommendations && trafficRoute.trafficRecommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Traffic Recommendations</Text>
            {trafficRoute.trafficRecommendations.map((rec, index) => (
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

  const renderFuelTab = () => {
    const { fuelRoute } = routeData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.fuelCard}>
          <LinearGradient
            colors={getFuelColors(fuelRoute?.fuelEfficiency || 0)}
            style={styles.fuelGradient}
          >
            <View style={styles.fuelHeader}>
              <Ionicons name="car" size={24} color="white" />
              <Text style={styles.fuelTitle}>Fuel Optimization</Text>
            </View>
            <Text style={styles.fuelEfficiency}>
              {Math.round(fuelRoute?.fuelEfficiency || 0)}%
            </Text>
            <Text style={styles.fuelSavings}>
              {fuelRoute?.fuelSavings?.toFixed(1) || '0.0'}% Savings
            </Text>
            <Text style={styles.fuelDistance}>
              {fuelRoute?.distance?.toFixed(1) || '0.0'} miles
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.fuelDetailsCard}>
          <Text style={styles.cardTitle}>Fuel Details</Text>
          
          <View style={styles.fuelDetailRow}>
            <Text style={styles.fuelDetailLabel}>Efficiency</Text>
            <Text style={styles.fuelDetailValue}>{Math.round(fuelRoute?.fuelEfficiency || 0)}%</Text>
          </View>
          
          <View style={styles.fuelDetailRow}>
            <Text style={styles.fuelDetailLabel}>Savings</Text>
            <Text style={styles.fuelDetailValue}>{fuelRoute?.fuelSavings?.toFixed(1) || '0.0'}%</Text>
          </View>
          
          <View style={styles.fuelDetailRow}>
            <Text style={styles.fuelDetailLabel}>Optimized</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: fuelRoute?.fuelOptimized ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{fuelRoute?.fuelOptimized ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {fuelRoute?.recommendations && fuelRoute.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Fuel Recommendations</Text>
            {fuelRoute.recommendations.map((rec, index) => (
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

  const renderAlternativesTab = () => {
    const { alternatives } = routeData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.alternativesOverviewCard}>
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="map" size={24} color="white" />
              <Text style={styles.overviewTitle}>Alternative Routes</Text>
            </View>
            <Text style={styles.overviewScore}>
              {alternatives?.alternatives?.length || 0} Options
            </Text>
            <Text style={styles.overviewSubtext}>
              Multiple route alternatives available
            </Text>
          </LinearGradient>
        </View>

        {alternatives?.alternatives && alternatives.alternatives.length > 0 ? (
          alternatives.alternatives.map((alternative, index) => (
            <View key={alternative.id} style={styles.alternativeCard}>
              <View style={styles.alternativeHeader}>
                <Text style={styles.alternativeName}>{alternative.name}</Text>
                <View style={[
                  styles.alternativeScoreBadge,
                  { backgroundColor: getScoreColor(alternative.score) }
                ]}>
                  <Text style={styles.alternativeScoreText}>{Math.round(alternative.score)}%</Text>
                </View>
              </View>
              
              <View style={styles.alternativeDetails}>
                <View style={styles.alternativeDetail}>
                  <Ionicons name="speedometer" size={16} color="#2196F3" />
                  <Text style={styles.alternativeDetailText}>
                    Speed: {Math.round(alternative.tradeoffs?.speed || 0)}%
                  </Text>
                </View>
                <View style={styles.alternativeDetail}>
                  <Ionicons name="resize" size={16} color="#4CAF50" />
                  <Text style={styles.alternativeDetailText}>
                    Distance: {Math.round(alternative.tradeoffs?.distance || 0)}%
                  </Text>
                </View>
                <View style={styles.alternativeDetail}>
                  <Ionicons name="car" size={16} color="#FF9800" />
                  <Text style={styles.alternativeDetailText}>
                    Fuel: {Math.round(alternative.tradeoffs?.fuel || 0)}%
                  </Text>
                </View>
                <View style={styles.alternativeDetail}>
                  <Ionicons name="eye" size={16} color="#9C27B0" />
                  <Text style={styles.alternativeDetailText}>
                    Scenery: {Math.round(alternative.tradeoffs?.scenery || 0)}%
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noAlternativesCard}>
            <Ionicons name="map-outline" size={48} color="#ccc" />
            <Text style={styles.noAlternativesText}>No alternatives available</Text>
            <Text style={styles.noAlternativesSubtext}>Single route option</Text>
          </View>
        )}

        {alternatives?.recommendations && alternatives.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Route Recommendations</Text>
            {alternatives.recommendations.map((rec, index) => (
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
      case 'optimization':
        return renderOptimizationTab();
      case 'traffic':
        return renderTrafficTab();
      case 'fuel':
        return renderFuelTab();
      case 'alternatives':
        return renderAlternativesTab();
      default:
        return renderOptimizationTab();
    }
  };

  // Helper functions
  const getOptimizationColors = (score) => {
    if (score >= 80) return ['#4CAF50', '#45a049'];
    if (score >= 60) return ['#FF9800', '#F57C00'];
    if (score >= 40) return ['#FF5722', '#E64A19'];
    return ['#F44336', '#D32F2F'];
  };

  const getOptimizationLevel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getTrafficColors = (level) => {
    const colors = {
      'light': ['#4CAF50', '#45a049'],
      'normal': ['#2196F3', '#1976D2'],
      'heavy': ['#FF9800', '#F57C00'],
      'severe': ['#F44336', '#D32F2F']
    };
    return colors[level] || ['#2196F3', '#1976D2'];
  };

  const getTrafficLevelColor = (level) => {
    const colors = {
      'light': '#4CAF50',
      'normal': '#2196F3',
      'heavy': '#FF9800',
      'severe': '#F44336'
    };
    return colors[level] || '#666';
  };

  const getFuelColors = (efficiency) => {
    if (efficiency >= 80) return ['#4CAF50', '#45a049'];
    if (efficiency >= 60) return ['#8BC34A', '#689F38'];
    if (efficiency >= 40) return ['#FFC107', '#FFA000'];
    return ['#FF9800', '#F57C00'];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    return '#FF9800';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Route Optimization...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Route Optimization</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'optimization', label: 'Optimization', icon: 'navigate' },
            { id: 'traffic', label: 'Traffic', icon: 'traffic' },
            { id: 'fuel', label: 'Fuel', icon: 'car' },
            { id: 'alternatives', label: 'Alternatives', icon: 'map' }
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
  // Optimization Card
  optimizationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optimizationGradient: {
    padding: 20,
  },
  optimizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optimizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  optimizationScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  optimizationLevel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  optimizationDistance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Route Details Card
  routeDetailsCard: {
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
  routeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  routeDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  routeDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  // Traffic Card
  trafficCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trafficGradient: {
    padding: 20,
  },
  trafficHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trafficTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  trafficLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  trafficScore: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  trafficDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Traffic Details Card
  trafficDetailsCard: {
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
  trafficDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trafficDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  trafficDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  trafficLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trafficLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Fuel Card
  fuelCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fuelGradient: {
    padding: 20,
  },
  fuelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fuelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  fuelEfficiency: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  fuelSavings: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  fuelDistance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Fuel Details Card
  fuelDetailsCard: {
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
  fuelDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fuelDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  fuelDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Alternatives Overview
  alternativesOverviewCard: {
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
  // Alternative Cards
  alternativeCard: {
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
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  alternativeScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  alternativeScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alternativeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  alternativeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alternativeDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  // No Alternatives Card
  noAlternativesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noAlternativesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noAlternativesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default RouteOptimizationDashboard;
