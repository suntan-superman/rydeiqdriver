import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const initializeNotifications = async () => {
  try {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Get existing notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });

    console.log('Push notification token:', token.data);

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ride-requests', {
        name: 'Ride Requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'ride-request.wav',
      });

      await Notifications.setNotificationChannelAsync('bid-updates', {
        name: 'Bid Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'bid-accepted.wav',
      });

      await Notifications.setNotificationChannelAsync('earnings', {
        name: 'Earnings',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#F59E0B',
      });

      await Notifications.setNotificationChannelAsync('system', {
        name: 'System Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#6B7280',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

export const sendLocalNotification = async (title, body, data = {}, channel = 'default') => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
};

export const sendRideRequestNotification = async (rideRequest) => {
  const title = 'New Ride Request';
  const body = `$${rideRequest.estimatedFare} ride from ${rideRequest.pickup.address}`;
  
  return await sendLocalNotification(title, body, { rideRequest }, 'ride-requests');
};

export const sendBidUpdateNotification = async (bid, status) => {
  const title = status === 'accepted' ? 'Bid Accepted!' : 'Bid Update';
  const body = status === 'accepted' 
    ? `Your $${bid.bidAmount} bid was accepted!`
    : `Your bid for $${bid.bidAmount} was ${status}`;
  
  return await sendLocalNotification(title, body, { bid, status }, 'bid-updates');
};

export const sendEarningsNotification = async (amount, type = 'ride') => {
  const title = 'Payment Received';
  const body = `You earned $${amount.toFixed(2)} from your ${type}`;
  
  return await sendLocalNotification(title, body, { amount, type }, 'earnings');
};

export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return false;
  }
};

// Notification event listeners
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

export const addNotificationResponseReceivedListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

export default {
  initializeNotifications,
  sendLocalNotification,
  sendRideRequestNotification,
  sendBidUpdateNotification,
  sendEarningsNotification,
  cancelNotification,
  cancelAllNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
}; 