/**
 * 🧠 DEMAND FORECASTING DASHBOARD
 * 
 * Advanced AI-powered demand forecasting dashboard showing:
 * - Ride demand prediction by location and time
 * - Event-based demand forecasting
 * - Weather impact analysis on demand
 * - Seasonal pattern recognition
 * - Demand hotspots and trends
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
import demandForecastingService from '../../services/ai/demandForecastingService';

const { width } = Dimensions.get('window');

const DemandForecastingDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('demand');
  const [forecastData, setForecastData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeDemandForecasting();
  }, []);

  const initializeDemandForecasting = async () => {
    try {
      setLoading(true);
      
      // Initialize the demand forecasting service
      const initialized = await demandForecastingService.initialize(user?.uid);
      
      if (initialized) {
        await loadForecastData();
      } else {
        Alert.alert('Demand Forecasting Unavailable', 'Demand forecasting is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize demand forecasting:', error);
      Alert.alert('Error', 'Failed to load demand forecasting data');
    } finally {
      setLoading(false);
    }
  };

  const loadForecastData = async () => {
    try {
      const dashboardData = await demandForecastingService.getDemandForecastingDashboard(
        { lat: 40.7128, lng: -74.0060 }, // Default NYC location
        '24h'
      );
      setForecastData(dashboardData);
    } catch (error) {
      console.error('❌ Failed to load forecast data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadForecastData();
    setRefreshing(false);
  };

  const renderDemandTab = () => {
    const { demandForecast } = forecastData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.demandScoreCard}>
          <LinearGradient
            colors={getDemandScoreColors(demandForecast?.totalDemand || 0)}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.scoreTitle}>Demand Forecast</Text>
            </View>
            <Text style={styles.scoreValue}>
              {Math.round(demandForecast?.totalDemand || 0)}%
            </Text>
            <Text style={styles.scoreLevel}>
              {getDemandLevel(demandForecast?.totalDemand || 0)}
            </Text>
            <Text style={styles.scoreConfidence}>
              Confidence: {Math.round((demandForecast?.confidence || 0) * 100)}%
            </Text>
          </LinearGradient>
        </View>

        {demandForecast?.timeFactors && (
          <View style={styles.factorsCard}>
            <Text style={styles.cardTitle}>Time Factors</Text>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Rush Hour:</Text>
              <Text style={styles.factorValue}>{demandForecast.timeFactors.rushHour ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Weekend:</Text>
              <Text style={styles.factorValue}>{demandForecast.timeFactors.weekend ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Night Time:</Text>
              <Text style={styles.factorValue}>{demandForecast.timeFactors.nightTime ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Multiplier:</Text>
              <Text style={styles.factorValue}>{demandForecast.timeFactors.multiplier?.toFixed(2)}x</Text>
            </View>
          </View>
        )}

        {demandForecast?.locationFactors && (
          <View style={styles.factorsCard}>
            <Text style={styles.cardTitle}>Location Factors</Text>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Business District:</Text>
              <Text style={styles.factorValue}>{demandForecast.locationFactors.businessDistrict ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Residential:</Text>
              <Text style={styles.factorValue}>{demandForecast.locationFactors.residential ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Tourist Area:</Text>
              <Text style={styles.factorValue}>{demandForecast.locationFactors.touristArea ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Transport Hub:</Text>
              <Text style={styles.factorValue}>{demandForecast.locationFactors.transportHub ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Multiplier:</Text>
              <Text style={styles.factorValue}>{demandForecast.locationFactors.multiplier?.toFixed(2)}x</Text>
            </View>
          </View>
        )}

        {demandForecast?.recommendations && demandForecast.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Demand Recommendations</Text>
            {demandForecast.recommendations.map((rec, index) => (
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

  const renderEventsTab = () => {
    const { eventForecast } = forecastData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.eventsOverviewCard}>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="calendar" size={24} color="white" />
              <Text style={styles.overviewTitle}>Event Forecast</Text>
            </View>
            <Text style={styles.overviewScore}>
              {eventForecast?.events?.length || 0} Events
            </Text>
            <Text style={styles.overviewSubtext}>
              Impact: {Math.round((eventForecast?.totalEventImpact || 0) * 100)}%
            </Text>
          </LinearGradient>
        </View>

        {eventForecast?.events && eventForecast.events.length > 0 ? (
          eventForecast.events.map((event, index) => (
            <View key={event.event || index} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.event}</Text>
                <View style={[
                  styles.eventTypeBadge,
                  { backgroundColor: getEventTypeColor(event.type) }
                ]}>
                  <Text style={styles.eventTypeText}>{event.type}</Text>
                </View>
              </View>
              
              <View style={styles.eventDetails}>
                <View style={styles.eventDetail}>
                  <Ionicons name="people" size={16} color="#2196F3" />
                  <Text style={styles.eventDetailText}>{event.attendees} attendees</Text>
                </View>
                <View style={styles.eventDetail}>
                  <Ionicons name="time" size={16} color="#2196F3" />
                  <Text style={styles.eventDetailText}>{event.duration}</Text>
                </View>
                <View style={styles.eventDetail}>
                  <Ionicons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={styles.eventDetailText}>
                    {Math.round(event.impact * 100)}% impact
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noEventsCard}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.noEventsText}>No events detected</Text>
            <Text style={styles.noEventsSubtext}>Normal demand patterns expected</Text>
          </View>
        )}

        {eventForecast?.recommendations && eventForecast.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Event Recommendations</Text>
            {eventForecast.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec.recommendation}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWeatherTab = () => {
    const { weatherForecast } = forecastData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.weatherCard}>
          <LinearGradient
            colors={getWeatherColors(weatherForecast?.condition || 'clear')}
            style={styles.weatherGradient}
          >
            <View style={styles.weatherHeader}>
              <Ionicons name={getWeatherIcon(weatherForecast?.condition || 'clear')} size={24} color="white" />
              <Text style={styles.weatherTitle}>Weather Impact</Text>
            </View>
            <Text style={styles.weatherCondition}>
              {weatherForecast?.condition || 'Clear'}
            </Text>
            <Text style={styles.weatherTemp}>
              {weatherForecast?.temperature || 72}°F
            </Text>
            <Text style={styles.weatherMultiplier}>
              Demand Multiplier: {weatherForecast?.demandMultiplier?.toFixed(2)}x
            </Text>
          </LinearGradient>
        </View>

        {weatherForecast?.impactFactors && (
          <View style={styles.weatherFactorsCard}>
            <Text style={styles.cardTitle}>Weather Factors</Text>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Precipitation:</Text>
              <Text style={styles.factorValue}>{weatherForecast.impactFactors.precipitation || 0}%</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Wind Speed:</Text>
              <Text style={styles.factorValue}>{weatherForecast.impactFactors.windSpeed || 0} mph</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Visibility:</Text>
              <Text style={styles.factorValue}>{weatherForecast.impactFactors.visibility || 'Good'}</Text>
            </View>
          </View>
        )}

        {weatherForecast?.recommendations && weatherForecast.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Weather Recommendations</Text>
            {weatherForecast.recommendations.map((rec, index) => (
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

  const renderHotspotsTab = () => {
    const { hotspots } = forecastData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.hotspotsOverviewCard}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="location" size={24} color="white" />
              <Text style={styles.overviewTitle}>Demand Hotspots</Text>
            </View>
            <Text style={styles.overviewScore}>
              {hotspots?.totalHotspots || 0} Hotspots
            </Text>
            <Text style={styles.overviewSubtext}>
              {hotspots?.highDemandHotspots || 0} high-demand areas
            </Text>
          </LinearGradient>
        </View>

        {hotspots?.hotspots && hotspots.hotspots.length > 0 ? (
          hotspots.hotspots.map((hotspot, index) => (
            <View key={hotspot.id} style={styles.hotspotCard}>
              <View style={styles.hotspotHeader}>
                <Text style={styles.hotspotName}>{hotspot.name}</Text>
                <View style={[
                  styles.demandLevelBadge,
                  { backgroundColor: getDemandLevelColor(hotspot.demandLevel) }
                ]}>
                  <Text style={styles.demandLevelText}>{hotspot.demandLevel}</Text>
                </View>
              </View>
              
              <View style={styles.hotspotDetails}>
                <View style={styles.hotspotDetail}>
                  <Ionicons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={styles.hotspotDetailText}>
                    {Math.round(hotspot.demandScore * 100)}% demand
                  </Text>
                </View>
                <View style={styles.hotspotDetail}>
                  <Ionicons name="time" size={16} color="#2196F3" />
                  <Text style={styles.hotspotDetailText}>
                    Peak: {hotspot.peakTimes?.join(', ')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.hotspotFactors}>
                <Text style={styles.factorsTitle}>Factors:</Text>
                {hotspot.factors?.map((factor, factorIndex) => (
                  <Text key={factorIndex} style={styles.factorText}>• {factor}</Text>
                ))}
              </View>
              
              <View style={styles.hotspotRecommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {hotspot.recommendations?.map((rec, recIndex) => (
                  <Text key={recIndex} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noHotspotsCard}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.noHotspotsText}>No hotspots detected</Text>
            <Text style={styles.noHotspotsSubtext}>Demand is evenly distributed</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demand':
        return renderDemandTab();
      case 'events':
        return renderEventsTab();
      case 'weather':
        return renderWeatherTab();
      case 'hotspots':
        return renderHotspotsTab();
      default:
        return renderDemandTab();
    }
  };

  // Helper functions
  const getDemandScoreColors = (score) => {
    if (score >= 80) return ['#4CAF50', '#45a049'];
    if (score >= 60) return ['#FF9800', '#F57C00'];
    if (score >= 40) return ['#FF5722', '#E64A19'];
    return ['#F44336', '#D32F2F'];
  };

  const getDemandLevel = (score) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'concert': '#9C27B0',
      'sports': '#FF5722',
      'conference': '#2196F3',
      'festival': '#FF9800',
      'wedding': '#E91E63',
      'graduation': '#4CAF50'
    };
    return colors[type] || '#666';
  };

  const getWeatherColors = (condition) => {
    const colors = {
      'clear': ['#4CAF50', '#45a049'],
      'cloudy': ['#9E9E9E', '#757575'],
      'rain': ['#2196F3', '#1976D2'],
      'snow': ['#E3F2FD', '#BBDEFB'],
      'storm': ['#424242', '#212121'],
      'fog': ['#BDBDBD', '#9E9E9E']
    };
    return colors[condition] || ['#4CAF50', '#45a049'];
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      'clear': 'sunny',
      'cloudy': 'cloudy',
      'rain': 'rainy',
      'snow': 'snow',
      'storm': 'thunderstorm',
      'fog': 'cloudy'
    };
    return icons[condition] || 'sunny';
  };

  const getDemandLevelColor = (level) => {
    const colors = {
      'Very High': '#4CAF50',
      'High': '#8BC34A',
      'Medium': '#FF9800',
      'Low': '#FF5722',
      'Very Low': '#F44336'
    };
    return colors[level] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Demand Forecast...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Demand Forecasting</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'demand', label: 'Demand', icon: 'trending-up' },
            { id: 'events', label: 'Events', icon: 'calendar' },
            { id: 'weather', label: 'Weather', icon: 'cloudy' },
            { id: 'hotspots', label: 'Hotspots', icon: 'location' }
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
  // Demand Score Card
  demandScoreCard: {
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
  // Factors Cards
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
  // Events Overview
  eventsOverviewCard: {
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
  // Event Cards
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  eventTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  // No Events Card
  noEventsCard: {
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
  noEventsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  // Weather Card
  weatherCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  weatherGradient: {
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  weatherCondition: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  weatherMultiplier: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Weather Factors Card
  weatherFactorsCard: {
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
  // Hotspots Overview
  hotspotsOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Hotspot Cards
  hotspotCard: {
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
  hotspotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotspotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  demandLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  demandLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hotspotDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  hotspotDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotspotDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  hotspotFactors: {
    marginBottom: 8,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  factorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  hotspotRecommendations: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  // No Hotspots Card
  noHotspotsCard: {
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
  noHotspotsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noHotspotsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default DemandForecastingDashboard;
