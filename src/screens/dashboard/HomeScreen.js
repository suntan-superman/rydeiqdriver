import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { FONT_SIZES, SPACING, WIDTHS, BUTTON_SIZES, CARD_SIZES, BORDER_RADIUS, hp, wp, rf } from '@/constants/responsiveSizes';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useDriverStatus, useAnalyticsDashboard, useUnreadCount } from '@/hooks/queries';
import RideRequestScreen from '../ride/RideRequestScreen';
import { profilePictureService } from '../../services/profilePictureService';
import ScheduledRideRequests from '../../components/ScheduledRideRequests';
import MyScheduledRides from '../../components/MyScheduledRides';
import ReliabilityScoreCard from '../../components/driver/ReliabilityScoreCard';
import CooldownBanner from '../../components/driver/CooldownBanner';
import SpeechSettingsModal from '../../components/SpeechSettingsModal';
import { speechService as voiceSpeechService } from '../../services/speechService';
import scheduledRideReminderService from '../../services/scheduledRideReminderService';
import emergencyVoiceService from '../../services/emergencyVoiceService';
import EmergencyModal from '../../components/EmergencyModal';
import EnhancedEmergencyModal from '../../components/EnhancedEmergencyModal';
import SafetyAnalyticsDashboard from '../../components/safety/SafetyAnalyticsDashboard';
import EmergencyContactsManager from '../../components/safety/EmergencyContactsManager';
import CommunicationHub from '../../components/communication/CommunicationHub';
import QuickResponsesManager from '../../components/communication/QuickResponsesManager';
import EarningsOptimizationDashboard from '../../components/earnings/EarningsOptimizationDashboard';
import EarningsGoalsManager from '../../components/earnings/EarningsGoalsManager';
import RouteOptimizationWidget from '../../components/navigation/RouteOptimizationWidget';
import RouteOptimizationDashboard from '../../components/navigation/RouteOptimizationDashboard';
import AdvancedPerformanceDashboard from '../../components/analytics/AdvancedPerformanceDashboard';
import VehicleManagementDashboard from '../../components/vehicle/VehicleManagementDashboard';
import PredictiveAnalyticsDashboard from '../../components/ai/PredictiveAnalyticsDashboard';
import SmartRecommendationsDashboard from '../../components/ai/SmartRecommendationsDashboard';
import BehavioralLearningDashboard from '../../components/ai/BehavioralLearningDashboard';
import MarketIntelligenceDashboard from '../../components/ai/MarketIntelligenceDashboard';
import RiskAssessmentDashboard from '../../components/ai/RiskAssessmentDashboard';
import DemandForecastingDashboard from '../../components/ai/DemandForecastingDashboard';
import DynamicPricingDashboard from '../../components/ai/DynamicPricingDashboard';
import AIRouteOptimizationDashboard from '../../components/ai/RouteOptimizationDashboard';
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
let speechService;

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
  const speechServiceModule = require('@/services/speechService');
  speechService = speechServiceModule.speechService;
} catch (error) {
  console.warn('⚠️ speechService import failed:', error.message);
  speechService = {
    speakNewRideRequest: () => Promise.resolve(),
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
const NavigationMenu = ({ visible, onClose, navigation, user, profilePicture, imageLoadError, onSafetyMenuPress, onCommunicationMenuPress, onEarningsOptimizationMenuPress, onRouteOptimizationMenuPress, onAdvancedPerformanceMenuPress, onVehicleManagementMenuPress }) => {
  const { signOut } = useAuth();
  
  // Profile picture props received

  const menuItems = [
    // Core navigation only - other features accessible from home screen
    { id: 'profile', title: 'Profile', icon: 'person', screen: 'Profile' },
    { id: 'settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'support', title: 'Support', icon: 'help-circle', screen: 'Support' },
    // Removed: Earnings, Analytics, Performance Analytics, Vehicle Management, 
    // Earnings Optimization, Route Optimization, Trip History, Rate Settings,
    // Safety & Emergency, Communication Hub (all available on home screen or not essential)
  ];

  const handleMenuItemPress = (item) => {
    onClose();
    if (item.action === 'safety') {
      onSafetyMenuPress();
      return;
    }
    if (item.action === 'communication') {
      onCommunicationMenuPress();
      return;
    }
    if (item.action === 'earnings-optimization') {
      onEarningsOptimizationMenuPress();
      return;
    }
    if (item.action === 'route-optimization') {
      onRouteOptimizationMenuPress();
      return;
    }
    if (item.action === 'advanced-performance') {
      onAdvancedPerformanceMenuPress();
      return;
    }
    if (item.action === 'vehicle-management') {
      onVehicleManagementMenuPress();
      return;
    }
    navigation.navigate(item.screen);
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
              {profilePicture && !imageLoadError ? (
                <Image 
                  source={{ uri: profilePicture }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="car" size={24} color={COLORS.white} />
                </View>
              )}
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{user?.displayName || 'Driver'}</Text>
                <Text style={styles.menuUserEmail}>{user?.email || 'driver@anyryde.com'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeMenuButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
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
  const navigation = useNavigation();
  
  // Driver status state
  const [isOnline, setIsOnline] = useState(false);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [ridesCompleted, setRidesCompleted] = useState(0);
  const [driverRating, setDriverRating] = useState(4.8);
  const [activeRideId, setActiveRideId] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);  // Full current ride details
  const [driverLocation, setDriverLocation] = useState(null);  // Driver's current location
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Ride request modal state
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [showRideRequestModal, setShowRideRequestModal] = useState(false);
  const [showBidSubmissionModal, setShowBidSubmissionModal] = useState(false);
  
  // Quick Actions Modal States
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAIAnalyticsModal, setShowAIAnalyticsModal] = useState(false);
  const [showSmartRecommendationsModal, setShowSmartRecommendationsModal] = useState(false);
  const [showBehavioralLearningModal, setShowBehavioralLearningModal] = useState(false);
  const [showMarketIntelligenceModal, setShowMarketIntelligenceModal] = useState(false);
  const [showRiskAssessmentModal, setShowRiskAssessmentModal] = useState(false);
  const [showDemandForecastingModal, setShowDemandForecastingModal] = useState(false);
  const [showDynamicPricingModal, setShowDynamicPricingModal] = useState(false);
  const [showRouteOptimizationModal, setShowRouteOptimizationModal] = useState(false);
  const [showDriverToolsModal, setShowDriverToolsModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showSpeechSettings, setShowSpeechSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => voiceSpeechService?.getSettings()?.enabled || false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEnhancedEmergencyModal, setShowEnhancedEmergencyModal] = useState(false);
  const [showSafetyAnalytics, setShowSafetyAnalytics] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showCommunicationHub, setShowCommunicationHub] = useState(false);
  const [showQuickResponsesManager, setShowQuickResponsesManager] = useState(false);
  const [showEarningsOptimization, setShowEarningsOptimization] = useState(false);
  const [showEarningsGoals, setShowEarningsGoals] = useState(false);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [showAdvancedPerformance, setShowAdvancedPerformance] = useState(false);
  const [showVehicleManagement, setShowVehicleManagement] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAIPricingModal, setShowAIPricingModal] = useState(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showTripHistoryModal, setShowTripHistoryModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
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
  
  // Scheduled rides status state
  const [scheduledRideStatus, setScheduledRideStatus] = useState({
    hasUpcomingRides: false,
    hasPendingRequests: false,
    pendingCount: 0,
    upcomingCount: 0,
    status: 'none' // 'none', 'upcoming', 'pending'
  });
  
  // Scheduled rides modal states
  const [showScheduledRidesModal, setShowScheduledRidesModal] = useState(false);
  const [showMyScheduledRidesModal, setShowMyScheduledRidesModal] = useState(false);
  
  // Track when modal was explicitly closed to prevent immediate reopening
  const [modalJustClosed, setModalJustClosed] = useState(false);
  
  // Track declined ride request IDs with timestamps to prevent reopening same requests
  // Use ref to ensure callback always has current value
  const ignoredRideRequestIds = useRef(new Map()); // Changed to Map to store timestamps
  
  // Migration: Convert old Set to new Map if needed (for hot reload compatibility)
  useEffect(() => {
    if (ignoredRideRequestIds.current instanceof Set) {
      const oldSet = ignoredRideRequestIds.current;
      const newMap = new Map();
      for (const id of oldSet) {
        newMap.set(id, Date.now()); // Use current time as timestamp for migrated entries
      }
      ignoredRideRequestIds.current = newMap;
    }
  }, []); // Run once on mount

  // Initialize Phase 2 services (scheduled reminders and emergency voice)
  useEffect(() => {
    const initializePhase2Services = async () => {
      try {
        // Initialize scheduled ride reminder service
        await scheduledRideReminderService.initialize();
        console.log('✅ Scheduled ride reminder service initialized');

        // Initialize emergency voice service
        // Emergency detection happens automatically through voiceCommandService
        await emergencyVoiceService.initialize();
        await emergencyVoiceService.startGlobalListener((emergencyData) => {
          console.log('🚨 Emergency detected from voice:', emergencyData);
          setShowEmergencyModal(true);
        });
        console.log('✅ Emergency voice service initialized (passive mode)');
      } catch (error) {
        console.error('❌ Error initializing Phase 2 services:', error);
      }
    };

    initializePhase2Services();

    // Cleanup on unmount
    return () => {
      scheduledRideReminderService.destroy().catch(() => {});
      emergencyVoiceService.destroy().catch(() => {});
    };
  }, []);
  
  // Track current ride request with ref to avoid stale closure in callbacks
  const currentRideRequestRef = useRef(null);
  
  // Keep ref in sync with rideRequest state AND set up dedicated listener for cancellations
  useEffect(() => {
    const rideId = rideRequest?.id;
    
    currentRideRequestRef.current = rideRequest;
    
    // Set up polling to check for cancellations (workaround for Firestore snapshot issues)
    if (rideId && showBidSubmissionModal) {
      const rideRequestRef = doc(db, 'rideRequests', rideId);
      
      // Poll every 2 seconds to check if ride was cancelled
      const pollInterval = setInterval(async () => {
        try {
          const snapshot = await getDoc(rideRequestRef);
          
          if (!snapshot.exists()) {
            clearInterval(pollInterval);
            return;
          }
          
          const data = snapshot.data();
          
          // Check if ride was cancelled
          if (data.status === 'cancelled') {
            clearInterval(pollInterval);
            
            // Add to ignored list to prevent reopening
            if (rideId) {
              // Ensure the Map is initialized and handle Set->Map migration
              if (!ignoredRideRequestIds.current) {
                ignoredRideRequestIds.current = new Map();
              } else if (ignoredRideRequestIds.current instanceof Set) {
                // Convert Set to Map if needed
                const oldSet = ignoredRideRequestIds.current;
                ignoredRideRequestIds.current = new Map();
                for (const id of oldSet) {
                  ignoredRideRequestIds.current.set(id, Date.now());
                }
              }
              ignoredRideRequestIds.current.set(rideId, Date.now());
            }
            
            Alert.alert(
              'Rider Cancelled',
              'The rider has cancelled this ride request.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowBidSubmissionModal(false);
                    setRideRequest(null);
                  }
                }
              ]
            );
          }
        } catch (error) {
          console.error('❌ Polling error:', error);
        }
      }, 2000); // Check every 2 seconds
      
      // Cleanup polling when ride request changes or modal closes
      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [rideRequest?.id, showBidSubmissionModal]); // Only depend on ID, not whole object
  
  // Clear ignored ride requests that are older than 2 hours
  useEffect(() => {
    const clearOldIgnoredRequests = setInterval(() => {
      if (!ignoredRideRequestIds.current) {
        return; // Skip if not initialized
      }
      
      // Handle Set->Map migration if needed
      if (ignoredRideRequestIds.current instanceof Set) {
        const oldSet = ignoredRideRequestIds.current;
        ignoredRideRequestIds.current = new Map();
        for (const id of oldSet) {
          ignoredRideRequestIds.current.set(id, Date.now());
        }
        return; // Skip cleanup this iteration since we just migrated
      }
      
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours
      
      let removedCount = 0;
      for (const [rideId, timestamp] of ignoredRideRequestIds.current.entries()) {
        if (timestamp < twoHoursAgo) {
          ignoredRideRequestIds.current.delete(rideId);
          removedCount++;
        }
      }
      
    }, 10 * 60 * 1000); // Check every 10 minutes
    
    return () => clearInterval(clearOldIgnoredRequests);
  }, []);

    // Load profile picture when user changes
    useEffect(() => {
      const loadProfilePicture = async () => {
        const userId = user?.uid || user?.id;
        if (userId) {
          try {
            setImageLoadError(false); // Reset error state
            const pictureUrl = await profilePictureService.getDriverProfilePicture(userId, 'male');
            if (pictureUrl) {
              setProfilePicture(pictureUrl);
            } else {
              setProfilePicture(null);
            }
          } catch (error) {
            setProfilePicture(null);
            setImageLoadError(true);
          }
        } else {
          setProfilePicture(null);
        }
      };

      loadProfilePicture();
    }, [user?.id]);

  // Determine approval status - check both approval status and onboarding completion
  // TEMPORARY: Override for testing - set to true to bypass approval check
  const isApproved = true; // user?.approvalStatus?.status === 'approved' && user?.onboardingStatus?.completed === true;

  // Check scheduled ride status
  const checkScheduledRideStatus = useCallback(async () => {
    const driverId = user?.uid || user?.id;
    
    if (!driverId) return;

    try {
      // Load driver profile to check capabilities
      const driverRef = doc(db, 'driverApplications', driverId);
      const driverSnap = await getDoc(driverRef);
      const driverData = driverSnap.exists() ? driverSnap.data() : null;
      
      const hasMedicalCertifications = driverData?.medicalCertifications && 
        Object.keys(driverData.medicalCertifications).length > 0;
      
      // Check for pending notifications (ride requests waiting for response)
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', driverId),
        where('type', 'in', ['scheduled_ride_request', 'medical_ride_request']),
        where('status', '==', 'pending')
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      // Filter notifications based on driver capabilities
      let filteredNotifications = notificationsSnapshot.docs;
      
      if (!hasMedicalCertifications) {
        // Filter out medical ride requests if driver lacks certifications
        filteredNotifications = notificationsSnapshot.docs.filter(doc => {
          const notifType = doc.data().type;
          return notifType !== 'medical_ride_request';
        });
      }
      
      const hasPendingRequests = filteredNotifications.length > 0;
      const pendingCount = filteredNotifications.length;

      // Check for upcoming confirmed rides (rides assigned to this driver)
      const now = new Date();

      // Check medical rides - all future rides, not just next 24 hours
      const medicalRidesQuery = query(
        collection(db, 'medicalRideSchedule'),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['assigned', 'confirmed']),
        where('pickupDateTime', '>=', now)
      );

      const medicalRidesSnapshot = await getDocs(medicalRidesQuery);
      const hasMedicalUpcoming = !medicalRidesSnapshot.empty;
      const medicalUpcomingCount = medicalRidesSnapshot.size;

      // Check regular scheduled rides - all future rides
      const scheduledRidesQuery = query(
        collection(db, 'scheduledRides'),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['assigned', 'confirmed']),
        where('scheduledDateTime', '>=', now)
      );

      const scheduledRidesSnapshot = await getDocs(scheduledRidesQuery);
      const hasRegularUpcoming = !scheduledRidesSnapshot.empty;
      const regularUpcomingCount = scheduledRidesSnapshot.size;

      // console.log(`📊 Scheduled ride counts - Medical: ${medicalUpcomingCount}, Regular: ${regularUpcomingCount}, Total: ${medicalUpcomingCount + regularUpcomingCount}`);

      const hasUpcomingRides = hasMedicalUpcoming || hasRegularUpcoming;
      const upcomingCount = medicalUpcomingCount + regularUpcomingCount;

      // Determine status priority: pending requests > upcoming rides > none
      let status = 'none';
      if (hasPendingRequests) {
        status = 'pending';
      } else if (hasUpcomingRides) {
        status = 'upcoming';
      }

      setScheduledRideStatus({
        hasUpcomingRides,
        hasPendingRequests,
        pendingCount,
        upcomingCount,
        status
      });

    } catch (error) {
      // Silently handle permission errors during logout
      if (!driverId || error.code === 'permission-denied') {
        setScheduledRideStatus({
          hasUpcomingRides: false,
          hasPendingRequests: false,
          status: 'none',
          pendingCount: 0,
          upcomingCount: 0
        });
        return;
      }
      console.error('Error checking scheduled ride status:', error);
      // Set default status on error
      setScheduledRideStatus({
        hasUpcomingRides: false,
        hasPendingRequests: false,
        pendingCount: 0,
        upcomingCount: 0,
        status: 'none'
      });
    }
  }, [user]);

  // Check scheduled ride status when component mounts and user changes
  useEffect(() => {
    const driverId = user?.uid || user?.id;
    
    if (driverId) {
      checkScheduledRideStatus();
      
      // Set up interval to check status every 30 seconds
      const interval = setInterval(checkScheduledRideStatus, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.uid, user?.id, checkScheduledRideStatus]);

  // Get scheduled ride button configuration based on status
  const getScheduledRideButtonConfig = () => {
    switch (scheduledRideStatus.status) {
      case 'pending':
        return {
          backgroundColor: '#F59E0B', // Yellow/amber
          text: 'Scheduled Rides',
          subtext: `${scheduledRideStatus.pendingCount} pending request${scheduledRideStatus.pendingCount !== 1 ? 's' : ''}`,
          icon: 'notifications',
          textColor: COLORS.white,
          badge: scheduledRideStatus.pendingCount
        };
      case 'upcoming':
        return {
          backgroundColor: '#10B981', // Green
          text: 'Scheduled Rides',
          subtext: `${scheduledRideStatus.upcomingCount} upcoming ride${scheduledRideStatus.upcomingCount !== 1 ? 's' : ''}`,
          icon: 'calendar',
          textColor: COLORS.white,
          badge: scheduledRideStatus.upcomingCount
        };
      default:
        return {
          backgroundColor: '#6B7280', // Gray
          text: 'Scheduled Rides',
          subtext: 'No scheduled rides',
          icon: 'calendar-outline',
          textColor: COLORS.white,
          badge: 0
        };
    }
  };

  const scheduledRideConfig = getScheduledRideButtonConfig();

  // Initialize services when component mounts
  useEffect(() => {
    const initializeServices = async () => {
      const userId = user?.uid || user?.id;
      if (!user || !userId) {
        // User logged out - cleanup services
        console.log('👋 User logged out, stopping all services');
        try {
          if (RideRequestService && typeof RideRequestService.stopListeningForRideRequests === 'function') {
            RideRequestService.stopListeningForRideRequests();
          }
        } catch (error) {
          console.warn('⚠️ Error stopping ride request service:', error);
        }
        return;
      }
      
      if (user && userId) {
        try {
          // IMPORTANT: Set callbacks BEFORE initializing to ensure they're ready when listeners start
          
          // Set callback for new ride requests FIRST
          try {
            if (RideRequestService && typeof RideRequestService.setRideRequestCallback === 'function') {
              RideRequestService.setRideRequestCallback((newRideRequest) => {
                try {
                  if (newRideRequest) {
                    // Don't open modal if it was just closed
                    if (modalJustClosed) {
                      return;
                    }
                    
                    // Check if this ride request ID has been previously ignored/declined
                    // Handle Set->Map migration if needed
                    if (ignoredRideRequestIds.current && ignoredRideRequestIds.current instanceof Set) {
                      const oldSet = ignoredRideRequestIds.current;
                      ignoredRideRequestIds.current = new Map();
                      for (const id of oldSet) {
                        ignoredRideRequestIds.current.set(id, Date.now());
                      }
                    }
                    
                    if (ignoredRideRequestIds.current && ignoredRideRequestIds.current.has(newRideRequest.id)) {
                      return;
                    }
                    
                    // Add to ignored list IMMEDIATELY to prevent duplicate modals
                    if (!ignoredRideRequestIds.current) {
                      ignoredRideRequestIds.current = new Map();
                    }
                    ignoredRideRequestIds.current.set(newRideRequest.id, Date.now());
                    
                    // Set ride request first, then show modal after a brief delay to ensure state is updated
                    setRideRequest(newRideRequest);
                    
                    // Use setTimeout to ensure the rideRequest state is updated before showing modal
                    setTimeout(() => {
                      try {
                        // Double-check modalJustClosed in case it changed during the timeout
                        if (modalJustClosed) {
                          return;
                        }
                        
                        setShowBidSubmissionModal(true);
                      } catch (modalError) {
                        console.warn('⚠️ Bid submission modal failed, using fallback:', modalError);
                        setShowRideRequestModal(true);
                      }
                    }, 100); // Small delay to ensure state update
                    
                    // Play sound first, then speak after a delay
                    try {
                      playRideRequestSound(); // Play notification sound
                    
                      // Wait for sound to finish (approximately 2 seconds) before speaking
                      setTimeout(() => {
                    try {
                      if (speechService && speechService.speakNewRideRequest) {
                            const pickupAddress = newRideRequest.pickup?.address || 'unknown location';
                            const destinationAddress = newRideRequest.destination?.address || 'unknown destination';
                            speechService.speakNewRideRequest(pickupAddress, destinationAddress);
                      }
                    } catch (speechError) {
                      // Silent fallback for speech errors
                        }
                      }, 2000); // 2 second delay to let sound finish
                    } catch (soundError) {
                      // If sound fails, speak immediately
                      try {
                        if (speechService && speechService.speakNewRideRequest) {
                          const pickupAddress = newRideRequest.pickup?.address || 'unknown location';
                          const destinationAddress = newRideRequest.destination?.address || 'unknown destination';
                          speechService.speakNewRideRequest(pickupAddress, destinationAddress);
                        }
                      } catch (speechError) {
                        // Silent fallback for speech errors
                      }
                    }
                  }
                } catch (callbackError) {
                  console.error('❌ Callback error:', callbackError);
                }
              });
            }
          } catch (error) {
            console.warn('⚠️ Failed to set ride request callback:', error);
          }

          // Set callback for when ride requests are cancelled SECOND
          try {
            if (RideRequestService && typeof RideRequestService.setRideRequestCancelledCallback === 'function') {
              RideRequestService.setRideRequestCancelledCallback((cancelledRideRequest) => {
                try {
                  // Check if this is the currently displayed ride request (using ref to avoid stale closure)
                  const currentRequest = currentRideRequestRef.current;
                  if (currentRequest && currentRequest.id === cancelledRideRequest.id) {
                    // Show alert FIRST (before closing modal)
                    Alert.alert(
                      'Rider Cancelled',
                      'The rider has cancelled this ride request.',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            // Now close the modal and clear state
                            setShowBidSubmissionModal(false);
                            setRideRequest(null);
                          }
                        }
                      ]
                    );
                  }
                } catch (callbackError) {
                  console.error('❌ Cancellation callback error:', callbackError);
                }
              });
            }
          } catch (error) {
            console.warn('⚠️ Failed to set ride cancellation listener:', error);
          }

          // NOW initialize services AFTER callbacks are set
          try {
            RideRequestService.initialize(userId);
            
            // Force restart listening to break out of any existing loops
            if (typeof RideRequestService.forceRestartListening === 'function') {
              RideRequestService.forceRestartListening();
            }
          } catch (error) {
            console.warn('⚠️ RideRequestService initialization failed:', error);
          }

          try {
            if (DriverStatusService && typeof DriverStatusService.initialize === 'function') {
              // Add timeout to prevent infinite hang
              await Promise.race([
                DriverStatusService.initialize(userId, {
                  email: user?.email || '',
                  displayName: user?.displayName || 'Driver'
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('DriverStatusService initialization timeout')), 5000)
                )
              ]);
              console.log('✅ DriverStatusService initialized successfully');
            }
          } catch (error) {
            console.warn('⚠️ DriverStatusService initialization failed:', error);
            // Continue anyway - app should still work
          }

          try {
            if (driverBidNotificationService && typeof driverBidNotificationService.initialize === 'function') {
              driverBidNotificationService.initialize(userId);
            }
          } catch (error) {
            console.warn('⚠️ driverBidNotificationService initialization failed:', error);
          }

          // Initialize real-time location service with timeout
          try {
            if (realTimeLocationService && typeof realTimeLocationService.initialize === 'function') {
              await Promise.race([
                realTimeLocationService.initialize(userId),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Location service initialization timeout')), 3000)
                )
              ]);
              console.log('✅ RealTimeLocationService initialized successfully');
            }
          } catch (error) {
            console.warn('⚠️ realTimeLocationService initialization failed:', error);
            // Continue anyway
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

  // Manage ride request listening based on driver online status
  useEffect(() => {
    if (isOnline && servicesInitialized) {
      try {
        if (RideRequestService && typeof RideRequestService.startListeningForRideRequests === 'function') {
          RideRequestService.startListeningForRideRequests();
        }
      } catch (error) {
        console.warn('⚠️ Failed to start ride request listening:', error);
      }
    } else if (!isOnline) {
      try {
        if (RideRequestService && typeof RideRequestService.stopListeningForRideRequests === 'function') {
          RideRequestService.stopListeningForRideRequests();
        }
      } catch (error) {
        console.warn('⚠️ Failed to stop ride request listening:', error);
      }
    }
  }, [isOnline, servicesInitialized]);

  // Fetch driver's current location
  useEffect(() => {
    const fetchDriverLocation = async () => {
      try {
        if (getCurrentLocation) {
          const location = await getCurrentLocation();
          if (location?.coords) {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch driver location:', error);
        // Set fallback location (Bakersfield)
        setDriverLocation({
          latitude: 35.3733,
          longitude: -119.0187,
          isFallback: true
        });
      }
    };

    if (isOnline) {
      fetchDriverLocation();
      // Update location every 30 seconds while online
      const locationInterval = setInterval(fetchDriverLocation, 30000);
      return () => clearInterval(locationInterval);
    }
  }, [isOnline]);

  // Fetch current ride details when activeRideId changes
  useEffect(() => {
    const fetchCurrentRide = async () => {
      if (!activeRideId || !db) {
        setCurrentRide(null);
        return;
      }

      try {
        const rideRef = doc(db, 'rideRequests', activeRideId);
        const rideSnap = await getDoc(rideRef);
        
        if (rideSnap.exists()) {
          const rideData = rideSnap.data();
          setCurrentRide({
            id: activeRideId,
            ...rideData,
            dropoff: rideData.dropoff || rideData.destination
          });
        }
      } catch (error) {
        console.error('❌ Error fetching current ride:', error);
        setCurrentRide(null);
      }
    };

    fetchCurrentRide();
  }, [activeRideId]);

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
    // Add current ride request to ignored list to prevent reopening
    if (rideRequest?.id) {
      try {
        // Ensure the Map is initialized and handle Set->Map migration
        if (!ignoredRideRequestIds.current) {
          ignoredRideRequestIds.current = new Map();
        } else if (ignoredRideRequestIds.current instanceof Set) {
          const oldSet = ignoredRideRequestIds.current;
          ignoredRideRequestIds.current = new Map();
          for (const id of oldSet) {
            ignoredRideRequestIds.current.set(id, Date.now());
          }
        }
        ignoredRideRequestIds.current.set(rideRequest.id, Date.now());
      } catch (error) {
        console.error('❌ ERROR in handleBidSubmissionModalClose:', error);
      }
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
      if (db && doc && getDoc) {
        const rideRequestRef = doc(db, 'rideRequests', acceptanceData.rideRequestId);
        const rideRequestSnap = await getDoc(rideRequestRef);
        if (rideRequestSnap.exists()) {
          completeRideRequest = rideRequestSnap.data();
          // console.log('🗺️ Fetched complete ride request from Firebase:', completeRideRequest);
          // console.log('🗺️ Firebase pickup data:', completeRideRequest.pickup);
          // console.log('🗺️ Firebase dropoff data:', completeRideRequest.dropoff);
        }
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
        // Ensure the Map is initialized and handle Set->Map migration
        if (!ignoredRideRequestIds.current) {
          ignoredRideRequestIds.current = new Map();
        } else if (ignoredRideRequestIds.current instanceof Set) {
          const oldSet = ignoredRideRequestIds.current;
          ignoredRideRequestIds.current = new Map();
          for (const id of oldSet) {
            ignoredRideRequestIds.current.set(id, Date.now());
          }
        }
        ignoredRideRequestIds.current.set(cancellationData.rideRequestId, Date.now());
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

  // Route Optimization Handler
  const onRouteOptimizationMenuPress = () => {
    setShowRouteOptimization(true);
  };

  // Advanced Performance Analytics Handler
  const onAdvancedPerformanceMenuPress = () => {
    setShowAdvancedPerformance(true);
  };

  const onVehicleManagementMenuPress = () => {
    setShowVehicleManagement(true);
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
      {/* Cooldown Banner - shows at top when active */}
      {user?.uid && <CooldownBanner driverId={user.uid} />}
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

        {/* Reliability Score Card */}
        {isApproved && user?.uid && (
          <ReliabilityScoreCard 
            driverId={user.uid}
            compact={false}
          />
        )}

        {/* Scheduled Rides Status Card */}
        <View style={styles.statusCard}>
          <TouchableOpacity
            style={[
              styles.statusButton, 
              { backgroundColor: scheduledRideConfig.backgroundColor },
              scheduledRideStatus.pendingCount === 0 && styles.disabledButton
            ]}
            onPress={() => {
              // If there are pending requests, show modal for quick access
              // Otherwise navigate to full dashboard
              if (scheduledRideStatus.hasPendingRequests) {
                setShowScheduledRidesModal(true);
              } else {
                navigation.navigate('ScheduledRideDashboard');
              }
            }}
            disabled={scheduledRideStatus.pendingCount === 0}
          >
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name={scheduledRideConfig.icon} 
                size={24} 
                color={scheduledRideConfig.textColor} 
                style={styles.statusIcon}
              />
              {scheduledRideConfig.badge > 0 && (
                <View style={styles.scheduledRideBadge}>
                  <Text style={styles.scheduledRideBadgeText}>
                    {scheduledRideConfig.badge}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusText, { color: scheduledRideConfig.textColor }]}>
                {scheduledRideConfig.text}
              </Text>
              <Text style={[styles.statusSubtext, { color: scheduledRideConfig.textColor }]}>
                {scheduledRideConfig.subtext}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={scheduledRideConfig.textColor} 
            />
          </TouchableOpacity>
        </View>

        {/* My Scheduled Rides Status Card */}
        <View style={styles.statusCard}>
          <TouchableOpacity
            style={[
              styles.statusButton, 
              { backgroundColor: COLORS.primary[100] },
              scheduledRideStatus.upcomingCount === 0 && styles.disabledButton
            ]}
            onPress={() => setShowMyScheduledRidesModal(true)}
            disabled={scheduledRideStatus.upcomingCount === 0}
          >
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name="calendar-sharp" 
                size={24} 
                color={COLORS.primary[700]} 
                style={styles.statusIcon}
              />
              {scheduledRideStatus.upcomingCount > 0 && (
                <View style={[styles.scheduledRideBadge, { backgroundColor: COLORS.primary[500] }]}>
                  <Text style={styles.scheduledRideBadgeText}>
                    {scheduledRideStatus.upcomingCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusText, { color: COLORS.primary[700] }]}>
                My Schedule
              </Text>
              <Text style={[styles.statusSubtext, { color: COLORS.primary[700] }]}>
                {scheduledRideStatus.upcomingCount > 0 
                  ? `${scheduledRideStatus.upcomingCount} accepted ride${scheduledRideStatus.upcomingCount !== 1 ? 's' : ''}`
                  : 'No upcoming rides'}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={COLORS.primary[700]} 
            />
          </TouchableOpacity>
        </View>

        {/* Route Optimization Widget */}
        {isApproved && user?.uid && (
          <RouteOptimizationWidget
            driverId={user.uid}
            onOpenFullDashboard={onRouteOptimizationMenuPress}
          />
        )}

        {/* Earnings Today Card */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.earningsHeaderContent}>
              <Text style={styles.cardTitle}>Today</Text>
              <Text style={styles.earningsAmount}>${currentEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsDetails}>
              <View style={styles.earningsItem}>
                <Ionicons name="car" size={14} color={COLORS.secondary[500]} />
                <Text style={styles.earningsItemText}>{ridesCompleted}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="time" size={14} color={COLORS.secondary[500]} />
                <Text style={styles.earningsItemText}>8h 30m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={18} color={COLORS.warning} />
            <Text style={styles.statValue}>{driverRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={18} color={COLORS.primary[500]} />
            <Text style={styles.statValue}>97%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
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
              style={[
                styles.actionCard,
                voiceEnabled && styles.actionCardActive
              ]}
              onPress={async () => {
                const newState = !voiceEnabled;
                await voiceSpeechService.updateSetting('enabled', newState);
                setVoiceEnabled(newState);
              }}
              onLongPress={() => setShowSpeechSettings(true)}
            >
              <Ionicons 
                name={voiceEnabled ? "volume-high" : "volume-mute"} 
                size={20} 
                color={voiceEnabled ? COLORS.white : COLORS.success} 
              />
              <Text style={[
                styles.actionText,
                voiceEnabled && styles.actionTextActive
              ]}>Voice</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowDriverToolsModal(true)}
            >
              <Ionicons name="construct" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Driver Tools</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('SustainabilityDashboard')}
            >
              <Ionicons name="leaf" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Sustainability</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CommunityDashboard')}
            >
              <Ionicons name="people" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Community</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowSafetyModal(true)}
            >
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Safety</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
              style={[
                styles.actionCard,
                voiceEnabled && styles.actionCardActive
              ]}
              onPress={async () => {
                const newState = !voiceEnabled;
                await voiceSpeechService.updateSetting('enabled', newState);
                setVoiceEnabled(newState);
                // Provide feedback
                if (newState) {
                  await voiceSpeechService.speak('Voice commands enabled', null);
                }
              }}
              onLongPress={() => setShowSpeechSettings(true)}
            >
              <Ionicons 
                name={voiceEnabled ? "mic" : "mic-off"} 
                size={20} 
                color={voiceEnabled ? COLORS.white : COLORS.primary[500]} 
              />
              <Text style={[
                styles.actionText,
                voiceEnabled && styles.actionTextActive
              ]}>Talk</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowVehicleModal(true)}
            >
              <Ionicons name="car-sport" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="card" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAIPricingModal(true)}
            >
              <Ionicons name="trending-up" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>AI Pricing</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('GamificationDashboard')}
            >
              <Ionicons name="star" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Gamification</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAccessibilityModal(true)}
            >
              <Ionicons name="accessibility" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Accessibility</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('WellnessDashboard')}
            >
              <Ionicons name="heart" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Wellness</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowEarningsModal(true)}
            >
              <Ionicons name="wallet" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowTripHistoryModal(true)}
            >
              <Ionicons name="car-sport" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Trip History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowSupportModal(true)}
            >
              <Ionicons name="help-circle" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAIAnalyticsModal(true)}
            >
              <Ionicons name="analytics" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>AI Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowSmartRecommendationsModal(true)}
            >
              <Ionicons name="bulb" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>AI Tips</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowBehavioralLearningModal(true)}
            >
              <Ionicons name="analytics" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>AI Learning</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowMarketIntelligenceModal(true)}
            >
              <Ionicons name="analytics" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Market Intel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowRiskAssessmentModal(true)}
            >
              <Ionicons name="shield" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Risk Assessment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowDemandForecastingModal(true)}
            >
              <Ionicons name="trending-up" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Demand Forecast</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowDynamicPricingModal(true)}
            >
              <Ionicons name="cash" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Dynamic Pricing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowRouteOptimizationModal(true)}
            >
              <Ionicons name="navigate" size={20} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Route Optimization</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Section (for testing) - COMMENTED OUT FOR CLEANER UI */}
        {/* <View style={styles.demoSection}>
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
          </View> */}

        {/* Bottom Spacing for Fixed Footer */}
        <View style={styles.bottomSpacingForFooter} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.fixedFooter}>
        <View style={styles.testingNotice}>
          <Text style={styles.testingText}>🚗 AnyRyde</Text>
          <Text style={styles.testingSubtext}>
            Driver platform • Earn money • Drive smart
          </Text>
        </View>
      </View>

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
        driverLocation={driverLocation}
        currentRide={currentRide}
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

      {/* Quick Actions Modals */}
      {/* Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowAnalyticsModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Analytics</Text>
              <TouchableOpacity 
                onPress={() => setShowAnalyticsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Today's Performance */}
              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>Today's Performance</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="car" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.statValue}>8</Text>
                    <Text style={styles.statLabel}>Trips</Text>
            </View>
                  <View style={styles.statCard}>
                    <Ionicons name="cash" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.statValue}>$127</Text>
                    <Text style={styles.statLabel}>Earnings</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="time" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.statValue}>5.2h</Text>
                    <Text style={styles.statLabel}>Online</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="star" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.statValue}>4.9</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>

              {/* Weekly Summary */}
              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>This Week</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Trips</Text>
                    <Text style={styles.summaryValue}>42 trips</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Earnings</Text>
                    <Text style={styles.summaryValueHighlight}>$687.50</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Average Rating</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color={COLORS.primary[500]} />
                      <Text style={styles.summaryValue}> 4.85</Text>
                    </View>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Acceptance Rate</Text>
                    <Text style={styles.summaryValue}>89%</Text>
                  </View>
                </View>
              </View>

              {/* Peak Hours */}
              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>Your Best Hours</Text>
                <View style={styles.peakHoursCard}>
                  <View style={styles.peakHourRow}>
                    <Text style={styles.peakHourTime}>7:00 AM - 9:00 AM</Text>
                    <View style={styles.peakHourBar}>
                      <View style={[styles.peakHourFill, { width: '85%' }]} />
                    </View>
                    <Text style={styles.peakHourEarnings}>$45</Text>
                  </View>
                  <View style={styles.peakHourRow}>
                    <Text style={styles.peakHourTime}>12:00 PM - 2:00 PM</Text>
                    <View style={styles.peakHourBar}>
                      <View style={[styles.peakHourFill, { width: '70%' }]} />
                    </View>
                    <Text style={styles.peakHourEarnings}>$38</Text>
                  </View>
                  <View style={styles.peakHourRow}>
                    <Text style={styles.peakHourTime}>5:00 PM - 7:00 PM</Text>
                    <View style={styles.peakHourBar}>
                      <View style={[styles.peakHourFill, { width: '95%' }]} />
                    </View>
                    <Text style={styles.peakHourEarnings}>$52</Text>
                  </View>
                </View>
              </View>

              {/* Performance Insights */}
              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>Insights</Text>
                <View style={styles.insightCard}>
                  <Ionicons name="trending-up" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.insightText}>Your earnings are up 15% from last week!</Text>
                </View>
                <View style={styles.insightCard}>
                  <Ionicons name="timer" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.insightText}>Peak earning time: 5-7 PM on weekdays</Text>
                </View>
                <View style={styles.insightCard}>
                  <Ionicons name="trophy" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.insightText}>You're in the top 20% of drivers this month!</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Driver Tools Modal */}
      <Modal
        visible={showDriverToolsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverToolsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowDriverToolsModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver Tools</Text>
              <TouchableOpacity 
                onPress={() => setShowDriverToolsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalPlaceholderText}>Driver Tools Coming Soon</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Safety Modal */}
      <Modal
        visible={showSafetyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowSafetyModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety</Text>
              <TouchableOpacity 
                onPress={() => setShowSafetyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalPlaceholderText}>Safety Dashboard Coming Soon</Text>
          </View>
        </View>
        </View>
      </Modal>

      {/* Communication Modal */}
      <Modal
        visible={showCommunicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommunicationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowCommunicationModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Communication</Text>
              <TouchableOpacity 
                onPress={() => setShowCommunicationModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.constructionContainer}>
                <View style={styles.constructionIconContainer}>
                  <Ionicons name="construct" size={64} color={COLORS.primary[500]} />
            </View>
                <Text style={styles.constructionTitle}>Coming Soon</Text>
                <Text style={styles.constructionSubtitle}>We're working on something amazing!</Text>
                <View style={styles.constructionFeaturesList}>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="chatbubbles" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>In-app messaging with passengers</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="notifications" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Customizable notifications</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="call" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Quick call options</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="mail" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Message templates</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.constructionButton}
                  onPress={() => Alert.alert('Thank You!', 'We\'ll notify you when this feature is ready.')}
                >
                  <Text style={styles.constructionButtonText}>Notify Me When Ready</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vehicle Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowVehicleModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vehicle</Text>
              <TouchableOpacity 
                onPress={() => setShowVehicleModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Current Vehicle */}
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <Ionicons name="car-sport" size={32} color={COLORS.primary[500]} />
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>2024 Toyota Camry</Text>
                    <Text style={styles.vehiclePlate}>ABC-1234</Text>
            </View>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => Alert.alert('Edit Vehicle', 'Vehicle editing feature coming soon!')}
                  >
                    <Ionicons name="pencil" size={20} color={COLORS.primary[500]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.vehicleDetails}>
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>Color</Text>
                    <Text style={styles.vehicleDetailValue}>Silver</Text>
                  </View>
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>Year</Text>
                    <Text style={styles.vehicleDetailValue}>2024</Text>
                  </View>
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>Seats</Text>
                    <Text style={styles.vehicleDetailValue}>5</Text>
                  </View>
                </View>
              </View>

              {/* Maintenance Reminders */}
              <View style={styles.vehicleSection}>
                <Text style={styles.vehicleSectionTitle}>Maintenance Reminders</Text>
                <View style={styles.maintenanceCard}>
                  <View style={styles.maintenanceItem}>
                    <Ionicons name="warning" size={20} color={COLORS.warning[500]} />
                    <View style={styles.maintenanceInfo}>
                      <Text style={styles.maintenanceTitle}>Oil Change Due Soon</Text>
                      <Text style={styles.maintenanceSubtitle}>Next: 45,500 miles (in 250 miles)</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                  </View>
                  <View style={styles.maintenanceDivider} />
                  <View style={styles.maintenanceItem}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success[500]} />
                    <View style={styles.maintenanceInfo}>
                      <Text style={styles.maintenanceTitle}>Tire Rotation</Text>
                      <Text style={styles.maintenanceSubtitle}>Completed 2 weeks ago</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                  </View>
                </View>
              </View>

              {/* Documents Status */}
              <View style={styles.vehicleSection}>
                <Text style={styles.vehicleSectionTitle}>Documents</Text>
                <View style={styles.documentsCard}>
                  <View style={styles.documentItem}>
                    <View style={styles.documentLeft}>
                      <Ionicons name="document-text" size={20} color={COLORS.primary[500]} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>Insurance</Text>
                        <Text style={styles.documentExpiry}>Expires: Dec 15, 2025</Text>
                      </View>
                    </View>
                    <View style={styles.documentStatusBadge}>
                      <Text style={styles.documentStatusText}>Valid</Text>
                    </View>
                  </View>
                  <View style={styles.documentDivider} />
                  <View style={styles.documentItem}>
                    <View style={styles.documentLeft}>
                      <Ionicons name="document-text" size={20} color={COLORS.primary[500]} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>Registration</Text>
                        <Text style={styles.documentExpiry}>Expires: Jun 30, 2026</Text>
                      </View>
                    </View>
                    <View style={styles.documentStatusBadge}>
                      <Text style={styles.documentStatusText}>Valid</Text>
                    </View>
                  </View>
                  <View style={styles.documentDivider} />
                  <View style={styles.documentItem}>
                    <View style={styles.documentLeft}>
                      <Ionicons name="document-text" size={20} color={COLORS.primary[500]} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>Inspection</Text>
                        <Text style={styles.documentExpiry}>Expires: Mar 1, 2026</Text>
                      </View>
                    </View>
                    <View style={styles.documentStatusBadge}>
                      <Text style={styles.documentStatusText}>Valid</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.vehicleSection}>
                <Text style={styles.vehicleSectionTitle}>This Month</Text>
                <View style={styles.vehicleStatsGrid}>
                  <View style={styles.vehicleStatCard}>
                    <Ionicons name="speedometer" size={24} color={COLORS.primary[500]} />
                    <Text style={styles.vehicleStatValue}>1,247</Text>
                    <Text style={styles.vehicleStatLabel}>Miles</Text>
                  </View>
                  <View style={styles.vehicleStatCard}>
                    <Ionicons name="water" size={24} color={COLORS.primary[500]} />
                    <Text style={styles.vehicleStatValue}>42</Text>
                    <Text style={styles.vehicleStatLabel}>Gallons</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowPaymentModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <TouchableOpacity 
                onPress={() => setShowPaymentModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Current Payment Method */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>Current Payout Method</Text>
                <View style={styles.paymentMethodCard}>
                  <View style={styles.paymentMethodHeader}>
                    <Ionicons name="card" size={24} color={COLORS.primary[500]} />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodTitle}>Bank Account</Text>
                      <Text style={styles.paymentMethodSubtitle}>****1234</Text>
            </View>
                    <View style={styles.paymentDefaultBadge}>
                      <Text style={styles.paymentDefaultText}>Default</Text>
                    </View>
                  </View>
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodDetail}>Chase Bank</Text>
                    <Text style={styles.paymentMethodDetail}>Checking Account</Text>
                  </View>
                </View>
              </View>

              {/* Payout Schedule */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>Payout Schedule</Text>
                <View style={styles.payoutScheduleCard}>
                  <View style={styles.payoutScheduleRow}>
                    <Text style={styles.payoutScheduleLabel}>Frequency</Text>
                    <Text style={styles.payoutScheduleValue}>Weekly</Text>
                  </View>
                  <View style={styles.paymentDivider} />
                  <View style={styles.payoutScheduleRow}>
                    <Text style={styles.payoutScheduleLabel}>Next Payout</Text>
                    <Text style={styles.payoutScheduleValue}>Friday, Oct 18</Text>
                  </View>
                  <View style={styles.paymentDivider} />
                  <View style={styles.payoutScheduleRow}>
                    <Text style={styles.payoutScheduleLabel}>Amount</Text>
                    <Text style={styles.payoutScheduleValueHighlight}>$687.50</Text>
                  </View>
                </View>
              </View>

              {/* Recent Transactions */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>Recent Transactions</Text>
                <View style={styles.transactionsList}>
                  <View style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <Ionicons name="arrow-down" size={16} color={COLORS.success[500]} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>Weekly Payout</Text>
                        <Text style={styles.transactionDate}>Oct 11, 2025</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>+$645.00</Text>
                  </View>
                  <View style={styles.transactionDivider} />
                  <View style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <Ionicons name="arrow-down" size={16} color={COLORS.success[500]} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>Weekly Payout</Text>
                        <Text style={styles.transactionDate}>Oct 4, 2025</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>+$578.50</Text>
                  </View>
                  <View style={styles.transactionDivider} />
                  <View style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <Ionicons name="arrow-down" size={16} color={COLORS.success[500]} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>Weekly Payout</Text>
                        <Text style={styles.transactionDate}>Sep 27, 2025</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>+$612.75</Text>
                  </View>
                </View>
              </View>

              {/* Payment Actions */}
              <View style={styles.paymentSection}>
                <TouchableOpacity 
                  style={styles.paymentActionButton}
                  onPress={() => Alert.alert('Add Payment Method', 'Feature coming soon!')}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.paymentActionText}>Add Payment Method</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.paymentActionButton}
                  onPress={() => Alert.alert('Change Payout Schedule', 'Feature coming soon!')}
                >
                  <Ionicons name="calendar" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.paymentActionText}>Change Payout Schedule</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Pricing Modal */}
      <Modal
        visible={showAIPricingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIPricingModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowAIPricingModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Pricing</Text>
              <TouchableOpacity 
                onPress={() => setShowAIPricingModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.constructionContainer}>
                <View style={styles.constructionIconContainer}>
                  <Ionicons name="analytics" size={64} color={COLORS.primary[500]} />
            </View>
                <Text style={styles.constructionTitle}>Coming Soon</Text>
                <Text style={styles.constructionSubtitle}>Advanced AI-powered pricing insights</Text>
                <View style={styles.constructionFeaturesList}>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="trending-up" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Real-time demand predictions</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="flash" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Surge pricing alerts</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="location" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Optimal zone recommendations</Text>
                  </View>
                  <View style={styles.constructionFeatureItem}>
                    <Ionicons name="stats-chart" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.constructionFeatureText}>Earnings optimization tips</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.constructionButton}
                  onPress={() => Alert.alert('Beta Access', 'Sign up for early beta access when this feature launches!')}
                >
                  <Text style={styles.constructionButtonText}>Join Beta Waitlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Accessibility Modal */}
      <Modal
        visible={showAccessibilityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccessibilityModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowAccessibilityModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Accessibility</Text>
              <TouchableOpacity 
                onPress={() => setShowAccessibilityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalPlaceholderText}>Accessibility Dashboard Coming Soon</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Earnings Modal */}
      <Modal
        visible={showEarningsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowEarningsModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Earnings</Text>
              <TouchableOpacity 
                onPress={() => setShowEarningsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Today's Earnings Highlight */}
              <View style={styles.earningsHighlight}>
                <Text style={styles.earningsHighlightLabel}>Today's Earnings</Text>
                <Text style={styles.earningsHighlightValue}>$127.50</Text>
                <View style={styles.earningsTrendContainer}>
                  <Ionicons name="trending-up" size={16} color={COLORS.success[500]} />
                  <Text style={styles.earningsTrendText}>+12% from yesterday</Text>
            </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.earningsSection}>
                <View style={styles.earningsStatsRow}>
                  <View style={styles.earningsStatItem}>
                    <Text style={styles.earningsStatLabel}>This Week</Text>
                    <Text style={styles.earningsStatValue}>$687.50</Text>
                  </View>
                  <View style={styles.earningsStatItem}>
                    <Text style={styles.earningsStatLabel}>This Month</Text>
                    <Text style={styles.earningsStatValue}>$2,845.00</Text>
                  </View>
                </View>
              </View>

              {/* Earnings Breakdown */}
              <View style={styles.earningsSection}>
                <Text style={styles.earningsSectionTitle}>Today's Breakdown</Text>
                <View style={styles.earningsBreakdownCard}>
                  <View style={styles.earningsBreakdownRow}>
                    <Text style={styles.earningsBreakdownLabel}>Trip Fares</Text>
                    <Text style={styles.earningsBreakdownValue}>$98.50</Text>
                  </View>
                  <View style={styles.earningsBreakdownRow}>
                    <Text style={styles.earningsBreakdownLabel}>Tips</Text>
                    <Text style={styles.earningsBreakdownValue}>$18.00</Text>
                  </View>
                  <View style={styles.earningsBreakdownRow}>
                    <Text style={styles.earningsBreakdownLabel}>Bonuses</Text>
                    <Text style={styles.earningsBreakdownValue}>$11.00</Text>
                  </View>
                  <View style={styles.earningsDivider} />
                  <View style={styles.earningsBreakdownRow}>
                    <Text style={styles.earningsBreakdownLabelBold}>Total</Text>
                    <Text style={styles.earningsBreakdownValueBold}>$127.50</Text>
                  </View>
                </View>
              </View>

              {/* Next Payout */}
              <View style={styles.earningsSection}>
                <Text style={styles.earningsSectionTitle}>Next Payout</Text>
                <View style={styles.payoutCard}>
                  <View style={styles.payoutRow}>
                    <View style={styles.payoutInfo}>
                      <Text style={styles.payoutAmount}>$687.50</Text>
                      <Text style={styles.payoutDate}>Scheduled for Friday, Oct 18</Text>
                    </View>
                    <Ionicons name="calendar" size={24} color={COLORS.primary[500]} />
                  </View>
                  <View style={styles.payoutProgress}>
                    <View style={styles.payoutProgressBar}>
                      <View style={[styles.payoutProgressFill, { width: '65%' }]} />
                    </View>
                    <Text style={styles.payoutProgressText}>2 days remaining</Text>
                  </View>
                </View>
              </View>

              {/* Recent Payouts */}
              <View style={styles.earningsSection}>
                <Text style={styles.earningsSectionTitle}>Recent Payouts</Text>
                <View style={styles.payoutHistoryCard}>
                  <View style={styles.payoutHistoryItem}>
                    <View style={styles.payoutHistoryLeft}>
                      <Text style={styles.payoutHistoryDate}>Oct 11, 2025</Text>
                      <Text style={styles.payoutHistoryMethod}>Direct Deposit</Text>
                    </View>
                    <Text style={styles.payoutHistoryAmount}>$645.00</Text>
                  </View>
                  <View style={styles.earningsDivider} />
                  <View style={styles.payoutHistoryItem}>
                    <View style={styles.payoutHistoryLeft}>
                      <Text style={styles.payoutHistoryDate}>Oct 4, 2025</Text>
                      <Text style={styles.payoutHistoryMethod}>Direct Deposit</Text>
                    </View>
                    <Text style={styles.payoutHistoryAmount}>$578.50</Text>
                  </View>
                  <View style={styles.earningsDivider} />
                  <View style={styles.payoutHistoryItem}>
                    <View style={styles.payoutHistoryLeft}>
                      <Text style={styles.payoutHistoryDate}>Sep 27, 2025</Text>
                      <Text style={styles.payoutHistoryMethod}>Direct Deposit</Text>
                    </View>
                    <Text style={styles.payoutHistoryAmount}>$612.75</Text>
                  </View>
                </View>
              </View>

              {/* Earnings Tips */}
              <View style={styles.earningsSection}>
                <Text style={styles.earningsSectionTitle}>Boost Your Earnings</Text>
                <View style={styles.earningsTipCard}>
                  <Ionicons name="bulb" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.earningsTipText}>Drive during peak hours (5-7 PM) to earn more!</Text>
                </View>
                <View style={styles.earningsTipCard}>
                  <Ionicons name="trophy" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.earningsTipText}>Complete 10 more trips this week to unlock a $20 bonus</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Trip History Modal */}
      <Modal
        visible={showTripHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTripHistoryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowTripHistoryModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip History</Text>
              <TouchableOpacity 
                onPress={() => setShowTripHistoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Summary Stats */}
              <View style={styles.tripHistoryStats}>
                <View style={styles.tripHistoryStatItem}>
                  <Text style={styles.tripHistoryStatValue}>42</Text>
                  <Text style={styles.tripHistoryStatLabel}>This Week</Text>
            </View>
                <View style={styles.tripHistoryStatDivider} />
                <View style={styles.tripHistoryStatItem}>
                  <Text style={styles.tripHistoryStatValue}>187</Text>
                  <Text style={styles.tripHistoryStatLabel}>This Month</Text>
          </View>
                <View style={styles.tripHistoryStatDivider} />
                <View style={styles.tripHistoryStatItem}>
                  <Text style={styles.tripHistoryStatValue}>1,245</Text>
                  <Text style={styles.tripHistoryStatLabel}>All Time</Text>
        </View>
              </View>

              {/* Recent Trips */}
              <View style={styles.tripSection}>
                <Text style={styles.tripSectionTitle}>Recent Trips</Text>
                
                {/* Trip 1 */}
                <View style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripHeaderLeft}>
                      <Text style={styles.tripDate}>Today, 3:45 PM</Text>
                      <View style={styles.tripBadge}>
                        <Text style={styles.tripBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.tripEarnings}>$18.50</Text>
                  </View>
                  <View style={styles.tripRoute}>
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.primary[500]} />
                      <Text style={styles.tripLocation}>123 Main St, Downtown</Text>
                    </View>
                    <View style={styles.tripRouteLine} />
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.error[500]} />
                      <Text style={styles.tripLocation}>456 Oak Ave, Uptown</Text>
                    </View>
                  </View>
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripDistance}>5.2 miles • 18 min</Text>
                    <View style={styles.tripRating}>
                      <Ionicons name="star" size={14} color={COLORS.primary[500]} />
                      <Text style={styles.tripRatingText}>5.0</Text>
                    </View>
                  </View>
                </View>

                {/* Trip 2 */}
                <View style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripHeaderLeft}>
                      <Text style={styles.tripDate}>Today, 2:15 PM</Text>
                      <View style={styles.tripBadge}>
                        <Text style={styles.tripBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.tripEarnings}>$12.75</Text>
                  </View>
                  <View style={styles.tripRoute}>
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.primary[500]} />
                      <Text style={styles.tripLocation}>789 Pine Rd, Midtown</Text>
                    </View>
                    <View style={styles.tripRouteLine} />
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.error[500]} />
                      <Text style={styles.tripLocation}>321 Elm St, West End</Text>
                    </View>
                  </View>
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripDistance}>3.8 miles • 12 min</Text>
                    <View style={styles.tripRating}>
                      <Ionicons name="star" size={14} color={COLORS.primary[500]} />
                      <Text style={styles.tripRatingText}>4.8</Text>
                    </View>
                  </View>
                </View>

                {/* Trip 3 */}
                <View style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripHeaderLeft}>
                      <Text style={styles.tripDate}>Today, 11:30 AM</Text>
                      <View style={styles.tripBadge}>
                        <Text style={styles.tripBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.tripEarnings}>$24.00</Text>
                  </View>
                  <View style={styles.tripRoute}>
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.primary[500]} />
                      <Text style={styles.tripLocation}>555 Airport Rd</Text>
                    </View>
                    <View style={styles.tripRouteLine} />
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.error[500]} />
                      <Text style={styles.tripLocation}>Downtown Hotel</Text>
                    </View>
                  </View>
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripDistance}>8.5 miles • 22 min</Text>
                    <View style={styles.tripRating}>
                      <Ionicons name="star" size={14} color={COLORS.primary[500]} />
                      <Text style={styles.tripRatingText}>5.0</Text>
                    </View>
                  </View>
                </View>

                {/* Yesterday's Trips */}
                <Text style={[styles.tripSectionTitle, { marginTop: 16 }]}>Yesterday</Text>
                
                {/* Trip 4 */}
                <View style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripHeaderLeft}>
                      <Text style={styles.tripDate}>Oct 13, 6:20 PM</Text>
                      <View style={styles.tripBadge}>
                        <Text style={styles.tripBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.tripEarnings}>$16.25</Text>
                  </View>
                  <View style={styles.tripRoute}>
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.primary[500]} />
                      <Text style={styles.tripLocation}>234 Market St</Text>
                    </View>
                    <View style={styles.tripRouteLine} />
                    <View style={styles.tripRouteRow}>
                      <Ionicons name="location" size={16} color={COLORS.error[500]} />
                      <Text style={styles.tripLocation}>890 Broadway Ave</Text>
                    </View>
                  </View>
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripDistance}>4.3 miles • 15 min</Text>
                    <View style={styles.tripRating}>
                      <Ionicons name="star" size={14} color={COLORS.primary[500]} />
                      <Text style={styles.tripRatingText}>4.9</Text>
                    </View>
                  </View>
                </View>

                {/* View All Button */}
          <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => {
                    Alert.alert('Full History', 'Complete trip history feature coming soon!');
                  }}
                >
                  <Text style={styles.viewAllButtonText}>View All Trips</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary[500]} />
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal
        visible={showSupportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowSupportModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Support</Text>
              <TouchableOpacity 
                onPress={() => setShowSupportModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollableModalContent}>
              {/* Emergency Section */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>Emergency</Text>
                <TouchableOpacity 
                  style={[styles.supportButton, styles.emergencyButton]}
                  onPress={() => {
                    Alert.alert(
                      'Call Emergency Services',
                      'This will dial 911. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Call', 
                          onPress: () => Linking.openURL('tel:911'),
                          style: 'destructive'
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="alert-circle" size={24} color={COLORS.white} />
                  <View style={styles.supportButtonTextContainer}>
                    <Text style={styles.supportButtonTitle}>Emergency Services</Text>
                    <Text style={styles.supportButtonSubtitle}>Call 911</Text>
            </View>
                  <Ionicons name="call" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* Company Support Section */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>Company Support</Text>
                <TouchableOpacity 
                  style={styles.supportButton}
                  onPress={() => {
                    Alert.alert(
                      'Call Support',
                      'This will dial our support line. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Call', 
                          onPress: () => Linking.openURL('tel:8005555555')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="headset" size={24} color={COLORS.primary[500]} />
                  <View style={styles.supportButtonTextContainer}>
                    <Text style={styles.supportButtonTitleDark}>24/7 Helpline</Text>
                    <Text style={styles.supportButtonSubtitleDark}>1-800-555-5555</Text>
                  </View>
                  <Ionicons name="call" size={20} color={COLORS.primary[500]} />
                </TouchableOpacity>
              </View>

              {/* Quick Help Section */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>Quick Help</Text>
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Passenger Issues', 'Feature coming soon. Contact support at 1-800-555-5555 for immediate assistance.');
                  }}
                >
                  <Ionicons name="person" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Passenger Issues</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Payment Problems', 'Feature coming soon. Contact support at 1-800-555-5555 for immediate assistance.');
                  }}
                >
                  <Ionicons name="card" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Payment Problems</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Vehicle Issues', 'Feature coming soon. Contact support at 1-800-555-5555 for immediate assistance.');
                  }}
                >
                  <Ionicons name="car" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Vehicle Issues</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('App Technical Issues', 'Feature coming soon. Contact support at 1-800-555-5555 for immediate assistance.');
                  }}
                >
                  <Ionicons name="bug" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>App Technical Issues</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Accident/Incident Report', 'Feature coming soon. For emergencies, please call 911. For non-emergencies, contact support at 1-800-555-5555.');
                  }}
                >
                  <Ionicons name="warning" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Accident/Incident Report</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>

              {/* Additional Resources */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>Resources</Text>
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('FAQ', 'Feature coming soon. Visit our website or contact support for answers to common questions.');
                  }}
                >
                  <Ionicons name="help-circle" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>FAQ</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Driver Guide', 'Feature coming soon. Check back later for helpful driving tips and best practices.');
                  }}
                >
                  <Ionicons name="book" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Driver Guide</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportItemButton}
                  onPress={() => {
                    Alert.alert('Send Feedback', 'Feature coming soon. We value your input! Contact support to share your thoughts.');
                  }}
                >
                  <Ionicons name="chatbox" size={20} color={COLORS.primary[500]} />
                  <Text style={styles.supportItemText}>Send Feedback</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation Menu Modal */}
      <NavigationMenu
        visible={showNavigationMenu}
        onClose={() => setShowNavigationMenu(false)}
        navigation={navigation}
        user={user}
        profilePicture={profilePicture}
        imageLoadError={imageLoadError}
        onSafetyMenuPress={() => {
          setShowNavigationMenu(false);
          setShowEnhancedEmergencyModal(true);
        }}
        onCommunicationMenuPress={() => {
          setShowNavigationMenu(false);
          setShowCommunicationHub(true);
        }}
        onEarningsOptimizationMenuPress={() => {
          setShowNavigationMenu(false);
          setShowEarningsOptimization(true);
        }}
        onRouteOptimizationMenuPress={() => {
          setShowNavigationMenu(false);
          setShowRouteOptimization(true);
        }}
        onAdvancedPerformanceMenuPress={() => {
          setShowNavigationMenu(false);
          setShowAdvancedPerformance(true);
        }}
        onVehicleManagementMenuPress={() => {
          setShowNavigationMenu(false);
          setShowVehicleManagement(true);
        }}
      />

      {/* Location Test Panel */}
      <LocationTestPanel
        visible={showLocationTestPanel}
        onClose={() => setShowLocationTestPanel(false)}
      />
      
      {/* Scheduled Rides Bottom Modal */}
      <Modal
        visible={showScheduledRidesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScheduledRidesModal(false)}
      >
        <View style={styles.bottomModalOverlay}>
          <TouchableOpacity 
            style={styles.bottomModalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowScheduledRidesModal(false)}
          />
          <View style={styles.bottomModalContainer}>
            <View style={styles.bottomModalHandle} />
            <View style={styles.bottomModalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="calendar" size={24} color={COLORS.primary[500]} />
                <Text style={styles.modalTitle}>Scheduled Rides</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowScheduledRidesModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
              </TouchableOpacity>
            </View>
            
            <ScheduledRideRequests
              driverId={user?.uid || user?.id}
              isOnline={isOnline}
              onRideAccepted={(request) => {
                // console.log('Ride accepted:', request);
                checkScheduledRideStatus(); // Refresh status
                Alert.alert(
                  'Ride Accepted!',
                  'The scheduled ride has been added to your calendar.',
                  [
                    { text: 'OK' },
                    {
                      text: 'View Schedule',
                      onPress: () => {
                        setShowScheduledRidesModal(false);
                        // Open My Schedule modal instead of navigating to dashboard
                        setTimeout(() => setShowMyScheduledRidesModal(true), 300);
                      }
                    }
                  ]
                );
              }}
              onRideDeclined={(request) => {
                checkScheduledRideStatus(); // Refresh status
              }}
            />
          </View>
        </View>
      </Modal>

      {/* My Scheduled Rides Bottom Modal */}
      <Modal
        visible={showMyScheduledRidesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMyScheduledRidesModal(false)}
      >
        <View style={styles.bottomModalOverlay}>
          <TouchableOpacity 
            style={styles.bottomModalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowMyScheduledRidesModal(false)}
          />
          <View style={styles.bottomModalContainer}>
            <View style={styles.bottomModalHandle} />
            <View style={styles.bottomModalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="calendar-sharp" size={24} color={COLORS.primary[500]} />
                <Text style={styles.modalTitle}>My Scheduled Rides</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMyScheduledRidesModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
              </TouchableOpacity>
            </View>
            
            <MyScheduledRides driverId={user?.uid || user?.id} />
          </View>
        </View>
      </Modal>

      {/* Speech Settings Modal */}
      <SpeechSettingsModal
        visible={showSpeechSettings}
        onClose={() => setShowSpeechSettings(false)}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        currentRide={null}
        driverLocation={null}
      />

      {/* Enhanced Emergency Modal */}
      <EnhancedEmergencyModal
        visible={showEnhancedEmergencyModal}
        onClose={() => setShowEnhancedEmergencyModal(false)}
        currentRide={null}
        driverLocation={null}
        driverId={user?.uid}
      />

      {/* Safety Analytics Dashboard */}
      <Modal
        visible={showSafetyAnalytics}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafetyAnalyticsDashboard
          driverId={user?.uid}
          onClose={() => setShowSafetyAnalytics(false)}
          visible={showSafetyAnalytics}
        />
      </Modal>

      {/* Emergency Contacts Manager */}
      <Modal
        visible={showEmergencyContacts}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EmergencyContactsManager
          driverId={user?.uid}
          onClose={() => setShowEmergencyContacts(false)}
          visible={showEmergencyContacts}
        />
      </Modal>

      {/* Communication Hub */}
      <Modal
        visible={showCommunicationHub}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CommunicationHub
          driverId={user?.uid}
          onClose={() => setShowCommunicationHub(false)}
          visible={showCommunicationHub}
        />
      </Modal>

      {/* Quick Responses Manager */}
      <Modal
        visible={showQuickResponsesManager}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <QuickResponsesManager
          driverId={user?.uid}
          onClose={() => setShowQuickResponsesManager(false)}
          visible={showQuickResponsesManager}
        />
      </Modal>

      {/* Earnings Optimization Dashboard */}
      <Modal
        visible={showEarningsOptimization}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EarningsOptimizationDashboard
          driverId={user?.uid}
          onClose={() => setShowEarningsOptimization(false)}
          visible={showEarningsOptimization}
        />
      </Modal>

      {/* Earnings Goals Manager */}
      <Modal
        visible={showEarningsGoals}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EarningsGoalsManager
          driverId={user?.uid}
          onClose={() => setShowEarningsGoals(false)}
          visible={showEarningsGoals}
        />
      </Modal>

      {/* Route Optimization Dashboard */}
      <Modal
        visible={showRouteOptimization}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <RouteOptimizationDashboard
          driverId={user?.uid}
          onClose={() => setShowRouteOptimization(false)}
          visible={showRouteOptimization}
        />
      </Modal>

      {/* Advanced Performance Analytics Dashboard */}
      <AdvancedPerformanceDashboard
        visible={showAdvancedPerformance}
        onClose={() => setShowAdvancedPerformance(false)}
        driverId={user?.uid}
      />

      {/* Vehicle Management Dashboard */}
      <VehicleManagementDashboard
        visible={showVehicleManagement}
        onClose={() => setShowVehicleManagement(false)}
        driverId={user?.uid}
      />

      {/* AI Analytics Dashboard */}
      <Modal
        visible={showAIAnalyticsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PredictiveAnalyticsDashboard
          onClose={() => setShowAIAnalyticsModal(false)}
        />
      </Modal>

      {/* Smart Recommendations Dashboard */}
      <Modal
        visible={showSmartRecommendationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SmartRecommendationsDashboard
          onClose={() => setShowSmartRecommendationsModal(false)}
        />
      </Modal>

      {/* Behavioral Learning Dashboard */}
      <Modal
        visible={showBehavioralLearningModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BehavioralLearningDashboard
          onClose={() => setShowBehavioralLearningModal(false)}
        />
      </Modal>

      {/* Market Intelligence Dashboard */}
      <Modal
        visible={showMarketIntelligenceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MarketIntelligenceDashboard
          onClose={() => setShowMarketIntelligenceModal(false)}
        />
      </Modal>

      {/* Risk Assessment Dashboard */}
      <Modal
        visible={showRiskAssessmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <RiskAssessmentDashboard
          onClose={() => setShowRiskAssessmentModal(false)}
        />
      </Modal>

      {/* Demand Forecasting Dashboard */}
      <Modal
        visible={showDemandForecastingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DemandForecastingDashboard
          onClose={() => setShowDemandForecastingModal(false)}
        />
      </Modal>

      {/* Dynamic Pricing Dashboard */}
      <Modal
        visible={showDynamicPricingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DynamicPricingDashboard
          onClose={() => setShowDynamicPricingModal(false)}
        />
      </Modal>

      {/* Route Optimization Dashboard */}
      <Modal
        visible={showRouteOptimizationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AIRouteOptimizationDashboard
          onClose={() => setShowRouteOptimizationModal(false)}
        />
      </Modal>
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
    paddingTop: Platform.OS === 'android' ? 32 : 16,
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
    marginTop: 3,
    marginBottom: 3,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  statusIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  statusIcon: {
    // No margin needed, handled by container
  },
  scheduledRideBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  scheduledRideBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  scheduledRideQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  scheduledRideQuickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary[500],
    marginLeft: 4,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
  },
  earningsHeaderContent: {
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[600],
    marginBottom: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
  },
  earningsDetails: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsItemText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.SMALL,
    padding: SPACING.SMALL,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.TINY_HORIZONTAL,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: hp('0.3%'),
  },
  statValue: {
    fontSize: rf(1.6, 12), // Responsive with 12px min
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginTop: SPACING.TINY,
    marginBottom: hp('0.25%'),
  },
  statLabel: {
    fontSize: rf(1, 10), // Responsive with 10px min
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  activeRideCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
  },
  activeRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SMALL,
  },
  activeRideHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRideTitle: {
    fontSize: FONT_SIZES.HEADING,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeRideBadge: {
    backgroundColor: COLORS.primary[700],
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.TINY,
    borderRadius: BORDER_RADIUS.SMALL,
  },
  activeRideBadgeText: {
    fontSize: FONT_SIZES.SMALL,
    color: COLORS.white,
    fontWeight: '600',
  },
  closeActiveRide: {
    marginLeft: SPACING.SMALL,
    padding: SPACING.TINY,
  },
  activeRideDetails: {
    marginBottom: SPACING.MEDIUM,
  },
  activeRideText: {
    fontSize: FONT_SIZES.SMALL,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.TINY,
  },
  continueRideButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BUTTON_SIZES.PADDING_VERTICAL,
    borderRadius: BORDER_RADIUS.MEDIUM,
  },
  continueRideButtonText: {
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: COLORS.primary[500],
    marginRight: SPACING.SMALL,
  },
  quickActions: {
    marginBottom: SPACING.TINY,
  },
  quickActionsTitle: {
    fontSize: FONT_SIZES.HEADING,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: SPACING.TINY,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.MEDIUM,
    padding: SPACING.SMALL,
    alignItems: 'center',
    width: wp('29%'), // Responsive width (~30% of screen minus margins)
    marginBottom: SPACING.SMALL,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: hp('0.3%'),
  },
  actionCardActive: {
    backgroundColor: COLORS.success,
  },
  actionText: {
    fontSize: rf(1.1, 10), // Responsive with 10px min
    fontWeight: '500',
    color: COLORS.secondary[900],
    marginTop: SPACING.SMALL,
    textAlign: 'center',
  },
  actionTextActive: {
    color: COLORS.white,
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
  bottomSpacingForFooter: {
    height: 100, // Extra space to account for fixed footer
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
    width: SCREEN_WIDTH * 0.85, // Slightly wider
    maxWidth: 350, // Maximum width to prevent it from being too wide on tablets
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
    paddingHorizontal: 16, // Reduce horizontal padding
    paddingVertical: 20, // Keep vertical padding
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow it to take available space
    marginRight: 12, // Add some margin from the close button
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6', // Blue color as fallback
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f3f4f6', // Light gray background
    borderWidth: 1,
    borderColor: '#e5e7eb', // Light border for better definition
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
    marginRight: -16, // Shift left more
    borderRadius: 8,
    backgroundColor: '#f3f4f6', // Light background for better visibility
    alignSelf: 'flex-start', // Ensure it stays within bounds
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
  testingNotice: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  testingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary[700],
    marginBottom: 4,
  },
  testingSubtext: {
    fontSize: 12,
    color: COLORS.primary[600],
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  bottomModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomModalBackdrop: {
    flex: 1,
  },
  bottomModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  bottomModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  bottomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollableModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalPlaceholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Support Modal Styles
  supportSection: {
    marginBottom: 24,
  },
  supportSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyButton: {
    backgroundColor: COLORS.error[500],
    borderColor: COLORS.error[600],
  },
  supportButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  supportButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  supportButtonSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  supportButtonTitleDark: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  supportButtonSubtitleDark: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  supportItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  supportItemText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  // Analytics Modal Styles
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -3,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 3,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 3,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.secondary[600],
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary[500],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peakHoursCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  peakHourRow: {
    marginBottom: 16,
  },
  peakHourTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 6,
  },
  peakHourBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  peakHourFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 4,
  },
  peakHourEarnings: {
    fontSize: 13,
    color: COLORS.secondary[600],
    textAlign: 'right',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary[100],
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  // Earnings Modal Styles
  earningsHighlight: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsHighlightLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  earningsHighlightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  earningsTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsTrendText: {
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 4,
  },
  earningsSection: {
    marginBottom: 24,
  },
  earningsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  earningsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  earningsStatItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsStatLabel: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginBottom: 6,
  },
  earningsStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  earningsBreakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  earningsBreakdownLabel: {
    fontSize: 15,
    color: COLORS.secondary[600],
  },
  earningsBreakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  earningsBreakdownLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  earningsBreakdownValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary[500],
  },
  earningsDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  payoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  payoutProgress: {
    marginTop: 8,
  },
  payoutProgressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  payoutProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
  },
  payoutProgressText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    textAlign: 'right',
  },
  payoutHistoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  payoutHistoryLeft: {
    flex: 1,
  },
  payoutHistoryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  payoutHistoryMethod: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  payoutHistoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  earningsTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary[100],
  },
  earningsTipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  // Trip History Modal Styles
  tripHistoryStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHistoryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripHistoryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  tripHistoryStatLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  tripHistoryStatDivider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 8,
  },
  tripSection: {
    marginBottom: 24,
  },
  tripSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flex: 1,
  },
  tripDate: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginBottom: 6,
  },
  tripBadge: {
    backgroundColor: COLORS.success[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tripBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success[700],
  },
  tripEarnings: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary[500],
  },
  tripRoute: {
    marginBottom: 12,
  },
  tripRouteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripRouteLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginLeft: 7,
    marginVertical: 4,
  },
  tripLocation: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[900],
    marginLeft: 8,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  tripDistance: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  tripRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary[500],
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary[500],
    marginRight: 4,
  },
  // Vehicle Modal Styles
  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary[50],
  },
  vehicleDetails: {
    gap: 12,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  vehicleDetailLabel: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  vehicleDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  vehicleSection: {
    marginBottom: 24,
  },
  vehicleSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  maintenanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  maintenanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  maintenanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  maintenanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  maintenanceSubtitle: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  maintenanceDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  documentsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  documentExpiry: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  documentStatusBadge: {
    backgroundColor: COLORS.success[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  documentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success[700],
  },
  documentDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  vehicleStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginTop: 8,
  },
  vehicleStatLabel: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  // Payment Modal Styles
  paymentSection: {
    marginBottom: 24,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  paymentDefaultBadge: {
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[500],
  },
  paymentMethodDetails: {
    paddingLeft: 36,
  },
  paymentMethodDetail: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  payoutScheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutScheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  payoutScheduleLabel: {
    fontSize: 15,
    color: COLORS.secondary[600],
  },
  payoutScheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  payoutScheduleValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary[500],
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 4,
  },
  transactionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: COLORS.secondary[600],
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success[600],
  },
  transactionDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  paymentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  paymentActionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  // Under Construction Styles
  constructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  constructionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  constructionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginBottom: 8,
  },
  constructionSubtitle: {
    fontSize: 16,
    color: COLORS.secondary[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  constructionFeaturesList: {
    width: '100%',
    marginBottom: 32,
  },
  constructionFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginBottom: 8,
  },
  constructionFeatureText: {
    fontSize: 15,
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  constructionButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  constructionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default HomeScreen; 