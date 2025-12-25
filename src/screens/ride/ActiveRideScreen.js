import React, { useState, useEffect } from 'react';
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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { playSuccessSound, playErrorSound } from '@/utils/soundEffects';
import { COLORS } from '@/constants';
import MultiStopNavigation from '../../components/MultiStopNavigation';
import WaitTimerWidget from '../../components/WaitTimerWidget';
import DeltaApprovalModal from '../../components/DeltaApprovalModal';
import RatingModal from '@/components/RatingModal';
import { speechService } from '@/services/speechService';
import voiceCommandService from '@/services/voiceCommandService';
import EmergencyModal from '@/components/EmergencyModal';
import VideoRecordingConsentModal from '@/components/VideoRecordingConsentModal';
import VideoRecordingStatusIndicator from '@/components/VideoRecordingStatusIndicator';
import VideoIncidentReportModal from '@/components/VideoIncidentReportModal';
import RouteOptimizationDashboard from '../../components/navigation/RouteOptimizationDashboard';
import routeOptimizationService from '../../services/routeOptimizationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ride states and their configurations
const RIDE_STATES = {
  'bid-submitted': {
    title: 'Bid Submitted',
    subtitle: 'Waiting for customer response',
    color: COLORS.warning,
    icon: 'hourglass-outline'
  },
  'ride-accepted': {
    title: 'Ride Accepted',
    subtitle: 'Navigate to pickup location',
    color: COLORS.success,
    icon: 'checkmark-circle'
  },
  'en-route-pickup': {
    title: 'En Route to Pickup',
    subtitle: 'Heading to customer location',
    color: COLORS.info,
    icon: 'car-outline'
  },
  'arrived-pickup': {
    title: 'Arrived at Pickup',
    subtitle: 'Waiting for customer',
    color: COLORS.warning,
    icon: 'location'
  },
  'customer-onboard': {
    title: 'Customer Onboard',
    subtitle: 'Verify destination and start trip',
    color: COLORS.primary[500],
    icon: 'person-add'
  },
  'trip-active': {
    title: 'Trip in Progress',
    subtitle: 'Driving to destination',
    color: COLORS.success,
    icon: 'navigation'
  },
  'trip-completed': {
    title: 'Trip Completed',
    subtitle: 'Collect payment and rate customer',
    color: COLORS.primary[600],
    icon: 'checkmark-done'
  }
};

const ActiveRideScreen = ({ route }) => {
  const navigation = useNavigation();
  const { rideData } = route?.params || {};
  
  // Default ride data for demo
  const defaultRide = {
    rideId: 'demo_ride_001',
    customerId: 'demo_customer',
    customerName: 'Sarah M.',
    customerRating: 4.9,
    customerPhone: '+1 (555) 123-4567',
    pickup: {
      address: '123 Main Street, Downtown Bakersfield',
      coordinates: { lat: 35.3733, lng: -119.0187 }
    },
    destination: {
      address: '456 Oak Avenue, East Bakersfield',
      coordinates: { lat: 35.3850, lng: -118.9950 }  // ~2 miles away
    },
    estimatedDistance: '3.2 miles',
    estimatedDuration: '12 minutes',
    bidAmount: 18.50,
    rideType: 'standard',
    startTime: new Date(),
    state: 'ride-accepted', // Current ride state
    videoRecordingRequested: true // Enable video recording for testing
  };

  const [ride, setRide] = useState({ ...defaultRide, ...rideData });
  const [timer, setTimer] = useState(0);
  
  // Multi-stop state
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [stopArrivalTimes, setStopArrivalTimes] = useState({});
  const isMultiStop = ride?.isMultiStop && ride?.stops && ride.stops.length > 0;
  
  // Delta approval state
  const [showDeltaApproval, setShowDeltaApproval] = useState(false);
  const [pendingDelta, setPendingDelta] = useState(null);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Emergency modal state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Voice command state
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);

  // Video recording state
  const [showVideoConsentModal, setShowVideoConsentModal] = useState(false);
  const [showVideoIncidentModal, setShowVideoIncidentModal] = useState(false);
  const [videoRecording, setVideoRecording] = useState({
    isRecording: false,
    consentGiven: false,
    recordingStartedAt: null,
    recordingDuration: 0,
    incidentFlagged: false,
  });

  // Route optimization state
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);

  // Timer for tracking ride duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load route optimization data when ride changes
  useEffect(() => {
    const loadRouteData = async () => {
      if (ride?.pickup?.coordinates && ride?.destination?.coordinates) {
        try {
          const origin = {
            latitude: ride.pickup.coordinates.latitude,
            longitude: ride.pickup.coordinates.longitude
          };
          const destination = {
            latitude: ride.destination.coordinates.latitude,
            longitude: ride.destination.coordinates.longitude
          };

          const optimizedRoute = await routeOptimizationService.getOptimizedRoute(origin, destination);
          setCurrentRoute(optimizedRoute);

          const alternatives = await routeOptimizationService.getAlternativeRoutes(origin, destination, optimizedRoute);
          setAlternativeRoutes(alternatives);
        } catch (error) {
          console.error('Error loading route data:', error);
        }
      }
    };

    loadRouteData();
  }, [ride?.pickup?.coordinates, ride?.destination?.coordinates]);

  // Video recording timer
  useEffect(() => {
    let interval;
    if (videoRecording.isRecording) {
      interval = setInterval(() => {
        setVideoRecording(prev => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [videoRecording.isRecording]);

  // Check for video recording request when ride starts
  useEffect(() => {
    if (ride.state === 'ride-accepted' && ride.videoRecordingRequested && !videoRecording.consentGiven) {
      // Show video consent modal after a short delay
      const timer = setTimeout(() => {
        setShowVideoConsentModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ride.state, ride.videoRecordingRequested, videoRecording.consentGiven]);

  // Voice command integration based on ride state
  useEffect(() => {
    let voiceTimeout = null;

    const startVoiceListener = async () => {
      try {
        // Determine which voice context based on ride state
        let context = null;
        let callback = null;

        switch (ride.state) {
          case 'en-route-pickup':
            context = 'pickup_arrival';
            callback = handleVoiceCommand;
            break;
          
          case 'arrived-pickup':
          case 'customer-onboard':
            context = 'start_trip';
            callback = handleVoiceCommand;
            break;
          
          case 'trip-active':
            context = 'active_ride';
            callback = handleVoiceCommand;
            break;
          
          default:
            // No voice commands for this state
            return;
        }

        if (context && callback) {
          setVoiceCommandActive(true);
          await voiceCommandService.startListening(context, callback, 30000);
        }
      } catch (error) {
        console.error('❌ Voice listener error:', error);
      }
    };

    // Start listening after a short delay
    voiceTimeout = setTimeout(() => {
      startVoiceListener();
    }, 2000);

    return () => {
      if (voiceTimeout) clearTimeout(voiceTimeout);
      voiceCommandService.stopListening().catch(() => {});
      setVoiceCommandActive(false);
    };
  }, [ride.state]);

  // Handle voice commands
  const handleVoiceCommand = async (result) => {
    if (result.type === 'timeout' || result.type === 'error') {
      setVoiceCommandActive(false);
      return;
    }

    // Handle emergency detection
    if (result.type === 'emergency') {
      console.log('🚨 EMERGENCY detected in ActiveRideScreen:', result.command);
      await speechService.speak('Emergency assistance activated', null);
      setShowEmergencyModal(true);
      setVoiceCommandActive(false);
      return;
    }

    const command = result.command;
    console.log(`🎤 Voice command received: ${command}`);

    try {
      switch (command) {
        case 'arrived':
          if (ride.state === 'en-route-pickup') {
            await speechService.speakRideStatusUpdate('arrived');
            handleStateChange('arrived-pickup');
          }
          break;

        case 'start_trip':
          if (ride.state === 'arrived-pickup' || ride.state === 'customer-onboard') {
            const destination = ride.destination?.address || 'destination';
            await speechService.speakRideStatusUpdate('started', destination);
            handleStateChange('trip-active');
          }
          break;

        case 'complete_trip':
          if (ride.state === 'trip-active') {
            const earnings = ride.bidAmount ? `$${ride.bidAmount.toFixed(2)}` : '';
            await speechService.speakRideStatusUpdate('completed', earnings);
            handleCompleteTrip();
          }
          break;

        case 'problem':
          await speechService.speak('Opening emergency assistance', null);
          setShowEmergencyModal(true);
          break;

        default:
          console.log('❓ Unknown voice command:', command);
      }
    } catch (error) {
      console.error('❌ Error handling voice command:', error);
    }

    setVoiceCommandActive(false);
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle state transitions
  const handleStateChange = (newState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRide(prev => ({ ...prev, state: newState }));
    
    // Trigger speech notifications for relevant state changes
    try {
      if (newState === 'arrived-pickup') {
        speechService.speakArrivingAtPickup();
      } else if (newState === 'customer-onboard') {
        speechService.speakPassengerPickedUp();
      } else if (newState === 'trip-active') {
        speechService.speakApproachingDestination();
      }
    } catch (error) {
      // Silent fallback for speech errors
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (ratingData) => {
    try {
      console.log('🌟 Rating submitted:', ratingData);
      playSuccessSound();
      Alert.alert(
        'Rating Submitted',
        'Thank you for rating your customer!',
        [{ text: 'OK', onPress: () => setShowRatingModal(false) }]
      );
    } catch (error) {
      console.error('❌ Rating submission error:', error);
      playErrorSound();
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  // Handle phone call
  const handleCall = () => {
    const url = `tel:${ride.customerPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  // Handle SMS
  const handleMessage = () => {
    const url = `sms:${ride.customerPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open messaging app');
    });
  };

  // Handle navigation
  const handleNavigate = () => {
    const destination = ride.state === 'ride-accepted' || ride.state === 'en-route-pickup' 
      ? ride.pickup 
      : ride.destination;
    
    const url = `https://maps.google.com/maps?daddr=${destination.coordinates.lat},${destination.coordinates.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open navigation app');
    });
  };

  // Handle emergency
  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Call 911 or report safety issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 911', onPress: () => Linking.openURL('tel:911'), style: 'destructive' },
        { text: 'Report Issue', onPress: () => Alert.alert('Issue Reported', 'Safety team has been notified') }
      ]
    );
  };

  // Handle trip completion
  const handleCompleteTrip = () => {
    Alert.alert(
      'Complete Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete Trip', 
          onPress: () => {
            playSuccessSound();
            handleStateChange('trip-completed');
          },
          style: 'default'
        }
      ]
    );
  };

  // Video Recording Handlers
  const handleVideoConsent = (consentData) => {
    setVideoRecording(prev => ({
      ...prev,
      consentGiven: true,
      recordingStartedAt: new Date().toISOString(),
    }));
    setShowVideoConsentModal(false);
    
    // Auto-start recording after consent
    setTimeout(() => {
      setVideoRecording(prev => ({
        ...prev,
        isRecording: true,
      }));
    }, 1000);
  };

  const handleVideoDecline = () => {
    setShowVideoConsentModal(false);
    Alert.alert(
      'Recording Declined',
      'Video recording has been declined. The ride will continue normally.',
      [{ text: 'OK' }]
    );
  };

  const handleToggleRecording = () => {
    if (videoRecording.isRecording) {
      // Stop recording
      setVideoRecording(prev => ({
        ...prev,
        isRecording: false,
      }));
    } else {
      // Start recording
      setVideoRecording(prev => ({
        ...prev,
        isRecording: true,
        recordingStartedAt: new Date().toISOString(),
      }));
    }
  };

  const handleFlagIncident = () => {
    setShowVideoIncidentModal(true);
  };

  const handleSubmitIncident = async (incidentData) => {
    try {
      // TODO: Submit incident to backend
      console.log('🚨 Incident reported:', incidentData);
      
      setVideoRecording(prev => ({
        ...prev,
        incidentFlagged: true,
      }));
      
      // Show success message
      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted. Support will review the video recording.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    }
  };

  // Multi-Stop Handlers
  const handleStopArrival = (stopId, stopIndex) => {
    console.log('🛑 Arrived at stop:', stopId);
    setStopArrivalTimes(prev => ({
      ...prev,
      [stopId]: Date.now()
    }));
  };

  const handleStopComplete = (stopId, stopIndex, waitTime) => {
    console.log('✅ Stop completed:', stopId, 'Wait time:', waitTime);
    
    // Move to next stop or complete ride
    if (stopIndex < ride.stops.length - 1) {
      setCurrentStopIndex(stopIndex + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Last stop completed - end ride
      handleCompleteTrip();
    }
  };

  const handleNavigateToStop = (stop, stopIndex) => {
    if (!stop?.coordinates) return;
    
    const lat = stop.coordinates.lat;
    const lng = stop.coordinates.lng;
    const scheme = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`
    });
    
    Linking.openURL(scheme).catch(() => {
      Alert.alert('Error', 'Unable to open navigation app');
    });
  };

  // Delta Approval Handlers
  const handleDeltaApprove = (amount) => {
    console.log('✅ Delta approved:', amount);
    
    // Update ride fare
    setRide(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        estimatedFare: (prev.pricing?.estimatedFare || prev.bidAmount) + amount
      }
    }));

    setShowDeltaApproval(false);
    setPendingDelta(null);
    
    playSuccessSound();
    Alert.alert(
      'Change Approved',
      `Fare ${amount >= 0 ? 'increased' : 'decreased'} by $${Math.abs(amount).toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeltaDecline = () => {
    console.log('❌ Delta declined');
    
    setShowDeltaApproval(false);
    setPendingDelta(null);
    
    playErrorSound();
    Alert.alert(
      'Change Declined',
      'Rider will be notified. Original route maintained.',
      [{ text: 'OK' }]
    );
  };

  const handleRequestNewBid = () => {
    console.log('🔄 Requesting new bid');
    
    setShowDeltaApproval(false);
    setPendingDelta(null);
    
    Alert.alert(
      'New Bid Requested',
      'Rider will be asked to submit a new ride request with the updated route.',
      [{ text: 'OK' }]
    );
  };

  // Simulate receiving delta request (for testing)
  const simulateDeltaRequest = (type = 'add_stop') => {
    const mockDelta = type === 'add_stop' ? {
      kind: 'add_stop',
      stopAddress: '999 Test Street, Demo City',
      calc: {
        dMiles: 1.9,
        dMins: 7,
        dWaitMins: 5
      },
      suggested: 4.60,
      deltaFare: 4.60,
      percentChange: 12,
      driverAutoAccept: true,
      riderAutoAccept: false,
      isLargeChange: false,
    } : {
      kind: 'remove_stop',
      stopAddress: '456 Oak Avenue, Uptown',
      calc: {
        dMiles: -1.5,
        dMins: -5,
        removedStopFee: -3.00
      },
      suggested: -6.75,
      deltaFare: -6.75,
      percentChange: 18,
      driverAutoAccept: false,
      riderAutoAccept: true,
      isLargeChange: false,
    };

    setPendingDelta(mockDelta);
    setShowDeltaApproval(true);
  };

  // Get current state configuration
  const currentState = RIDE_STATES[ride.state] || RIDE_STATES['ride-accepted'];

  // Render action buttons based on current state
  const renderActionButtons = () => {
    switch (ride.state) {
      case 'bid-submitted':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('View Bid', `Your bid: $${ride.bidAmount}`)}>
              <Ionicons name="eye" size={24} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>View Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Edit Bid', 'Edit bid functionality')}>
              <Ionicons name="create" size={24} color={COLORS.warning} />
              <Text style={styles.actionText}>Edit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.actionText}>Cancel Bid</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'ride-accepted':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => navigation.navigate('Navigation', { rideData: ride })}>
              <Ionicons name="navigate" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowRouteOptimization(true)}>
              <Ionicons name="map" size={24} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Route Options</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Ionicons name="chatbubble" size={24} color={COLORS.info} />
              <Text style={styles.actionText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleStateChange('en-route-pickup')}>
              <Ionicons name="car" size={24} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Start Drive</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'en-route-pickup':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => handleStateChange('arrived-pickup')}>
              <Ionicons name="location" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>I've Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowRouteOptimization(true)}>
              <Ionicons name="map" size={24} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Route Options</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Issue Reported', 'Issue has been reported')}>
              <Ionicons name="warning" size={24} color={COLORS.warning} />
              <Text style={styles.actionText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'arrived-pickup':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => handleStateChange('customer-onboard')}>
              <Ionicons name="person-add" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>Customer Onboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('No Show', 'Customer no-show reported')}>
              <Ionicons name="person-remove" size={24} color={COLORS.error} />
              <Text style={styles.actionText}>No Show</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'customer-onboard':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => handleStateChange('trip-active')}>
              <Ionicons name="play" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>Start Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Destination Verified', 'Destination confirmed with customer')}>
              <Ionicons name="checkmark" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Verify Destination</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Issue Reported', 'Issue has been reported')}>
              <Ionicons name="warning" size={24} color={COLORS.warning} />
              <Text style={styles.actionText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'trip-active':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleCompleteTrip}>
              <Ionicons name="stop" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>End Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Stop Added', 'Additional stop has been added')}>
              <Ionicons name="add-circle" size={24} color={COLORS.info} />
              <Text style={styles.actionText}>Add Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmergency}>
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
              <Text style={styles.actionText}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Navigation', { rideData: ride })}>
              <Ionicons name="navigate" size={24} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'trip-completed':
        return (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => Alert.alert('Payment', 'Payment collection interface')}>
              <Ionicons name="card" size={24} color={COLORS.white} />
              <Text style={[styles.actionText, styles.primaryActionText]}>Collect Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowRatingModal(true)}>
              <Ionicons name="star" size={24} color={COLORS.warning} />
              <Text style={styles.actionText}>Rate Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Issue Reported', 'Issue has been reported')}>
              <Ionicons name="flag" size={24} color={COLORS.error} />
              <Text style={styles.actionText}>Report Issues</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
              <Ionicons name="home" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 8 : 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary[700]} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Active Ride</Text>
          <Text style={styles.headerSubtitle}>#{ride.rideId.slice(-6)}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.secondary[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: currentState.color }]}>
          <View style={styles.statusHeader}>
            <Ionicons name={currentState.icon} size={32} color={COLORS.white} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{currentState.title}</Text>
              <Text style={styles.statusSubtitle}>{currentState.subtitle}</Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTimer(timer)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Customer</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.ratingText}>{ride.customerRating}</Text>
            </View>
          </View>
          <Text style={styles.customerName}>{ride.customerName}</Text>
          <Text style={styles.customerPhone}>{ride.customerPhone}</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>{ride.pickup.address}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            {/* Multi-Stop Display */}
            {isMultiStop && ride.stops.map((stop, index) => (
              <React.Fragment key={stop.id || index}>
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, styles.stopDot]}>
                    <Text style={styles.stopDotNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Stop {index + 1}</Text>
                    <Text style={styles.locationAddress}>{stop.address}</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
              </React.Fragment>
            ))}
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>
                  {isMultiStop ? 'Final Destination' : 'Destination'}
                </Text>
                <Text style={styles.locationAddress}>
                  {isMultiStop 
                    ? ride.finalDestination?.address || ride.destination?.address
                    : ride.destination.address
                  }
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {ride.routeOptimization?.totalDistance || ride.estimatedDistance}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {ride.routeOptimization?.totalDuration || ride.estimatedDuration}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${(ride.pricing?.estimatedFare || ride.bidAmount)?.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Fare</Text>
            </View>
          </View>
        </View>

        {/* Video Recording Status */}
        {ride.videoRecordingRequested && (
          <VideoRecordingStatusIndicator
            isRecording={videoRecording.isRecording}
            recordingDuration={videoRecording.recordingDuration}
            onToggleRecording={handleToggleRecording}
            onFlagIncident={handleFlagIncident}
            showControls={ride.state === 'trip-active' || ride.state === 'customer-onboard'}
            compact={false}
          />
        )}

        {/* Multi-Stop Navigation - Show during active trip */}
        {isMultiStop && (ride.state === 'trip-active' || ride.state === 'customer-onboard') && (
          <>
            <MultiStopNavigation
              ride={ride}
              currentStopIndex={currentStopIndex}
              onStopComplete={handleStopComplete}
              onArrived={handleStopArrival}
              onNavigateToStop={handleNavigateToStop}
            />

            {/* Wait Timer - Show when arrived at stop */}
            {stopArrivalTimes[ride.stops[currentStopIndex]?.id] && (
              <WaitTimerWidget
                stopId={ride.stops[currentStopIndex].id}
                startTime={stopArrivalTimes[ride.stops[currentStopIndex].id]}
                graceMinutes={5}
                chargePerMinute={0.40}
                onWaitTimeUpdate={(elapsed, stopId) => {
                  // Could update backend with wait time here
                  console.log('Wait time update:', elapsed, 'seconds at stop', stopId);
                }}
              />
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Actions</Text>
          {renderActionButtons()}
        </View>

        {/* Test Delta Buttons (for development/testing) */}
        {isMultiStop && __DEV__ && (
          <View style={styles.testCard}>
            <Text style={styles.cardTitle}>Test Delta Approvals</Text>
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => simulateDeltaRequest('add_stop')}
              >
                <Text style={styles.testButtonText}>Test Add Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => simulateDeltaRequest('remove_stop')}
              >
                <Text style={styles.testButtonText}>Test Remove Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delta Approval Modal */}
      <DeltaApprovalModal
        visible={showDeltaApproval}
        onClose={() => setShowDeltaApproval(false)}
        delta={pendingDelta}
        onApprove={handleDeltaApprove}
        onDecline={handleDeltaDecline}
        onRequestNewBid={handleRequestNewBid}
      />

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        rideData={ride}
        targetUser={{
          name: ride.customerName,
          photo: null, // Would come from rider profile
          role: 'rider'
        }}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        currentRide={ride}
        driverLocation={null}
      />

      {/* Video Recording Modals */}
      <VideoRecordingConsentModal
        visible={showVideoConsentModal}
        onClose={() => setShowVideoConsentModal(false)}
        onConsent={handleVideoConsent}
        onDecline={handleVideoDecline}
        rideData={ride}
        riderName={ride.customerName}
      />

      <VideoIncidentReportModal
        visible={showVideoIncidentModal}
        onClose={() => setShowVideoIncidentModal(false)}
        onSubmit={handleSubmitIncident}
        rideData={ride}
        recordingDuration={videoRecording.recordingDuration}
      />

      {/* Route Optimization Dashboard */}
      <RouteOptimizationDashboard
        visible={showRouteOptimization}
        onClose={() => setShowRouteOptimization(false)}
        driverId={ride.driverId}
        currentRoute={currentRoute}
        alternativeRoutes={alternativeRoutes}
        rideData={ride}
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
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  customerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.warning,
    marginLeft: 4,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.secondary[500],
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  routeContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary[500],
    marginTop: 4,
    marginRight: 16,
  },
  stopDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDotNumber: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  destinationDot: {
    backgroundColor: COLORS.error,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.secondary[200],
    marginLeft: 5,
    marginRight: 16,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[500],
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.secondary[900],
    lineHeight: 18,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[500],
  },
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 72) / 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
  },
  primaryAction: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginTop: 8,
    textAlign: 'center',
  },
  primaryActionText: {
    color: COLORS.white,
  },
  bottomSpacing: {
    height: 20,
  },
  testCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ActiveRideScreen; 