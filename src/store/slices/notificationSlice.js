import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Notifications from 'expo-notifications';
import { NOTIFICATION_TYPES } from '@/constants';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  settings: {
    sound: true,
    vibration: true,
    rideRequests: true,
    bidUpdates: true,
    earnings: true,
    promotions: false,
    systemUpdates: true
  },
  isLoading: false,
  error: null
};

// Async thunks
export const registerForPushNotifications = createAsyncThunk(
  'notification/registerForPush',
  async (_, { rejectWithValue }) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return rejectWithValue('Push notification permission denied');
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Configure notification handling
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      
      return { token, permission: finalStatus };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendLocalNotification = createAsyncThunk(
  'notification/sendLocal',
  async ({ title, body, data, sound }, { rejectWithValue }) => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound !== false,
        },
        trigger: null, // Send immediately
      });
      
      return { id: notificationId, title, body, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelNotification = createAsyncThunk(
  'notification/cancel',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return { notificationId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async ({ driverId, settings }, { rejectWithValue }) => {
    try {
      // Import firestore here to avoid circular dependencies
      const { firebaseFirestore } = await import('@/services/firebase/config');
      
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
      .addCase(registerForPushNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerForPushNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pushToken = action.payload.token;
      })
      .addCase(registerForPushNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send local notification
      .addCase(sendLocalNotification.fulfilled, (state, action) => {
        // Local notification sent successfully
        // The notification will be added via addNotification action
      })
      
      // Cancel notification
      .addCase(cancelNotification.fulfilled, (state, action) => {
        // Notification cancelled
        const { notificationId } = action.payload;
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
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