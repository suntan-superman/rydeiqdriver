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
  console.log('✅ expo-location imported successfully');
} catch (e) {
  console.warn('⚠️ expo-location not available on iOS device:', e.message);
  Location = null;
}

// Safe imports
let RideRequestService, costEstimationService, FareCalculationCard;
try {
  RideRequestService = require('@/services/rideRequestService').default;
  console.log('✅ RideRequestService imported successfully');
} catch (e) { 
  console.warn('⚠️ RideRequestService import failed:', e.message);
  RideRequestService = null; 
}
try {
  costEstimationService = require('@/services/costEstimationService').default;
} catch (e) { costEstimationService = null; }

try {
  FareCalculationCard = require('@/components/FareCalculationCard').default;
  console.log('✅ FareCalculationCard imported successfully');
} catch (e) { 
  console.warn('⚠️ FareCalculationCard not available on iOS device:', e.message);
  FareCalculationCard = null; 
}

/**
 * Enhanced Driver Bid Submission Screen
 * Provides comprehensive bid submission with real-time feedback and cost analysis
 */
const DriverBidSubmissionScreen = ({
  isVisible = false,
  rideRequest = null,
  driverInfo = null,
  driverVehicle = null,
  onBidSubmitted,
  onBidAccepted,
  onRideCancelled,
  onClose
}) => {
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  
  // State management with debugging
  const [customBidAmount, setCustomBidAmountInternal] = useState('15.00');
  
  const setCustomBidAmount = (value) => {
    console.log('🔧 setCustomBidAmount called with:', value, 'type:', typeof value);
    if (value === '' || value === null || value === undefined) {
      console.log('❌ Preventing empty value - not setting');
      return;
    }
    if (typeof value === 'string' && value.trim() === '') {
      console.log('❌ Preventing empty string - not setting');
      return;
    }
    if (typeof value === 'number' && isNaN(value)) {
      console.log('❌ Preventing NaN number - not setting');
      return;
    }
    if (typeof value === 'string' && isNaN(parseFloat(value))) {
      console.log('❌ Preventing non-numeric string - not setting');
      return;
    }
    console.log('✅ Setting customBidAmount to:', value);
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
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listeningAnim = useRef(new Animated.Value(0)).current;

  // Platform commission rate (could be configurable)
  const PLATFORM_COMMISSION = 0.15; // 15%

  /**
   * Simple reverse geocode using Expo Location (no API key needed)
   */
  const reverseGeocode = async (lat, lng) => {
    // Safety check for Location availability
    if (!Location) {
      console.log('⚠️ Location service not available - using coordinates');
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
      console.log('🔗 Setting up service references');
      driverBidNotificationService.setRideRequestService(RideRequestService);
    }
  }, []);

  useEffect(() => {
    console.log('🎯 DriverBidSubmissionScreen useEffect - isVisible:', isVisible, 'rideRequest:', !!rideRequest);
    
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
    console.log('🎯 DriverBidSubmissionScreen animation useEffect - isListeningForAcceptance:', isListeningForAcceptance);
    
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
    console.log('🎯 DriverBidSubmissionScreen earnings useEffect - customBidAmount:', customBidAmount);
    
    // Comment out for iOS debugging
    /*
    if (customBidAmount) {
      calculateNetEarnings(parseFloat(customBidAmount));
    }
    */
  }, [customBidAmount]);

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
    console.log('🔄 resetState called - NOT resetting customBidAmount to prevent NaN');
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
   * @param {number} bidAmount - Gross bid amount
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
   * Handle quick bid adjustment
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
    console.log('🎯 Smart Bid clicked - fareCalculation:', fareCalculation);
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
    console.log('🚀 handleSubmitBid called');
    console.log('💰 customBidAmount:', customBidAmount);
    
    const bidAmount = parseFloat(customBidAmount);
    console.log('💰 Parsed bid amount:', bidAmount);
    
    if (isNaN(bidAmount) || bidAmount < 5) {
      console.error('❌ Invalid bid amount:', bidAmount);
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount. Minimum bid is $5.00');
      return;
    }

    console.log('🚗 RideRequestService check:', !!RideRequestService);
    console.log('🔄 RideRequestService initialized:', RideRequestService?.isInitialized?.());
    console.log('📋 Ride request ID check:', rideRequest?.id);
    console.log('👤 Driver info:', driverInfo);
    
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

    try {
      setIsSubmittingBid(true);
      setBidStatus('submitting');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Submit bid to Firebase
      console.log('🎯 Submitting bid:', { rideRequestId: rideRequest.id, bidAmount, RideRequestService: !!RideRequestService });
      
      if (!RideRequestService) {
        throw new Error('RideRequestService not available');
      }
      
      const result = await RideRequestService.submitCustomBid(rideRequest.id, bidAmount);
      console.log('🎯 Bid submission result:', result);
      
      if (result.success) {
        setIsSubmittingBid(false);
        setIsListeningForAcceptance(true);
        setBidStatus('listening');
        
        // Start listening for bid acceptance
        await driverBidNotificationService.startListeningForBidAcceptance(
          rideRequest.id,
          driverInfo?.id || 'unknown',
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
                console.log('✅ User acknowledged bid submission - closing modal');
                console.log('🔍 onClose function available:', typeof onClose);
                // Close the modal immediately after user confirms
                if (onClose) {
                  console.log('🚪 Calling onClose to close bid submission modal');
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
            console.log('⏰ Bid timeout reached, closing bid screen and restarting ride request listening');
            
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
      
      Alert.alert(
        'Submission Failed',
        'Unable to submit your bid. Please check your connection and try again.'
      );
    }
  };

  /**
   * Handle bid acceptance callback
   */
  const handleBidAcceptanceCallback = (acceptanceData) => {
    console.log('🎉 Bid accepted! Closing bid screen and navigating to ride');
    
    // Force reset all state immediately
    setIsListeningForAcceptance(false);
    setBidStatus('accepted');
    setIsSubmittingBid(false);
    
    if (onBidAccepted) {
      onBidAccepted(acceptanceData);
    }
    
    // Close the bid submission screen after bid acceptance
    console.log('🚪 Calling onClose from handleBidAcceptanceCallback');
    if (onClose) {
      onClose();
    }
  };

  /**
   * Handle ride cancellation callback
   */
  const handleRideCancelledCallback = (cancellationData) => {
    console.log('❌ Ride cancelled! Closing bid screen and restarting listening');
    
    // Force reset all state immediately
    setIsListeningForAcceptance(false);
    setBidStatus('idle');
    setIsSubmittingBid(false);
    
    if (onRideCancelled) {
      onRideCancelled(cancellationData);
    }
    
    // Restart general ride request listening
    if (driverBidNotificationService && typeof driverBidNotificationService.restartRideRequestListening === 'function') {
      driverBidNotificationService.restartRideRequestListening();
    }
    
    // Close the bid submission screen
    console.log('🚪 Calling onClose from handleRideCancelledCallback');
    if (onClose) {
      onClose();
    }
  };

  /**
   * Handle bidding expiration callback
   */
  const handleBiddingExpiredCallback = (expirationData) => {
    console.log('⏰ Bidding expired! Closing bid screen and restarting listening');
    
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
    console.log('🚪 Calling onClose from handleBiddingExpiredCallback');
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
    console.log('🚪 DriverBidSubmissionScreen handleClose called');
    console.log('🚪 isListeningForAcceptance:', isListeningForAcceptance);
    
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
              console.log('🚪 User confirmed close while listening');
              
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
                console.log('🚫 Bid screen closed while listening - marked as declined:', rideRequest.id);
              }
              
              console.log('🚪 Calling onClose from handleClose');
              onClose();
            }
          }
        ]
      );
    } else {
      console.log('🚪 Closing without listening confirmation');
      
      // Force reset all state
      setIsListeningForAcceptance(false);
      setBidStatus('idle');
      setIsSubmittingBid(false);
      
      // Mark as declined if closing without bidding
      if (rideRequest?.id && RideRequestService && typeof RideRequestService.declineRideRequest === 'function') {
        RideRequestService.declineRideRequest(rideRequest.id);
        console.log('🚫 Bid screen closed without action - marked as declined:', rideRequest.id);
      }
      
      console.log('🚪 Calling onClose from handleClose');
      onClose();
    }
  };

  const isValidBid = !isNaN(parseFloat(customBidAmount)) && parseFloat(customBidAmount) >= 5;



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

  // Comment out address resolution for iOS debugging  
  /*
  // Resolve addresses when ride request changes
  useEffect(() => {
    const resolveAddresses = async () => {
      if (rideRequest?.pickup?.coordinates && rideRequest?.destination?.coordinates) {
        try {
          console.log('📍 Resolving addresses for coordinates...');
          const [pickupAddr, destAddr] = await Promise.all([
            reverseGeocode(rideRequest.pickup.coordinates.lat, rideRequest.pickup.coordinates.lng),
            reverseGeocode(rideRequest.destination.coordinates.lat, rideRequest.destination.coordinates.lng)
          ]);
          
          setResolvedAddresses({
            pickup: pickupAddr,
            destination: destAddr
          });
          console.log('✅ Addresses resolved:', { pickup: pickupAddr, destination: destAddr });
        } catch (error) {
          console.log('❌ Address resolution failed:', error);
          // Fallback to coordinates
          setResolvedAddresses({
            pickup: `${rideRequest.pickup.coordinates.lat.toFixed(4)}, ${rideRequest.pickup.coordinates.lng.toFixed(4)}`,
            destination: `${rideRequest.destination.coordinates.lat.toFixed(4)}, ${rideRequest.destination.coordinates.lng.toFixed(4)}`
          });
        }
      }
    };

    if (rideRequest?.id) {
      resolveAddresses();
    }
  }, [rideRequest?.id]);
  */

  // Add debug logging for visibility state
  useEffect(() => {
    console.log('🎯 DriverBidSubmissionScreen visibility changed:', {
      isVisible,
      rideRequestId: rideRequest?.id,
      isListeningForAcceptance,
      bidStatus
    });
  }, [isVisible, rideRequest?.id, isListeningForAcceptance, bidStatus]);

  if (!isVisible) {
    console.log('🚫 DriverBidSubmissionScreen not visible, returning null');
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
          padding: 20,
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
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ fontSize: 24, color: '#6B7280' }}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Scrollable Content */}
        <ScrollView style={{ flex: 1, height: 500 }}>
          {/* Ride Details - Beautiful Layout with Icons */}
          {rideRequest && (
            <View style={styles.rideDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={COLORS?.primary || '#007AFF'} />
                <Text style={styles.detailText}>
                  From: {resolvedAddresses.pickup || 'Loading address...'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={COLORS?.secondary?.[600] || '#6B7280'} />
                <Text style={styles.detailText}>
                  To: {resolvedAddresses.destination || 'Loading address...'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={COLORS?.primary || '#007AFF'} />
                <Text style={styles.detailText}>
                  {rideRequest.estimatedDistance || rideRequest.distanceInMiles?.toFixed(1) + ' miles' || 'Distance'} • {rideRequest.estimatedDuration || 'Duration'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="wallet" size={16} color={COLORS?.success || '#10B981'} />
                <Text style={styles.detailText}>
                  ${rideRequest.companyBid?.toFixed(2) || 'N/A'}
                </Text>
              </View>
            </View>
          )}
          
          {/* Driver Location to Pickup Analysis */}
          {rideRequest && (
            <View style={{
              padding: 10,
              backgroundColor: '#F0FDF4',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="car-sport" size={16} color="#EA580C" />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#EA580C',
                  marginLeft: 8
                }}>
                  Your Trip Breakdown
                </Text>
              </View>
              
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: '#15803D', marginBottom: 2 }}>
                  🚗 To pickup location: ~2.5 miles (estimated)
                </Text>
                <Text style={{ fontSize: 13, color: '#15803D', marginBottom: 2 }}>
                  🛣️ Trip distance: {rideRequest.distanceInMiles?.toFixed(1) || rideRequest.estimatedDistance || 'N/A'}
                </Text>
                <Text style={{ fontSize: 13, color: '#15803D' }}>
                  ⏱️ Total time: ~{((parseInt(rideRequest.estimatedDuration) || 15) + 8)} min (including pickup)
                </Text>
              </View>
              
              <Text style={{ fontSize: 12, color: '#15803D', fontStyle: 'italic' }}>
                Consider pickup distance and return trip when setting your price
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
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            backgroundColor: '#F0F9FF'
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#16A34A',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}
              onPress={async () => {
                console.log('🎯 Accept Default Bid pressed!');
                console.log('💰 Current price:', currentPrice);
                console.log('🚗 RideRequestService available:', !!RideRequestService);
                console.log('📋 Ride request ID:', rideRequest?.id);
                
                try {
                  const bidAmount = currentPrice.toFixed(2);
                  setCustomBidAmount(bidAmount);
                  console.log('💰 Setting bid amount to:', bidAmount);
                  
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
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                Accept Default Bid: ${currentPrice.toFixed(2)}
              </Text>
            </TouchableOpacity>
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
          
          {/* Custom Bid Input - Compact Layout */}
          <View style={styles.customBidSection}>
            <Text style={styles.customBidLabel}>
              Custom Amount:
            </Text>
            <View style={styles.customBidInputRow}>
              <TextInput
                style={styles.customBidInput}
                placeholder="$0.00"
                value={customBidAmount}
                onChangeText={(value) => {
                  console.log('💰 TextInput changed:', value);
                  setCustomBidAmount(value);
                }}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity
                style={[
                  styles.submitBidButton,
                  { backgroundColor: isValidBid ? COLORS.success : COLORS.gray[300] }
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
  },
  closeButton: {
    padding: 4,
  },
  rideDetails: {
    padding: 20,
    backgroundColor: COLORS.secondary[50],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.secondary[700],
    flex: 1,
  },
  fareCardContainer: {
    padding: 20,
  },
  fareCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  quickBidContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  quickBidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBidButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBidButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  smartBidButton: {
    backgroundColor: COLORS.success,
  },
  smartBidButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bidInputContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  bidInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  earningsContainer: {
    padding: 20,
    backgroundColor: COLORS.secondary[50],
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsRowNet: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[300],
    marginTop: 4,
  },
  earningsRowProfit: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[300],
    marginTop: 4,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  earningsValue: {
    fontSize: 14,
    color: COLORS.secondary[800],
    fontWeight: '500',
  },
  earningsLabelNet: {
    fontSize: 16,
    color: COLORS.secondary[900],
    fontWeight: '600',
  },
  earningsValueNet: {
    fontSize: 16,
    color: COLORS.secondary[900],
    fontWeight: 'bold',
  },
  earningsLabelProfit: {
    fontSize: 14,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  earningsValueProfit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  listeningText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.success,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
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
    fontSize: 16,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  showDetailsButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  fareCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  customBidSection: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  customBidLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[800],
    marginBottom: 12,
    textAlign: 'center',
  },
  customBidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customBidInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'white',
    textAlign: 'center',
    color: COLORS.secondary[900],
    minWidth: 100,
    maxWidth: 150,
  },
  submitBidButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBidButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverBidSubmissionScreen;
