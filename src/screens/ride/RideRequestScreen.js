import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Animated,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { playRideRequestSound, playBidSound, playSuccessSound, playErrorSound } from '@/utils/soundEffects';
import { COLORS } from '@/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RideRequestScreen = ({ 
  visible = false, 
  onAccept, 
  onDecline, 
  onCustomBid,
  rideRequest = {},
  driverVehicle = null // Vehicle info for fuel calculations
}) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showBidOptions, setShowBidOptions] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [fuelEstimate, setFuelEstimate] = useState(null);
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Default ride request data for demo
  const defaultRequest = {
    customerId: 'demo_customer',
    customerName: 'Sarah M.',
    customerRating: 4.9,
    customerPhoto: null,
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
    companyBid: 18.50,
    rideType: 'standard',
    specialRequests: [],
    distanceInMiles: 3.2 // Numeric distance for calculations
  };

  const request = { ...defaultRequest, ...rideRequest };

  // Default vehicle for demo if none provided
  const defaultVehicle = {
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    vehicleType: 'standard'
  };

  const vehicle = driverVehicle || defaultVehicle;

  // Bid profit display component
  const BidProfitDisplay = ({ bidAmount }) => {
    const [profit, setProfit] = useState(null);

    useEffect(() => {
      const calcProfit = async () => {
        const result = await calculateBidProfit(bidAmount);
        setProfit(result);
      };
      calcProfit();
    }, [bidAmount]);

    if (!profit) return null;

    return (
      <Text style={[styles.bidOptionProfit, 
        { color: profit.netProfit > 0 ? COLORS.success : COLORS.error }
      ]}>
        ${profit.netProfit.toFixed(2)} profit
      </Text>
    );
  };

  // Calculate fuel and profit estimates
  useEffect(() => {
    if (!visible || !request.distanceInMiles) return;

    const calculateEstimates = async () => {
      try {
        const { calculateFuelCost, calculateProfitEstimate } = require('../../utils/fuelEstimation');
        
        // Calculate fuel cost
        const fuelCost = await calculateFuelCost({
          distance: request.distanceInMiles,
          vehicle: { ...vehicle, driverId: 'demo_driver' }, // Include driver ID for learning
          trafficFactor: 1.1, // Assume light traffic
          location: request.pickup?.coordinates // Use pickup location for fuel prices
        });
        
        setFuelEstimate(fuelCost);
        
        // Calculate profit for company bid
        const profit = await calculateProfitEstimate({
          bidAmount: request.companyBid,
          distance: request.distanceInMiles,
          vehicle: { ...vehicle, driverId: 'demo_driver' },
          trafficFactor: 1.1,
          location: request.pickup?.coordinates
        });
        
        setProfitAnalysis(profit);
      } catch (error) {
        console.error('Error calculating fuel/profit:', error);
        // Set fallback estimates
        setFuelEstimate({ totalCost: 2.50, costBreakdown: { efficiency: 30, efficiencyUnit: 'MPG' } });
        setProfitAnalysis({ 
          netProfit: request.companyBid * 0.7, 
          profitMargin: 70,
          breakdown: { commission: request.companyBid * 0.15 },
          recommendations: []
        });
      }
    };

    calculateEstimates();
  }, [visible, request.distanceInMiles, request.companyBid, vehicle]);

  // Timer countdown effect
  useEffect(() => {
    if (!visible) return;

    // Reset timer when modal opens
    setTimeRemaining(30);
    
    // Start countdown
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-decline when timer reaches 0
          handleDecline('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Modal entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Timer pulse animation
      const timerPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(timerAnim, {
            toValue: 0.9,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(timerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      );
      timerPulse.start();

      // Alert pulse animation
      const alertPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      alertPulse.start();

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Vibration pattern
      Vibration.vibrate([0, 500, 200, 500]);

      return () => {
        timerPulse.stop();
        alertPulse.stop();
      };
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  // Handle accept ride
  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSuccessSound();
    onAccept?.(request);
  };

  // Handle decline ride  
  const handleDecline = (reason = 'manual') => {
    if (reason === 'timeout') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playErrorSound();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playErrorSound();
    }
    onDecline?.(request, reason);
  };

  // Handle custom bid
  const handleBidOption = (bidType, amount = null) => {
    let finalAmount;
    
    switch (bidType) {
      case 'accept':
        finalAmount = request.companyBid;
        break;
      case 'plus2':
        finalAmount = request.companyBid + 2;
        break;
      case 'plus5':
        finalAmount = request.companyBid + 5;
        break;
      case 'plus10':
        finalAmount = request.companyBid + 10;
        break;
      case 'custom':
        finalAmount = amount || parseFloat(customBidAmount);
        break;
      default:
        finalAmount = request.companyBid;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playBidSound();
    onCustomBid?.(request, finalAmount, bidType);
  };

  // Calculate profit for a specific bid amount
  const calculateBidProfit = async (bidAmount) => {
    if (!request.distanceInMiles || !fuelEstimate) return null;
    
    try {
      const { calculateProfitEstimate } = require('../../utils/fuelEstimation');
      return await calculateProfitEstimate({
        bidAmount,
        distance: request.distanceInMiles,
        vehicle: { ...vehicle, driverId: 'demo_driver' },
        trafficFactor: 1.1,
        location: request.pickup?.coordinates
      });
    } catch (error) {
      return null;
    }
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining > 15) return COLORS.success;
    if (timeRemaining > 5) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
              ]
            }
          ]}
        >
          {/* Header with Timer */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Ride Request</Text>
            <Animated.View 
              style={[
                styles.timerContainer,
                { backgroundColor: getTimerColor() },
                { transform: [{ scale: timerAnim }] }
              ]}
            >
              <Text style={styles.timerText}>{timeRemaining}</Text>
            </Animated.View>
          </View>

          {/* Customer Info */}
          <View style={styles.customerSection}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                {request.customerPhoto ? (
                  <Image 
                    source={{ uri: request.customerPhoto }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons 
                    name="person" 
                    size={28} 
                    color={COLORS.secondary[500]} 
                  />
                )}
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{request.customerName}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{request.customerRating}</Text>
                  <Text style={styles.rideType}>• {request.rideType}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripSection}>
            <View style={styles.routeContainer}>
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{request.pickup.address}</Text>
                </View>
              </View>
              
              <View style={styles.routeLine} />
              
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, styles.destinationDot]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Destination</Text>
                  <Text style={styles.locationAddress}>{request.destination.address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tripStats}>
              <View style={styles.statItem}>
                <Ionicons name="location" size={16} color={COLORS.secondary[500]} />
                <Text style={styles.statText}>{request.estimatedDistance}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={COLORS.secondary[500]} />
                <Text style={styles.statText}>{request.estimatedDuration}</Text>
              </View>
            </View>

            {/* Fuel Cost & Profit Analysis */}
            {fuelEstimate && profitAnalysis && (
              <View style={styles.profitAnalysis}>
                <View style={styles.profitHeader}>
                  <Ionicons name="analytics" size={16} color={COLORS.primary[500]} />
                  <Text style={styles.profitTitle}>Profit Analysis</Text>
                </View>
                
                <View style={styles.profitGrid}>
                  <View style={styles.profitItem}>
                    <Text style={styles.profitLabel}>Fuel Cost</Text>
                    <Text style={styles.profitValue}>
                      ${fuelEstimate.totalCost.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.profitItem}>
                    <Text style={styles.profitLabel}>Commission</Text>
                    <Text style={styles.profitValue}>
                      ${profitAnalysis.breakdown.commission.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.profitItem}>
                    <Text style={styles.profitLabel}>Net Profit</Text>
                    <Text style={[
                      styles.profitValue,
                      { color: profitAnalysis.netProfit > 0 ? COLORS.success : COLORS.error }
                    ]}>
                      ${profitAnalysis.netProfit.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.profitItem}>
                    <Text style={styles.profitLabel}>Margin</Text>
                    <Text style={[
                      styles.profitValue,
                      { color: profitAnalysis.profitMargin > 20 ? COLORS.success : 
                               profitAnalysis.profitMargin > 10 ? COLORS.warning : COLORS.error }
                    ]}>
                      {profitAnalysis.profitMargin.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                {/* Vehicle Info */}
                <Text style={styles.vehicleInfo}>
                  {vehicle.year} {vehicle.make} {vehicle.model} • {fuelEstimate.costBreakdown.efficiency} {fuelEstimate.costBreakdown.efficiencyUnit}
                </Text>

                {/* Recommendations */}
                {profitAnalysis.recommendations && profitAnalysis.recommendations.length > 0 && (
                  <View style={styles.recommendations}>
                    {profitAnalysis.recommendations.map((rec, index) => (
                      <View key={index} style={[
                        styles.recommendation,
                        { borderLeftColor: rec.type === 'warning' ? COLORS.error : 
                                          rec.type === 'caution' ? COLORS.warning : COLORS.success }
                      ]}>
                        <Text style={styles.recommendationText}>{rec.message}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Fare Display */}
          <View style={styles.fareSection}>
            <Text style={styles.fareLabel}>Company Estimate</Text>
            <Text style={styles.fareAmount}>${request.companyBid.toFixed(2)}</Text>
          </View>

          {/* Action Buttons */}
          {!showBidOptions ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.declineButton}
                onPress={() => handleDecline('manual')}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleBidOption('accept')}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptButtonText}>
                  Accept ${request.companyBid.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bidOptions}>
              <Text style={styles.bidOptionsTitle}>Choose Your Bid</Text>
              <View style={styles.bidButtonsRow}>
                <TouchableOpacity 
                  style={styles.bidOption}
                  onPress={() => handleBidOption('plus2')}
                >
                  <Text style={styles.bidOptionText}>+$2</Text>
                  <Text style={styles.bidOptionAmount}>
                    ${(request.companyBid + 2).toFixed(2)}
                  </Text>
                  <BidProfitDisplay bidAmount={request.companyBid + 2} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.bidOption}
                  onPress={() => handleBidOption('plus5')}
                >
                  <Text style={styles.bidOptionText}>+$5</Text>
                  <Text style={styles.bidOptionAmount}>
                    ${(request.companyBid + 5).toFixed(2)}
                  </Text>
                  <BidProfitDisplay bidAmount={request.companyBid + 5} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.bidOption}
                  onPress={() => handleBidOption('plus10')}
                >
                  <Text style={styles.bidOptionText}>+$10</Text>
                  <Text style={styles.bidOptionAmount}>
                    ${(request.companyBid + 10).toFixed(2)}
                  </Text>
                  <BidProfitDisplay bidAmount={request.companyBid + 10} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Custom Bid Toggle */}
          <TouchableOpacity 
            style={styles.customBidToggle}
            onPress={() => setShowBidOptions(!showBidOptions)}
          >
            <Text style={styles.customBidToggleText}>
              {showBidOptions ? 'Back to Accept/Decline' : 'Make Custom Bid'}
            </Text>
            <Ionicons 
              name={showBidOptions ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={COLORS.primary[500]} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  timerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  customerSection: {
    marginBottom: 24,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 4,
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
    marginRight: 8,
  },
  rideType: {
    fontSize: 14,
    color: COLORS.secondary[500],
    textTransform: 'capitalize',
  },
  tripSection: {
    marginBottom: 24,
  },
  routeContainer: {
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    marginLeft: 6,
  },
  fareSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.secondary[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  bidOptions: {
    marginBottom: 16,
  },
  bidOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  bidButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bidOption: {
    flex: 1,
    backgroundColor: COLORS.primary[50],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  bidOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary[600],
    marginBottom: 2,
  },
  bidOptionAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary[600],
  },
  customBidToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  customBidToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary[500],
    marginRight: 6,
  },
  // New styles for fuel cost and profit analysis
  profitAnalysis: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[800],
    marginLeft: 6,
  },
  profitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profitItem: {
    width: '48%',
    marginBottom: 8,
  },
  profitLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginBottom: 2,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[800],
  },
  vehicleInfo: {
    fontSize: 11,
    color: COLORS.secondary[500],
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  recommendations: {
    marginTop: 8,
  },
  recommendation: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.secondary[700],
    lineHeight: 16,
  },
  bidOptionProfit: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default RideRequestScreen; 