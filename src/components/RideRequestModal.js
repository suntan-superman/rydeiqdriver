import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import RideRequestService from '@/services/rideRequestService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RideRequestModal = ({ 
  visible = false, 
  rideRequest = null,
  onClose 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showBidOptions, setShowBidOptions] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && rideRequest) {
      setTimeRemaining(30);
      setShowBidOptions(false);
      setCustomBidAmount('');
      
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(timerAnim, {
          toValue: 0,
          duration: 30000,
          useNativeDriver: true,
        })
      ]).start();

      // Start timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleDecline('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, rideRequest]);

  // Handle accept ride
  const handleAccept = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await RideRequestService.acceptRideRequest(rideRequest.id);
      
      Alert.alert('Success', 'Ride accepted!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
    }
  };

  // Handle decline ride  
  const handleDecline = async (reason = 'manual') => {
    try {
      if (reason === 'timeout') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      await RideRequestService.rejectRideRequest(rideRequest.id, reason);
      
      if (reason !== 'timeout') {
        Alert.alert('Ride Declined', 'Ride request has been declined');
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline ride');
    }
  };

  // Handle custom bid
  const handleCustomBid = async (bidAmount) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await RideRequestService.submitCustomBid(rideRequest.id, bidAmount);
      
      Alert.alert('Bid Submitted', `Your bid of $${bidAmount} has been submitted`);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid');
    }
  };

  if (!rideRequest) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="car" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>New Ride Request</Text>
            </View>
            <Animated.View 
              style={[
                styles.timer,
                {
                  transform: [{ scale: timerAnim }],
                  backgroundColor: timeRemaining > 15 ? COLORS.success : 
                                  timeRemaining > 5 ? COLORS.warning : COLORS.error
                }
              ]}
            >
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </Animated.View>
          </View>

          {/* Ride Details */}
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {rideRequest.pickup?.address || 'Pickup location'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.detailText}>
                {rideRequest.destination?.address || 'Destination'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {rideRequest.estimatedDistance || 'Distance'} • {rideRequest.estimatedDuration || 'Duration'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="wallet" size={16} color={COLORS.success} />
              <Text style={styles.detailText}>
                ${rideRequest.companyBid?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDecline('manual')}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>

          {/* Bid Options */}
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => setShowBidOptions(!showBidOptions)}
          >
            <Ionicons name="trending-up" size={16} color={COLORS.primary} />
            <Text style={styles.bidButtonText}>Custom Bid</Text>
          </TouchableOpacity>

          {showBidOptions && (
            <View style={styles.bidOptions}>
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 2)}
              >
                <Text style={styles.bidOptionText}>+$2.00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 5)}
              >
                <Text style={styles.bidOptionText}>+$5.00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 10)}
              >
                <Text style={styles.bidOptionText}>+$10.00</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  timer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rideDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  bidButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  bidOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  bidOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  bidOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RideRequestModal; 