import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Remove module-level Firebase import - make it lazy instead
// import messaging from '@react-native-firebase/messaging';

// Lazy Firebase messaging getter
const getFirebaseMessaging = () => {
  try {
    return require('@react-native-firebase/messaging').default;
  } catch (error) {
    // Firebase messaging not available in notificationSlice
    return null;
  }
};

// Temporary constants
const NOTIFICATION_TYPES = {
  RIDE_REQUEST: 'ride_request',
  BID_ACCEPTED: 'bid_accepted',
  BID_DECLINED: 'bid_declined',
  TRIP_COMPLETED: 'trip_completed',
  EARNINGS: 'earnings',
  SYSTEM: 'system'
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pushToken: null,
  permissions: {
    hasPermission: false,
    provisional: false
  },
  settings: {
    rideRequests: true,
    updates: true,
    earnings: true,
    system: true,
    sound: true,
    vibration: true
  }
};

// Async thunks for notification management
export const requestNotificationPermission = createAsyncThunk(
  'notification/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        return rejectWithValue('Firebase messaging not available');
      }
      
      const permission = await messaging().requestPermission();
      const enabled = permission === 1; // AuthorizationStatus.AUTHORIZED
      
      return {
        hasPermission: enabled,
        provisional: permission === 2 // AuthorizationStatus.PROVISIONAL
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshPushToken = createAsyncThunk(
  'notification/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        return rejectWithValue('Firebase messaging not available');
      }
      const token = await messaging().getToken();
      return { token };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToDriverTopics = createAsyncThunk(
  'notification/subscribeToTopics',
  async ({ driverId, city, vehicleType }, { rejectWithValue }) => {
    try {
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        return rejectWithValue('Firebase messaging not available');
      }
      const topics = [
        `driver_${driverId}`,
        `city_${city.toLowerCase().replace(/\s+/g, '_')}`,
        `vehicle_${vehicleType.toLowerCase()}`,
        'all_drivers'
      ];

      // Subscribe to all topics
      await Promise.all(topics.map(topic => messaging().subscribeToTopic(topic)));
      
      // Subscribed to FCM topics
      return { topics };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const unsubscribeFromDriverTopics = createAsyncThunk(
  'notification/unsubscribeFromTopics',
  async ({ driverId, city, vehicleType }, { rejectWithValue }) => {
    try {
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        return rejectWithValue('Firebase messaging not available');
      }
      const topics = [
        `driver_${driverId}`,
        `city_${city.toLowerCase().replace(/\s+/g, '_')}`,
        `vehicle_${vehicleType.toLowerCase()}`,
        'all_drivers'
      ];

      // Unsubscribe from all topics
      await Promise.all(topics.map(topic => messaging().unsubscribeFromTopic(topic)));
      
      // Unsubscribed from FCM topics
      return { topics };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async ({ driverId, settings }, { rejectWithValue }) => {
    try {
      // Use the same lazy loading pattern as other slices
      const getFirebaseFirestore = () => {
        try {
          const { firebaseFirestore } = require('@/services/firebase/config');
          return firebaseFirestore;
        } catch (error) {
          // Firebase firestore not available in notificationSlice
          return null;
        }
      };
      
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        notificationSettings: settings
      });
      
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async ({ notificationIds }, { rejectWithValue }) => {
    try {
      // Mark notifications as read in Firebase if needed
      return { notificationIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      const notification = {
        id: action.payload.id || Date.now().toString(),
        ...action.payload,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    addFCMNotification: (state, action) => {
      // Add notification from Firebase Cloud Messaging
      const { remoteMessage } = action.payload;
      const { notification, data } = remoteMessage;
      
      const notificationObj = {
        id: data?.id || Date.now().toString(),
        type: data?.type || NOTIFICATION_TYPES.SYSTEM,
        title: notification?.title || 'New Notification',
        body: notification?.body || '',
        data: data || {},
        timestamp: new Date().toISOString(),
        read: false,
        priority: data?.priority || 'normal'
      };
      
      state.notifications.unshift(notificationObj);
      state.unreadCount += 1;
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex >= 0) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(notificationIndex, 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    // Helper action for ride request notifications
    addRideRequestNotification: (state, action) => {
      const { rideRequest } = action.payload;
      const notification = {
        id: `ride-${rideRequest.id}`,
        type: NOTIFICATION_TYPES.RIDE_REQUEST,
        title: 'New Ride Request',
        body: `$${rideRequest.estimatedFare} ride from ${rideRequest.pickup.address}`,
        data: { rideRequest },
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high'
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    // Helper action for bid updates
    addBidUpdateNotification: (state, action) => {
      const { bid, status } = action.payload;
      const notification = {
        id: `bid-${bid.id}`,
        type: NOTIFICATION_TYPES.BID_ACCEPTED,
        title: status === 'accepted' ? 'Bid Accepted!' : 'Bid Declined',
        body: status === 'accepted' 
          ? `Your $${bid.bidAmount} bid was accepted!`
          : `Your bid for $${bid.bidAmount} was declined`,
        data: { bid, status },
        timestamp: new Date().toISOString(),
        read: false,
        priority: status === 'accepted' ? 'high' : 'normal'
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register for push notifications
      .addCase(requestNotificationPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissions = action.payload;
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Refresh push token
      .addCase(refreshPushToken.fulfilled, (state, action) => {
        state.pushToken = action.payload.token;
      })
      
      // Subscribe to topics
      .addCase(subscribeToDriverTopics.fulfilled, (state, action) => {
        // Topics subscribed successfully
        // Topics subscription successful
      })
      .addCase(subscribeToDriverTopics.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Unsubscribe from topics
      .addCase(unsubscribeFromDriverTopics.fulfilled, (state, action) => {
        // Topics unsubscribed successfully
        // Topics unsubscription successful
      })
      
      // Update settings
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        notificationIds.forEach(id => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      });
  }
});

// Export actions
export const {
  clearError,
  addNotification,
  addFCMNotification,
  markNotificationAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
  updateSettings,
  setPushToken,
  addRideRequestNotification,
  addBidUpdateNotification
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notification.notifications;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectNotificationSettings = (state) => state.notification.settings;
export const selectPushToken = (state) => state.notification.pushToken;
export const selectNotificationLoading = (state) => state.notification.isLoading;
export const selectNotificationError = (state) => state.notification.error;

// Helper selectors
export const selectUnreadNotifications = (state) => 
  state.notification.notifications.filter(n => !n.read);

export const selectNotificationsByType = (type) => (state) =>
  state.notification.notifications.filter(n => n.type === type);

export const selectRecentNotifications = (state) => 
  state.notification.notifications.slice(0, 10);

export const selectRideRequestNotifications = (state) =>
  state.notification.notifications.filter(n => n.type === NOTIFICATION_TYPES.RIDE_REQUEST);

export const selectHasUnreadRideRequests = (state) =>
  state.notification.notifications.some(n => 
    n.type === NOTIFICATION_TYPES.RIDE_REQUEST && !n.read
  );

export default notificationSlice.reducer; 