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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Temporary constants
const COLORS = {
  primary: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857'
  },
  secondary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000'
};

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
      address: '123 Main Street, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    destination: {
      address: '456 Oak Avenue, Uptown',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    estimatedDistance: '3.2 miles',
    estimatedDuration: '12 minutes',
    bidAmount: 18.50,
    rideType: 'standard',
    startTime: new Date(),
    state: 'ride-accepted' // Current ride state
  };

  const [ride, setRide] = useState({ ...defaultRide, ...rideData });
  const [timer, setTimer] = useState(0);

  // Timer for tracking ride duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
          onPress: () => handleStateChange('trip-completed'),
          style: 'default'
        }
      ]
    );
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
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Rating', 'Customer rating interface')}>
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
    <SafeAreaView style={styles.container}>
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
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress}>{ride.destination.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ride.estimatedDistance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ride.estimatedDuration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${ride.bidAmount.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Fare</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Actions</Text>
          {renderActionButtons()}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
});

export default ActiveRideScreen; 