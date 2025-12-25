import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import routeOptimizationService from '../../services/routeOptimizationService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RealTimeTrafficMonitor = ({ driverId, onClose, visible = false }) => {
  const [trafficData, setTrafficData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('current');
  const [trafficAlerts, setTrafficAlerts] = useState([]);

  const regions = [
    { id: 'current', name: 'Current Area', icon: 'location' },
    { id: 'city', name: 'City Wide', icon: 'business' },
    { id: 'highway', name: 'Highways', icon: 'car' },
    { id: 'downtown', name: 'Downtown', icon: 'build' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadTrafficData();
      startTrafficMonitoring();
    }
    
    return () => {
      stopTrafficMonitoring();
    };
  }, [visible, driverId, selectedRegion]);

  const loadTrafficData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const destination = getDestinationForRegion(selectedRegion, currentLocation);
        const data = await routeOptimizationService.getTrafficData(currentLocation, destination);
        
        setTrafficData(data);
        setLastUpdated(new Date());
        
        // Process traffic alerts
        processTrafficAlerts(data);
      }
    } catch (error) {
      console.error('Error loading traffic data:', error);
      setError('Failed to load traffic data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrafficData();
    setIsRefreshing(false);
  };

  const startTrafficMonitoring = () => {
    // In a real app, this would set up real-time traffic monitoring
    // For now, we'll simulate periodic updates
    this.trafficInterval = setInterval(() => {
      loadTrafficData();
    }, 30000); // Update every 30 seconds
  };

  const stopTrafficMonitoring = () => {
    if (this.trafficInterval) {
      clearInterval(this.trafficInterval);
    }
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

  const getDestinationForRegion = (region, currentLocation) => {
    // Simulate different regions for traffic monitoring
    const regionOffsets = {
      'current': { lat: 0.01, lng: 0.01 },
      'city': { lat: 0.05, lng: 0.05 },
      'highway': { lat: 0.02, lng: 0.08 },
      'downtown': { lat: 0.03, lng: 0.02 }
    };
    
    const offset = regionOffsets[region] || regionOffsets.current;
    return {
      latitude: currentLocation.latitude + offset.lat,
      longitude: currentLocation.longitude + offset.lng
    };
  };

  const processTrafficAlerts = (data) => {
    const alerts = [];
    
    if (data.congestionLevel > 3) {
      alerts.push({
        id: 'congestion',
        type: 'warning',
        title: 'Heavy Traffic',
        message: `Traffic congestion level: ${data.congestionLevel.toFixed(1)}/4`,
        severity: 'high'
      });
    }
    
    if (data.averageSpeed < 20) {
      alerts.push({
        id: 'slow-traffic',
        type: 'info',
        title: 'Slow Traffic',
        message: `Average speed: ${data.averageSpeed.toFixed(0)} mph`,
        severity: 'medium'
      });
    }
    
    data.incidents.forEach((incident, index) => {
      alerts.push({
        id: `incident-${index}`,
        type: 'alert',
        title: 'Traffic Incident',
        message: `${incident.type}: ${incident.description}`,
        severity: incident.severity,
        impact: incident.impact
      });
    });
    
    setTrafficAlerts(alerts);
  };

  const handleRegionChange = (regionId) => {
    setSelectedRegion(regionId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getCongestionColor = (level) => {
    if (level <= 1) return COLORS.success[600];
    if (level <= 2) return COLORS.warning[600];
    if (level <= 3) return COLORS.orange[600];
    return COLORS.error[600];
  };

  const getCongestionLabel = (level) => {
    if (level <= 1) return 'Light';
    if (level <= 2) return 'Moderate';
    if (level <= 3) return 'Heavy';
    return 'Severe';
  };

  const getSpeedColor = (speed) => {
    if (speed >= 45) return COLORS.success[600];
    if (speed >= 30) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getAlertIcon = (type) => {
    const icons = {
      'warning': 'warning',
      'info': 'information-circle',
      'alert': 'alert-circle'
    };
    return icons[type] || 'information-circle';
  };

  const getAlertColor = (severity) => {
    const colors = {
      'low': COLORS.info[600],
      'medium': COLORS.warning[600],
      'high': COLORS.error[600]
    };
    return colors[severity] || COLORS.gray[600];
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Traffic Monitor</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Region Selector */}
      <View style={styles.regionSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {regions.map((region) => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionButton,
                selectedRegion === region.id && styles.regionButtonActive
              ]}
              onPress={() => handleRegionChange(region.id)}
            >
              <Ionicons 
                name={region.icon} 
                size={16} 
                color={selectedRegion === region.id ? 'white' : COLORS.gray[600]} 
              />
              <Text style={[
                styles.regionButtonText,
                selectedRegion === region.id && styles.regionButtonTextActive
              ]}>
                {region.name}
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
        {isLoading && !trafficData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading traffic data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
            <Text style={styles.errorTitle}>Failed to Load Traffic Data</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadTrafficData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : trafficData ? (
          <>
            {/* Traffic Overview */}
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>Traffic Overview</Text>
              
              <View style={styles.overviewCard}>
                <View style={styles.overviewHeader}>
                  <Text style={styles.overviewTitle}>Current Conditions</Text>
                  <Text style={styles.lastUpdated}>
                    Updated {lastUpdated?.toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.overviewMetrics}>
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="speedometer" size={20} color={COLORS.primary[600]} />
                      <Text style={styles.metricTitle}>Congestion</Text>
                    </View>
                    <View style={styles.metricValue}>
                      <Text style={[
                        styles.metricNumber,
                        { color: getCongestionColor(trafficData.congestionLevel) }
                      ]}>
                        {trafficData.congestionLevel.toFixed(1)}/4
                      </Text>
                      <Text style={styles.metricLabel}>
                        {getCongestionLabel(trafficData.congestionLevel)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="car" size={20} color={COLORS.primary[600]} />
                      <Text style={styles.metricTitle}>Average Speed</Text>
                    </View>
                    <View style={styles.metricValue}>
                      <Text style={[
                        styles.metricNumber,
                        { color: getSpeedColor(trafficData.averageSpeed) }
                      ]}>
                        {trafficData.averageSpeed.toFixed(0)} mph
                      </Text>
                      <Text style={styles.metricLabel}>Current</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Traffic Alerts */}
            {trafficAlerts.length > 0 && (
              <View style={styles.alertsContainer}>
                <Text style={styles.sectionTitle}>Traffic Alerts</Text>
                
                {trafficAlerts.map((alert) => (
                  <View key={alert.id} style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                      <Ionicons 
                        name={getAlertIcon(alert.type)} 
                        size={20} 
                        color={getAlertColor(alert.severity)} 
                      />
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: getAlertColor(alert.severity) }
                      ]}>
                        <Text style={styles.severityText}>{alert.severity}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    {alert.impact && (
                      <Text style={styles.alertImpact}>
                        Expected delay: +{alert.impact.toFixed(0)} minutes
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Road Conditions */}
            <View style={styles.conditionsContainer}>
              <Text style={styles.sectionTitle}>Road Conditions</Text>
              
              <View style={styles.conditionsCard}>
                <View style={styles.conditionItem}>
                  <Ionicons name="road" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.conditionLabel}>Surface</Text>
                  <Text style={styles.conditionValue}>
                    {trafficData.roadConditions.surface}
                  </Text>
                </View>
                
                <View style={styles.conditionItem}>
                  <Ionicons name="partly-sunny" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.conditionLabel}>Weather</Text>
                  <Text style={styles.conditionValue}>
                    {trafficData.roadConditions.weather}
                  </Text>
                </View>
                
                <View style={styles.conditionItem}>
                  <Ionicons name="eye" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.conditionLabel}>Visibility</Text>
                  <Text style={styles.conditionValue}>
                    {trafficData.roadConditions.visibility}
                  </Text>
                </View>
              </View>
            </View>

            {/* Traffic Incidents */}
            {trafficData.incidents.length > 0 && (
              <View style={styles.incidentsContainer}>
                <Text style={styles.sectionTitle}>Traffic Incidents</Text>
                
                {trafficData.incidents.map((incident, index) => (
                  <View key={index} style={styles.incidentCard}>
                    <View style={styles.incidentHeader}>
                      <Ionicons 
                        name="warning" 
                        size={20} 
                        color={incident.severity === 'high' ? COLORS.error[600] : COLORS.warning[600]} 
                      />
                      <Text style={styles.incidentType}>
                        {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                      </Text>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: incident.severity === 'high' ? COLORS.error[600] : COLORS.warning[600] }
                      ]}>
                        <Text style={styles.severityText}>{incident.severity}</Text>
                      </View>
                    </View>
                    <Text style={styles.incidentDescription}>{incident.description}</Text>
                    <Text style={styles.incidentImpact}>
                      Impact: +{incident.impact.toFixed(0)} minutes delay
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Traffic Trends */}
            <View style={styles.trendsContainer}>
              <Text style={styles.sectionTitle}>Traffic Trends</Text>
              
              <View style={styles.trendsCard}>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Peak Hours</Text>
                  <Text style={styles.trendValue}>7-9 AM, 5-7 PM</Text>
                </View>
                
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Best Travel Time</Text>
                  <Text style={styles.trendValue}>10 AM - 2 PM</Text>
                </View>
                
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Weekend Traffic</Text>
                  <Text style={styles.trendValue}>Lighter</Text>
                </View>
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
  regionSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingVertical: 12,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  regionButtonActive: {
    backgroundColor: COLORS.primary[600],
  },
  regionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  regionButtonTextActive: {
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
  overviewContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  overviewMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  metricValue: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.gray[600],
  },
  alertsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  alertImpact: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning[600],
  },
  conditionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  conditionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  conditionLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
    flex: 1,
    marginLeft: 8,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    textTransform: 'capitalize',
  },
  incidentsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  incidentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  incidentType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
    textTransform: 'capitalize',
  },
  incidentDescription: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  incidentImpact: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning[600],
  },
  trendsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  trendsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  trendLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RealTimeTrafficMonitor;
