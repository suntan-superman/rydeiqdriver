import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Firebase Cloud Messaging (FCM) service for RydeIQ Driver app
 * Handles push notifications for ride requests, bid updates, and earnings
 */

export const initializeNotifications = async () => {
  try {
    // Request permission for iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        // Push notification permission denied
        return null;
      }
    }

    // Request permission for Android 13+
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Android notification permission denied
        return null;
      }
    }

    // Get FCM token
    const token = await messaging().getToken();
    // FCM token received

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      // Create high-priority channel for ride requests
      await messaging().setNotificationChannelAsync?.('ride-requests', {
        name: 'Ride Requests',
        importance: 'high',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'ride_request',
      });

      // Create channel for bid updates
      await messaging().setNotificationChannelAsync?.('bid-updates', {
        name: 'Bid Updates', 
        importance: 'high',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'bid_accepted',
      });

      // Create channel for earnings
      await messaging().setNotificationChannelAsync?.('earnings', {
        name: 'Earnings',
        importance: 'default',
        vibrationPattern: [0, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });

      // Create channel for system updates
      await messaging().setNotificationChannelAsync?.('system', {
        name: 'System Updates',
        importance: 'default',
        vibrationPattern: [0, 250],
        lightColor: '#6B7280',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.error('Error initializing Firebase notifications:', error);
    return null;
  }
};

/**
 * Get the current FCM token
 */
export const getNotificationToken = async () => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Handle background messages (when app is in background/killed)
 */
export const setBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // Message handled in the background
    
    // Handle different notification types
    const { data, notification } = remoteMessage;
    
    switch (data?.type) {
      case 'ride_request':
        // Background ride request received
        break;
      case 'bid_update':
        // Background bid update received
        break;
      case 'earnings':
        // Background earnings update received
        break;
      default:
        // Background notification received
    }
  });
};

/**
 * Subscribe to notification topics
 */
export const subscribeToTopic = async (topic) => {
  try {
    await messaging().subscribeToTopic(topic);
    // Subscribed to topic
    return true;
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    return false;
  }
};

/**
 * Unsubscribe from notification topics
 */
export const unsubscribeFromTopic = async (topic) => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    // Unsubscribed from topic
    return true;
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
    return false;
  }
};

/**
 * Subscribe to driver-specific topics based on location/preferences
 */
export const subscribeToDriverTopics = async (driverId, city, vehicleType) => {
  const topics = [
    `driver_${driverId}`,
    `city_${city.toLowerCase().replace(/\s+/g, '_')}`,
    `vehicle_${vehicleType.toLowerCase()}`,
    'all_drivers'
  ];

  const results = await Promise.allSettled(
    topics.map(topic => subscribeToTopic(topic))
  );

  const successful = results.filter(result => result.status === 'fulfilled').length;
  // Subscribed to driver topics
  
  return successful === topics.length;
};

/**
 * Handle foreground notifications (when app is active)
 */
export const addForegroundMessageListener = (callback) => {
  return messaging().onMessage(async remoteMessage => {
    // Foreground notification received
    
    if (callback) {
      callback(remoteMessage);
    }
  });
};

/**
 * Handle notification tap events (when user taps notification)
 */
export const addNotificationOpenedListener = (callback) => {
  // Handle notification when app is opened from background
  messaging().onNotificationOpenedApp(remoteMessage => {
    // Notification caused app to open from background state
    
    if (callback) {
      callback(remoteMessage, 'background');
    }
  });

  // Handle notification when app is opened from killed state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        // Notification caused app to open from killed state
        
        if (callback) {
          callback(remoteMessage, 'killed');
        }
      }
    });
};

/**
 * Handle token refresh
 */
export const addTokenRefreshListener = (callback) => {
  return messaging().onTokenRefresh(token => {
    // FCM token refreshed
    
    if (callback) {
      callback(token);
    }
  });
};

/**
 * Check notification permission status
 */
export const checkNotificationPermission = async () => {
  try {
    const authStatus = await messaging().hasPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    return enabled;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export default {
  initializeNotifications,
  getNotificationToken,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic,
  subscribeToDriverTopics,
  addForegroundMessageListener,
  addNotificationOpenedListener,
  addTokenRefreshListener,
  checkNotificationPermission,
  requestNotificationPermission,
}; 