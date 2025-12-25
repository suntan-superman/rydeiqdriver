import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import routeOptimizationService from '../../services/routeOptimizationService';
import * as Haptics from 'expo-haptics';

const MultiStopRoutePlanner = ({ driverId, onClose, visible = false }) => {
  const [stops, setStops] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAddStop, setShowAddStop] = useState(false);
  const [newStopAddress, setNewStopAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && driverId) {
      initializePlanner();
    }
  }, [visible, driverId]);

  const initializePlanner = async () => {
    try {
      setIsLoading(true);
      
      // Get current location as origin
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setOrigin({
          ...currentLocation,
          address: 'Current Location',
          type: 'origin'
        });
      }
    } catch (error) {
      console.error('Error initializing planner:', error);
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

  const handleAddStop = () => {
    if (!newStopAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }

    // Simulate geocoding (in real app, you'd use a geocoding service)
    const newStop = {
      id: Date.now().toString(),
      address: newStopAddress.trim(),
      latitude: origin.latitude + (Math.random() - 0.5) * 0.02,
      longitude: origin.longitude + (Math.random() - 0.5) * 0.02,
      type: 'stop'
    };

    setStops(prev => [...prev, newStop]);
    setNewStopAddress('');
    setShowAddStop(false);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveStop = (stopId) => {
    setStops(prev => prev.filter(stop => stop.id !== stopId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetDestination = () => {
    if (!newStopAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid destination address');
      return;
    }

    // Simulate geocoding
    const newDestination = {
      id: 'destination',
      address: newStopAddress.trim(),
      latitude: origin.latitude + (Math.random() - 0.5) * 0.03,
      longitude: origin.longitude + (Math.random() - 0.5) * 0.03,
      type: 'destination'
    };

    setDestination(newDestination);
    setNewStopAddress('');
    setShowAddStop(false);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleOptimizeRoute = async () => {
    if (!origin || !destination || stops.length === 0) {
      Alert.alert('Error', 'Please add at least one stop and set a destination');
      return;
    }

    try {
      setIsOptimizing(true);
      
      const stopCoordinates = stops.map(stop => ({
        latitude: stop.latitude,
        longitude: stop.longitude
      }));

      const route = await routeOptimizationService.getMultiStopRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        stopCoordinates,
        { latitude: destination.latitude, longitude: destination.longitude }
      );

      setOptimizedRoute(route);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error optimizing route:', error);
      Alert.alert('Error', 'Failed to optimize route. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStartNavigation = () => {
    if (!optimizedRoute) return;
    
    Alert.alert(
      'Start Navigation',
      'Start navigation with the optimized multi-stop route?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startNavigation() }
      ]
    );
  };

  const startNavigation = () => {
    Alert.alert('Navigation Started', 'Starting multi-stop navigation');
    onClose();
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

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Multi-Stop Planner</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Origin */}
        {origin && (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationIcon, { backgroundColor: COLORS.success[100] }]}>
                <Ionicons name="play" size={16} color={COLORS.success[600]} />
              </View>
              <Text style={styles.locationLabel}>Origin</Text>
            </View>
            <Text style={styles.locationAddress}>{origin.address}</Text>
          </View>
        )}

        {/* Stops */}
        <View style={styles.stopsContainer}>
          <View style={styles.stopsHeader}>
            <Text style={styles.stopsTitle}>Stops ({stops.length})</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddStop(true)}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addButtonText}>Add Stop</Text>
            </TouchableOpacity>
          </View>

          {stops.length === 0 ? (
            <View style={styles.emptyStops}>
              <Ionicons name="location-outline" size={48} color={COLORS.gray[400]} />
              <Text style={styles.emptyStopsText}>No stops added yet</Text>
              <Text style={styles.emptyStopsSubtext}>Add stops to create a multi-stop route</Text>
            </View>
          ) : (
            <View style={styles.stopsList}>
              {stops.map((stop, index) => (
                <View key={stop.id} style={styles.stopItem}>
                  <View style={styles.stopInfo}>
                    <View style={[styles.stopIcon, { backgroundColor: COLORS.primary[100] }]}>
                      <Text style={styles.stopNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stopAddress}>{stop.address}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveStop(stop.id)}
                  >
                    <Ionicons name="close" size={16} color={COLORS.error[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Destination */}
        {destination ? (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationIcon, { backgroundColor: COLORS.error[100] }]}>
                <Ionicons name="flag" size={16} color={COLORS.error[600]} />
              </View>
              <Text style={styles.locationLabel}>Destination</Text>
            </View>
            <Text style={styles.locationAddress}>{destination.address}</Text>
          </View>
        ) : (
          <View style={styles.destinationPlaceholder}>
            <TouchableOpacity 
              style={styles.setDestinationButton}
              onPress={() => setShowAddStop(true)}
            >
              <Ionicons name="flag-outline" size={20} color={COLORS.gray[600]} />
              <Text style={styles.setDestinationText}>Set Destination</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Optimize Button */}
        {origin && destination && stops.length > 0 && (
          <TouchableOpacity 
            style={[styles.optimizeButton, isOptimizing && styles.optimizeButtonDisabled]}
            onPress={handleOptimizeRoute}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="navigate" size={20} color="white" />
            )}
            <Text style={styles.optimizeButtonText}>
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Optimized Route Results */}
        {optimizedRoute && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Optimized Route</Text>
            
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Ionicons name="navigate" size={20} color={COLORS.primary[600]} />
                  <Text style={styles.routeName}>Multi-Stop Route</Text>
                </View>
                <View style={styles.routeScore}>
                  <Text style={styles.scoreText}>{optimizedRoute.score?.toFixed(0) || 85}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>

              <View style={styles.routeMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatTime(optimizedRoute.estimatedTime)}</Text>
                  <Text style={styles.metricLabel}>Total Time</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatDistance(optimizedRoute.distance)}</Text>
                  <Text style={styles.metricLabel}>Total Distance</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatCurrency(optimizedRoute.fuelCost)}</Text>
                  <Text style={styles.metricLabel}>Fuel Cost</Text>
                </View>
              </View>

              <View style={styles.routeSequence}>
                <Text style={styles.sequenceTitle}>Route Sequence</Text>
                {optimizedRoute.waypoints.map((waypoint, index) => (
                  <View key={index} style={styles.sequenceItem}>
                    <View style={[
                      styles.sequenceIcon,
                      { backgroundColor: index === 0 ? COLORS.success[100] : index === optimizedRoute.waypoints.length - 1 ? COLORS.error[100] : COLORS.primary[100] }
                    ]}>
                      {index === 0 ? (
                        <Ionicons name="play" size={12} color={COLORS.success[600]} />
                      ) : index === optimizedRoute.waypoints.length - 1 ? (
                        <Ionicons name="flag" size={12} color={COLORS.error[600]} />
                      ) : (
                        <Text style={styles.sequenceNumber}>{index}</Text>
                      )}
                    </View>
                    <Text style={styles.sequenceText}>
                      {index === 0 ? 'Origin' : index === optimizedRoute.waypoints.length - 1 ? 'Destination' : `Stop ${index}`}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.startNavigationButton}
                onPress={handleStartNavigation}
              >
                <Ionicons name="navigate" size={20} color="white" />
                <Text style={styles.startNavigationText}>Start Navigation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Stop Modal */}
      <Modal
        visible={showAddStop}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddStop(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddStop(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Location</Text>
            <View style={styles.modalSpacer} />
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.addressInput}
              value={newStopAddress}
              onChangeText={setNewStopAddress}
              placeholder="Enter address or location"
              autoCapitalize="words"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.addStopButton}
                onPress={handleAddStop}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addStopButtonText}>Add Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.setDestinationButton}
                onPress={handleSetDestination}
              >
                <Ionicons name="flag" size={16} color="white" />
                <Text style={styles.setDestinationButtonText}>Set as Destination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  locationCard: {
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
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  stopsContainer: {
    marginBottom: 16,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStops: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStopsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStopsSubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  stopsList: {
    gap: 8,
  },
  stopItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  stopAddress: {
    fontSize: 14,
    color: COLORS.gray[900],
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  destinationPlaceholder: {
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
  setDestinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  setDestinationText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  optimizeButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  optimizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
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
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
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
    marginBottom: 16,
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
  routeSequence: {
    marginBottom: 16,
  },
  sequenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sequenceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  sequenceText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success[600],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startNavigationText: {
    color: 'white',
    fontSize: 16,
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
  modalSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addressInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    gap: 12,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addStopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  setDestinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error[600],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  setDestinationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiStopRoutePlanner;
