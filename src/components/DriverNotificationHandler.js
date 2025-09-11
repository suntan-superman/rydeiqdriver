import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Safe imports
let COLORS, driverBidNotificationService, Haptics;

try {
  COLORS = require('@/constants').COLORS;
} catch (e) {
  console.warn('⚠️ COLORS not available:', e.message);
  COLORS = {
    primary: '#007AFF',
    secondary: { 500: '#6B7280' },
    success: '#10B981',
    warning: '#F59E0B',
    gray: { 300: '#D1D5DB', 400: '#9CA3AF' }
  };
}

try {
  driverBidNotificationService = require('@/services/driverBidNotificationService').default;
} catch (e) {
  console.warn('⚠️ driverBidNotificationService not available:', e.message);
  driverBidNotificationService = {
    initialize: () => {},
    startListeningForBidAcceptance: () => Promise.resolve(() => {}),
    stopListening: () => {},
    stopAllListeners: () => {}
  };
}

try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.warn('⚠️ expo-haptics not available:', e.message);
  Haptics = {
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success' }
  };
}

const { width } = Dimensions.get('window');

/**
 * Driver Notification Handler
 * Displays in-app floating notifications for bid acceptance and ride events
 */
const DriverNotificationHandler = ({ 
  driverId, 
  onBidAccepted, 
  onNavigateToRide,
  onRideCancelled,
  onBiddingExpired 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Animation values for notifications
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (driverId && !isInitialized) {
      initializeNotificationHandler();
      setIsInitialized(true);
    }

    return () => {
      // Cleanup when component unmounts
      driverBidNotificationService.stopAllListeners();
    };
  }, [driverId]);

  /**
   * Initialize the notification handler with the driver ID
   */
  const initializeNotificationHandler = () => {
    try {
      driverBidNotificationService.initialize(driverId);
      console.log('🔔 Driver notification handler initialized for:', driverId);
    } catch (error) {
      console.error('❌ Error initializing notification handler:', error);
    }
  };

  /**
   * Show a floating in-app notification
   * @param {Object} notification - Notification data
   */
  const showNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Animate notification in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(newNotification.id);
    }, 5000);
  };

  /**
   * Dismiss a notification
   * @param {string} notificationId - Notification ID to dismiss
   */
  const dismissNotification = (notificationId) => {
    // Animate notification out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Reset animation values for next notification
      slideAnim.setValue(-width);
      fadeAnim.setValue(0);
    });
  };

  /**
   * Handle bid acceptance notification
   * @param {Object} bidData - Bid acceptance data
   */
  const handleBidAccepted = (bidData) => {
    console.log('🎉 Handling bid acceptance in notification handler:', bidData);

    // Show floating notification
    showNotification({
      type: 'bid_accepted',
      title: '🎉 Congratulations!',
      message: `Your bid of $${bidData.bidAmount.toFixed(2)} was accepted!`,
      action: 'View Ride Details',
      onPress: () => {
        dismissNotification();
        if (onBidAccepted) {
          onBidAccepted(bidData);
        }
        if (onNavigateToRide) {
          onNavigateToRide(bidData.rideRequestId, 'ride_details');
        }
      },
      backgroundColor: COLORS.success || '#10B981',
      icon: 'checkmark-circle'
    });

    // Additional haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  /**
   * Handle ride cancellation notification
   * @param {Object} cancellationData - Cancellation data
   */
  const handleRideCancelled = (cancellationData) => {
    console.log('❌ Handling ride cancellation:', cancellationData);

    showNotification({
      type: 'ride_cancelled',
      title: '❌ Ride Cancelled',
      message: 'The ride request has been cancelled.',
      backgroundColor: COLORS.warning || '#F59E0B',
      icon: 'close-circle',
      onPress: () => {
        dismissNotification();
        if (onRideCancelled) {
          onRideCancelled(cancellationData);
        }
      }
    });
  };

  /**
   * Handle bidding expiration notification
   * @param {Object} expirationData - Expiration data
   */
  const handleBiddingExpired = (expirationData) => {
    console.log('⏰ Handling bidding expiration:', expirationData);

    showNotification({
      type: 'bidding_expired',
      title: '⏰ Bidding Expired',
      message: 'Another driver was selected for this ride.',
      backgroundColor: COLORS.secondary[500] || '#6B7280',
      icon: 'time',
      onPress: () => {
        dismissNotification();
        if (onBiddingExpired) {
          onBiddingExpired(expirationData);
        }
      }
    });
  };

  /**
   * Start listening for bid acceptance on a ride
   * @param {string} rideRequestId - Ride request ID
   * @param {number} bidAmount - Bid amount
   */
  const startListeningForBidAcceptance = async (rideRequestId, bidAmount) => {
    try {
      await driverBidNotificationService.startListeningForBidAcceptance(
        rideRequestId,
        driverId,
        bidAmount,
        handleBidAccepted,
        handleRideCancelled,
        handleBiddingExpired
      );
      
      console.log(`🎧 Started listening for bid acceptance on ${rideRequestId}`);
    } catch (error) {
      console.error('❌ Error starting bid listener:', error);
    }
  };

  /**
   * Stop listening for a specific ride
   * @param {string} rideRequestId - Ride request ID
   */
  const stopListeningForRide = (rideRequestId) => {
    driverBidNotificationService.stopListening(rideRequestId);
  };

  /**
   * Render notification item
   * @param {Object} notification - Notification data
   */
  const renderNotification = (notification) => (
    <Animated.View
      key={notification.id}
      style={[
        styles.notificationContainer,
        {
          backgroundColor: notification.backgroundColor || COLORS.primary,
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={notification.onPress}
        activeOpacity={0.8}
      >
        <View style={styles.notificationHeader}>
          <Ionicons 
            name={notification.icon || 'notifications'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <TouchableOpacity
            onPress={() => dismissNotification(notification.id)}
            style={styles.dismissButton}
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        
        {notification.action && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>{notification.action}</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Expose methods to parent components
  const notificationHandlerRef = {
    startListeningForBidAcceptance,
    stopListeningForRide,
    showNotification,
    dismissNotification
  };

  // Make methods available to parent
  useEffect(() => {
    if (typeof onBidAccepted === 'function' && onBidAccepted.setNotificationHandler) {
      onBidAccepted.setNotificationHandler(notificationHandlerRef);
    }
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map(renderNotification)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  notificationContainer: {
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  dismissButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginRight: 6,
  },
});

export default DriverNotificationHandler;

// Export the component with additional helper methods
export { DriverNotificationHandler };

// Export helper functions
export const createNotificationHandler = (driverId, callbacks = {}) => {
  return {
    component: DriverNotificationHandler,
    props: {
      driverId,
      ...callbacks
    }
  };
};
