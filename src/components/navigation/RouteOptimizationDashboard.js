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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import routeOptimizationService from '../../services/routeOptimizationService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RouteOptimizationDashboard = ({ driverId, onClose, visible = false, currentRoute: propCurrentRoute, alternativeRoutes: propAlternativeRoutes, rideData }) => {
  const [optimizationData, setOptimizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('routes');
  const [currentRoute, setCurrentRoute] = useState(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'routes', title: 'Routes', icon: 'map' },
    { id: 'traffic', title: 'Traffic', icon: 'car' },
    { id: 'multi-stop', title: 'Multi-Stop', icon: 'location' },
    { id: 'analytics', title: 'Analytics', icon: 'analytics' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      // Use props if provided, otherwise load data
      if (propCurrentRoute && propAlternativeRoutes) {
        setCurrentRoute(propCurrentRoute);
        setAlternativeRoutes(propAlternativeRoutes);
      } else {
        loadOptimizationData();
      }
    }
  }, [visible, driverId, propCurrentRoute, propAlternativeRoutes]);

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await routeOptimizationService.initialize(driverId);
      
      // Load current route if available
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        // Simulate a destination for demo
        const destination = {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01
        };
        
        const route = await routeOptimizationService.getOptimizedRoute(
          currentLocation, 
          destination
        );
        setCurrentRoute(route);
        
        // Get alternative routes
        const alternatives = await routeOptimizationService.getAlternativeRoutes(
          currentLocation, 
          destination, 
          route
        );
        setAlternativeRoutes(alternatives);
      }
      
      setOptimizationData({
        currentRoute,
        alternativeRoutes,
        trafficData: await getTrafficData(),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading optimization data:', error);
      setError('Failed to load route optimization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOptimizationData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setShowRouteDetails(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStartNavigation = (route) => {
    Alert.alert(
      'Start Navigation',
      `Start navigation using ${route.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startNavigation(route) }
      ]
    );
  };

  const startNavigation = (route) => {
    // In a real implementation, this would integrate with navigation apps
    Alert.alert('Navigation Started', `Starting navigation using ${route.name}`);
    setShowRouteDetails(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { getCurrentLocation } = await import('../../services/location');
      return await getCurrentLocation();
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const getTrafficData = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const destination = {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01
        };
        return await routeOptimizationService.getTrafficData(currentLocation, destination);
      }
      return null;
    } catch (error) {
      console.error('Error getting traffic data:', error);
      return null;
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (miles) => {
    return `${miles.toFixed(1)} mi`;
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const getRouteTypeColor = (type) => {
    const colors = {
      'fastest': COLORS.primary[600],
      'shortest': COLORS.success[600],
      'fuel-efficient': COLORS.info[600],
      'scenic': COLORS.purple[600],
      'multi-stop': COLORS.warning[600]
    };
    return colors[type] || COLORS.gray[600];
  };

  const getRouteTypeIcon = (type) => {
    const icons = {
      'fastest': 'flash',
      'shortest': 'resize',
      'fuel-efficient': 'leaf',
      'scenic': 'camera',
      'multi-stop': 'location'
    };
    return icons[type] || 'map';
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Route Optimization</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
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
            <Text style={styles.loadingText}>Loading route optimization...</Text>
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
            {activeTab === 'routes' && (
              <View style={styles.routesContainer}>
                {/* Current Route */}
                {currentRoute && (
                  <View style={styles.currentRouteContainer}>
                    <Text style={styles.sectionTitle}>Current Route</Text>
                    <TouchableOpacity 
                      style={styles.routeCard}
                      onPress={() => handleRouteSelect(currentRoute)}
                    >
                      <View style={styles.routeHeader}>
                        <View style={styles.routeInfo}>
                          <Ionicons 
                            name={getRouteTypeIcon(currentRoute.type)} 
                            size={20} 
                            color={getRouteTypeColor(currentRoute.type)} 
                          />
                          <Text style={styles.routeName}>{currentRoute.name}</Text>
                          <View style={[
                            styles.routeTypeBadge,
                            { backgroundColor: getRouteTypeColor(currentRoute.type) }
                          ]}>
                            <Text style={styles.routeTypeText}>{currentRoute.type}</Text>
                          </View>
                        </View>
                        <View style={styles.routeScore}>
                          <Text style={styles.scoreText}>{currentRoute.score?.toFixed(0) || 85}</Text>
                          <Text style={styles.scoreLabel}>Score</Text>
                        </View>
                      </View>

                      <View style={styles.routeMetrics}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>{formatTime(currentRoute.estimatedTime)}</Text>
                          <Text style={styles.metricLabel}>Time</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>{formatDistance(currentRoute.distance)}</Text>
                          <Text style={styles.metricLabel}>Distance</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>{formatCurrency(currentRoute.fuelCost)}</Text>
                          <Text style={styles.metricLabel}>Fuel Cost</Text>
                        </View>
                      </View>

                      <View style={styles.routeConditions}>
                        <View style={styles.conditionItem}>
                          <View style={[
                            styles.trafficIndicator,
                            { backgroundColor: currentRoute.trafficConditions.color }
                          ]} />
                          <Text style={styles.conditionText}>
                            {currentRoute.trafficConditions.description}
                          </Text>
                        </View>
                        {currentRoute.tolls > 0 && (
                          <View style={styles.conditionItem}>
                            <Ionicons name="card" size={16} color={COLORS.warning[600]} />
                            <Text style={styles.conditionText}>
                              Tolls: {formatCurrency(currentRoute.tolls)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Alternative Routes */}
                {alternativeRoutes.length > 0 && (
                  <View style={styles.alternativesContainer}>
                    <Text style={styles.sectionTitle}>Alternative Routes</Text>
                    {alternativeRoutes.map((route, index) => (
                      <TouchableOpacity 
                        key={route.id || index}
                        style={styles.alternativeRouteCard}
                        onPress={() => handleRouteSelect(route)}
                      >
                        <View style={styles.routeHeader}>
                          <View style={styles.routeInfo}>
                            <Ionicons 
                              name={getRouteTypeIcon(route.type)} 
                              size={16} 
                              color={getRouteTypeColor(route.type)} 
                            />
                            <Text style={styles.routeName}>{route.name}</Text>
                          </View>
                          <View style={styles.routeScore}>
                            <Text style={styles.scoreText}>{route.score?.toFixed(0) || 75}</Text>
                          </View>
                        </View>

                        <View style={styles.routeMetrics}>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{formatTime(route.estimatedTime)}</Text>
                            <Text style={styles.metricLabel}>Time</Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{formatDistance(route.distance)}</Text>
                            <Text style={styles.metricLabel}>Distance</Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{formatCurrency(route.fuelCost)}</Text>
                            <Text style={styles.metricLabel}>Fuel Cost</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'traffic' && (
              <View style={styles.trafficContainer}>
                <Text style={styles.sectionTitle}>Traffic Conditions</Text>
                
                {optimizationData.trafficData ? (
                  <View style={styles.trafficCard}>
                    <View style={styles.trafficHeader}>
                      <Text style={styles.trafficTitle}>Current Traffic</Text>
                      <Text style={styles.trafficLastUpdated}>
                        Updated {optimizationData.trafficData.lastUpdated.toLocaleTimeString()}
                      </Text>
                    </View>

                    <View style={styles.trafficMetrics}>
                      <View style={styles.trafficMetric}>
                        <Text style={styles.trafficMetricValue}>
                          {optimizationData.trafficData.congestionLevel.toFixed(1)}/4
                        </Text>
                        <Text style={styles.trafficMetricLabel}>Congestion Level</Text>
                      </View>
                      <View style={styles.trafficMetric}>
                        <Text style={styles.trafficMetricValue}>
                          {optimizationData.trafficData.averageSpeed.toFixed(0)} mph
                        </Text>
                        <Text style={styles.trafficMetricLabel}>Average Speed</Text>
                      </View>
                    </View>

                    {optimizationData.trafficData.incidents.length > 0 && (
                      <View style={styles.incidentsContainer}>
                        <Text style={styles.incidentsTitle}>Traffic Incidents</Text>
                        {optimizationData.trafficData.incidents.map((incident, index) => (
                          <View key={index} style={styles.incidentItem}>
                            <Ionicons 
                              name="warning" 
                              size={16} 
                              color={incident.severity === 'high' ? COLORS.error[600] : COLORS.warning[600]} 
                            />
                            <Text style={styles.incidentText}>
                              {incident.type} - {incident.description}
                            </Text>
                            <Text style={styles.incidentImpact}>
                              +{incident.impact.toFixed(0)}m delay
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="car-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>No Traffic Data</Text>
                    <Text style={styles.emptyText}>
                      Traffic data will appear when you have an active route
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'multi-stop' && (
              <View style={styles.multiStopContainer}>
                <Text style={styles.sectionTitle}>Multi-Stop Routes</Text>
                
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={64} color={COLORS.gray[400]} />
                  <Text style={styles.emptyTitle}>Multi-Stop Planning</Text>
                  <Text style={styles.emptyText}>
                    Plan optimized routes with multiple stops for maximum efficiency
                  </Text>
                  <TouchableOpacity style={styles.planRouteButton}>
                    <Text style={styles.planRouteButtonText}>Plan Multi-Stop Route</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'analytics' && (
              <View style={styles.analyticsContainer}>
                <Text style={styles.sectionTitle}>Route Analytics</Text>
                
                <View style={styles.emptyContainer}>
                  <Ionicons name="analytics-outline" size={64} color={COLORS.gray[400]} />
                  <Text style={styles.emptyTitle}>Route Performance</Text>
                  <Text style={styles.emptyText}>
                    Track your route efficiency and optimization over time
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'settings' && (
              <View style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>Route Settings</Text>
                
                <View style={styles.settingsCard}>
                  <Text style={styles.settingsTitle}>Optimization Preferences</Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Prefer Highways</Text>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Text style={styles.toggleText}>ON</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Avoid Tolls</Text>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Text style={styles.toggleText}>OFF</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Fuel Efficient</Text>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Text style={styles.toggleText}>ON</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Real-Time Traffic</Text>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Text style={styles.toggleText}>ON</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : null}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Route Details Modal */}
      <Modal
        visible={showRouteDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRouteDetails(false)}
      >
        {selectedRoute && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRouteDetails(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedRoute.name}</Text>
              <TouchableOpacity onPress={() => handleStartNavigation(selectedRoute)}>
                <Text style={styles.modalStartText}>Start</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.routeDetailsCard}>
                <View style={styles.routeDetailsHeader}>
                  <Ionicons 
                    name={getRouteTypeIcon(selectedRoute.type)} 
                    size={24} 
                    color={getRouteTypeColor(selectedRoute.type)} 
                  />
                  <Text style={styles.routeDetailsName}>{selectedRoute.name}</Text>
                  <View style={[
                    styles.routeDetailsBadge,
                    { backgroundColor: getRouteTypeColor(selectedRoute.type) }
                  ]}>
                    <Text style={styles.routeDetailsBadgeText}>{selectedRoute.type}</Text>
                  </View>
                </View>

                <View style={styles.routeDetailsMetrics}>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricValue}>{formatTime(selectedRoute.estimatedTime)}</Text>
                    <Text style={styles.detailMetricLabel}>Estimated Time</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricValue}>{formatDistance(selectedRoute.distance)}</Text>
                    <Text style={styles.detailMetricLabel}>Distance</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricValue}>{formatCurrency(selectedRoute.fuelCost)}</Text>
                    <Text style={styles.detailMetricLabel}>Fuel Cost</Text>
                  </View>
                </View>

                {selectedRoute.instructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>Route Instructions</Text>
                    {selectedRoute.instructions.map((instruction, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <View style={styles.instructionStep}>
                          <Text style={styles.instructionStepNumber}>{instruction.step}</Text>
                        </View>
                        <View style={styles.instructionContent}>
                          <Text style={styles.instructionText}>{instruction.instruction}</Text>
                          {instruction.distance > 0 && (
                            <Text style={styles.instructionDistance}>
                              {formatDistance(instruction.distance)} • {formatTime(instruction.duration)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    marginBottom: 24,
  },
  routesContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  currentRouteContainer: {
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  routeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  routeScore: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.gray[600],
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  routeConditions: {
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trafficIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 12,
    color: COLORS.gray[700],
  },
  alternativesContainer: {
    gap: 12,
  },
  alternativeRouteCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trafficContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  trafficCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trafficHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trafficTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  trafficLastUpdated: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  trafficMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  trafficMetric: {
    flex: 1,
    alignItems: 'center',
  },
  trafficMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  trafficMetricLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  incidentsContainer: {
    marginTop: 16,
  },
  incidentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  incidentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  incidentText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
  },
  incidentImpact: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning[600],
  },
  multiStopContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  planRouteButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  planRouteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  toggleButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  modalStartText: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  routeDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  routeDetailsName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  routeDetailsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeDetailsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  routeDetailsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  detailMetric: {
    alignItems: 'center',
  },
  detailMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  detailMetricLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  instructionsContainer: {
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionStepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  instructionDistance: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
});

export default RouteOptimizationDashboard;
