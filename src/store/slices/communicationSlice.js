import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { communicationService } from '../../services/communicationService';

export const fetchCommunicationDashboard = createAsyncThunk(
  'communication/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await communicationService.getCommunicationDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'communication/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      return await communicationService.sendMessage(messageData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const initiateVoiceCall = createAsyncThunk(
  'communication/initiateVoiceCall',
  async (callData, { rejectWithValue }) => {
    try {
      return await communicationService.initiateVoiceCall(callData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMessageStatus = createAsyncThunk(
  'communication/updateMessageStatus',
  async ({ messageId, status }, { rejectWithValue }) => {
    try {
      return await communicationService.updateMessageStatus(messageId, status);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'communication/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      return await communicationService.markNotificationAsRead(notificationId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  activeCall: null,
  unreadMessages: 0,
  unreadNotifications: 0,
  realTimeMessages: [],
  realTimeNotifications: []
};

const communicationSlice = createSlice({
  name: 'communication',
  initialState,
  reducers: {
    clearCommunicationError: (state) => {
      state.error = null;
    },
    setActiveCall: (state, action) => {
      state.activeCall = action.payload;
    },
    updateUnreadCounts: (state, action) => {
      state.unreadMessages = action.payload.messages || state.unreadMessages;
      state.unreadNotifications = action.payload.notifications || state.unreadNotifications;
    },
    addRealTimeMessage: (state, action) => {
      state.realTimeMessages.unshift(action.payload);
      if (!action.payload.readBy?.includes(action.payload.senderId)) {
        state.unreadMessages += 1;
      }
    },
    addRealTimeNotification: (state, action) => {
      state.realTimeNotifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadNotifications += 1;
      }
    },
    markMessageAsRead: (state, action) => {
      const messageId = action.payload;
      const message = state.realTimeMessages.find(m => m.id === messageId);
      if (message && !message.readBy?.includes(action.payload.userId)) {
        message.readBy = [...(message.readBy || []), action.payload.userId];
        state.unreadMessages = Math.max(0, state.unreadMessages - 1);
      }
    },
    markNotificationAsReadLocal: (state, action) => {
      const notificationId = action.payload;
      const notification = state.realTimeNotifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunicationDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommunicationDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update unread counts from dashboard data
        if (action.payload.messaging) {
          state.unreadMessages = action.payload.messaging.unreadCount || 0;
        }
        if (action.payload.notifications) {
          state.unreadNotifications = action.payload.notifications.unreadCount || 0;
        }
      })
      .addCase(fetchCommunicationDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Add the new message to real-time messages
        state.realTimeMessages.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.messaging) {
          state.dashboard.messaging.totalMessages += 1;
        }
      })
      .addCase(initiateVoiceCall.fulfilled, (state, action) => {
        state.activeCall = action.payload;
        // Add to dashboard if available
        if (state.dashboard?.voiceCalls) {
          state.dashboard.voiceCalls.recentCalls.unshift(action.payload);
          state.dashboard.voiceCalls.totalCalls += 1;
        }
      })
      .addCase(updateMessageStatus.fulfilled, (state, action) => {
        // Update message status in real-time messages
        const message = state.realTimeMessages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.status = action.payload.status;
          message.updatedAt = action.payload.updatedAt;
        }
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        // Mark notification as read in real-time notifications
        const notification = state.realTimeNotifications.find(n => n.id === action.payload);
        if (notification) {
          notification.read = true;
          notification.readAt = new Date();
          state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
        }
      });
  },
});

export const { 
  clearCommunicationError, 
  setActiveCall, 
  updateUnreadCounts,
  addRealTimeMessage,
  addRealTimeNotification,
  markMessageAsRead,
  markNotificationAsReadLocal
} = communicationSlice.actions;
export default communicationSlice.reducer; 