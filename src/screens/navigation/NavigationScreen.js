import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Google Maps API Key (should be in env vars in production)
const GOOGLE_MAPS_API_KEY = 'AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU';

const NavigationScreen = ({ route }) => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
  const { rideData } = route?.params || {};
  
  // Default ride data for demo
  const defaultRide = {
    rideId: 'demo_ride_001',
    customerId: 'demo_customer',
    customerName: 'Sarah M.',
    customerPhone: '+1 (555) 123-4567',
    pickup: {
      address: '123 Main Street, Downtown',
      coordinates: { latitude: 35.3733, longitude: -119.0187 }
    },
    destination: {
      address: '456 Oak Avenue, Uptown',
      coordinates: { latitude: 35.3733, longitude: -119.0187 }
    },
    estimatedDistance: '3.2 miles',
    estimatedDuration: '12 minutes',
    bidAmount: 18.50,
    state: 'en-route-pickup'
  };

  const [ride] = useState({ ...defaultRide, ...rideData });
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 35.3733,
    longitude: -119.0187,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Debug logging for ride data
  // useEffect(() => {
  //   console.log('🗺️ NavigationScreen received rideData:', rideData);
  //   console.log('🗺️ NavigationScreen ride object:', ride);
  //   console.log('🗺️ NavigationScreen pickup coordinates:', ride.pickup.coordinates);
  //   console.log('🗺️ NavigationScreen destination coordinates:', ride.destination.coordinates);
  // }, [rideData, ride]);
  const [showDirections, setShowDirections] = useState(true);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [mapType, setMapType] = useState('standard');

  // Location tracking
  useEffect(() => {
    let locationSubscription;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for navigation');
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setCurrentLocation(newLocation);

        // Start watching location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setCurrentLocation(newLocation);
          }
        );

      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your current location');
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Timer for trip duration
  useEffect(() => {
    if (isNavigating) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isNavigating]);

  // Get destination based on trip state
  const getDestination = () => {
    if (ride.state === 'en-route-pickup' || ride.state === 'arrived-pickup') {
      return ride.pickup;
    }
    return ride.destination;
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle directions ready
  const onDirectionsReady = (result) => {
    setDistance(result.distance);
    setDuration(result.duration * 60); // Convert to seconds
    
    // Fit route to screen
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: {
          right: 50,
          bottom: 200,
          left: 50,
          top: 100,
        },
        animated: true,
      });
    }
  };

  // Handle phone call
  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `tel:${ride.customerPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  // Handle message
  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `sms:${ride.customerPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open messaging app');
    });
  };

  // Handle navigation to external app
  const handleExternalNavigation = () => {
    const destination = getDestination();
    const lat = destination.coordinates.latitude;
    const lng = destination.coordinates.longitude;
    
    Alert.alert(
      'Choose Navigation App',
      'Select your preferred navigation app',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Google Maps', 
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
              android: `google.navigation:q=${lat},${lng}&mode=d`
            });
            Linking.openURL(url).catch(() => {
              const webUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`;
              Linking.openURL(webUrl);
            });
          }
        },
        { 
          text: 'Waze', 
          onPress: () => {
            const url = `waze://?ll=${lat},${lng}&navigate=yes`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Waze Not Installed', 'Please install Waze to use this option');
            });
          }
        }
      ]
    );
  };

  // Toggle map type
  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  // Handle arrival
  const handleArrival = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (ride.state === 'en-route-pickup') {
      Alert.alert(
        'Arrived at Pickup',
        'You have arrived at the pickup location',
        [
          { text: 'Continue Navigation', style: 'cancel' },
          { 
            text: 'Confirm Arrival', 
            onPress: () => {
              navigation.navigate('ActiveRide', {
                rideData: { ...ride, state: 'arrived-pickup' }
              });
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Trip Completed',
        'You have arrived at the destination',
        [
          { text: 'Continue Navigation', style: 'cancel' },
          { 
            text: 'End Trip', 
            onPress: () => {
              navigation.navigate('ActiveRide', {
                rideData: { ...ride, state: 'trip-completed' }
              });
            }
          }
        ]
      );
    }
  };

  // Handle emergency
  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 911', onPress: () => Linking.openURL('tel:911'), style: 'destructive' },
        { text: 'Report Issue', onPress: () => Alert.alert('Issue Reported', 'Safety team has been notified') }
      ]
    );
  };

  const destination = getDestination();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentLocation}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        followsUserLocation={true}
        rotateEnabled={true}
        pitchEnabled={true}
        toolbarEnabled={false}
      >
        {/* Current Location Marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          pinColor={COLORS.primary[500]}
        />

        {/* Destination Marker */}
        <Marker
          coordinate={destination.coordinates}
          title={ride.state === 'en-route-pickup' ? 'Pickup Location' : 'Destination'}
          description={destination.address}
          pinColor={ride.state === 'en-route-pickup' ? COLORS.warning : COLORS.error}
        />

        {/* Directions */}
        {showDirections && (
          <MapViewDirections
            origin={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            destination={destination.coordinates}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor={COLORS.primary[500]}
            optimizeWaypoints={true}
            onReady={onDirectionsReady}
            onError={(errorMessage) => {
              console.error('Directions error:', errorMessage);
              setShowDirections(false);
            }}
          />
        )}
      </MapView>

      {/* Top Status Bar */}
      <SafeAreaView style={styles.topContainer}>
        <View style={styles.statusBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {ride.state === 'en-route-pickup' ? 'To Pickup' : 'To Destination'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {ride.customerName} • {formatDuration(duration)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowOverlay(!showOverlay)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Navigation Info Card */}
      {showOverlay && (
        <View style={styles.navigationCard}>
          <View style={styles.navigationHeader}>
            <View style={styles.navigationInfo}>
              <Text style={styles.navigationDistance}>
                {distance ? `${distance.toFixed(1)} mi` : ride.estimatedDistance}
              </Text>
              <Text style={styles.navigationDuration}>
                {duration ? Math.ceil(duration / 60) : parseInt(ride.estimatedDuration)} min
              </Text>
            </View>
            <View style={styles.navigationActions}>
              <TouchableOpacity 
                style={styles.navActionButton}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.navActionButton}
                onPress={handleMessage}
              >
                <Ionicons name="chatbubble" size={20} color={COLORS.info} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.destinationInfo}>
            <Ionicons 
              name={ride.state === 'en-route-pickup' ? 'location' : 'flag'} 
              size={16} 
              color={COLORS.secondary[500]} 
            />
            <Text style={styles.destinationText} numberOfLines={1}>
              {destination.address}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <SafeAreaView style={styles.bottomContainer}>
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleMapType}
          >
            <Ionicons name="layers" size={24} color={COLORS.secondary[700]} />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleExternalNavigation}
          >
            <Ionicons name="navigate" size={24} color={COLORS.secondary[700]} />
            <Text style={styles.actionButtonText}>External</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={handleArrival}
          >
            <Ionicons name="checkmark-circle" size={28} color={COLORS.white} />
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>
              {ride.state === 'en-route-pickup' ? 'Arrived' : 'Complete'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEmergency}
          >
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.actionButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  statusInfo: {
    flex: 1,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  statusSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  navigationCard: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationDistance: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginRight: 16,
  },
  navigationDuration: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.secondary[600],
  },
  navigationActions: {
    flexDirection: 'row',
  },
  navActionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: COLORS.secondary[100],
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  destinationText: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 8,
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginTop: 4,
  },
  primaryActionText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default NavigationScreen; 