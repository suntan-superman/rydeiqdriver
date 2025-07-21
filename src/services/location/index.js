import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TRACKING = 'location-tracking';

export const initializeLocationServices = async () => {
  try {
    // Initializing location services
    
    // Check if location services are enabled
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      // Location services are not enabled
      return { success: false, error: 'Location services disabled' };
    }

    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      // Foreground location permission denied
      return { success: false, error: 'Foreground location permission denied' };
    }

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      // Background location permission denied
      // Continue without background location - not critical for basic functionality
    }

    // Location services initialized successfully
    return { 
      success: true, 
      foregroundPermission: foregroundStatus === 'granted',
      backgroundPermission: backgroundStatus === 'granted'
    };
  } catch (error) {
    console.error('Error initializing location services:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000, // Use cached location if less than 10 seconds old
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

export const startLocationTracking = async () => {
  try {
    // Define the background task for location tracking
    TaskManager.defineTask(LOCATION_TRACKING, ({ data, error }) => {
      if (error) {
        // Location tracking error
        return;
      }
      if (data) {
        const { locations } = data;
        // Received new locations
        // Here you would typically dispatch to Redux store or send to server
        // Note: In a real implementation, you'd need to set up a store listener
      }
    });

    // Start location updates
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 10, // Update every 10 meters
      deferredUpdatesInterval: 10000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'AnyRyde Driver',
        notificationBody: 'Tracking location for ride matching',
        notificationColor: '#10B981',
      },
    });

    // Location tracking started
    return { success: true };
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return { success: false, error: error.message };
  }
};

export const stopLocationTracking = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
    
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      // Location tracking stopped
    }

    return { success: true };
  } catch (error) {
    console.error('Error stopping location tracking:', error);
    return { success: false, error: error.message };
  }
};

export const watchPosition = (callback, options = {}) => {
  const defaultOptions = {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
  };

  return Location.watchPositionAsync(
    { ...defaultOptions, ...options },
    callback
  );
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance * 0.621371; // Convert to miles
};

export const isLocationPermissionGranted = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

export const isBackgroundLocationPermissionGranted = async () => {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking background location permission:', error);
    return false;
  }
};

export default {
  initializeLocationServices,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  watchPosition,
  calculateDistance,
  isLocationPermissionGranted,
  isBackgroundLocationPermissionGranted,
}; 