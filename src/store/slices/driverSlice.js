import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Remove module-level Firebase import - make it lazy instead
// import { firebaseFirestore } from '@/services/firebase/config';

// Lazy Firebase firestore getter
const getFirebaseFirestore = () => {
  try {
    const { firebaseFirestore } = require('@/services/firebase/config');
    return firebaseFirestore;
  } catch (error) {
    // Firebase firestore not available in driverSlice
    return null;
  }
};

// import { DRIVER_STATUS } from '@/constants';

// Temporary constants
const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  BREAK: 'break'
};

// Initial state
const initialState = {
  profile: {
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: null,
      address: '',
      profilePhoto: null
    },
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vehicleType: 'standard', // standard, premium, wheelchair, pet
      photos: []
    },
    documents: {
      driverLicense: null,
      insurance: null,
      registration: null,
      backgroundCheck: null,
      vehicleInspection: null
    },
    bankingInfo: {
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      bankName: '',
      isVerified: false
    }
  },
  status: DRIVER_STATUS.OFFLINE,
  availability: {
    isOnline: false,
    inBreak: false,
    breakStartTime: null,
    preferredZones: [],
    workingHours: {
      start: null,
      end: null,
      daysOfWeek: []
    }
  },
  location: {
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    accuracy: null,
    lastUpdated: null
  },
  preferences: {
    rideTypes: ['standard', 'premium'],
    minimumFare: 5.00,
    maximumDistance: 50, // miles
    autoAcceptEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
    language: 'en',
    notifications: {
      rideRequests: true,
      bidUpdates: true,
      earnings: true,
      promotions: false
    }
  },
  statistics: {
    totalRides: 0,
    rating: 5.0,
    ratingCount: 0,
    completionRate: 100,
    cancellationRate: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0
  },
  achievements: [],
  isLoading: false,
  error: null
};

// Async thunks
export const updateDriverProfile = createAsyncThunk(
  'driver/updateProfile',
  async ({ driverId, profileData }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        ...profileData,
        updatedAt: firebaseFirestore.FieldValue.serverTimestamp()
      });
      return profileData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDriverStatus = createAsyncThunk(
  'driver/updateStatus',
  async ({ driverId, status, location }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      const updateData = {
        currentStatus: status,
        lastStatusUpdate: firebaseFirestore.FieldValue.serverTimestamp()
      };
      
      if (location) {
        updateData.location = new firebaseFirestore.GeoPoint(location.latitude, location.longitude);
        updateData.lastLocationUpdate = firebaseFirestore.FieldValue.serverTimestamp();
      }
      
      await driverRef.update(updateData);
      return { status, location };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const goOnline = createAsyncThunk(
  'driver/goOnline',
  async ({ driverId, location }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        currentStatus: DRIVER_STATUS.ONLINE,
        isOnline: true,
        location: new firebaseFirestore.GeoPoint(location.latitude, location.longitude),
        onlineAt: firebaseFirestore.FieldValue.serverTimestamp(),
        lastLocationUpdate: firebaseFirestore.FieldValue.serverTimestamp()
      });
      
      return {
        status: DRIVER_STATUS.ONLINE,
        isOnline: true,
        location
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const goOffline = createAsyncThunk(
  'driver/goOffline',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const driverRef = getFirebaseFirestore().collection('drivers').doc(driverId);
      await driverRef.update({
        currentStatus: DRIVER_STATUS.OFFLINE,
        isOnline: false,
        offlineAt: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return {
        status: DRIVER_STATUS.OFFLINE,
        isOnline: false
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  'driver/updateLocation',
  async ({ driverId, location }, { rejectWithValue }) => {
    try {
      const driverRef = getFirebaseFirestore().collection('drivers').doc(driverId);
      await driverRef.update({
        location: new getFirebaseFirestore().GeoPoint(location.latitude, location.longitude),
        heading: location.heading || null,
        speed: location.speed || null,
        lastLocationUpdate: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return location;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const takeBreak = createAsyncThunk(
  'driver/takeBreak',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const driverRef = getFirebaseFirestore().collection('drivers').doc(driverId);
      const breakStartTime = new Date();
      
      await driverRef.update({
        currentStatus: DRIVER_STATUS.BREAK,
        inBreak: true,
        breakStartTime: getFirebaseFirestore().Timestamp.fromDate(breakStartTime)
      });
      
      return {
        status: DRIVER_STATUS.BREAK,
        inBreak: true,
        breakStartTime: breakStartTime.toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const endBreak = createAsyncThunk(
  'driver/endBreak',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const driverRef = getFirebaseFirestore().collection('drivers').doc(driverId);
      await driverRef.update({
        currentStatus: DRIVER_STATUS.ONLINE,
        inBreak: false,
        breakStartTime: null,
        breakEndTime: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return {
        status: DRIVER_STATUS.ONLINE,
        inBreak: false,
        breakStartTime: null
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'driver/updatePreferences',
  async ({ driverId, preferences }, { rejectWithValue }) => {
    try {
      const driverRef = getFirebaseFirestore().collection('drivers').doc(driverId);
      await driverRef.update({
        preferences,
        updatedAt: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return preferences;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadDriverProfile = createAsyncThunk(
  'driver/loadProfile',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const driverDoc = await getFirebaseFirestore().collection('drivers').doc(driverId).get();
      
      if (!driverDoc.exists) {
        return rejectWithValue('Driver profile not found');
      }
      
      const data = driverDoc.data();
      return {
        profile: data.profile || {},
        preferences: data.preferences || {},
        statistics: data.statistics || {},
        achievements: data.achievements || [],
        status: data.currentStatus || DRIVER_STATUS.OFFLINE,
        availability: data.availability || {}
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Driver slice
const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocationLocal: (state, action) => {
      state.location = {
        ...state.location,
        ...action.payload,
        lastUpdated: new Date().toISOString()
      };
    },
    updateStatistics: (state, action) => {
      state.statistics = {
        ...state.statistics,
        ...action.payload
      };
    },
    addAchievement: (state, action) => {
      if (!state.achievements.includes(action.payload)) {
        state.achievements.push(action.payload);
      }
    },
    setPreference: (state, action) => {
      const { key, value } = action.payload;
      state.preferences[key] = value;
    },
    updatePersonalInfo: (state, action) => {
      state.profile.personalInfo = {
        ...state.profile.personalInfo,
        ...action.payload
      };
    },
    updateVehicleInfo: (state, action) => {
      state.profile.vehicleInfo = {
        ...state.profile.vehicleInfo,
        ...action.payload
      };
    },
    updateBankingInfo: (state, action) => {
      state.profile.bankingInfo = {
        ...state.profile.bankingInfo,
        ...action.payload
      };
    },
    setPreferredZones: (state, action) => {
      state.availability.preferredZones = action.payload;
    },
    setWorkingHours: (state, action) => {
      state.availability.workingHours = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Update profile
      .addCase(updateDriverProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDriverProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = {
          ...state.profile,
          ...action.payload
        };
      })
      .addCase(updateDriverProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update status
      .addCase(updateDriverStatus.fulfilled, (state, action) => {
        state.status = action.payload.status;
        if (action.payload.location) {
          state.location = {
            ...state.location,
            ...action.payload.location,
            lastUpdated: new Date().toISOString()
          };
        }
      })
      
      // Go online
      .addCase(goOnline.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.availability.isOnline = action.payload.isOnline;
        state.location = {
          ...state.location,
          ...action.payload.location,
          lastUpdated: new Date().toISOString()
        };
      })
      
      // Go offline
      .addCase(goOffline.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.availability.isOnline = action.payload.isOnline;
      })
      
      // Update location
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.location = {
          ...state.location,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      
      // Take break
      .addCase(takeBreak.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.availability.inBreak = action.payload.inBreak;
        state.availability.breakStartTime = action.payload.breakStartTime;
      })
      
      // End break
      .addCase(endBreak.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.availability.inBreak = action.payload.inBreak;
        state.availability.breakStartTime = action.payload.breakStartTime;
      })
      
      // Update preferences
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = {
          ...state.preferences,
          ...action.payload
        };
      })
      
      // Load profile
      .addCase(loadDriverProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadDriverProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = { ...state.profile, ...action.payload.profile };
        state.preferences = { ...state.preferences, ...action.payload.preferences };
        state.statistics = { ...state.statistics, ...action.payload.statistics };
        state.achievements = action.payload.achievements;
        state.status = action.payload.status;
        state.availability = { ...state.availability, ...action.payload.availability };
      })
      .addCase(loadDriverProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  updateLocationLocal,
  updateStatistics,
  addAchievement,
  setPreference,
  updatePersonalInfo,
  updateVehicleInfo,
  updateBankingInfo,
  setPreferredZones,
  setWorkingHours
} = driverSlice.actions;

// Selectors
export const selectDriverProfile = (state) => state.driver.profile;
export const selectDriverStatus = (state) => state.driver.status;
export const selectDriverAvailability = (state) => state.driver.availability;
export const selectDriverLocation = (state) => state.driver.location;
export const selectDriverPreferences = (state) => state.driver.preferences;
export const selectDriverStatistics = (state) => state.driver.statistics;
export const selectDriverAchievements = (state) => state.driver.achievements;
export const selectIsOnline = (state) => state.driver.availability.isOnline;
export const selectInBreak = (state) => state.driver.availability.inBreak;
export const selectDriverError = (state) => state.driver.error;
export const selectDriverLoading = (state) => state.driver.isLoading;

export default driverSlice.reducer; 