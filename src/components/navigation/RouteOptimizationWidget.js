import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import routeOptimizationService from '../../services/routeOptimizationService';
import * as Haptics from 'expo-haptics';

const RouteOptimizationWidget = ({ driverId, onOpenFullDashboard }) => {
  const [trafficData, setTrafficData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (driverId) {
      loadTrafficData();
    }
  }, [driverId]);

  const loadTrafficData = async () => {
    try {
      setIsLoading(true);
      
      // Get current location for traffic data
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const destination = {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01
        };
        
        const data = await routeOptimizationService.getTrafficData(currentLocation, destination);
        setTrafficData(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading traffic data:', error);
    } finally {
      setIsLoading(false);
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

  const handleOpenFullDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenFullDashboard();
  };

  const getTrafficColor = (level) => {
    if (level <= 1) return COLORS.success[600];
    if (level <= 2) return COLORS.warning[600];
    if (level <= 3) return COLORS.orange[600];
    return COLORS.error[600];
  };

  const getTrafficLabel = (level) => {
    if (level <= 1) return 'Light';
    if (level <= 2) return 'Moderate';
    if (level <= 3) return 'Heavy';
    return 'Severe';
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={20} color={COLORS.primary[600]} />
          <Text style={styles.title}>Route Optimization</Text>
        </View>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={handleOpenFullDashboard}
        >
          <Ionicons name="expand" size={16} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading traffic data...</Text>
        </View>
      ) : trafficData ? (
        <View style={styles.content}>
          {/* Traffic Overview */}
          <View style={styles.trafficOverview}>
            <View style={styles.trafficItem}>
              <View style={[
                styles.trafficIndicator,
                { backgroundColor: getTrafficColor(trafficData.congestionLevel) }
              ]} />
              <Text style={styles.trafficText}>
                {getTrafficLabel(trafficData.congestionLevel)} Traffic
              </Text>
            </View>
            <Text style={styles.speedText}>
              {trafficData.averageSpeed.toFixed(0)} mph avg
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenFullDashboard}
            >
              <Ionicons name="navigate" size={16} color={COLORS.primary[600]} />
              <Text style={styles.actionText}>Plan Route</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenFullDashboard}
            >
              <Ionicons name="location" size={16} color={COLORS.primary[600]} />
              <Text style={styles.actionText}>Multi-Stop</Text>
            </TouchableOpacity>
          </View>

          {/* Last Updated */}
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Updated {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={32} color={COLORS.gray[400]} />
          <Text style={styles.emptyText}>No traffic data available</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTrafficData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  expandButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  content: {
    gap: 12,
  },
  trafficOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trafficItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trafficIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trafficText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  speedText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary[600],
  },
  lastUpdated: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary[600],
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});

export default RouteOptimizationWidget;
