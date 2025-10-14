// Safe imports
let auth, db, doc, onSnapshot, collection, query, where, orderBy, firestoreLimit;
let playAchievementSound, playNotificationSound, playBidAcceptedSound, playRideCompletedSound, playRideCancelledSound;
let Haptics, Notifications;
let speechService;

try {
  const firebaseConfig = require('./firebase/config');
  auth = firebaseConfig.auth;
  db = firebaseConfig.db;
} catch (e) {
  console.warn('⚠️ Firebase config not available:', e.message);
  auth = { currentUser: null };
  db = null;
}

try {
  const firestore = require('firebase/firestore');
  doc = firestore.doc;
  onSnapshot = firestore.onSnapshot;
  collection = firestore.collection;
  query = firestore.query;
  where = firestore.where;
  orderBy = firestore.orderBy;
  firestoreLimit = firestore.limit;
} catch (e) {
  console.warn('⚠️ Firestore not available:', e.message);
  doc = () => null;
  onSnapshot = () => () => {};
  collection = () => null;
  query = () => null;
  where = () => null;
  orderBy = () => null;
  firestoreLimit = () => null;
}

try {
  const soundEffects = require('@/utils/soundEffects');
  playAchievementSound = soundEffects.playAchievementSound || (() => Promise.resolve());
  playNotificationSound = soundEffects.playNotificationSound || (() => Promise.resolve());
  playBidAcceptedSound = soundEffects.playBidAcceptedSound || (() => Promise.resolve());
  playRideCompletedSound = soundEffects.playRideCompletedSound || (() => Promise.resolve());
  playRideCancelledSound = soundEffects.playRideCancelledSound || (() => Promise.resolve());
} catch (e) {
  console.warn('⚠️ Sound effects not available:', e.message);
  playAchievementSound = () => Promise.resolve();
  playNotificationSound = () => Promise.resolve();
  playBidAcceptedSound = () => Promise.resolve();
  playRideCompletedSound = () => Promise.resolve();
  playRideCancelledSound = () => Promise.resolve();
}

try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.warn('⚠️ expo-haptics not available:', e.message);
  Haptics = {
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' }
  };
}

try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('⚠️ expo-notifications not available:', e.message);
  Notifications = {
    scheduleNotificationAsync: () => Promise.resolve()
  };
}

try {
  const speechServiceModule = require('./speechService');
  speechService = speechServiceModule.speechService;
} catch (e) {
  console.warn('⚠️ Speech service not available:', e.message);
  speechService = {
    speakNewRideRequest: () => Promise.resolve(),
    speakBidAccepted: () => Promise.resolve(),
    speakBidRejected: () => Promise.resolve(),
    speakRideCancelled: () => Promise.resolve(),
    speakRideCompleted: () => Promise.resolve(),
    speakBiddingExpired: () => Promise.resolve(),
  };
}

/**
 * Driver Bid Notification Service
 * Handles real-time Firebase listeners for bid acceptance and ride status updates
 */
class DriverBidNotificationService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.activeListeners = new Map(); // Track active listeners
    this.currentDriverId = null;
    this.bidAcceptanceCallbacks = new Map(); // Store callbacks for bid acceptance
    this.rideStatusCallbacks = new Map(); // Store callbacks for ride status updates
    this.rideRequestService = null; // Reference to RideRequestService for restarting listeners
  }

  /**
   * Set reference to RideRequestService for restarting listeners
   * @param {Object} rideRequestService - RideRequestService instance
   */
  setRideRequestService(rideRequestService) {
    this.rideRequestService = rideRequestService;
  }

  /**
   * Restart listening for ride requests after bid rejection/cancellation
   */
  restartRideRequestListening() {
    if (this.rideRequestService) {
      // console.log('🔄 Restarting ride request listening after bid resolution');
      this.rideRequestService.startListeningForRideRequests();
    } else {
      console.warn('⚠️ RideRequestService reference not set, cannot restart listening');
    }
  }

  /**
   * Initialize service with driver ID
   * @param {string} driverId - Current driver's ID
   */
  initialize(driverId) {
    this.currentDriverId = driverId;
    // console.log('🎧 Driver bid notification service initialized for:', driverId);
  }

  /**
   * Start listening for bid acceptance on a specific ride request
   * @param {string} rideRequestId - The ride request ID
   * @param {string} driverId - Driver's ID
   * @param {number} bidAmount - The bid amount submitted
   * @param {Function} onBidAccepted - Callback when bid is accepted
   * @param {Function} onRideCancelled - Callback when ride is cancelled
   * @param {Function} onBiddingExpired - Callback when bidding expires
   * @returns {Function} Unsubscribe function
   */
  async startListeningForBidAcceptance(
    rideRequestId, 
    driverId, 
    bidAmount,
    onBidAccepted = null,
    onRideCancelled = null,
    onBiddingExpired = null
  ) {
    try {
      // Check if Firebase is available
      if (!this.db || !doc || !onSnapshot) {
        console.warn('⚠️ Firebase not available for bid listening - using fallback');
        return () => {}; // Return empty unsubscribe function
      }

      // Store callbacks
      if (onBidAccepted) {
        this.bidAcceptanceCallbacks.set(rideRequestId, onBidAccepted);
      }

      // Create Firebase listener for ride request document
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      
      const unsubscribe = onSnapshot(rideRequestRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const rideData = docSnapshot.data();
          console.log(`🔔 Ride ${rideRequestId} update received:`, {
            exists: true,
            status: rideData.status,
            cancelledBy: rideData.cancelledBy || rideData.canceledBy
          });
          this.handleRideRequestUpdate(rideRequestId, rideData, driverId, bidAmount, {
            onBidAccepted,
            onRideCancelled,
            onBiddingExpired
          });
        } else {
          // Document deleted - ride was likely cancelled
          console.log(`🔔 Ride ${rideRequestId} update received: Document deleted`);
          this.handleRideCancellation(rideRequestId, onRideCancelled);
        }
      }, (error) => {
        console.error('❌ Error listening for bid acceptance:', error);
      });

      // Store the listener for cleanup
      this.activeListeners.set(rideRequestId, unsubscribe);
      
      console.log(`🎧 Started listening for bid acceptance on ride ${rideRequestId}`);
      return unsubscribe;

    } catch (error) {
      console.error('❌ Error starting bid acceptance listener:', error);
      throw error;
    }
  }

  /**
   * Handle ride request document updates
   * @param {string} rideRequestId - Ride request ID
   * @param {Object} rideData - Updated ride data
   * @param {string} driverId - Driver's ID
   * @param {number} bidAmount - The bid amount
   * @param {Object} callbacks - Callback functions
   */
  handleRideRequestUpdate(rideRequestId, rideData, driverId, bidAmount, callbacks) {
    const { onBidAccepted, onRideCancelled, onBiddingExpired } = callbacks;

    console.log('🔄 Driver notification update:', {
      rideRequestId,
      status: rideData.status,
      driverId,
      acceptedDriverId: rideData.acceptedDriver?.driverId,
      acceptedDriver: rideData.acceptedDriver,
      cancelledBy: rideData.cancelledBy || rideData.canceledBy
    });

    switch (rideData.status) {
      case 'accepted':
        // Check if this driver's bid was accepted
        if (rideData.acceptedDriver?.driverId === driverId) {
          console.log('🎉 This driver\'s bid was accepted!');
          this.handleBidAcceptance(rideRequestId, rideData, bidAmount, onBidAccepted);
        } else {
          // Another driver's bid was accepted
          console.log('❌ Another driver\'s bid was accepted:', rideData.acceptedDriver?.driverId);
          this.handleBidRejection(rideRequestId, rideData, onBiddingExpired);
        }
        break;

      case 'cancelled':
      case 'expired':
        console.log('❌ CANCELLATION DETECTED - Calling handleRideCancellation for:', rideRequestId);
        this.handleRideCancellation(rideRequestId, onRideCancelled);
        break;

      case 'completed':
        this.handleRideCompletion(rideRequestId, rideData);
        break;

      case 'open_for_bids':
      case 'pending':
        // Still waiting for acceptance - no action needed
        // console.log(`⏳ Ride ${rideRequestId} still pending...`);
        break;

      default:
        console.log(`📊 Ride ${rideRequestId} status: ${rideData.status}`);
    }
  }

  /**
   * Handle successful bid acceptance
   * @param {string} rideRequestId - Ride request ID
   * @param {Object} rideData - Ride data
   * @param {number} bidAmount - Accepted bid amount
   * @param {Function} callback - Callback function
   */
  async handleBidAcceptance(rideRequestId, rideData, bidAmount, callback) {
    try {
      // console.log('🎉 BID ACCEPTED!', { rideRequestId, bidAmount });

      // Play success sound and haptic feedback
      await this.playBidAcceptedFeedback();

      // Speak bid accepted notification
      await speechService.speakBidAccepted();

      // Show system notification
      await this.showBidAcceptedNotification(rideData, bidAmount);

      // Call the callback if provided
      if (callback) {
        callback({
          rideRequestId,
          rideData,
          bidAmount,
          acceptedAt: rideData.acceptedAt || new Date(),
          rider: rideData.rider,
          pickup: rideData.pickup,
          destination: rideData.destination
        });
      }

      // Clean up this listener
      this.stopListening(rideRequestId);

    } catch (error) {
      console.error('❌ Error handling bid acceptance:', error);
    }
  }

  /**
   * Handle bid rejection (another driver's bid accepted)
   * @param {string} rideRequestId - Ride request ID
   * @param {Object} rideData - Ride data
   * @param {Function} callback - Callback function
   */
  async handleBidRejection(rideRequestId, rideData, callback) {
    try {
      console.log('❌ Bid not accepted - another driver was selected');

      // Play notification sound (less celebratory)
      await playNotificationSound();

      // Gentle haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Speak bid rejected notification
      await speechService.speakBidRejected();

      // Show system notification
      await this.showBidRejectedNotification();

      // Call the callback if provided
      if (callback) {
        callback({
          rideRequestId,
          reason: 'bid_not_selected',
          acceptedDriver: rideData.acceptedDriver
        });
      }

      // Clean up this listener
      this.stopListening(rideRequestId);
      
      // Restart listening for new ride requests since this bid was rejected
      this.restartRideRequestListening();

    } catch (error) {
      console.error('❌ Error handling bid rejection:', error);
    }
  }

  /**
   * Handle ride cancellation
   * @param {string} rideRequestId - Ride request ID
   * @param {Function} callback - Callback function
   */
  async handleRideCancellation(rideRequestId, callback) {
    try {
      console.log('❌ handleRideCancellation called for ride:', rideRequestId);
      console.log('❌ Callback function provided:', !!callback);

      // Play cancellation sound with error handling
      try {
        if (playRideCancelledSound) {
          await playRideCancelledSound();
          console.log('🔊 Cancellation sound played');
        }
      } catch (error) {
        console.warn('⚠️ Error playing ride cancelled sound:', error);
      }

      // Warning haptic feedback with error handling
      try {
        if (Haptics && Haptics.notificationAsync && Haptics.NotificationFeedbackType) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          console.log('📳 Haptic feedback triggered');
        }
      } catch (error) {
        console.warn('⚠️ Error with haptic feedback:', error);
      }

      // Speak ride cancelled notification
      try {
        await speechService.speakRideCancelled();
      } catch (error) {
        console.warn('⚠️ Error speaking ride cancelled notification:', error);
      }

      // Show system notification with error handling
      try {
        await this.showRideCancelledNotification();
        console.log('🔔 System notification shown');
      } catch (error) {
        console.warn('⚠️ Error showing ride cancelled notification:', error);
      }

      // Call the callback if provided
      if (callback) {
        try {
          console.log('📞 Calling cancellation callback...');
          callback({
            rideRequestId,
            reason: 'ride_cancelled'
          });
          console.log('✅ Cancellation callback executed successfully');
        } catch (error) {
          console.error('❌ Error in ride cancellation callback:', error);
        }
      } else {
        console.warn('⚠️ No callback provided for ride cancellation!');
      }

      // Clean up this listener
      try {
        this.stopListening(rideRequestId);
      } catch (error) {
        console.warn('⚠️ Error stopping listener:', error);
      }
      
      // Restart listening for new ride requests since the ride was cancelled
      try {
        this.restartRideRequestListening();
      } catch (error) {
        console.warn('⚠️ Error restarting ride request listening:', error);
      }

    } catch (error) {
      console.error('❌ Error handling ride cancellation:', error);
    }
  }

  /**
   * Handle ride completion
   * @param {string} rideRequestId - Ride request ID
   * @param {Object} rideData - Ride data
   */
  async handleRideCompletion(rideRequestId, rideData) {
    try {
      // console.log('✅ Ride completed:', rideRequestId);

      // Play completion sound
      await playRideCompletedSound();

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Speak ride completed notification
      await speechService.speakRideCompleted();

      // Show completion notification
      await this.showRideCompletedNotification(rideData);

      // Clean up this listener
      this.stopListening(rideRequestId);

    } catch (error) {
      console.error('❌ Error handling ride completion:', error);
    }
  }

  /**
   * Play audio and haptic feedback for bid acceptance
   */
  async playBidAcceptedFeedback() {
    try {
      // Play bid accepted sound
      await playBidAcceptedSound();
      
      // Strong success haptic pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Additional celebration pattern
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 400);

    } catch (error) {
      console.error('❌ Error playing bid accepted feedback:', error);
    }
  }

  /**
   * Show system notification for bid acceptance
   * @param {Object} rideData - Ride data
   * @param {number} bidAmount - Accepted bid amount
   */
  async showBidAcceptedNotification(rideData, bidAmount) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Congratulations!',
          body: `Your bid of $${bidAmount.toFixed(2)} was accepted!`,
          data: {
            type: 'bid_accepted',
            rideRequestId: rideData.id,
            bidAmount
          },
          sound: 'mixkit-achievement-bell-600.wav',
          priority: 'high'
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing bid accepted notification:', error);
    }
  }

  /**
   * Show system notification for bid rejection
   */
  async showBidRejectedNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bid Not Selected',
          body: 'Another driver was chosen for this ride. Keep trying!',
          data: {
            type: 'bid_rejected'
          },
          priority: 'default'
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing bid rejected notification:', error);
    }
  }

  /**
   * Show system notification for ride cancellation
   */
  async showRideCancelledNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Ride Cancelled',
          body: 'The ride request has been cancelled by the rider.',
          data: {
            type: 'ride_cancelled'
          },
          priority: 'default'
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing ride cancelled notification:', error);
    }
  }

  /**
   * Show system notification for ride completion
   * @param {Object} rideData - Ride data
   */
  async showRideCompletedNotification(rideData) {
    try {
      const earnings = rideData.finalPrice || rideData.estimatedPrice || 0;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Ride Completed!',
          body: `Great job! You earned $${earnings.toFixed(2)}`,
          data: {
            type: 'ride_completed',
            earnings,
            rideRequestId: rideData.id
          },
          sound: 'success.mp3',
          priority: 'high'
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing ride completed notification:', error);
    }
  }

  /**
   * Stop listening for a specific ride request
   * @param {string} rideRequestId - Ride request ID
   */
  stopListening(rideRequestId) {
    const listener = this.activeListeners.get(rideRequestId);
    if (listener) {
      listener(); // Call unsubscribe function
      this.activeListeners.delete(rideRequestId);
      this.bidAcceptanceCallbacks.delete(rideRequestId);
      // console.log(`🔇 Stopped listening for ride ${rideRequestId}`);
    }
  }

  /**
   * Stop all active listeners
   */
  stopAllListeners() {
    // console.log('🔇 Stopping all bid notification listeners...');
    
    for (const [rideRequestId, listener] of this.activeListeners) {
      listener(); // Call unsubscribe function
      // console.log(`🔇 Stopped listening for ride ${rideRequestId}`);
    }
    
    this.activeListeners.clear();
    this.bidAcceptanceCallbacks.clear();
    this.rideStatusCallbacks.clear();
  }

  /**
   * Get the count of active listeners
   * @returns {number} Number of active listeners
   */
  getActiveListenerCount() {
    return this.activeListeners.size;
  }

  /**
   * Check if listening for a specific ride
   * @param {string} rideRequestId - Ride request ID
   * @returns {boolean} True if listening
   */
  isListeningForRide(rideRequestId) {
    return this.activeListeners.has(rideRequestId);
  }

  /**
   * Start listening for ride status changes (cancellation, completion) after bid acceptance
   * @param {string} rideRequestId - The ride request ID
   * @param {string} driverId - Driver's ID
   * @param {Function} onRideCancelled - Callback when ride is cancelled
   * @param {Function} onRideCompleted - Callback when ride is completed
   * @returns {Function} Unsubscribe function
   */
  async startListeningForRideStatusChanges(rideRequestId, driverId, onRideCancelled = null, onRideCompleted = null) {
    try {
      // console.log('🎧 Starting ride status listener for:', rideRequestId);
      
      // Check if Firebase is available
      if (!this.db || !doc || !onSnapshot) {
        console.warn('⚠️ Firebase not available for ride status listening - using fallback');
        return () => {}; // Return empty unsubscribe function
      }

      // Create Firebase listener for ride request document
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      
      const unsubscribe = onSnapshot(rideRequestRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const rideData = docSnapshot.data();
          console.log('🔄 Ride status update:', {
            rideRequestId,
            status: rideData.status,
            driverId
          });
          
          switch (rideData.status) {
            case 'cancelled':
              // console.log('🚨 RIDE CANCELLATION DETECTED in status listener:', rideRequestId);
              if (onRideCancelled) {
                try {
                  onRideCancelled({
                    rideRequestId,
                    reason: 'ride_cancelled',
                    cancelledBy: rideData.cancelledBy
                  });
                } catch (error) {
                  console.error('❌ Error in ride cancellation callback from status listener:', error);
                }
              }
              try {
                this.stopListening(`${rideRequestId}_status`);
              } catch (error) {
                console.warn('⚠️ Error stopping status listener:', error);
              }
              break;
              
            case 'completed':
              // console.log('✅ RIDE COMPLETION DETECTED in status listener:', rideRequestId);
              if (onRideCompleted) {
                onRideCompleted({
                  rideRequestId,
                  rideData
                });
              }
              this.stopListening(`${rideRequestId}_status`);
              break;
              
            default:
              console.log(`📊 Ride ${rideRequestId} status: ${rideData.status}`);
          }
        } else {
          // console.log('🚨 Ride document deleted - treating as cancellation');
          if (onRideCancelled) {
            try {
              onRideCancelled({
                rideRequestId,
                reason: 'ride_cancelled',
                cancelledBy: 'unknown'
              });
            } catch (error) {
              console.error('❌ Error in ride cancellation callback from document deletion:', error);
            }
          }
          try {
            this.stopListening(`${rideRequestId}_status`);
          } catch (error) {
            console.warn('⚠️ Error stopping status listener after document deletion:', error);
          }
        }
      }, (error) => {
        console.error('❌ Error in ride status listener:', error);
      });

      // Store the listener for cleanup
      this.activeListeners.set(`${rideRequestId}_status`, unsubscribe);
      // console.log(`🎧 Started ride status listener for ${rideRequestId}`);
      return unsubscribe;

    } catch (error) {
      console.error('❌ Error starting ride status listener:', error);
      throw error;
    }
  }
}

// Export singleton instance
const driverBidNotificationService = new DriverBidNotificationService();
export default driverBidNotificationService;
