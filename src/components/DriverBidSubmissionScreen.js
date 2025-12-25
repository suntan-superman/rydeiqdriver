import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Safe imports
let Haptics, COLORS, driverBidNotificationService, Location;

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
  COLORS = require('@/constants').COLORS;
} catch (e) {
  console.warn('⚠️ COLORS not available:', e.message);
  COLORS = {
    primary: '#007AFF',
    secondary: { 
      50: '#F9FAFB', 
      200: '#E5E7EB', 
      300: '#D1D5DB', 
      600: '#4B5563', 
      700: '#374151', 
      800: '#1F2937', 
      900: '#111827' 
    },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    gray: {
      300: '#D1D5DB',
      400: '#9CA3AF'
    }
  };
}

try {
  driverBidNotificationService = require('@/services/driverBidNotificationService').default;
} catch (e) {
  console.warn('⚠️ driverBidNotificationService not available:', e.message);
  driverBidNotificationService = {
    startListeningForBidAcceptance: () => Promise.resolve(() => {}),
    stopListening: () => {}
  };
}

try {
  Location = require('expo-location');
  // console.log('✅ expo-location imported successfully');
} catch (e) {
  console.warn('⚠️ expo-location not available on iOS device:', e.message);
  Location = null;
}

// Safe imports
let RideRequestService, costEstimationService, FareCalculationCard, AsyncStorage, voiceCommandService, VoiceCommandIndicator, speechService;
try {
  voiceCommandService = require('@/services/voiceCommandService').default;
} catch (e) {
  console.warn('⚠️ voiceCommandService not available:', e.message);
  voiceCommandService = {
    initialize: () => Promise.resolve(true),
    startListening: () => Promise.resolve(true),
    stopListening: () => Promise.resolve(),
    destroy: () => Promise.resolve(),
    getListeningState: () => false,
  };
}

try {
  VoiceCommandIndicator = require('@/components/VoiceCommandIndicator').default;
} catch (e) {
  console.warn('⚠️ VoiceCommandIndicator not available:', e.message);
  VoiceCommandIndicator = () => null;
}

try {
  speechService = require('@/services/speechService').default;
} catch (e) {
  console.warn('⚠️ speechService not available:', e.message);
  speechService = {
    speak: () => Promise.resolve(),
    getSettings: () => ({ enabled: false }),
  };
}

try {
  RideRequestService = require('@/services/rideRequestService').default;
  // console.log('✅ RideRequestService imported successfully');
} catch (e) { 
  console.warn('⚠️ RideRequestService import failed:', e.message);
  RideRequestService = null; 
}
try {
  costEstimationService = require('@/services/costEstimationService').default;
} catch (e) { costEstimationService = null; }

try {
  FareCalculationCard = require('@/components/FareCalculationCard').default;
  // console.log('✅ FareCalculationCard imported successfully');
} catch (e) { 
  console.warn('⚠️ FareCalculationCard not available on iOS device:', e.message);
  FareCalculationCard = null; 
}

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('⚠️ AsyncStorage not available:', e.message);
  AsyncStorage = null;
}

// Import bid adjustment configuration utilities
let bidAdjustmentConfig;
try {
  bidAdjustmentConfig = require('@/utils/bidAdjustmentConfig');
} catch (e) {
  console.warn('⚠️ bidAdjustmentConfig not available:', e.message);
  // Fallback defaults
  bidAdjustmentConfig = {
    DEFAULT_INCREASE_BUTTONS: [
      { type: 'amount', value: 2, label: '+$2', id: 'inc_1' },
      { type: 'amount', value: 5, label: '+$5', id: 'inc_2' },
      { type: 'percentage', value: 10, label: '+10%', id: 'inc_3' }
    ],
    DEFAULT_DECREASE_BUTTONS: [
      { type: 'amount', value: 2, label: '-$2', id: 'dec_1' },
      { type: 'amount', value: 5, label: '-$5', id: 'dec_2' },
      { type: 'percentage', value: 10, label: '-10%', id: 'dec_3' }
    ],
    loadButtonConfig: async () => ({
      increaseButtons: bidAdjustmentConfig.DEFAULT_INCREASE_BUTTONS,
      decreaseButtons: bidAdjustmentConfig.DEFAULT_DECREASE_BUTTONS
    })
  };
}

const { DEFAULT_INCREASE_BUTTONS, DEFAULT_DECREASE_BUTTONS } = bidAdjustmentConfig;

/**
 * BID VALIDATION CONSTANTS
 * These ensure bids stay within safe, reasonable bounds
 */
const MIN_BID_AMOUNT = 5.00;    // Minimum bid: $5.00
const MAX_BID_AMOUNT = 500.00;  // Maximum bid: $500.00

/**
 * Enhanced Driver Bid Submission Screen
 * Provides comprehensive bid submission with real-time feedback and cost analysis
 */
const DriverBidSubmissionScreen = ({
  isVisible = false,
  rideRequest = null,
  driverInfo = null,
  driverVehicle = null,
  driverLocation = null,  // Driver's current location
  currentRide = null,     // Active ride if driver is currently on one
  onBidSubmitted,
  onBidAccepted,
  onRideCancelled,
  onClose
}) => {
  // Validate driverInfo immediately
  if (!driverInfo || !driverInfo.id) {
    console.warn('⚠️ WARNING: DriverBidSubmissionScreen received invalid driverInfo:', driverInfo);
  }
  
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  
  // State management with debugging
  const [customBidAmount, setCustomBidAmountInternal] = useState('15.00');
  
  const setCustomBidAmount = (value) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return;
    }
    if (typeof value === 'number' && isNaN(value)) {
      return;
    }
    if (typeof value === 'string' && isNaN(parseFloat(value))) {
      return;
    }
    setCustomBidAmountInternal(value);
  };
  const [currentPrice, setCurrentPrice] = useState(15);
  const [resolvedAddresses, setResolvedAddresses] = useState({
    pickup: null,
    destination: null
  });
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isListeningForAcceptance, setIsListeningForAcceptance] = useState(false);
  const [fareCalculation, setFareCalculation] = useState(null);
  const [netEarnings, setNetEarnings] = useState(null);
  const [bidStatus, setBidStatus] = useState('idle'); // 'idle', 'submitting', 'listening', 'accepted', 'rejected'
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [pickupDistance, setPickupDistance] = useState(null);
  const [tripDistance, setTripDistance] = useState(null);
  const [timeEstimates, setTimeEstimates] = useState(null);
  
  // Voice command state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceContext, setVoiceContext] = useState(null); // 'ride_request' or 'confirmation'
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'accept' or 'decline'
  const voiceTimeoutRef = useRef(null);
  const [increaseButtons, setIncreaseButtons] = useState(DEFAULT_INCREASE_BUTTONS);
  const [decreaseButtons, setDecreaseButtons] = useState(DEFAULT_DECREASE_BUTTONS);
  const [savedDefaultBid, setSavedDefaultBid] = useState(null); // Save original bid for reset
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listeningAnim = useRef(new Animated.Value(0)).current;

  // Platform commission rate (could be configurable)
  const PLATFORM_COMMISSION = 0.15; // 15%

  /**
   * Calculate accurate pickup distance based on driver's current state
   * - If driver is on active ride, calculate from dropoff to new pickup
   * - Otherwise, calculate from current location to pickup
   */
  const calculatePickupDistance = () => {
    if (!rideRequest?.pickup) return 2.5;
    
    // Determine starting point
    let startPoint = null;
    
    if (currentRide?.dropoff?.coordinates) {
      // Driver is on active ride - calculate from dropoff to new pickup
      startPoint = {
        latitude: currentRide.dropoff.coordinates.latitude || currentRide.dropoff.coordinates.lat,
        longitude: currentRide.dropoff.coordinates.longitude || currentRide.dropoff.coordinates.lng
      };
    } else if (driverLocation) {
      // Driver is available - use current location
      startPoint = driverLocation;
    }
    
    if (!startPoint || !costEstimationService) {
      return 2.5; // fallback
    }
    
    try {
      const distance = costEstimationService.calculatePickupDistance(startPoint, rideRequest.pickup);
      return Math.max(0.1, distance); // Minimum 0.1 miles
    } catch (error) {
      console.error('Error calculating pickup distance:', error);
      return 2.5;
    }
  };

  /**
   * Calculate trip distance from pickup to destination
   */
  const calculateTripDistance = () => {
    // Check for both destination and dropoff properties
    const destination = rideRequest?.destination || rideRequest?.dropoff;
    
    // First priority: Use the estimated distance from the ride request
    if (rideRequest?.estimatedDistance) {
      const parsed = parseFloat(rideRequest.estimatedDistance);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    
    // Second priority: Use distanceInMiles if available
    if (rideRequest?.distanceInMiles && rideRequest.distanceInMiles > 0) {
      return rideRequest.distanceInMiles;
    }
    
    // Third priority: Calculate from coordinates
    if (!rideRequest?.pickup || !destination) {
      console.warn('⚠️ Missing pickup or destination for calculation, using fallback');
      return 3.0;
    }
    
    if (!costEstimationService) {
      console.warn('⚠️ costEstimationService not available, using fallback');
      return 3.0;
    }
    
    try {
      const distance = costEstimationService.calculateTripDistance(
        rideRequest.pickup,
        destination
      );
      return Math.max(0.1, distance);
    } catch (error) {
      console.error('❌ Error calculating trip distance:', error);
      return 3.0;
    }
  };

  /**
   * Calculate time estimates for pickup and total trip
   */
  const calculateTimeEstimates = (pickupDist, tripDist) => {
    const avgPickupSpeed = 25; // mph average speed in traffic
    const navigationBuffer = 3; // minutes for navigation/parking
    
    // Calculate pickup time
    const pickupTimeHours = pickupDist / avgPickupSpeed;
    const pickupTimeMinutes = Math.round(pickupTimeHours * 60) + navigationBuffer;
    
    // Get trip duration from ride request
    const tripTimeMinutes = parseInt(rideRequest?.estimatedDuration) || 
                           Math.round((tripDist / 30) * 60); // fallback: 30 mph
    
    // Total time
    const totalTimeMinutes = pickupTimeMinutes + tripTimeMinutes;
    
    return {
      pickupTime: pickupTimeMinutes,
      tripTime: tripTimeMinutes,
      totalTime: totalTimeMinutes,
      pickupTimeFormatted: `${pickupTimeMinutes} min`,
      tripTimeFormatted: `${tripTimeMinutes} min`,
      totalTimeFormatted: `${totalTimeMinutes} min`
    };
  };

  /**
   * Simple reverse geocode using Expo Location (no API key needed)
   */
  const reverseGeocode = async (lat, lng) => {
    // Safety check for Location availability
    if (!Location) {
      // console.log('⚠️ Location service not available - using coordinates');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [];
        if (addr.streetNumber) parts.push(addr.streetNumber);
        if (addr.street) parts.push(addr.street);
        if (addr.city) parts.push(addr.city);
        if (addr.region) parts.push(addr.region);
        if (addr.postalCode) parts.push(addr.postalCode);
        
        return parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.log('❌ Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Setup service references once
  useEffect(() => {
    if (driverBidNotificationService && RideRequestService) {
      // console.log('🔗 Setting up service references');
      driverBidNotificationService.setRideRequestService(RideRequestService);
    }
  }, []);

  useEffect(() => {
    // console.log('🎯 DriverBidSubmissionScreen useEffect - isVisible:', isVisible, 'rideRequest:', !!rideRequest);
    
    // Comment out potentially problematic functionality for iOS debugging
    /*
    if (isVisible && rideRequest) {
      calculateInitialEstimates();
    }
    */
    if (!isVisible) {
      // Reset basic state when modal closes
      setShowFareDetails(false);
    }
  }, [isVisible, rideRequest]);

  useEffect(() => {
    // console.log('🎯 DriverBidSubmissionScreen animation useEffect - isListeningForAcceptance:', isListeningForAcceptance);
    
    // Comment out animations for iOS debugging
    /*
    if (isListeningForAcceptance) {
      startListeningAnimation();
    } else {
      stopListeningAnimation();
    }
    */
  }, [isListeningForAcceptance]);

  // Calculate net earnings when bid amount changes
  useEffect(() => {
    // console.log('🎯 DriverBidSubmissionScreen earnings useEffect - customBidAmount:', customBidAmount);
    
    // Comment out for iOS debugging
    /*
    if (customBidAmount) {
      calculateNetEarnings(parseFloat(customBidAmount));
    }
    */
  }, [customBidAmount]);

  // Initialize voice command service
  useEffect(() => {
    voiceCommandService.initialize();
    return () => {
      voiceCommandService.destroy();
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
    };
  }, []);

  // Start voice listening when modal opens (after speech announcement)
  useEffect(() => {
    if (isVisible && rideRequest) {
      // Check if voice is enabled in speech settings
      const settings = speechService.getSettings();
      if (settings?.enabled) {
        // Wait for sound (2s) + voice announcement (3s) to finish
        voiceTimeoutRef.current = setTimeout(() => {
          startVoiceListening();
        }, 5000);
      }
    } else {
      // Stop listening when modal closes
      stopVoiceListening();
    }

    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
    };
  }, [isVisible, rideRequest]);

  /**
   * Start voice listening for accept/decline
   */
  const startVoiceListening = async () => {
    try {
      setIsVoiceListening(true);
      setVoiceContext('ride_request');
      
      await voiceCommandService.startListening('ride_request', handleVoiceCommand, 10000);
      console.log('🎤 Voice listening started for ride request');
    } catch (error) {
      console.error('❌ Failed to start voice listening:', error);
      setIsVoiceListening(false);
    }
  };

  /**
   * Stop voice listening
   */
  const stopVoiceListening = async () => {
    try {
      await voiceCommandService.stopListening();
      setIsVoiceListening(false);
      setVoiceContext(null);
      setNeedsConfirmation(false);
      setPendingAction(null);
      console.log('🔇 Voice listening stopped');
    } catch (error) {
      console.error('❌ Failed to stop voice listening:', error);
    }
  };

  /**
   * Handle voice command results
   */
  const handleVoiceCommand = async (result) => {
    console.log('🎤 Voice command result:', result);
    
    if (result.type === 'success') {
      const { command } = result;
      
      if (command === 'decline') {
        // Require confirmation for decline to prevent accidents
        setPendingAction('decline');
        setNeedsConfirmation(true);
        setVoiceContext('confirmation');
        
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (hapticError) {
          // Haptics may not be available on all devices - non-critical failure
          console.warn('Haptic feedback unavailable:', hapticError?.message || 'Unknown error');
        }
        
        // Ask for confirmation
        await speechService.speak('Are you sure you want to decline this ride? Say confirm or cancel', null);
        
        // Start listening for confirmation
        setTimeout(async () => {
          setIsVoiceListening(true);
          await voiceCommandService.startListening('confirmation', handleConfirmation, 10000);
        }, 4000); // Wait for speech to finish
        
      } else if (command === 'accept') {
        // Accept the ride immediately
        setPendingAction('accept');
        
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (hapticError) {
          // Haptics may not be available on all devices - non-critical failure
          console.warn('Haptic feedback unavailable:', hapticError?.message || 'Unknown error');
        }
        
        await speechService.speak('Ride accepted', null);
        
        // Proceed to bid submission (use existing functionality)
        // The modal will stay open for driver to set bid amount
        setIsVoiceListening(false);
        setVoiceContext(null);
      }
    } else if (result.type === 'timeout') {
      console.log('⏱️ Voice command timeout - driver can use touch buttons');
      setIsVoiceListening(false);
      setVoiceContext(null);
    } else if (result.type === 'error') {
      console.error('❌ Voice error:', result.error);
      setIsVoiceListening(false);
      setVoiceContext(null);
    }
  };

  /**
   * Handle confirmation voice command (for decline)
   */
  const handleConfirmation = async (result) => {
    if (result.type === 'success') {
      const { command } = result;
      
      if (command === 'confirm' && pendingAction === 'decline') {
        // Execute decline
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (hapticError) {
          // Haptics may not be available on all devices - non-critical failure
          console.warn('Haptic feedback unavailable:', hapticError?.message || 'Unknown error');
        }
        
        await speechService.speak('Ride declined', null);
        
        // Close modal and decline
        setIsVoiceListening(false);
        setNeedsConfirmation(false);
        setPendingAction(null);
        onClose();
        
      } else if (command === 'cancel') {
        // Cancel action, go back to listening for accept/decline
        setPendingAction(null);
        setNeedsConfirmation(false);
        
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (hapticError) {
          // Haptics may not be available on all devices - non-critical failure
          console.warn('Haptic feedback unavailable:', hapticError?.message || 'Unknown error');
        }
        
        await speechService.speak('Cancelled. Say accept or decline', null);
        
        setTimeout(() => startVoiceListening(), 3000);
      }
    } else {
      setIsVoiceListening(false);
      setNeedsConfirmation(false);
    }
  };

  /**
   * Show modal with animation
   */
  const showModal = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  /**
   * Hide modal with animation
   */
  const hideModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Reset component state
   */
  const resetState = () => {
    // console.log('🔄 resetState called - NOT resetting customBidAmount to prevent NaN');
    // Don't reset customBidAmount to empty string - it causes NaN
    // setCustomBidAmount(''); // REMOVED - causes NaN
    setIsSubmittingBid(false);
    setIsListeningForAcceptance(false);
    setFareCalculation(null);
    setNetEarnings(null);
    setBidStatus('idle');
    
    // Stop any active listeners
    if (rideRequest?.id) {
      driverBidNotificationService.stopListening(rideRequest.id);
    }
  };

  /**
   * Calculate initial cost estimates
   */
  const calculateInitialEstimates = async () => {
    if (!costEstimationService || !rideRequest || !driverVehicle) {
      return;
    }

    try {
      const analysis = await costEstimationService.calculateRideCosts(rideRequest, driverVehicle);
      if (analysis) {
        // Extract relevant cost data
        const estimatedCosts = analysis.trip?.cost || 0;
        setFareCalculation({
          totalEstimatedCosts: estimatedCosts,
          breakdown: analysis
        });
        
        // Set initial bid suggestion
        const suggestedBid = Math.max(estimatedCosts * 1.3, parseFloat(rideRequest.estimatedPrice || 0));
        setCustomBidAmount(suggestedBid.toFixed(2));
      }
    } catch (error) {
      console.error('Error calculating initial estimates:', error);
    }
  };

  /**
   * Calculate net earnings after platform commission
   * @param {number} bidAmount - Driver's bid amount (what they'll receive before platform fee)
   * 
   * FARE CALCULATION BREAKDOWN:
   * - Bid Amount = Driver compensation (gross)
   * - Platform Fee = 15% of bid amount (AnyRyde commission)
   * - Net Driver Earnings = Bid Amount - Platform Fee
   * - This does NOT include rider fees, tolls, or other charges
   */
  const calculateNetEarnings = (bidAmount) => {
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setNetEarnings(null);
      return;
    }

    const grossEarnings = bidAmount;
    const platformFee = grossEarnings * PLATFORM_COMMISSION;
    const netAmount = grossEarnings - platformFee;
    
    const estimatedCosts = fareCalculation?.totalEstimatedCosts || 0;
    const profit = netAmount - estimatedCosts;
    const profitMargin = estimatedCosts > 0 ? (profit / estimatedCosts) * 100 : 0;

    setNetEarnings({
      gross: grossEarnings,
      platformFee: platformFee,
      net: netAmount,
      estimatedCosts: estimatedCosts,
      profit: profit,
      profitMargin: profitMargin
    });
  };

  /**
   * Load button configuration from storage
   */
  const loadButtonConfig = async () => {
    if (!bidAdjustmentConfig?.loadButtonConfig) return;
    
    try {
      const config = await bidAdjustmentConfig.loadButtonConfig();
      if (config.increaseButtons) setIncreaseButtons(config.increaseButtons);
      if (config.decreaseButtons) setDecreaseButtons(config.decreaseButtons);
    } catch (error) {
      console.warn('Could not load button config:', error);
    }
  };

  /**
   * Apply bid adjustment based on button type
   * @param {Object} button - Button configuration {type, value, label}
   * @param {string} direction - 'increase' or 'decrease'
   */
  const applyBidAdjustment = (button, direction) => {
    const currentBid = parseFloat(customBidAmount) || currentPrice;
    let newBid = currentBid;
    
    if (button.type === 'amount') {
      // Fixed amount adjustment
      newBid = direction === 'increase' 
        ? currentBid + button.value 
        : currentBid - button.value;
    } else if (button.type === 'percentage') {
      // Percentage adjustment
      const adjustment = currentBid * (button.value / 100);
      newBid = direction === 'increase'
        ? currentBid + adjustment
        : currentBid - adjustment;
    }
    
    // ✅ FAIL-SAFE: Enforce minimum and maximum bid amounts
    newBid = Math.max(MIN_BID_AMOUNT, Math.min(MAX_BID_AMOUNT, newBid));
    
    // Show alert if minimum reached
    if (newBid === MIN_BID_AMOUNT && direction === 'decrease') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Minimum Bid Reached', 
        `Cannot go below $${MIN_BID_AMOUNT.toFixed(2)}`
      );
    }
    
    // Show alert if maximum reached
    if (newBid === MAX_BID_AMOUNT && direction === 'increase') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Maximum Bid Reached', 
        `Cannot exceed $${MAX_BID_AMOUNT.toFixed(2)}`
      );
    }
    
    // Update bid amount
    setCustomBidAmount(newBid.toFixed(2));
    setCurrentPrice(newBid);
    
    // Haptic feedback (only if not at limit)
    if (newBid !== MIN_BID_AMOUNT && newBid !== MAX_BID_AMOUNT) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  /**
   * Reset bid to original default amount
   */
  const resetToDefaultBid = () => {
    if (savedDefaultBid !== null) {
      setCustomBidAmount(savedDefaultBid.toFixed(2));
      setCurrentPrice(savedDefaultBid);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /**
   * Handle quick bid adjustment (legacy - keeping for compatibility)
   * @param {number} adjustment - Amount to add/subtract
   */
  const handleQuickBidAdjustment = (adjustment) => {
    const newPrice = Math.max(currentPrice + adjustment, 5); // Minimum $5
    setCurrentPrice(newPrice);
    setCustomBidAmount(newPrice.toFixed(2));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Handle smart bid calculation
   */
  const handleSmartBid = () => {
    // console.log('🎯 Smart Bid clicked - fareCalculation:', fareCalculation);
    if (!fareCalculation || !fareCalculation.totalEstimatedCosts) {
      Alert.alert(
        'Smart Bid Unavailable', 
        'Cost analysis is still calculating. Please try again in a moment.'
      );
      return;
    }

    const targetProfitMargin = 0.3; // 30% profit margin
    const estimatedCosts = parseFloat(fareCalculation?.totalEstimatedCosts) || 0;
    
    if (!estimatedCosts || estimatedCosts <= 0 || isNaN(estimatedCosts)) {
      Alert.alert(
        'Smart Bid Unavailable', 
        'Cost analysis data is incomplete. Please try again in a moment.'
      );
      return;
    }
    
    const smartBid = estimatedCosts * (1 + targetProfitMargin);
    const companyBid = parseFloat(rideRequest?.companyBid) || 15;
    const finalBid = Math.max(smartBid, companyBid + 2, 5);

    Alert.alert(
      'Smart Bid Calculation',
      `Suggested bid: $${finalBid.toFixed(2)}\n\nBased on:\n• Estimated costs: $${estimatedCosts.toFixed(2)}\n• Target profit: ${(targetProfitMargin * 100)}%\n• Minimum viable bid`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use This Bid', 
          onPress: () => {
            setCurrentPrice(finalBid);
            setCustomBidAmount(finalBid.toFixed(2));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      ]
    );
  };

  /**
   * Submit the bid
   */
  const handleSubmitBid = async () => {
    // console.log('🚀 handleSubmitBid called');
    // console.log('💰 customBidAmount:', customBidAmount);
    
    const bidAmount = parseFloat(customBidAmount);
    // console.log('💰 Parsed bid amount:', bidAmount);
    
    // ✅ FAIL-SAFE: Final validation before submission
    if (isNaN(bidAmount) || bidAmount < MIN_BID_AMOUNT) {
      console.error('❌ Invalid bid amount:', bidAmount);
      Alert.alert(
        'Invalid Bid', 
        `Please enter a valid bid amount. Minimum bid is $${MIN_BID_AMOUNT.toFixed(2)}`
      );
      return;
    }
    
    if (bidAmount > MAX_BID_AMOUNT) {
      console.error('❌ Bid too high:', bidAmount);
      Alert.alert(
        'Bid Too High', 
        `Maximum bid is $${MAX_BID_AMOUNT.toFixed(2)}. Please adjust your bid.`
      );
      return;
    }

    // console.log('🚗 RideRequestService check:', !!RideRequestService);
    // console.log('🔄 RideRequestService initialized:', RideRequestService?.isInitialized?.());
    // console.log('📋 Ride request ID check:', rideRequest?.id);
    // console.log('👤 Driver info:', driverInfo);
    
    if (!RideRequestService) {
      console.error('❌ RideRequestService not available');
      Alert.alert('Error', 'Ride request service is not available. Please restart the app.');
      return;
    }
    
    if (!RideRequestService.isInitialized || !RideRequestService.isInitialized()) {
      console.error('❌ RideRequestService not initialized');
      Alert.alert('Error', 'Driver service is not ready. Please wait a moment and try again.');
      return;
    }
    
    if (!rideRequest?.id) {
      console.error('❌ Missing ride request ID');
      Alert.alert('Error', 'Invalid ride request. Please close and try again.');
      return;
    }

    // ✅ CONFIRMATION DIALOG: Show confirmation before submitting custom bid
    Alert.alert(
      'Confirm Bid',
      `Submit bid of $${bidAmount.toFixed(2)} for this ride?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            await submitBidToFirebase(bidAmount);
          }
        }
      ]
    );
  };

  /**
   * Actually submit the bid to Firebase (called after confirmation)
   */
  const submitBidToFirebase = async (bidAmount) => {
    try {
      setIsSubmittingBid(true);
      setBidStatus('submitting');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Submit bid to Firebase
      // console.log('🎯 Submitting bid:', { rideRequestId: rideRequest.id, bidAmount, RideRequestService: !!RideRequestService });
      
      if (!RideRequestService) {
        throw new Error('RideRequestService not available');
      }
      
      const result = await RideRequestService.submitCustomBid(rideRequest.id, bidAmount);
      // console.log('🎯 Bid submission result:', result);
      
      if (result.success) {
        setIsSubmittingBid(false);
        setIsListeningForAcceptance(true);
        setBidStatus('listening');
        
        // Start listening for bid acceptance
        const driverId = driverInfo?.id || 'unknown';
        
        if (!driverId || driverId === 'unknown') {
          console.error('❌ Driver ID not available for bid acceptance listening');
          Alert.alert('Error', 'Driver ID not available. Please try again.');
          setIsListeningForAcceptance(false);
          setBidStatus('idle');
          return;
        }
        
        await driverBidNotificationService.startListeningForBidAcceptance(
          rideRequest.id,
          driverId,
          bidAmount,
          handleBidAcceptanceCallback,
          handleRideCancelledCallback,
          handleBiddingExpiredCallback
        );

        // Notify parent component
        if (onBidSubmitted) {
          onBidSubmitted({
            rideRequestId: rideRequest.id,
            bidAmount: bidAmount,
            timestamp: new Date()
          });
        }

        // Show confirmation and close immediately after user acknowledges
        Alert.alert(
          'Bid Submitted!',
          `Your bid of $${bidAmount.toFixed(2)} has been submitted. We'll notify you when the rider responds.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // console.log('✅ User acknowledged bid submission - closing modal');
                // console.log('🔍 onClose function available:', typeof onClose);
                // Close the modal immediately after user confirms
                if (onClose) {
                  // console.log('🚪 Calling onClose to close bid submission modal');
                  onClose();
                } else {
                  console.error('❌ onClose function not available - modal will not close');
                }
              }
            }
          ]
        );

        // Set 5-minute timeout to automatically close and restart listening
        setTimeout(() => {
          if (isListeningForAcceptance) {
            // console.log('⏰ Bid timeout reached, closing bid screen and restarting ride request listening');
            
            // Stop listening for this specific bid
            if (driverBidNotificationService && rideRequest?.id) {
              driverBidNotificationService.stopListening(rideRequest.id);
            }
            
            // Restart general ride request listening
            if (driverBidNotificationService && typeof driverBidNotificationService.restartRideRequestListening === 'function') {
              driverBidNotificationService.restartRideRequestListening();
            }
            
            // Close the bid submission screen
            setIsListeningForAcceptance(false);
            setBidStatus('idle');
            
            if (onClose) {
              onClose();
            }
          }
        }, 5 * 60 * 1000); // 5 minutes timeout

      } else {
        throw new Error('Failed to submit bid');
      }

    } catch (error) {
      console.error('Error submitting bid:', error);
      setIsSubmittingBid(false);
      setBidStatus('idle');
      
      // ✅ RELIABILITY ERROR HANDLING
      if (error.code === 'BID_COOLDOWN') {
        const mins = Math.floor(error.retrySec / 60);
        const secs = error.retrySec % 60;
        Alert.alert(
          'Bidding Cooldown Active',
          `You cannot bid right now due to a recent cancellation.\n\nPlease wait ${mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} before bidding again.`,
          [{ text: 'OK' }]
        );
      } else if (error.code === 'BID_LOCKED') {
        Alert.alert(
          'Cannot Bid',
          error.message || 'You cannot bid on this ride at this time.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Submission Failed',
          'Unable to submit your bid. Please check your connection and try again.'
        );
      }
    }
  };

  /**
   * Handle bid acceptance callback
   */
  const handleBidAcceptanceCallback = (acceptanceData) => {
    // console.log('🎉 Bid accepted! Closing bid screen and navigating to ride');
    
    // Force reset all state immediately
    setIsListeningForAcceptance(false);
    setBidStatus('accepted');
    setIsSubmittingBid(false);
    
    if (onBidAccepted) {
      onBidAccepted(acceptanceData);
    }
    
    // Close the bid submission screen after bid acceptance
    // console.log('🚪 Calling onClose from handleBidAcceptanceCallback');
    if (onClose) {
      onClose();
    }
  };

  /**
   * Handle ride cancellation callback
   */
  const handleRideCancelledCallback = (cancellationData) => {
    console.log('🚨 DriverBidSubmissionScreen: handleRideCancelledCallback triggered!', cancellationData);
    
    // Force reset all state immediately
    setIsListeningForAcceptance(false);
    setBidStatus('idle');
    setIsSubmittingBid(false);
    
    // ✅ SHOW ALERT FIRST, THEN CLOSE MODAL AFTER USER ACKNOWLEDGES
    console.log('🔔 DriverBidSubmissionScreen: Showing cancellation alert to driver');
    Alert.alert(
      'Ride Cancelled',
      'The rider has cancelled this ride request.',
      [{ 
        text: 'OK',
        onPress: () => {
          // Close modal after user acknowledges
          if (onClose) {
            console.log('🚪 DriverBidSubmissionScreen: Closing modal after user acknowledged cancellation');
            onClose();
          }
          
          if (onRideCancelled) {
            console.log('🔄 DriverBidSubmissionScreen: Calling onRideCancelled prop');
            onRideCancelled(cancellationData);
          }
          
          // Restart general ride request listening
          if (driverBidNotificationService && typeof driverBidNotificationService.restartRideRequestListening === 'function') {
            console.log('🔄 DriverBidSubmissionScreen: Restarting ride request listening');
            driverBidNotificationService.restartRideRequestListening();
          }
        }
      }]
    );
  };

  /**
   * Handle bidding expiration callback
   */
  const handleBiddingExpiredCallback = (expirationData) => {
    // console.log('⏰ Bidding expired! Closing bid screen and restarting listening');
    
    // Force reset all state immediately
    setIsListeningForAcceptance(false);
    setBidStatus('idle');
    setIsSubmittingBid(false);
    
    Alert.alert(
      'Bid Not Selected',
      'Another driver was chosen for this ride. Keep trying!'
    );
    
    // Automatically restart ride request listening
    if (driverBidNotificationService && typeof driverBidNotificationService.restartRideRequestListening === 'function') {
      driverBidNotificationService.restartRideRequestListening();
    }
    
    // Close the bid submission screen
    // console.log('🚪 Calling onClose from handleBiddingExpiredCallback');
    if (onClose) {
      onClose();
    }
  };

  /**
   * Start listening animation
   */
  const startListeningAnimation = () => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(listeningAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(listeningAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isListeningForAcceptance) {
          animate();
        }
      });
    };
    animate();
  };

  /**
   * Stop listening animation
   */
  const stopListeningAnimation = () => {
    listeningAnim.setValue(0);
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    // console.log('🚪 DriverBidSubmissionScreen handleClose called');
    // console.log('🚪 isListeningForAcceptance:', isListeningForAcceptance);
    
    if (isListeningForAcceptance) {
      Alert.alert(
        'Stop Listening?',
        'You are currently waiting for bid acceptance. Are you sure you want to close this?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Close', 
            style: 'destructive',
            onPress: () => {
              // console.log('🚪 User confirmed close while listening');
              
              // Force reset all state
              setIsListeningForAcceptance(false);
              setBidStatus('idle');
              setIsSubmittingBid(false);
              
              if (rideRequest?.id) {
                driverBidNotificationService.stopListening(rideRequest.id);
              }
              
              // Mark as declined if closing without bidding
              if (rideRequest?.id && RideRequestService && typeof RideRequestService.declineRideRequest === 'function') {
                RideRequestService.declineRideRequest(rideRequest.id);
                // console.log('🚫 Bid screen closed while listening - marked as declined:', rideRequest.id);
              }
              
              // console.log('🚪 Calling onClose from handleClose');
              onClose();
            }
          }
        ]
      );
    } else {
      // console.log('🚪 Closing without listening confirmation');
      
      // Force reset all state
      setIsListeningForAcceptance(false);
      setBidStatus('idle');
      setIsSubmittingBid(false);
      
      // Mark as declined if closing without bidding
      if (rideRequest?.id && RideRequestService && typeof RideRequestService.declineRideRequest === 'function') {
        RideRequestService.declineRideRequest(rideRequest.id);
        // console.log('🚫 Bid screen closed without action - marked as declined:', rideRequest.id);
      }
      
      // console.log('🚪 Calling onClose from handleClose');
      onClose();
    }
  };

  // ✅ FAIL-SAFE: Validate bid amount for submit button
  const isValidBid = !isNaN(parseFloat(customBidAmount)) && 
                     parseFloat(customBidAmount) >= MIN_BID_AMOUNT && 
                     parseFloat(customBidAmount) <= MAX_BID_AMOUNT;



  // Removed excessive debug logging

  // Update current price when ride request changes
  useEffect(() => {
    if (rideRequest?.companyBid && !isNaN(rideRequest.companyBid)) {
      setCurrentPrice(rideRequest.companyBid);
      setCustomBidAmount(rideRequest.companyBid.toFixed(2));
    } else {
      setCurrentPrice(15);
      setCustomBidAmount('15.00');
    }
  }, [rideRequest?.companyBid]);

  // Calculate accurate distances and times when ride request or driver state changes
  useEffect(() => {
    if (rideRequest && isVisible) {
      // Calculate distances
      const pickup = calculatePickupDistance();
      const trip = calculateTripDistance();
      setPickupDistance(pickup);
      setTripDistance(trip);
      
      // Calculate time estimates
      const times = calculateTimeEstimates(pickup, trip);
      setTimeEstimates(times);
    }
  }, [rideRequest?.id, driverLocation, currentRide?.id, isVisible]);

  // Load button configuration on mount
  useEffect(() => {
    loadButtonConfig();
  }, []);

  // Save default bid when ride request changes (for reset functionality)
  useEffect(() => {
    if (rideRequest?.companyBid && !isNaN(rideRequest.companyBid)) {
      setSavedDefaultBid(rideRequest.companyBid);
    }
  }, [rideRequest?.companyBid]);

  // Use addresses from ride request or resolve from coordinates
  useEffect(() => {
    const resolveAddresses = async () => {
      if (!rideRequest) return;
      
      // First, try to use addresses directly from ride request
      if (rideRequest.pickup?.address && rideRequest.destination?.address) {
        setResolvedAddresses({
          pickup: rideRequest.pickup.address,
          destination: rideRequest.destination.address
        });
        return;
      }
      
      // Fallback: use dropoff.address if available
      if (rideRequest.pickup?.address && rideRequest.dropoff?.address) {
        setResolvedAddresses({
          pickup: rideRequest.pickup.address,
          destination: rideRequest.dropoff.address
        });
        return;
      }
      
      // Last resort: reverse geocode from coordinates if available
      if (rideRequest.pickup?.coordinates && (rideRequest.destination?.coordinates || rideRequest.dropoff?.coordinates)) {
        try {
          const destCoords = rideRequest.destination?.coordinates || rideRequest.dropoff?.coordinates;
          
          const [pickupAddr, destAddr] = await Promise.all([
            reverseGeocode(
              rideRequest.pickup.coordinates.lat || rideRequest.pickup.coordinates.latitude, 
              rideRequest.pickup.coordinates.lng || rideRequest.pickup.coordinates.longitude
            ),
            reverseGeocode(
              destCoords.lat || destCoords.latitude, 
              destCoords.lng || destCoords.longitude
            )
          ]);
          
          setResolvedAddresses({
            pickup: pickupAddr,
            destination: destAddr
          });
        } catch (error) {
          console.error('❌ Address resolution failed:', error);
          // Final fallback to coordinates display
          const pickupCoords = rideRequest.pickup.coordinates;
          const destCoords = rideRequest.destination?.coordinates || rideRequest.dropoff?.coordinates;
          setResolvedAddresses({
            pickup: `${(pickupCoords.lat || pickupCoords.latitude).toFixed(4)}, ${(pickupCoords.lng || pickupCoords.longitude).toFixed(4)}`,
            destination: `${(destCoords.lat || destCoords.latitude).toFixed(4)}, ${(destCoords.lng || destCoords.longitude).toFixed(4)}`
          });
        }
      }
    };

    if (rideRequest?.id) {
      resolveAddresses();
    }
  }, [rideRequest?.id]);

  // Add debug logging for visibility state
  // useEffect(() => {
  //   console.log('🎯 DriverBidSubmissionScreen visibility changed:', {
  //     isVisible,
  //     rideRequestId: rideRequest?.id,
  //     isListeningForAcceptance,
  //     bidStatus
  //   });
  // }, [isVisible, rideRequest?.id, isListeningForAcceptance, bidStatus]);

  if (!isVisible) {
    // console.log('🚫 DriverBidSubmissionScreen not visible, returning null');
    return null;
  }

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 99999,
      elevation: 1000,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Voice Command Indicator */}
        <VoiceCommandIndicator 
          isListening={isVoiceListening} 
          context={voiceContext} 
        />
        
        <View style={{
          width: width * 0.9,
          height: height * 0.9,
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 0,
          elevation: 10
        }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB'
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Submit Your Bid
          </Text>
          {/* <TouchableOpacity onPress={handleClose}>
            <Text style={{ fontSize: 24, color: '#6B7280' }}>✕</Text>
          </TouchableOpacity> */}
        </View>
        
        {/* Scrollable Content */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Ride Details - Beautiful Layout with Icons */}
          {rideRequest && (
            <View style={[styles.rideDetails, { padding: 16, marginBottom: 8 }]}>
              <View style={[styles.detailRow, { marginBottom: 8 }]}>
                <Ionicons name="location" size={18} color={COLORS?.primary || '#007AFF'} />
                <Text style={[styles.detailText, { fontSize: 14, lineHeight: 20 }]}>
                  From: {resolvedAddresses.pickup || 'Loading address...'}
                </Text>
              </View>
              
              <View style={[styles.detailRow, { marginBottom: 8 }]}>
                <Ionicons name="location-outline" size={18} color={COLORS?.secondary?.[600] || '#6B7280'} />
                <Text style={[styles.detailText, { fontSize: 14, lineHeight: 20 }]}>
                  To: {resolvedAddresses.destination || 'Loading address...'}
                </Text>
              </View>
              
              <View style={[styles.detailRow, { marginBottom: 8 }]}>
                <Ionicons name="time" size={18} color={COLORS?.primary || '#007AFF'} />
                <Text style={[styles.detailText, { fontSize: 14 }]}>
                  {rideRequest.estimatedDistance || rideRequest.distanceInMiles?.toFixed(1) + ' miles' || 'Distance'} • {rideRequest.estimatedDuration || 'Duration'}
                </Text>
              </View>
              
              {/* <View style={styles.detailRow}>
                <Ionicons name="wallet" size={18} color={COLORS?.success || '#10B981'} />
                <Text style={[styles.detailText, { fontSize: 16, fontWeight: '600' }]}>
                  Default Bid: ${rideRequest.companyBid?.toFixed(2) || 'N/A'}
                </Text>
              </View> */}
            </View>
          )}
          
          {/* Driver Location to Pickup Analysis - ACCURATE CALCULATIONS */}
          {rideRequest && (
            <View style={{
              padding: 8,
              marginHorizontal: 12,
              marginBottom: 4,
              marginTop: 4,
              backgroundColor: '#F0FDF4',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#86EFAC'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="car-sport" size={18} color="#EA580C" />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#EA580C',
                  marginLeft: 8
                }}>
                  Your Trip Breakdown
                  {currentRide && ' (After Current Ride)'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 14, color: '#15803D', marginBottom: 8 }}>
                  🚗 {currentRide ? 'From dropoff to pickup' : 'To pickup location'}: {pickupDistance?.toFixed(1) || '...'} miles
                </Text>
                <Text style={{ fontSize: 14, color: '#15803D', marginBottom: 8 }}>
                  🛣️ Trip distance: {tripDistance?.toFixed(1) || rideRequest.estimatedDistance || 'N/A'}
                </Text>
                <Text style={{ fontSize: 14, color: '#15803D' }}>
                  ⏱️ Total time: ~{timeEstimates?.totalTime || '...'} min (Pickup: {timeEstimates?.pickupTime || '...'}m + Trip: {timeEstimates?.tripTime || '...'}m)
                </Text>
              </View>
              
              <Text style={{ fontSize: 12, color: '#059669', fontStyle: 'italic', marginTop: 8 }}>
                {currentRide 
                  ? 'Calculated from your current dropoff to new pickup location'
                  : 'Consider pickup distance and return trip when setting your price'}
              </Text>
            </View>
          )}
          
          {/* Show Fare Details Button */}
          <TouchableOpacity
            style={styles.showDetailsButton}
            onPress={() => setShowFareDetails(!showFareDetails)}
          >
            <Ionicons name="calculator" size={18} color={COLORS.primary} />
            <Text style={styles.showDetailsButtonText}>
              {showFareDetails ? 'Hide' : 'Show'} Fare Details
            </Text>
            <Ionicons 
              name={showFareDetails ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>

          {/* Conditional Fare Details Card */}
          {showFareDetails && (
            FareCalculationCard && rideRequest ? (
              <FareCalculationCard
                rideRequest={rideRequest}
                driverVehicle={driverVehicle}
                style={styles.fareCard}
                forceExpanded={true}
                hideToggleButton={true}
                onCalculationComplete={(data) => {
                  console.log('💰 Fare calculation complete:', data);
                }}
              />
            ) : (
              <View style={[styles.fareCard, { padding: 16, backgroundColor: COLORS.secondary[50] }]}>
                <Text style={{ textAlign: 'center', color: COLORS.secondary[600] }}>
                  {!FareCalculationCard 
                    ? 'Fare details unavailable on this device' 
                    : 'Ride request data is incomplete'
                  }
                </Text>
              </View>
            )
          )}
          
          {/* Submit Default Bid Button - Top Section */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 4,
            marginBottom: 0
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#16A34A',
                paddingVertical: 11,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4
              }}
              onPress={async () => {
                // console.log('🎯 Accept Default Bid pressed!');
                // console.log('💰 Current price:', currentPrice);
                // console.log('🚗 RideRequestService available:', !!RideRequestService);
                // console.log('📋 Ride request ID:', rideRequest?.id);
                
                try {
                  const bidAmount = currentPrice.toFixed(2);
                  setCustomBidAmount(bidAmount);
                  // console.log('💰 Setting bid amount to:', bidAmount);
                  
                  // Small delay to ensure state is updated
                  setTimeout(() => {
                    handleSubmitBid();
                  }, 100);
                } catch (error) {
                  console.error('❌ Error in Accept Default Bid:', error);
                  Alert.alert('Error', 'Failed to accept bid. Please try again.');
                }
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 15,
                fontWeight: 'bold'
              }}>
                Accept Default Bid: ${currentPrice.toFixed(2)}
              </Text>
            </TouchableOpacity>
            
            {/* Fare Breakdown Explanation */}
            {/* <View style={{
              backgroundColor: '#EFF6FF',
              padding: 12,
              marginTop: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#BFDBFE'
            }}>
              <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600', marginBottom: 4 }}>
                💡 Default Bid Breakdown:
              </Text>
              <Text style={{ fontSize: 11, color: '#1E3A8A', marginBottom: 2 }}>
                • Gross Earnings: ${currentPrice.toFixed(2)} (your bid)
              </Text>
              <Text style={{ fontSize: 11, color: '#1E3A8A', marginBottom: 2 }}>
                • AnyRyde Fee (15%): -${(currentPrice * 0.15).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }}>
                • Your Net Pay: ${(currentPrice * 0.85).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
                Rider pays separately for tolls and fees
              </Text>
            </View>  */}
            </View> 

          {/* Quick Bid Options - Commented out for now */}
          {/* 
          <View style={styles.quickBidContainer}>
            <Text style={styles.sectionTitle}>Quick Adjustments</Text>
            <View style={styles.quickBidRow}>
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => handleQuickBidAdjustment(-2)}
              >
                <Text style={styles.quickBidButtonText}>-$2</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => handleQuickBidAdjustment(-1)}
              >
                <Text style={styles.quickBidButtonText}>-$1</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickBidButton, styles.smartBidButton]}
                onPress={handleSmartBid}
              >
                <Text style={styles.quickBidButtonText}>Smart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => handleQuickBidAdjustment(2)}
              >
                <Text style={styles.quickBidButtonText}>+$2</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => handleQuickBidAdjustment(5)}
              >
                <Text style={styles.quickBidButtonText}>+$5</Text>
              </TouchableOpacity>
            </View>
          </View>
          */}
          
          {/* Custom Bid Adjustment - Enhanced with Quick Buttons */}
          <View style={[styles.customBidSection, { marginHorizontal: 12, marginBottom: 8, padding: 12, paddingTop: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[styles.customBidLabel, { fontSize: 16 }]}>
                Custom Bid Amount:
              </Text>
              {savedDefaultBid !== null && parseFloat(customBidAmount) !== savedDefaultBid && (
                <TouchableOpacity
                  onPress={resetToDefaultBid}
                  style={{
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#BFDBFE'
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600' }}>
                    ↺ Reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Green Increase Buttons Row */}
            <View style={[styles.adjustmentButtonsRow, { marginBottom: 14 }]}>
              {increaseButtons.map((button) => (
                <TouchableOpacity
                  key={button.id}
                  style={[styles.adjustmentButton, styles.increaseButton]}
                  onPress={() => applyBidAdjustment(button, 'increase')}
                >
                  <Text style={styles.increaseButtonText}>{button.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Bid Input with Submit Button - Horizontal */}
            <View style={[styles.customBidInputRow, { marginBottom: 6 }]}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.customBidInput}
                  placeholder="$0.00"
                  value={customBidAmount}
                  onChangeText={(value) => {
                    // Allow typing but don't validate yet
                    setCustomBidAmount(value);
                  }}
                  onBlur={() => {
                    // ✅ FAIL-SAFE: Validate on blur (when user finishes typing)
                    const bidValue = parseFloat(customBidAmount);
                    if (!isNaN(bidValue)) {
                      if (bidValue < MIN_BID_AMOUNT) {
                        setCustomBidAmount(MIN_BID_AMOUNT.toFixed(2));
                        Alert.alert(
                          'Minimum Bid',
                          `Bid cannot be less than $${MIN_BID_AMOUNT.toFixed(2)}. Adjusted to minimum.`
                        );
                      } else if (bidValue > MAX_BID_AMOUNT) {
                        setCustomBidAmount(MAX_BID_AMOUNT.toFixed(2));
                        Alert.alert(
                          'Maximum Bid',
                          `Bid cannot exceed $${MAX_BID_AMOUNT.toFixed(2)}. Adjusted to maximum.`
                        );
                      }
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[
                    styles.submitBidButton,
                    { 
                      backgroundColor: isValidBid ? '#16A34A' : COLORS.gray[300],
                      borderWidth: 1,
                      borderColor: isValidBid ? '#15803D' : COLORS.gray[300]
                    }
                  ]}
                  onPress={handleSubmitBid}
                  disabled={!isValidBid}
                >
                  <Text style={[
                    styles.submitBidButtonText,
                    { color: isValidBid ? 'white' : COLORS.gray[400] }
                  ]}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Red Decrease Buttons Row */}
            <View style={styles.adjustmentButtonsRow}>
              {decreaseButtons.map((button) => (
                <TouchableOpacity
                  key={button.id}
                  style={[styles.adjustmentButton, styles.decreaseButton]}
                  onPress={() => applyBidAdjustment(button, 'decrease')}
                >
                  <Text style={styles.decreaseButtonText}>{button.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Helper Text with Dynamic Limits */}
            <Text style={{
              fontSize: 9,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 3,
              marginBottom: 1,
              fontStyle: 'italic'
            }}>
              Tap buttons for quick adjustments • Min: ${MIN_BID_AMOUNT.toFixed(2)}, Max: ${MAX_BID_AMOUNT.toFixed(2)}
            </Text>
          </View>

          {/* Decline Button */}
          <View style={{ paddingHorizontal: 12, paddingTop: 3, paddingBottom: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#DC2626',
                paddingVertical: 5,
                paddingHorizontal: 12,
                borderRadius: 6,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#B91C1C',
              }}
              onPress={() => {
                Alert.alert(
                  'Decline Ride',
                  'Are you sure you want to decline this ride request?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Decline',
                      style: 'destructive',
                      onPress: () => {
                        // Use handleClose which already marks as declined and calls onClose
                        handleClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close-circle" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Decline Ride Request
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: 350,
    height: 600,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
  },
  closeButton: {
    padding: 2,
  },
  rideDetails: {
    padding: 12,
    backgroundColor: COLORS.secondary[50],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.secondary[700],
    flex: 1,
  },
  fareCardContainer: {
    padding: 12,
  },
  fareCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 8,
  },
  quickBidContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  quickBidRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBidButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickBidButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  smartBidButton: {
    backgroundColor: COLORS.success,
  },
  smartBidButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bidInputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  bidInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  earningsContainer: {
    padding: 12,
    backgroundColor: COLORS.secondary[50],
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  earningsRowNet: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[300],
    marginTop: 3,
  },
  earningsRowProfit: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[300],
    marginTop: 3,
  },
  earningsLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  earningsValue: {
    fontSize: 12,
    color: COLORS.secondary[800],
    fontWeight: '500',
  },
  earningsLabelNet: {
    fontSize: 14,
    color: COLORS.secondary[900],
    fontWeight: '600',
  },
  earningsValueNet: {
    fontSize: 14,
    color: COLORS.secondary[900],
    fontWeight: 'bold',
  },
  earningsLabelProfit: {
    fontSize: 12,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  earningsValueProfit: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  listeningText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.success,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.secondary[300],
  },
  submitButtonSubmitting: {
    backgroundColor: COLORS.primary,
  },
  submitButtonListening: {
    backgroundColor: COLORS.secondary[500],
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // New compact layout styles
  showDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary[50],
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    gap: 6,
  },
  showDetailsButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  fareCard: {
    marginHorizontal: 12,
    marginBottom: 6,
  },
  customBidSection: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  customBidLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[800],
    marginBottom: 6,
    textAlign: 'center',
  },
  customBidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customBidInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'white',
    textAlign: 'center',
    color: COLORS.secondary[900],
  },
  submitBidButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBidButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Quick Adjustment Buttons Styles
  adjustmentButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 3,
  },
  adjustmentButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  increaseButton: {
    backgroundColor: '#16A34A', // Green
    borderWidth: 1,
    borderColor: '#15803D',
  },
  increaseButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  decreaseButton: {
    backgroundColor: '#DC2626', // Red
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  decreaseButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DriverBidSubmissionScreen;
