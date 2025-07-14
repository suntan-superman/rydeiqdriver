import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TRACKING = 'location-tracking';

// Initial state
const initialState = {
  currentLocation: null,
  locationHistory: [],
  isTracking: false,
  hasLocationPermission: false,
  backgroundLocationEnabled: false,
  accuracy: Location.Accuracy.High,
  error: null,
  lastUpdate: null
};

// Async thunks
export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return rejectWithValue('Foreground location permission denied');
      }
      
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted'
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const startLocationTracking = createAsyncThunk(
  'location/startTracking',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      // Define the background task
      TaskManager.defineTask(LOCATION_TRACKING, ({ data, error }) => {
        if (error) {
          console.log('Location tracking error:', error);
          return;
        }
        if (data) {
          const { locations } = data;
          // Handle location updates in background
          // You can dispatch actions here if needed
          console.log('Background location update:', locations);
        }
      });

      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
        deferredUpdatesInterval: 10000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'RydeIQ Driver',
          notificationBody: 'Tracking location for ride matching',
        }
      });
      
      return { driverId, isTracking: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const stopLocationTracking = createAsyncThunk(
  'location/stopTracking',
  async (_, { rejectWithValue }) => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
      
      return { isTracking: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLocationInFirestore = createAsyncThunk(
  'location/updateInFirestore',
  async ({ driverId, location }, { rejectWithValue }) => {
    try {
      // Import firestore here to avoid circular dependencies
      const { firebaseFirestore } = await import('@/services/firebase/config');
      
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        location: new firebaseFirestore.GeoPoint(location.latitude, location.longitude),
        heading: location.heading || null,
        speed: location.speed || null,
        lastLocationUpdate: firebaseFirestore.FieldValue.serverTimestamp()
      });
      
      return location;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Location slice
const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateCurrentLocation: (state, action) => {
      const location = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      
      state.currentLocation = location;
      state.lastUpdate = location.timestamp;
      
      // Add to history (keep last 100 locations)
      state.locationHistory.unshift(location);
      if (state.locationHistory.length > 100) {
        state.locationHistory = state.locationHistory.slice(0, 100);
      }
    },
    setLocationPermission: (state, action) => {
      const { foreground, background } = action.payload;
      state.hasLocationPermission = foreground;
      state.backgroundLocationEnabled = background;
    },
    setTrackingStatus: (state, action) => {
      state.isTracking = action.payload;
    },
    clearLocationHistory: (state) => {
      state.locationHistory = [];
    },
    setAccuracy: (state, action) => {
      state.accuracy = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Request permission
      .addCase(requestLocationPermission.fulfilled, (state, action) => {
        state.hasLocationPermission = action.payload.foreground;
        state.backgroundLocationEnabled = action.payload.background;
        state.error = null;
      })
      .addCase(requestLocationPermission.rejected, (state, action) => {
        state.error = action.payload;
        state.hasLocationPermission = false;
        state.backgroundLocationEnabled = false;
      })
      
      // Get current location
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        const location = {
          ...action.payload,
          timestamp: new Date().toISOString()
        };
        
        state.currentLocation = location;
        state.lastUpdate = location.timestamp;
        state.error = null;
        
        // Add to history
        state.locationHistory.unshift(location);
        if (state.locationHistory.length > 100) {
          state.locationHistory = state.locationHistory.slice(0, 100);
        }
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Start tracking
      .addCase(startLocationTracking.fulfilled, (state, action) => {
        state.isTracking = action.payload.isTracking;
        state.error = null;
      })
      .addCase(startLocationTracking.rejected, (state, action) => {
        state.error = action.payload;
        state.isTracking = false;
      })
      
      // Stop tracking
      .addCase(stopLocationTracking.fulfilled, (state, action) => {
        state.isTracking = action.payload.isTracking;
        state.error = null;
      })
      .addCase(stopLocationTracking.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Update in Firestore
      .addCase(updateLocationInFirestore.fulfilled, (state, action) => {
        // Location already updated in local state
        state.error = null;
      })
      .addCase(updateLocationInFirestore.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  updateCurrentLocation,
  setLocationPermission,
  setTrackingStatus,
  clearLocationHistory,
  setAccuracy
} = locationSlice.actions;

// Selectors
export const selectCurrentLocation = (state) => state.location.currentLocation;
export const selectLocationHistory = (state) => state.location.locationHistory;
export const selectIsTracking = (state) => state.location.isTracking;
export const selectHasLocationPermission = (state) => state.location.hasLocationPermission;
export const selectBackgroundLocationEnabled = (state) => state.location.backgroundLocationEnabled;
export const selectLocationAccuracy = (state) => state.location.accuracy;
export const selectLocationError = (state) => state.location.error;
export const selectLastLocationUpdate = (state) => state.location.lastUpdate;

// Helper selectors
export const selectLocationCoords = (state) => {
  const location = state.location.currentLocation;
  return location ? {
    latitude: location.latitude,
    longitude: location.longitude
  } : null;
};

export const selectLocationSpeed = (state) => {
  const location = state.location.currentLocation;
  return location?.speed || 0;
};

export const selectLocationHeading = (state) => {
  const location = state.location.currentLocation;
  return location?.heading || 0;
};

export default locationSlice.reducer; 