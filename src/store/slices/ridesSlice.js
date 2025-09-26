import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Remove module-level Firebase import - make it lazy instead
// import { firebaseFirestore } from '@/services/firebase/config';

// Lazy Firebase firestore getter
const getFirebaseFirestore = () => {
  try {
    const { firebaseFirestore } = require('@/services/firebase/config');
    return firebaseFirestore;
  } catch (error) {
    // Firebase firestore not available in ridesSlice
    return null;
  }
};

// import { RIDE_STATUS } from '@/constants';

// Temporary constants
const RIDE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EN_ROUTE_PICKUP: 'en_route_pickup',
  ARRIVED_PICKUP: 'arrived_pickup',
  CUSTOMER_ONBOARD: 'customer_onboard',
  TRIP_ACTIVE: 'trip_active',
  TRIP_COMPLETED: 'trip_completed'
};

// Initial state
const initialState = {
  currentRide: null,
  rideRequests: [],
  rideHistory: [],
  activeRides: [],
  currentRideStatus: null,
  navigationRoute: null,
  customerInfo: null,
  rideMetrics: {
    distance: 0,
    duration: 0,
    estimatedArrival: null,
    actualPickupTime: null,
    actualDropoffTime: null
  },
  isLoading: false,
  error: null
};

// Async thunks
export const acceptRide = createAsyncThunk(
  'rides/acceptRide',
  async ({ rideId, driverId }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const rideRef = firebaseFirestore.collection('rideRequests').doc(rideId);
      const driverRef = firebaseFirestore.collection('driverApplications').doc(driverId);
      
      // Update ride status
      await rideRef.update({
        status: RIDE_STATUS.ACCEPTED,
        driverId: driverId,
        acceptedAt: firebaseFirestore.FieldValue.serverTimestamp()
      });
      
      // Update driver status
      await driverRef.update({
        currentStatus: 'busy',
        currentRideId: rideId
      });
      
      // Get updated ride data
      const rideDoc = await rideRef.get();
      return { id: rideDoc.id, ...rideDoc.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const startRide = createAsyncThunk(
  'rides/startRide',
  async ({ rideId }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      await rideRef.update({
        status: RIDE_STATUS.TRIP_ACTIVE,
        startedAt: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      const rideDoc = await rideRef.get();
      return { id: rideDoc.id, ...rideDoc.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeRide = createAsyncThunk(
  'rides/completeRide',
  async ({ rideId, finalFare, paymentMethod }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      await rideRef.update({
        status: RIDE_STATUS.TRIP_COMPLETED,
        completedAt: getFirebaseFirestore().FieldValue.serverTimestamp(),
        finalFare: finalFare,
        paymentMethod: paymentMethod
      });
      
      const rideDoc = await rideRef.get();
      return { id: rideDoc.id, ...rideDoc.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelRide = createAsyncThunk(
  'rides/cancelRide',
  async ({ rideId, reason }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      await rideRef.update({
        status: RIDE_STATUS.CANCELLED,
        cancelledAt: getFirebaseFirestore().FieldValue.serverTimestamp(),
        cancellationReason: reason
      });
      
      return { rideId, reason };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRideStatus = createAsyncThunk(
  'rides/updateStatus',
  async ({ rideId, status }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      const updateData = {
        status: status,
        lastUpdated: getFirebaseFirestore().FieldValue.serverTimestamp()
      };
      
      // Add specific timestamp fields based on status
      switch (status) {
        case RIDE_STATUS.EN_ROUTE_PICKUP:
          updateData.enRouteAt = getFirebaseFirestore().FieldValue.serverTimestamp();
          break;
        case RIDE_STATUS.ARRIVED_PICKUP:
          updateData.arrivedAt = getFirebaseFirestore().FieldValue.serverTimestamp();
          break;
        case RIDE_STATUS.CUSTOMER_ONBOARD:
          updateData.customerOnboardAt = getFirebaseFirestore().FieldValue.serverTimestamp();
          break;
      }
      
      await rideRef.update(updateData);
      return { rideId, status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadRideHistory = createAsyncThunk(
  'rides/loadHistory',
  async ({ driverId, limit = 50 }, { rejectWithValue }) => {
    try {
      const ridesQuery = getFirebaseFirestore()
        .collection('rideRequests')
        .where('driverId', '==', driverId)
        .where('status', 'in', [RIDE_STATUS.TRIP_COMPLETED, RIDE_STATUS.CANCELLED])
        .orderBy('completedAt', 'desc')
        .limit(limit);
      
      const snapshot = await ridesQuery.get();
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return rides;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadCurrentRide = createAsyncThunk(
  'rides/loadCurrentRide',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const ridesQuery = getFirebaseFirestore()
        .collection('rideRequests')
        .where('driverId', '==', driverId)
        .where('status', 'in', [
          RIDE_STATUS.ACCEPTED,
          RIDE_STATUS.EN_ROUTE_PICKUP,
          RIDE_STATUS.ARRIVED_PICKUP,
          RIDE_STATUS.CUSTOMER_ONBOARD,
          RIDE_STATUS.TRIP_ACTIVE
        ])
        .limit(1);
      
      const snapshot = await ridesQuery.get();
      
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs[0];
        return { id: rideDoc.id, ...rideDoc.data() };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRideMetrics = createAsyncThunk(
  'rides/updateMetrics',
  async ({ rideId, metrics }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      await rideRef.update({
        metrics: metrics,
        lastMetricsUpdate: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return metrics;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rateCustomer = createAsyncThunk(
  'rides/rateCustomer',
  async ({ rideId, rating, feedback }, { rejectWithValue }) => {
    try {
      const rideRef = getFirebaseFirestore().collection('rideRequests').doc(rideId);
      await rideRef.update({
        driverRating: rating,
        driverFeedback: feedback,
        driverRatedAt: getFirebaseFirestore().FieldValue.serverTimestamp()
      });
      
      return { rideId, rating, feedback };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Rides slice
const ridesSlice = createSlice({
  name: 'rides',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRide: (state, action) => {
      state.currentRide = action.payload;
    },
    clearCurrentRide: (state) => {
      state.currentRide = null;
      state.currentRideStatus = null;
      state.rideMetrics = initialState.rideMetrics;
      state.customerInfo = null;
      state.navigationRoute = null;
    },
    updateRideMetricsLocal: (state, action) => {
      state.rideMetrics = {
        ...state.rideMetrics,
        ...action.payload
      };
    },
    setNavigationRoute: (state, action) => {
      state.navigationRoute = action.payload;
    },
    setCustomerInfo: (state, action) => {
      state.customerInfo = action.payload;
    },
    addRideRequest: (state, action) => {
      const existingIndex = state.rideRequests.findIndex(
        request => request.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.rideRequests[existingIndex] = action.payload;
      } else {
        state.rideRequests.unshift(action.payload);
      }
    },
    removeRideRequest: (state, action) => {
      state.rideRequests = state.rideRequests.filter(
        request => request.id !== action.payload
      );
    },
    clearRideRequests: (state) => {
      state.rideRequests = [];
    },
    updateRideRequestStatus: (state, action) => {
      const { rideId, status } = action.payload;
      const rideIndex = state.rideRequests.findIndex(ride => ride.id === rideId);
      
      if (rideIndex >= 0) {
        state.rideRequests[rideIndex].status = status;
      }
      
      if (state.currentRide && state.currentRide.id === rideId) {
        state.currentRide.status = status;
        state.currentRideStatus = status;
      }
    },
    setEstimatedArrival: (state, action) => {
      state.rideMetrics.estimatedArrival = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Accept ride
      .addCase(acceptRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload;
        state.currentRideStatus = action.payload.status;
        // Remove from ride requests
        state.rideRequests = state.rideRequests.filter(
          request => request.id !== action.payload.id
        );
      })
      .addCase(acceptRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Start ride
      .addCase(startRide.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        state.currentRideStatus = action.payload.status;
      })
      
      // Complete ride
      .addCase(completeRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeRide.fulfilled, (state, action) => {
        state.isLoading = false;
        // Move current ride to history
        if (state.currentRide) {
          state.rideHistory.unshift(action.payload);
        }
        // Clear current ride
        state.currentRide = null;
        state.currentRideStatus = null;
        state.rideMetrics = initialState.rideMetrics;
        state.customerInfo = null;
        state.navigationRoute = null;
      })
      .addCase(completeRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel ride
      .addCase(cancelRide.fulfilled, (state, action) => {
        // Remove from requests or clear current ride
        state.rideRequests = state.rideRequests.filter(
          request => request.id !== action.payload.rideId
        );
        
        if (state.currentRide && state.currentRide.id === action.payload.rideId) {
          state.currentRide = null;
          state.currentRideStatus = null;
          state.rideMetrics = initialState.rideMetrics;
          state.customerInfo = null;
          state.navigationRoute = null;
        }
      })
      
      // Update ride status
      .addCase(updateRideStatus.fulfilled, (state, action) => {
        if (state.currentRide && state.currentRide.id === action.payload.rideId) {
          state.currentRide.status = action.payload.status;
          state.currentRideStatus = action.payload.status;
        }
      })
      
      // Load ride history
      .addCase(loadRideHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadRideHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rideHistory = action.payload;
      })
      .addCase(loadRideHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load current ride
      .addCase(loadCurrentRide.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentRide = action.payload;
          state.currentRideStatus = action.payload.status;
        }
      })
      
      // Update ride metrics
      .addCase(updateRideMetrics.fulfilled, (state, action) => {
        state.rideMetrics = {
          ...state.rideMetrics,
          ...action.payload
        };
      })
      
      // Rate customer
      .addCase(rateCustomer.fulfilled, (state, action) => {
        const { rideId } = action.payload;
        const historyIndex = state.rideHistory.findIndex(ride => ride.id === rideId);
        
        if (historyIndex >= 0) {
          state.rideHistory[historyIndex] = {
            ...state.rideHistory[historyIndex],
            ...action.payload
          };
        }
      });
  }
});

// Export actions
export const {
  clearError,
  setCurrentRide,
  clearCurrentRide,
  updateRideMetricsLocal,
  setNavigationRoute,
  setCustomerInfo,
  addRideRequest,
  removeRideRequest,
  clearRideRequests,
  updateRideRequestStatus,
  setEstimatedArrival
} = ridesSlice.actions;

// Selectors
export const selectCurrentRide = (state) => state.rides.currentRide;
export const selectCurrentRideStatus = (state) => state.rides.currentRideStatus;
export const selectRideRequests = (state) => state.rides.rideRequests;
export const selectRideHistory = (state) => state.rides.rideHistory;
export const selectRideMetrics = (state) => state.rides.rideMetrics;
export const selectNavigationRoute = (state) => state.rides.navigationRoute;
export const selectCustomerInfo = (state) => state.rides.customerInfo;
export const selectRidesLoading = (state) => state.rides.isLoading;
export const selectRidesError = (state) => state.rides.error;
export const selectHasActiveRide = (state) => Boolean(state.rides.currentRide);

export default ridesSlice.reducer; 