/**
 * Scheduled Ride Reminder Service
 * Handles background notifications for upcoming scheduled rides with voice announcements
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import speechService from './speechService';
import voiceCommandService from './voiceCommandService';
import { parseReminderResponse } from '@/utils/naturalLanguageParser';

const REMINDERS_STORAGE_KEY = '@anyryde_scheduled_reminders';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class ScheduledRideReminderService {
  constructor() {
    this.scheduledNotifications = new Map(); // rideId -> [notificationIds]
    this.isInitialized = false;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      // Load existing reminders from storage
      await this.loadReminders();

      // Set up notification listeners
      this.notificationListener = Notifications.addNotificationReceivedListener(
        this.handleNotificationReceived.bind(this)
      );

      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse.bind(this)
      );

      this.isInitialized = true;
      console.log('✅ Scheduled Ride Reminder Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing reminder service:', error);
      return false;
    }
  }

  /**
   * Schedule reminders for a ride
   */
  async scheduleReminders(ride) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const rideTime = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
      const pickupDate = rideTime?.toDate ? rideTime.toDate() : new Date(rideTime);
      
      if (!pickupDate || isNaN(pickupDate.getTime())) {
        console.error('❌ Invalid pickup date for ride:', ride.id);
        return;
      }

      const now = new Date();
      const notificationIds = [];

      // Cancel existing reminders for this ride
      await this.cancelReminders(ride.id);

      // 1-hour reminder
      const oneHourBefore = new Date(pickupDate.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        const notificationId = await this.scheduleNotification(
          oneHourBefore,
          '🚗 Upcoming Scheduled Ride',
          `Pickup in 1 hour at ${this.getAddressFromRide(ride)}`,
          {
            rideId: ride.id,
            type: 'one_hour_reminder',
            ride: this.serializeRideForNotification(ride)
          }
        );
        if (notificationId) {
          notificationIds.push(notificationId);
          console.log(`✅ Scheduled 1-hour reminder for ride ${ride.id}`);
        }
      }

      // 15-minute reminder
      const fifteenMinBefore = new Date(pickupDate.getTime() - 15 * 60 * 1000);
      if (fifteenMinBefore > now) {
        const notificationId = await this.scheduleNotification(
          fifteenMinBefore,
          '⏰ Ride Starting Soon!',
          `Pickup in 15 minutes at ${this.getAddressFromRide(ride)}`,
          {
            rideId: ride.id,
            type: 'fifteen_min_reminder',
            ride: this.serializeRideForNotification(ride)
          }
        );
        if (notificationId) {
          notificationIds.push(notificationId);
          console.log(`✅ Scheduled 15-minute reminder for ride ${ride.id}`);
        }
      }

      // Store notification IDs
      if (notificationIds.length > 0) {
        this.scheduledNotifications.set(ride.id, notificationIds);
        await this.saveReminders();
      }

      return notificationIds;
    } catch (error) {
      console.error('❌ Error scheduling reminders:', error);
      return [];
    }
  }

  /**
   * Schedule a single notification
   */
  async scheduleNotification(triggerDate, title, body, data) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate,
      });
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Handle notification received (foreground)
   */
  async handleNotificationReceived(notification) {
    const { data } = notification.request.content;
    
    if (!data || !data.rideId) return;

    console.log(`🔔 Reminder received for ride ${data.rideId}: ${data.type}`);

    // Speak the reminder with a delay to allow notification sound to finish
    setTimeout(async () => {
      await this.speakReminder(data.ride, data.type);
      
      // Start listening for voice response
      setTimeout(async () => {
        await this.startListeningForResponse(data.ride, data.type);
      }, 2000);
    }, 2000);
  }

  /**
   * Handle notification response (user tapped notification)
   */
  async handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    if (!data || !data.rideId) return;

    console.log(`📱 User tapped reminder for ride ${data.rideId}`);
    // App should navigate to scheduled rides screen
    // This will be handled by the navigation system
  }

  /**
   * Speak reminder message
   */
  async speakReminder(ride, type) {
    if (!ride) return;

    const pickupAddress = this.getAddressFromRide(ride);
    const pickupTime = this.formatTime(ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime);

    let message = '';
    
    if (type === 'one_hour_reminder') {
      message = `Reminder: You have a scheduled ride in 1 hour. Pickup at ${pickupAddress} at ${pickupTime}`;
    } else if (type === 'fifteen_min_reminder') {
      message = `Your scheduled ride is in 15 minutes. Pickup at ${pickupAddress}. Would you like navigation?`;
    }

    await speechService.speak(message, 'scheduledRideReminder');
  }

  /**
   * Start listening for voice response
   */
  async startListeningForResponse(ride, type) {
    try {
      await voiceCommandService.startListening(
        'scheduled_reminder',
        async (result) => {
          await this.handleVoiceResponse(result, ride, type);
        },
        15000 // 15 second timeout
      );
    } catch (error) {
      console.error('❌ Error starting voice listener:', error);
    }
  }

  /**
   * Handle voice response to reminder
   */
  async handleVoiceResponse(result, ride, type) {
    if (result.type === 'timeout') {
      console.log('⏱️ Voice response timeout');
      return;
    }

    if (result.type === 'error') {
      console.error('❌ Voice recognition error:', result.error);
      return;
    }

    const parsed = parseReminderResponse(result.text);
    console.log(`🎤 Parsed response: ${parsed.action}`);

    switch (parsed.action) {
      case 'confirm':
        await speechService.speak('Reminder acknowledged', null);
        break;

      case 'cancel_ride':
        await speechService.speak(
          'Please open the app to cancel your scheduled ride',
          null
        );
        // TODO: Could trigger navigation to ride details with cancel option
        break;

      case 'details':
        await this.speakRideDetails(ride);
        break;

      case 'navigate':
        await speechService.speak(
          'Opening navigation to pickup location',
          null
        );
        // TODO: Trigger navigation to pickup
        break;

      default:
        console.log('❓ Unknown response:', result.text);
        break;
    }
  }

  /**
   * Speak full ride details
   */
  async speakRideDetails(ride) {
    const pickupAddress = this.getAddressFromRide(ride);
    const destination = ride.dropoffLocation?.address || ride.destination?.address || 'destination not specified';
    const pickupTime = this.formatTime(ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime);
    
    const message = `Ride details: Pickup at ${pickupAddress} at ${pickupTime}. Destination: ${destination}.`;
    
    await speechService.speak(message, null);
  }

  /**
   * Cancel reminders for a ride
   */
  async cancelReminders(rideId) {
    try {
      const notificationIds = this.scheduledNotifications.get(rideId);
      
      if (notificationIds && notificationIds.length > 0) {
        await Notifications.cancelScheduledNotificationAsync(notificationIds[0]);
        if (notificationIds[1]) {
          await Notifications.cancelScheduledNotificationAsync(notificationIds[1]);
        }
        
        this.scheduledNotifications.delete(rideId);
        await this.saveReminders();
        
        console.log(`✅ Cancelled reminders for ride ${rideId}`);
      }
    } catch (error) {
      console.error('❌ Error cancelling reminders:', error);
    }
  }

  /**
   * Cancel all reminders
   */
  async cancelAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      await this.saveReminders();
      console.log('✅ Cancelled all scheduled reminders');
    } catch (error) {
      console.error('❌ Error cancelling all reminders:', error);
    }
  }

  /**
   * Get scheduled notifications count
   */
  getScheduledCount() {
    return this.scheduledNotifications.size;
  }

  /**
   * Save reminders to storage
   */
  async saveReminders() {
    try {
      const data = Array.from(this.scheduledNotifications.entries());
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving reminders:', error);
    }
  }

  /**
   * Load reminders from storage
   */
  async loadReminders() {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.scheduledNotifications = new Map(data);
        console.log(`✅ Loaded ${this.scheduledNotifications.size} scheduled reminders`);
      }
    } catch (error) {
      console.error('❌ Error loading reminders:', error);
    }
  }

  /**
   * Helper: Get address from ride
   */
  getAddressFromRide(ride) {
    return ride.pickupLocation?.address || 
           ride.pickup?.address || 
           ride.pickup || 
           'pickup location';
  }

  /**
   * Helper: Format time
   */
  formatTime(dateTime) {
    if (!dateTime) return 'scheduled time';
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    if (isNaN(date.getTime())) return 'scheduled time';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Helper: Serialize ride for notification data
   */
  serializeRideForNotification(ride) {
    return {
      id: ride.id,
      pickupDateTime: ride.pickupDateTime?.toMillis ? ride.pickupDateTime.toMillis() : null,
      scheduledDateTime: ride.scheduledDateTime?.toMillis ? ride.scheduledDateTime.toMillis() : null,
      appointmentDateTime: ride.appointmentDateTime?.toMillis ? ride.appointmentDateTime.toMillis() : null,
      pickupLocation: ride.pickupLocation,
      pickup: ride.pickup,
      dropoffLocation: ride.dropoffLocation,
      destination: ride.destination,
      requestType: ride.requestType,
    };
  }

  /**
   * Cleanup
   */
  async destroy() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.isInitialized = false;
    console.log('🗑️ Scheduled Ride Reminder Service destroyed');
  }
}

// Export singleton instance
const scheduledRideReminderService = new ScheduledRideReminderService();
export { scheduledRideReminderService };
export default scheduledRideReminderService;

