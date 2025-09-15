import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import RideRequestScreen from '@/screens/ride/RideRequestScreen';
// Safe service imports with error handling
let RideRequestService;
let RideRequestModal;
let DriverBidSubmissionScreen;
let DriverNotificationHandler;
let driverBidNotificationService;
let DriverStatusService;
let realTimeLocationService;
let simpleLocationService;
let locationServices = {};

try {
  RideRequestService = require('@/services/rideRequestService').default;
} catch (error) {
  console.warn('⚠️ RideRequestService import failed:', error.message);
  RideRequestService = {
    initialize: () => {},
    setRideRequestCallback: () => {},
    stopListening: () => {}
  };
}

try {
  RideRequestModal = require('@/components/RideRequestModal').default;
} catch (error) {
  console.warn('⚠️ RideRequestModal import failed:', error.message);
  RideRequestModal = ({ visible, onClose }) => null;
}

try {
  DriverBidSubmissionScreen = require('@/components/DriverBidSubmissionScreen').default;
  // console.log('✅ DriverBidSubmissionScreen imported successfully');
  // console.log('✅ Type of DriverBidSubmissionScreen:', typeof DriverBidSubmissionScreen);
} catch (error) {
  console.warn('⚠️ DriverBidSubmissionScreen import failed:', error.message);
  console.warn('⚠️ Using fallback component instead');
  DriverBidSubmissionScreen = ({ isVisible, onClose }) => {
    // console.log('🚨 FALLBACK COMPONENT CALLED with isVisible:', isVisible);
    return null;
  };
}

try {
  DriverNotificationHandler = require('@/components/DriverNotificationHandler').default;
} catch (error) {
  console.warn('⚠️ DriverNotificationHandler import failed:', error.message);
  DriverNotificationHandler = ({ driverId }) => null;
}

try {
  driverBidNotificationService = require('@/services/driverBidNotificationService').default;
} catch (error) {
  console.warn('⚠️ driverBidNotificationService import failed:', error.message);
  driverBidNotificationService = {
    initialize: () => {},
    startListeningForBidAcceptance: () => Promise.resolve(() => {}),
    startListeningForRideStatusChanges: () => Promise.resolve(() => {}),
    stopAllListeners: () => {}
  };
}

try {
  DriverStatusService = require('@/services/driverStatusService').default;
} catch (error) {
  console.warn('⚠️ DriverStatusService import failed:', error.message);
  DriverStatusService = {
    initialize: () => Promise.resolve(),
    listenForDriverStatus: () => {},
    getCurrentDriverStatus: () => Promise.resolve({ isOnline: false }),
    toggleOnlineStatus: () => Promise.resolve({ success: true }),
    startLocationUpdates: () => Promise.resolve(),
    stopLocationUpdates: () => Promise.resolve()
  };
}

try {
  const locationModule = require('@/services/location');
  locationServices = {
    getCurrentLocation: locationModule.getCurrentLocation || (() => Promise.reject()),
    startLocationTracking: locationModule.startLocationTracking || (() => Promise.resolve()),
    stopLocationTracking: locationModule.stopLocationTracking || (() => Promise.resolve())
  };
} catch (error) {
  console.warn('⚠️ Location services import failed:', error.message);
  locationServices = {
    getCurrentLocation: () => Promise.reject(new Error('Location service not available')),
    startLocationTracking: () => Promise.resolve(),
    stopLocationTracking: () => Promise.resolve()
  };
}

const { getCurrentLocation, startLocationTracking, stopLocationTracking } = locationServices;

// Real-time and simple location service imports
try {
  realTimeLocationService = require('@/services/realTimeLocationService').default;
} catch (error) {
  console.warn('⚠️ realTimeLocationService import failed:', error.message);
  realTimeLocationService = {
    startTracking: () => Promise.resolve(),
    stopTracking: () => Promise.resolve()
  };
}

try {
  simpleLocationService = require('@/services/simpleLocationService').default;
} catch (error) {
  console.warn('⚠️ simpleLocationService import failed:', error.message);
  simpleLocationService = {
    startTracking: () => Promise.resolve(),
    stopTracking: () => Promise.resolve()
  };
}

// Safe utility imports
let ConnectionTestService;
let DebugHelper;
let FirebaseIndexHelper;
let InitializationTest;
let TestDriverSetup;
let playRideRequestSound;

try {
  ConnectionTestService = require('@/utils/connectionTest').default;
} catch (error) {
  console.warn('⚠️ ConnectionTestService import failed:', error.message);
  ConnectionTestService = { test: () => Promise.resolve() };
}

try {
  DebugHelper = require('@/utils/debugHelper').default;
} catch (error) {
  console.warn('⚠️ DebugHelper import failed:', error.message);
  DebugHelper = { log: () => {} };
}

try {
  FirebaseIndexHelper = require('@/utils/firebaseIndexHelper').default;
} catch (error) {
  console.warn('⚠️ FirebaseIndexHelper import failed:', error.message);
  FirebaseIndexHelper = { checkIndexRequirements: () => {} };
}

try {
  InitializationTest = require('@/utils/initializationTest').default;
} catch (error) {
  console.warn('⚠️ InitializationTest import failed:', error.message);
  InitializationTest = { run: () => Promise.resolve() };
}

try {
  TestDriverSetup = require('@/utils/testDriverSetup').default;
} catch (error) {
  console.warn('⚠️ TestDriverSetup import failed:', error.message);
  TestDriverSetup = { setup: () => Promise.resolve() };
}

try {
  const soundEffects = require('@/utils/soundEffects');
  playRideRequestSound = soundEffects.playRideRequestSound || (() => {});
} catch (error) {
  console.warn('⚠️ Sound effects import failed:', error.message);
  playRideRequestSound = () => {};
}
// Safe import for LocationTestPanel
let LocationTestPanel;
try {
  LocationTestPanel = require('@/components/LocationTestPanel').default;
} catch (error) {
  console.warn('LocationTestPanel not available:', error.message);
  LocationTestPanel = ({ visible, onClose }) => null; // Fallback component
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Navigation Menu Component
const NavigationMenu = ({ visible, onClose, navigation, user }) => {
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'earnings', title: 'Earnings', icon: 'wallet', screen: 'Earnings' },
    { id: 'trips', title: 'Trip History', icon: 'car', screen: 'TripHistory' },
    { id: 'profile', title: 'Profile', icon: 'person', screen: 'Profile' },
    { id: 'settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'support', title: 'Support', icon: 'help-circle', screen: 'Support' },
  ];

  const handleMenuItemPress = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleSignOut = () => {
    onClose();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <TouchableOpacity style={styles.menuBackdrop} onPress={onClose} />
        <View style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderLeft}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{user?.displayName || 'Driver'}</Text>
                <Text style={styles.menuUserEmail}>{user?.email || 'driver@anyryde.com'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeMenuButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.secondary[500]} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <Ionicons name={item.icon} size={24} color={COLORS.secondary[700]} />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[400]} />
              </TouchableOpacity>
            ))}
            
            {/* Divider */}
            <View style={styles.menuDivider} />
            
            {/* Sign Out */}
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out" size={24} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[400]} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const WEB_ONBOARDING_URL = 'https://anyryde.com/register';

const HomeScreen = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // Driver status state
  const [isOnline, setIsOnline] = useState(false);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [ridesCompleted, setRidesCompleted] = useState(0);
  const [driverRating, setDriverRating] = useState(4.8);
  const [activeRideId, setActiveRideId] = useState(null);
  
  // Ride request modal state
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [showRideRequestModal, setShowRideRequestModal] = useState(false);
  const [showBidSubmissionModal, setShowBidSubmissionModal] = useState(false);
  
  // Debug logging for modal state
  useEffect(() => {
    // console.log('🎯 Modal state changed:', {
    //   showBidSubmissionModal,
    //   showRideRequestModal,
    //   rideRequest: !!rideRequest
    // });
  }, [showBidSubmissionModal, showRideRequestModal, rideRequest]);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [showLocationTestPanel, setShowLocationTestPanel] = useState(false);
  
  // Track when modal was explicitly closed to prevent immediate reopening
  const [modalJustClosed, setModalJustClosed] = useState(false);
  
  // Track declined ride request IDs to prevent reopening same requests
  // Use ref to ensure callback always has current value
  const ignoredRideRequestIds = useRef(new Set());
  
  // Clear ignored ride requests every 30 minutes to prevent permanent blocking
  useEffect(() => {
    const clearIgnoredRequests = setInterval(() => {
      if (ignoredRideRequestIds.current.size > 0) {
        // console.log('🧹 DRIVER DEBUG: Clearing', ignoredRideRequestIds.current.size, 'ignored ride requests (30min cleanup)');
        ignoredRideRequestIds.current = new Set();
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(clearIgnoredRequests);
  }, []);

  // Determine approval status - check both approval status and onboarding completion
  const isApproved = user?.approvalStatus?.status === 'approved' && user?.onboardingStatus?.completed === true;

  // Initialize services when component mounts
  useEffect(() => {
    const initializeServices = async () => {
      if (user && user.id) {
        try {
          // Initialize services with error handling
          try {
            RideRequestService.initialize(user.id);
            
            // Force restart listening to break out of any existing loops
            if (typeof RideRequestService.forceRestartListening === 'function') {
              RideRequestService.forceRestartListening();
              // console.log('🔄 Force restarted ride request listening on app open');
            }
          } catch (error) {
            console.warn('⚠️ RideRequestService initialization failed:', error);
          }

          try {
            if (DriverStatusService && typeof DriverStatusService.initialize === 'function') {
              await DriverStatusService.initialize(user.id, {
                email: user?.email || '',
                displayName: user?.displayName || 'Driver'
              });
            }
          } catch (error) {
            console.warn('⚠️ DriverStatusService initialization failed:', error);
          }

          try {
            if (driverBidNotificationService && typeof driverBidNotificationService.initialize === 'function') {
              driverBidNotificationService.initialize(user.id);
            }
          } catch (error) {
            console.warn('⚠️ driverBidNotificationService initialization failed:', error);
          }

          // Initialize real-time location service
          try {
            if (realTimeLocationService && typeof realTimeLocationService.initialize === 'function') {
              await realTimeLocationService.initialize(user.id);
              // console.log('✅ Real-time location service initialized for driver:', user.id);
            }
          } catch (error) {
            console.warn('⚠️ realTimeLocationService initialization failed:', error);
          }
          
          // Set callback for new ride requests
          try {
            if (RideRequestService && typeof RideRequestService.setRideRequestCallback === 'function') {
              RideRequestService.setRideRequestCallback((newRideRequest) => {
                try {
                  if (newRideRequest) {
                    // console.log('🎯 New ride request received:', newRideRequest);
                    // console.log('🎯 New ride request pickup:', newRideRequest.pickup);
                    // console.log('🎯 New ride request dropoff:', newRideRequest.dropoff);
                    // console.log('🚪 DRIVER DEBUG: modalJustClosed state:', modalJustClosed);
                    
                    // Don't open modal if it was just closed
                    if (modalJustClosed) {
                      // console.log('🚫 DRIVER DEBUG: Modal was just closed - ignoring ride request to prevent reopening');
                      return;
                    }
                    
                    // Check if this ride request ID has been previously ignored/declined
                    if (ignoredRideRequestIds.current.has(newRideRequest.id)) {
                      // console.log('🚫 DRIVER DEBUG: Ride request already ignored/declined - not showing modal:', newRideRequest.id);
                      // console.log('🚫 DRIVER DEBUG: Current ignored list:', Array.from(ignoredRideRequestIds.current));
                      return;
                    }
                    
                    // Set ride request first, then show modal after a brief delay to ensure state is updated
                    setRideRequest(newRideRequest);
                    
                    // Use setTimeout to ensure the rideRequest state is updated before showing modal
                    setTimeout(() => {
                      try {
                        // Double-check modalJustClosed in case it changed during the timeout
                        if (modalJustClosed) {
                          // console.log('🚫 DRIVER DEBUG: Modal was closed during timeout - aborting modal open');
                          return;
                        }
                        
                        // Double-check ignored list in case it changed during timeout
                        if (ignoredRideRequestIds.current.has(newRideRequest.id)) {
                          // console.log('🚫 DRIVER DEBUG: Ride request was ignored during timeout - aborting modal open:', newRideRequest.id);
                          return;
                        }
                        
                        // console.log('🎯 Showing bid submission modal...');
                        setShowBidSubmissionModal(true);
                      } catch (modalError) {
                        console.warn('⚠️ Bid submission modal failed, using fallback:', modalError);
                        setShowRideRequestModal(true);
                      }
                    }, 100); // Small delay to ensure state update
                    
                    try {
                      playRideRequestSound(); // Play notification sound
                    } catch (soundError) {
                      // Silent fallback for sound errors
                    }
                  }
                } catch (callbackError) {
                  console.error('❌ Callback error:', callbackError);
                }
              });
            }
          } catch (error) {
            // Silent fallback for service setup errors
          }

          // Listen for driver status changes
          try {
            if (DriverStatusService && typeof DriverStatusService.listenForDriverStatus === 'function') {
              DriverStatusService.listenForDriverStatus((driverStatus) => {
                if (driverStatus && typeof driverStatus.isOnline !== 'undefined') {
                  setIsOnline(driverStatus.isOnline);
                }
              });
            }
          } catch (error) {
            console.warn('⚠️ Failed to set driver status listener:', error);
          }

          // Get initial status with timeout
          try {
            if (DriverStatusService && typeof DriverStatusService.getCurrentDriverStatus === 'function') {
              const status = await Promise.race([
                DriverStatusService.getCurrentDriverStatus(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 3000)
                )
              ]);
              
              if (status && typeof status.isOnline !== 'undefined') {
                setIsOnline(status.isOnline);
              } else {
                setIsOnline(false);
              }
            } else {
              setIsOnline(false);
            }
          } catch (error) {
            console.warn('⚠️ Failed to get initial driver status:', error);
            setIsOnline(false);
          }

          // Mark as initialized regardless of individual service results
          setServicesInitialized(true);
          
        } catch (error) {
          console.error('❌ Error during service initialization:', error);
          // Still mark as initialized to allow app to function
          setServicesInitialized(true);
          setIsOnline(false);
        }
      } else {
        setServicesInitialized(false);
      }
    };

    initializeServices();

    return () => {
      try {
        RideRequestService.cleanup();
        DriverStatusService.cleanup();
        if (driverBidNotificationService && typeof driverBidNotificationService.stopAllListeners === 'function') {
          driverBidNotificationService.stopAllListeners();
        }
        setServicesInitialized(false);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [user]);

  // Monitor servicesInitialized state changes
  useEffect(() => {
    // State change monitoring removed for cleaner logs
  }, [servicesInitialized]);

  // Restart ride request listening when driver is online and back on home screen
  useEffect(() => {
    if (isOnline && servicesInitialized && !showBidSubmissionModal && !showRideRequestModal) {
      try {
        // console.log('🔄 Driver is online and on home screen, ensuring ride request listening is active');
        if (RideRequestService && typeof RideRequestService.startListeningForRideRequests === 'function') {
          RideRequestService.startListeningForRideRequests();
        }
      } catch (error) {
        console.warn('⚠️ Failed to restart ride request listening:', error);
      }
    } else if (!isOnline) {
      try {
        // console.log('🛑 Driver is offline, stopping ride request listening');
        if (RideRequestService && typeof RideRequestService.stopListeningForRideRequests === 'function') {
          RideRequestService.stopListeningForRideRequests();
        }
      } catch (error) {
        console.warn('⚠️ Failed to stop ride request listening:', error);
      }
    }
  }, [isOnline, servicesInitialized, showBidSubmissionModal, showRideRequestModal]);

  // Location tracking functions
  const startLocationUpdates = async () => {
    try {
      await DriverStatusService.startLocationUpdates();
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  // Handle ride request modal close
  const handleRideRequestModalClose = () => {
    setShowRideRequestModal(false);
    setRideRequest(null);
  };

  // Handle bid submission modal close
  const handleBidSubmissionModalClose = () => {
    // console.log('🚪 DRIVER DEBUG: handleBidSubmissionModalClose called');
    // console.log('🚪 DRIVER DEBUG: Current modal state before close:', showBidSubmissionModal);
    
    // Add current ride request to ignored list to prevent reopening
    if (rideRequest?.id) {
      ignoredRideRequestIds.current.add(rideRequest.id);
      // console.log('🚫 DRIVER DEBUG: Added ride request to ignored list:', rideRequest.id);
      // console.log('🚫 DRIVER DEBUG: Ignored list now contains:', Array.from(ignoredRideRequestIds.current));
    }
    
    setShowBidSubmissionModal(false);
    setRideRequest(null);
    setModalJustClosed(true); // Prevent immediate reopening
    
    // Clear the "just closed" flag after 2 seconds
    setTimeout(() => {
      setModalJustClosed(false);
      // console.log('🚪 DRIVER DEBUG: Modal cooldown period ended - can open again');
    }, 2000);
    
    // console.log('🚪 DRIVER DEBUG: Modal close requested - should be false now');
  };

  // Handle successful bid submission
  const handleBidSubmitted = (bidData) => {
    // console.log('🎯 Bid submitted successfully:', bidData);
    Alert.alert(
      'Bid Submitted!',
      `Your bid of $${bidData.bidAmount.toFixed(2)} has been submitted. We'll notify you when the rider responds.`
    );
  };

  // Handle bid acceptance
  const handleBidAccepted = async (acceptanceData) => {
    // console.log('🎉 Bid accepted!', acceptanceData);
    setShowBidSubmissionModal(false);
    
    // Fetch the complete ride request data from Firebase to ensure we have all the details
    let completeRideRequest = rideRequest;
    try {
      const { doc, getDoc } = require('firebase/firestore');
      const { db } = require('@/config/firebase');
      const rideRequestRef = doc(db, 'rideRequests', acceptanceData.rideRequestId);
      const rideRequestSnap = await getDoc(rideRequestRef);
      if (rideRequestSnap.exists()) {
        completeRideRequest = rideRequestSnap.data();
        // console.log('🗺️ Fetched complete ride request from Firebase:', completeRideRequest);
        // console.log('🗺️ Firebase pickup data:', completeRideRequest.pickup);
        // console.log('🗺️ Firebase dropoff data:', completeRideRequest.dropoff);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch ride request from Firebase, using cached data:', error);
    }
    
    // Create ride data for navigation using the actual ride request data
    const rideData = {
      rideId: acceptanceData.rideRequestId,
      customerId: completeRideRequest?.riderId || 'customer',
      customerName: completeRideRequest?.riderInfo?.name || 'Rider',
      customerPhone: completeRideRequest?.riderInfo?.phone || '555-1234',
      pickup: {
        address: completeRideRequest?.pickup?.address || 'Pickup Location',
        coordinates: {
          latitude: completeRideRequest?.pickup?.lat || completeRideRequest?.pickup?.coordinates?.lat || completeRideRequest?.pickup?.coordinates?.latitude || 35.3733,
          longitude: completeRideRequest?.pickup?.lng || completeRideRequest?.pickup?.coordinates?.lng || completeRideRequest?.pickup?.coordinates?.longitude || -119.0187
        }
      },
      destination: {
        address: completeRideRequest?.dropoff?.address || completeRideRequest?.destination?.address || 'Destination',
        coordinates: {
          latitude: completeRideRequest?.dropoff?.lat || completeRideRequest?.destination?.lat || completeRideRequest?.dropoff?.coordinates?.lat || completeRideRequest?.destination?.coordinates?.lat || completeRideRequest?.dropoff?.coordinates?.latitude || completeRideRequest?.destination?.coordinates?.latitude || 35.3733,
          longitude: completeRideRequest?.dropoff?.lng || completeRideRequest?.destination?.lng || completeRideRequest?.dropoff?.coordinates?.lng || completeRideRequest?.destination?.coordinates?.lng || completeRideRequest?.dropoff?.coordinates?.longitude || completeRideRequest?.destination?.coordinates?.longitude || -119.0187
        }
      },
      estimatedDistance: completeRideRequest?.estimatedDistance || completeRideRequest?.distanceInMiles || 'Unknown',
      estimatedDuration: completeRideRequest?.estimatedDuration || 'Unknown',
      bidAmount: acceptanceData.bidAmount || completeRideRequest?.acceptedBid,
      state: 'en-route-pickup'
    };
    
    // console.log('🗺️ Navigation ride data:', rideData);
    // console.log('🗺️ Pickup coordinates:', rideData.pickup.coordinates);
    // console.log('🗺️ Destination coordinates:', rideData.destination.coordinates);
    // console.log('🗺️ Complete ride request data:', completeRideRequest);
    // console.log('🗺️ completeRideRequest.pickup:', completeRideRequest?.pickup);
    // console.log('🗺️ completeRideRequest.dropoff:', completeRideRequest?.dropoff);
    // console.log('🗺️ completeRideRequest.pickup.lat:', completeRideRequest?.pickup?.lat);
    // console.log('🗺️ completeRideRequest.pickup.lng:', completeRideRequest?.pickup?.lng);
    setRideRequest(null);
    
    // Start listening for ride status changes (cancellation, completion)
    // console.log('🎧 Starting ride status listener for cancellation detection');
    try {
      if (driverBidNotificationService && driverBidNotificationService.startListeningForRideStatusChanges) {
        await driverBidNotificationService.startListeningForRideStatusChanges(
          acceptanceData.rideRequestId,
          user?.uid || user?.id,
          handleRideCancelledDuringBidding,
          (completionData) => {
            // console.log('✅ Ride completed:', completionData);
            // Handle ride completion if needed
          }
        );
        // console.log('✅ Ride status listener started');
      }
    } catch (error) {
      console.error('❌ Error starting ride status listener:', error);
      // Continue anyway - don't block the user flow
    }
    
    // Start active location tracking for rider to track driver
    // console.log('🎯 Starting active location tracking for accepted ride');
    try {
      // Try real-time location service first
      if (realTimeLocationService && realTimeLocationService.startTracking) {
        await realTimeLocationService.startTracking();
        // console.log('✅ Real-time location service started');
      }
      
      // Try simple location service as backup
      if (simpleLocationService && simpleLocationService.startTracking) {
        await simpleLocationService.startTracking();
        // console.log('✅ Simple location service started');
      }
      
      // Also use the general location tracking as additional backup
      if (startLocationTracking) {
        await startLocationTracking();
        // console.log('✅ General location tracking started');
      }
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      // Continue anyway - don't block the user flow
    }
    
    // Navigate to ride details or active ride screen
    Alert.alert(
      'Congratulations!',
      `Your bid was accepted! Ready to pick up the rider?`,
      [
        { text: 'View Details', onPress: () => navigation.navigate('RideDetails', { rideRequestId: acceptanceData.rideRequestId, rideData }) },
        { text: 'Start Navigation', onPress: () => navigation.navigate('Navigation', { rideData }) }
      ]
    );
  };

  // Handle ride cancellation during bidding
  const handleRideCancelledDuringBidding = async (cancellationData) => {
    // console.log('❌ HOME SCREEN: Ride cancelled during bidding:', cancellationData);
    
    try {
      // Stop all location tracking services
      // console.log('🛑 Stopping location tracking services...');
      try {
        if (realTimeLocationService && realTimeLocationService.stopTracking) {
          await realTimeLocationService.stopTracking();
          // console.log('✅ Real-time location service stopped');
        }
      } catch (error) {
        console.warn('⚠️ Error stopping real-time location service:', error);
      }
      
      try {
        if (simpleLocationService && simpleLocationService.stopTracking) {
          await simpleLocationService.stopTracking();
          // console.log('✅ Simple location service stopped');
        }
      } catch (error) {
        console.warn('⚠️ Error stopping simple location service:', error);
      }
      
      try {
        if (stopLocationTracking) {
          await stopLocationTracking();
          // console.log('✅ General location tracking stopped');
        }
      } catch (error) {
        console.warn('⚠️ Error stopping general location tracking:', error);
      }
      
      // Stop all bid notification listeners
      if (driverBidNotificationService && driverBidNotificationService.stopAllListeners) {
        driverBidNotificationService.stopAllListeners();
        // console.log('✅ All bid notification listeners stopped');
      }
      
      // Clear all state
      setShowBidSubmissionModal(false);
      setRideRequest(null);
      setActiveRideId(null);
      
      // Force reset modal state to prevent any lingering display issues
      setTimeout(() => {
        setShowBidSubmissionModal(false);
        // console.log('🔄 Force reset modal state after cancellation');
      }, 100);
      
      // Add cancelled ride to ignored list
      if (cancellationData?.rideRequestId) {
        ignoredRideRequestIds.current.add(cancellationData.rideRequestId);
        // console.log('🚫 Added cancelled ride to ignored list:', cancellationData.rideRequestId);
      }
      
      // Navigate back to HomeScreen if we're on a different screen
      // console.log('🏠 Navigating back to HomeScreen after ride cancellation');
      if (navigation) {
        // Use reset to ensure we're back at the HomeScreen and clear the navigation stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        // console.log('✅ Navigation stack reset to HomeScreen');
      }
      
      // Restart ride request listening for new requests
      if (RideRequestService && typeof RideRequestService.startListeningForRideRequests === 'function') {
        RideRequestService.startListeningForRideRequests();
        // console.log('🔄 Restarted ride request listening for new requests');
      }
      
      // console.log('✅ Ride cancellation cleanup completed');
      
    } catch (error) {
      console.error('❌ Error during ride cancellation cleanup:', error);
    }
    
    Alert.alert(
      'Ride Cancelled',
      'The ride was cancelled by the rider.',
      [{ text: 'OK' }]
    );
  };

  // Handle notification handler callbacks
  const handleNavigateToRide = (rideRequestId, screen) => {
    // console.log('📱 Navigate to ride:', rideRequestId, screen);
    
    // Create ride data if we have rideRequest available
    const rideData = rideRequest ? {
      rideId: rideRequestId,
      customerId: rideRequest?.riderId || 'customer',
      customerName: rideRequest?.riderInfo?.name || 'Rider',
      customerPhone: rideRequest?.riderInfo?.phone || '555-1234',
      pickup: {
        address: rideRequest?.pickup?.address || 'Pickup Location',
        coordinates: {
          latitude: rideRequest?.pickup?.lat || rideRequest?.pickup?.coordinates?.lat,
          longitude: rideRequest?.pickup?.lng || rideRequest?.pickup?.coordinates?.lng
        }
      },
      destination: {
        address: rideRequest?.dropoff?.address || rideRequest?.destination?.address || 'Destination',
        coordinates: {
          latitude: rideRequest?.dropoff?.lat || rideRequest?.destination?.lat || rideRequest?.dropoff?.coordinates?.lat || rideRequest?.destination?.coordinates?.lat,
          longitude: rideRequest?.dropoff?.lng || rideRequest?.destination?.lng || rideRequest?.dropoff?.coordinates?.lng || rideRequest?.destination?.coordinates?.lng
        }
      },
      estimatedDistance: rideRequest?.estimatedDistance || rideRequest?.distanceInMiles || 'Unknown',
      estimatedDuration: rideRequest?.estimatedDuration || 'Unknown',
      state: 'en-route-pickup'
    } : null;
    
    switch (screen) {
      case 'ride_details':
        navigation.navigate('RideDetails', { rideRequestId, rideData });
        break;
      case 'navigation':
        navigation.navigate('Navigation', { rideData });
        break;
      case 'contact_rider':
        navigation.navigate('ContactRider', { rideRequestId, rideData });
        break;
      default:
        navigation.navigate('RideDetails', { rideRequestId, rideData });
    }
  };
  


  // Handle online/offline toggle
  const handleStatusToggle = async () => {
    try {
      // Check if services are initialized
      if (!user || !user.id) {
        Alert.alert('Error', 'User not authenticated. Please sign in again.');
        return;
      }

      if (!servicesInitialized) {
        Alert.alert('Error', 'Services are still initializing. Please wait a moment and try again.');
        return;
      }

      if (isOnline) {
        Alert.alert(
          'Go Offline',
          'Are you sure you want to go offline? You will stop receiving ride requests.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go Offline', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await DriverStatusService.goOffline();
                } catch (error) {
                  console.error('Error going offline:', error);
                  Alert.alert('Error', 'Failed to go offline. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        await DriverStatusService.goOnline();
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  // Status button configuration
  const statusConfig = !servicesInitialized
    ? {
        text: 'INITIALIZING',
        subtext: 'Setting up services...',
        backgroundColor: COLORS.secondary,
        icon: 'hourglass'
      }
    : isOnline 
      ? {
          text: 'ONLINE',
          subtext: 'Receiving ride requests',
          backgroundColor: COLORS.success,
          icon: 'radio-button-on'
        }
      : {
          text: 'OFFLINE', 
          subtext: 'Tap to go online',
          backgroundColor: COLORS.offline,
          icon: 'radio-button-off'
        };

  // Handle ride request actions
  const handleAcceptRide = (request) => {
    setShowRideRequest(false);
    setActiveRideId(request.customerId); // Set active ride
    navigation.navigate('ActiveRide', { 
      rideData: {
        ...request,
        rideId: `ride_${Date.now()}`,
        bidAmount: request.companyBid,
        state: 'ride-accepted'
      }
    });
  };

  const handleDeclineRide = (request, reason) => {
    setShowRideRequest(false);
    const reasonText = reason === 'timeout' ? 'automatically declined due to timeout' : 'declined';
    Alert.alert('Ride Declined', `Request ${reasonText}`);
  };

  const handleCustomBid = (request, amount, bidType) => {
    setShowRideRequest(false);
    setActiveRideId(request.customerId); // Set active ride
    navigation.navigate('ActiveRide', { 
      rideData: {
        ...request,
        rideId: `ride_${Date.now()}`,
        bidAmount: amount,
        state: 'bid-submitted'
      }
    });
  };

  // Demo function to trigger ride request
  const triggerDemoRideRequest = () => {
    if (!isOnline) {
      Alert.alert('Go Online First', 'You need to be online to receive ride requests');
      return;
    }
    playRideRequestSound();
    setShowRideRequest(true);
  };

  // Test connection functionality
  const testConnection = async () => {
    try {
      Alert.alert(
        'Test Connection',
        'This will run comprehensive tests to verify the rider-driver connection. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run Tests',
            onPress: async () => {
              await ConnectionTestService.runAllTests();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Test Error', 'Failed to run connection tests');
    }
  };

  // Debug functionality
  const runDebugCheck = async () => {
    try {
      const result = await DebugHelper.runDebugCheck();
      Alert.alert(
        'Debug Check Complete',
        result.success ? 'All checks passed!' : 'Some checks failed. Check console for details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to run debug check');
    }
  };

  // Show Firebase index information
  const showIndexInfo = () => {
    FirebaseIndexHelper.logIndexRequirements();
    Alert.alert(
      'Firebase Index Info',
      'Index requirements have been logged to the console. Check the console for details and creation links.',
      [{ text: 'OK' }]
    );
  };

  // Test initialization
  const testInitialization = async () => {
    try {
      if (!user || !user.id) {
        Alert.alert('Error', 'User not authenticated. Please sign in first.');
        return;
      }

      Alert.alert(
        'Test Initialization',
        'This will test service initialization and methods. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run Test',
            onPress: async () => {
              await InitializationTest.testServiceInitialization(user.id, {
                email: user.email,
                displayName: user.displayName
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Test Error', 'Failed to run initialization test');
    }
  };

  // Debug current state
  const debugCurrentState = () => {
    Alert.alert(
      'Debug Info',
      `Services Initialized: ${servicesInitialized}\nIs Online: ${isOnline}\nUser: ${user ? 'Authenticated' : 'Not authenticated'}\nUser UID: ${user?.id || 'null'}`,
      [{ text: 'OK' }]
    );
  };

  // Force initialization completion
  const forceInitialization = () => {
    setIsOnline(false);
    setServicesInitialized(true);
    Alert.alert('Success', 'Initialization has been forced to complete.');
  };

  // Simple initialization for testing
  const simpleInitialization = () => {
    try {
      // Basic initialization without complex services
      setIsOnline(false);
      setServicesInitialized(true);
      Alert.alert('Success', 'Simple initialization completed successfully.');
    } catch (error) {
      console.error('❌ Simple initialization failed:', error);
      Alert.alert('Error', 'Simple initialization failed: ' + error.message);
    }
  };

  // Test driver setup functions
  const setupTestDriver = async () => {
    try {
      Alert.alert(
        'Setup Test Driver',
        'This will create a test driver profile and rider profile for testing. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Setup',
            onPress: async () => {
              try {
                const result = await TestDriverSetup.runComprehensiveTest();
                if (result.success) {
                  Alert.alert('Success', 'Test driver setup completed successfully!');
                } else {
                  Alert.alert('Partial Success', `Test completed with warnings: ${result.error}`);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to setup test driver: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to setup test driver');
    }
  };

  const createTestRideRequest = async () => {
    try {
      Alert.alert(
        'Create Test Ride Request',
        'This will create a test ride request for the test driver. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: async () => {
              try {
                const result = await TestDriverSetup.createTestRideRequest();
                Alert.alert('Success', `Test ride request created: ${result.rideRequestId}`);
              } catch (error) {
                Alert.alert('Error', 'Failed to create test ride request: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create test ride request');
    }
  };

  const simulateMultipleRideRequests = async () => {
    try {
      Alert.alert(
        'Simulate Multiple Ride Requests',
        'This will create 3 test ride requests with 2-second intervals. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate',
            onPress: async () => {
              try {
                const results = await TestDriverSetup.simulateMultipleRideRequests(3, 2000);
                const successCount = results.filter(r => r.success).length;
                Alert.alert('Success', `Created ${successCount} test ride requests successfully!`);
              } catch (error) {
                Alert.alert('Error', 'Failed to simulate ride requests: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate ride requests');
    }
  };

  const cleanupTestData = async () => {
    try {
      Alert.alert(
        'Cleanup Test Data',
        'This will mark the test driver as offline. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Cleanup',
            onPress: async () => {
              try {
                await TestDriverSetup.cleanupTestData();
                Alert.alert('Success', 'Test data cleanup completed!');
              } catch (error) {
                Alert.alert('Error', 'Failed to cleanup test data: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup test data');
    }
  };

  // Pending approval banner
  const PendingApprovalBanner = () => (
    <View style={styles.pendingBanner}>
      <Ionicons name="alert-circle" size={20} color={COLORS.warning} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pendingBannerText}>
          Your account is pending approval. Please complete onboarding on the web to unlock all features.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.pendingBannerButton}
        onPress={() => Linking.openURL(WEB_ONBOARDING_URL)}
      >
        <Text style={styles.pendingBannerButtonText}>Continue Onboarding</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Pending Approval Banner */}
      {!isApproved && <PendingApprovalBanner />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowNavigationMenu(true)}
        >
          <Ionicons name="menu" size={24} color={COLORS.secondary[700]} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>{user?.displayName || 'Driver'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={40} color={COLORS.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Main content, restrict features if not approved */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Online/Offline Status Card */}
        <View style={styles.statusCard}>
          {/* Online/Offline Toggle - disabled if not approved or services not initialized */}
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: statusConfig.backgroundColor, opacity: (isApproved && servicesInitialized) ? 1 : 0.5 }]}
            onPress={(isApproved && servicesInitialized) ? handleStatusToggle : undefined}
            disabled={!isApproved || !servicesInitialized}
          >
            <Ionicons 
              name={statusConfig.icon} 
              size={24} 
              color={COLORS.white} 
              style={styles.statusIcon}
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusText}>{statusConfig.text}</Text>
              <Text style={styles.statusSubtext}>{statusConfig.subtext}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        </View>

        {/* Earnings Today Card */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Earnings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>${currentEarnings.toFixed(2)}</Text>
          <View style={styles.earningsDetails}>
            <View style={styles.earningsItem}>
              <Ionicons name="car" size={16} color={COLORS.secondary[500]} />
              <Text style={styles.earningsItemText}>{ridesCompleted} rides</Text>
            </View>
            <View style={styles.earningsItem}>
              <Ionicons name="time" size={16} color={COLORS.secondary[500]} />
              <Text style={styles.earningsItemText}>8h 30m online</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{driverRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary[500]} />
            <Text style={styles.statValue}>97%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
        </View>

        {/* Active Ride Card (if applicable) */}
        {activeRideId && (
          <View style={styles.activeRideCard}>
            <View style={styles.activeRideHeader}>
              <Text style={styles.activeRideTitle}>Active Ride</Text>
              <View style={styles.activeRideHeaderRight}>
                <View style={styles.activeRideBadge}>
                  <Text style={styles.activeRideBadgeText}>EN ROUTE</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeActiveRide}
                  onPress={() => setActiveRideId(null)}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.activeRideDetails}>
              <Text style={styles.activeRideText}>Pickup: 123 Main Street, Downtown</Text>
              <Text style={styles.activeRideText}>Customer: Sarah M.</Text>
              <Text style={styles.activeRideText}>ETA: 8 minutes</Text>
            </View>
            <TouchableOpacity 
              style={styles.continueRideButton}
              onPress={() => navigation.navigate('ActiveRide', { 
                rideData: {
                  rideId: activeRideId,
                  state: 'en-route-pickup'
                }
              })}
            >
              <Text style={styles.continueRideButtonText}>Continue Ride</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('AnalyticsDashboard')}
            >
              <Ionicons name="analytics" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('DriverToolsDashboard')}
            >
              <Ionicons name="construct" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Driver Tools</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('SustainabilityDashboard')}
            >
              <Ionicons name="leaf" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Sustainability</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CommunityDashboard')}
            >
              <Ionicons name="people" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Community</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('SafetyDashboard')}
            >
              <Ionicons name="shield-checkmark" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CommunicationDashboard')}
            >
              <Ionicons name="chatbubbles" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Communication</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('VehicleDashboard')}
            >
              <Ionicons name="car-sport" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('PaymentDashboard')}
            >
              <Ionicons name="card" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('DynamicPricingDashboard')}
            >
              <Ionicons name="trending-up" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>AI Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('GamificationDashboard')}
            >
              <Ionicons name="star" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Gamification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('AccessibilityDashboard')}
            >
              <Ionicons name="accessibility" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Accessibility</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('WellnessDashboard')}
            >
              <Ionicons name="heart" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Wellness</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Ionicons name="wallet" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <Ionicons name="car-sport" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Trip History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Support')}
            >
              <Ionicons name="help-circle" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Section (for testing) */}
        <View style={styles.demoSection}>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={triggerDemoRideRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Simulate Ride Request</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.info, marginTop: 12 }]}
              onPress={testConnection}
              activeOpacity={0.8}
            >
              <Ionicons name="bug" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Test Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.warning, marginTop: 12 }]}
              onPress={runDebugCheck}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Debug Check</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.gray500, marginTop: 12 }]}
              onPress={showIndexInfo}
              activeOpacity={0.8}
            >
              <Ionicons name="server" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Firebase Indexes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.primary[600], marginTop: 12 }]}
              onPress={() => setShowLocationTestPanel(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Test Location Override</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.primary[500], marginTop: 12 }]}
              onPress={testInitialization}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Test Initialization</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.warning, marginTop: 12 }]}
              onPress={debugCurrentState}
              activeOpacity={0.8}
            >
              <Ionicons name="bug" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Debug State</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.error, marginTop: 12 }]}
              onPress={forceInitialization}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Force Init</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: COLORS.info, marginTop: 12 }]}
              onPress={simpleInitialization}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Simple Init</Text>
            </TouchableOpacity>
            
            {/* Test Driver Setup Section */}
            <View style={styles.demoSection}>
              <Text style={styles.demoSectionTitle}>🧪 Test Driver Setup</Text>
              
              <TouchableOpacity 
                style={[styles.demoButton, { backgroundColor: COLORS.success, marginTop: 12 }]}
                onPress={setupTestDriver}
                activeOpacity={0.8}
              >
                <Ionicons name="car" size={20} color={COLORS.white} />
                <Text style={styles.demoButtonText}>Setup Test Driver</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.demoButton, { backgroundColor: COLORS.primary[500], marginTop: 12 }]}
                onPress={createTestRideRequest}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.demoButtonText}>Create Test Ride Request</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.demoButton, { backgroundColor: COLORS.gray500, marginTop: 12 }]}
                onPress={simulateMultipleRideRequests}
                activeOpacity={0.8}
              >
                <Ionicons name="repeat" size={20} color={COLORS.white} />
                <Text style={styles.demoButtonText}>Simulate Multiple Requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.demoButton, { backgroundColor: COLORS.warning, marginTop: 12 }]}
                onPress={cleanupTestData}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={20} color={COLORS.white} />
                <Text style={styles.demoButtonText}>Cleanup Test Data</Text>
              </TouchableOpacity>
            </View>
          </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Ride Request Modal */}
      <RideRequestScreen
        visible={showRideRequest}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
        onCustomBid={handleCustomBid}
      />

      {/* New Ride Request Modal */}
      <RideRequestModal
        visible={showRideRequestModal}
        rideRequest={rideRequest}
        onClose={handleRideRequestModalClose}
        driverVehicle={{
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          vehicleType: 'standard',
          driverId: user?.uid
        }}
      />

      {/* Enhanced Bid Submission Screen */}
      {/* console.log('🎯 Rendering DriverBidSubmissionScreen with visible:', showBidSubmissionModal) */}
      <DriverBidSubmissionScreen
        isVisible={showBidSubmissionModal}
        rideRequest={rideRequest}
        driverInfo={{
          id: user?.uid || user?.id,
          name: user?.displayName || 'Driver',
          email: user?.email
        }}
        driverVehicle={{
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          vehicleType: 'standard',
          driverId: user?.uid || user?.id
        }}
        onBidSubmitted={handleBidSubmitted}
        onBidAccepted={handleBidAccepted}
        onRideCancelled={handleRideCancelledDuringBidding}
        onClose={handleBidSubmissionModalClose}
      />

      {/* Driver Notification Handler */}
      <DriverNotificationHandler
        driverId={user?.uid || user?.id}
        onBidAccepted={handleBidAccepted}
        onNavigateToRide={handleNavigateToRide}
        onRideCancelled={handleRideCancelledDuringBidding}
      />

      {/* Navigation Menu Modal */}
      <NavigationMenu
        visible={showNavigationMenu}
        onClose={() => setShowNavigationMenu(false)}
        navigation={navigation}
        user={user}
      />

      {/* Location Test Panel */}
      <LocationTestPanel
        visible={showLocationTestPanel}
        onClose={() => setShowLocationTestPanel(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.secondary[500],
    fontWeight: '400',
  },
  driverName: {
    fontSize: 24,
    color: COLORS.secondary[900],
    fontWeight: '700',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    marginTop: 20,
    marginBottom: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 12,
  },
  earningsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsItemText: {
    fontSize: 14,
    color: COLORS.secondary[500],
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  activeRideCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activeRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeRideHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeRideBadge: {
    backgroundColor: COLORS.primary[700],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeRideBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  closeActiveRide: {
    marginLeft: 12,
    padding: 4,
  },
  activeRideDetails: {
    marginBottom: 16,
  },
  activeRideText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  continueRideButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueRideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[500],
    marginRight: 8,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 52) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginTop: 8,
    textAlign: 'center',
  },
  demoSection: {
    marginBottom: 20,
  },
  demoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButton: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  // New styles for Navigation Menu
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  menuUserEmail: {
    fontSize: 14,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  closeMenuButton: {
    padding: 8,
  },
  menuContent: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.secondary[200],
    marginVertical: 16,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  pendingBannerText: {
    color: COLORS.warning,
    fontWeight: '500',
    fontSize: 14,
  },
  pendingBannerButton: {
    backgroundColor: COLORS.warning,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  pendingBannerButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default HomeScreen; 