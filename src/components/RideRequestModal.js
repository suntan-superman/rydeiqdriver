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
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// Safe import for COLORS
let COLORS;
try {
  COLORS = require('@/constants').COLORS;
} catch (e) {
  COLORS = {
    primary: '#10B981',
    secondary: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
    success: '#10B981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
}
// Safe imports with error handling
let RideRequestService, costEstimationService, CostBreakdownModal, FareCalculationCard;

try {
  RideRequestService = require('@/services/rideRequestService').default;
} catch (e) {
  RideRequestService = null;
}

try {
  costEstimationService = require('@/services/costEstimationService').default;
} catch (e) {
  costEstimationService = null;
}

try {
  CostBreakdownModal = require('./CostBreakdownModal').default;
} catch (e) {
  CostBreakdownModal = () => null;
}

try {
  FareCalculationCard = require('./SafeFareCalculationCard').default;
} catch (e) {
  FareCalculationCard = () => null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RideRequestModal = ({ 
  visible = false, 
  rideRequest = null,
  onClose,
  driverVehicle = null
}) => {
  const [timeRemaining, setTimeRemaining] = useState(120); // Increased to 2 minutes
  const [showBidOptions, setShowBidOptions] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fareCalculation, setFareCalculation] = useState(null);
  const [userTookAction, setUserTookAction] = useState(false); // Track explicit actions
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && rideRequest) {
      setTimeRemaining(120); // Reset to 2 minutes
      setShowBidOptions(false);
      setCustomBidAmount('');
      setCostAnalysis(null);
      setShowCostBreakdown(false);
      setFareCalculation(null);
      
      // Calculate cost analysis with enhanced error handling
      if (driverVehicle && costEstimationService) {
        setIsCalculating(true);
        
        // Add timeout protection for cost calculation
        const calculateWithTimeout = async () => {
          try {
            const analysisPromise = costEstimationService.calculateRideCosts(rideRequest, driverVehicle);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Cost calculation timeout')), 10000)
            );
            
            const analysis = await Promise.race([analysisPromise, timeoutPromise]);
            
            // Validate the analysis result
            if (analysis && typeof analysis === 'object') {
              setCostAnalysis(analysis);
            } else {
              throw new Error('Invalid analysis result');
            }
            
          } catch (error) {
            // Set a basic fallback analysis for physical device
            setCostAnalysis({
              total: { cost: 0 },
              profitAnalysis: { netProfit: 0, profitMargin: 0 },
              error: 'Unable to calculate costs',
              pickup: { distance: 2.5, cost: 3.75 },
              trip: { distance: 3.0, cost: 4.50 }
            });
          } finally {
            setIsCalculating(false);
          }
        };
        
        calculateWithTimeout();
      } else {
        // Set fallback when services not available
        setCostAnalysis({
          total: { cost: 0 },
          profitAnalysis: { netProfit: 0, profitMargin: 0 },
          error: 'Service unavailable'
        });
      }
      
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
          duration: 120000, // 2 minutes
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
  }, [visible, rideRequest, driverVehicle]);

  // Wrapper close function that handles implicit declines
  const handleModalClose = () => {
    // If user didn't take explicit action, treat as decline
    if (!userTookAction && rideRequest?.id && RideRequestService) {
      if (typeof RideRequestService.declineRideRequest === 'function') {
        RideRequestService.declineRideRequest(rideRequest.id);
        console.log('🚫 Modal closed without action - marked as declined:', rideRequest.id);
      }
    }
    
    // Reset for next modal
    setUserTookAction(false);
    
    if (onClose) {
      onClose();
    }
  };

  // Handle accept ride
  const handleAccept = async () => {
    try {
      setUserTookAction(true); // Mark that user took explicit action
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (RideRequestService && rideRequest?.id) {
        await RideRequestService.acceptRideRequest(rideRequest.id);
        Alert.alert('Success', 'Ride accepted!');
      } else {
        Alert.alert('Success', 'Ride accepted!'); // Fallback for demo
      }
      handleModalClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
      handleModalClose(); // Still close modal
    }
  };

  // Handle decline ride  
  const handleDecline = async (reason = 'manual') => {
    try {
      setUserTookAction(true); // Mark that user took explicit action
      
      if (reason === 'timeout') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      if (RideRequestService && rideRequest?.id) {
        // Mark as declined so it won't appear again
        if (typeof RideRequestService.declineRideRequest === 'function') {
          RideRequestService.declineRideRequest(rideRequest.id);
        }
        
        await RideRequestService.rejectRideRequest(rideRequest.id, reason);
      }
      
      if (reason !== 'timeout') {
        Alert.alert('Ride Declined', 'Ride request has been declined');
      }
      handleModalClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline ride');
      
      // Still mark as declined even if Firebase fails
      if (RideRequestService && rideRequest?.id && typeof RideRequestService.declineRideRequest === 'function') {
        RideRequestService.declineRideRequest(rideRequest.id);
      }
      
      handleModalClose(); // Still close modal
    }
  };

  // Handle custom bid
  const handleCustomBid = async (bidAmount) => {
    try {
      setUserTookAction(true); // Mark that user took explicit action
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (RideRequestService && rideRequest?.id) {
        await RideRequestService.submitCustomBid(rideRequest.id, bidAmount);
      }
      
      Alert.alert('Bid Submitted', `Your bid of $${bidAmount.toFixed(2)} has been submitted`);
      handleModalClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid');
      handleModalClose(); // Still close modal
    }
  };

  // Handle manual bid submission
  const handleManualBidSubmit = () => {
    Keyboard.dismiss(); // Dismiss keyboard first
    
    const bidValue = parseFloat(customBidAmount);
    if (isNaN(bidValue) || bidValue < 5) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount. Minimum bid is $5.00');
      return;
    }
    
    handleCustomBid(bidValue);
  };

  // Dismiss keyboard when touching outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Get safe price with validation and fallback
  const getSafePrice = (rideRequest) => {
    // Try different price fields
    const priceFields = [
      rideRequest.companyBid,
      rideRequest.estimatedPrice,
      rideRequest.bidAmount,
      rideRequest.totalFare
    ];
    
    for (const price of priceFields) {
      if (price != null && isFinite(price) && !isNaN(price) && price > 0 && price < 500) {
        return price.toFixed(2);
      }
    }
    
    // Calculate basic fallback price based on distance
    const distance = rideRequest.estimatedDistance || rideRequest.distanceInMiles || 2.5;
    const safeDistance = Math.min(Math.max(distance, 1), 50); // Between 1-50 miles
    const fallbackPrice = 5.00 + (safeDistance * 2.25); // $5 base + $2.25/mile
    
    console.warn('⚠️ Using fallback price calculation:', {
      originalFields: priceFields,
      distance: safeDistance,
      fallbackPrice: fallbackPrice.toFixed(2)
    });
    
    return fallbackPrice.toFixed(2);
  };

  // Handle fare calculation completion
  const handleFareCalculationComplete = (fareData) => {
    setFareCalculation(fareData);
  };

  if (!rideRequest) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleModalClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
                ${getSafePrice(rideRequest)}
              </Text>
            </View>
            
            {/* Cost Analysis Summary */}
            {costAnalysis && (
              <View style={styles.costSummary}>
                <View style={styles.costSummaryRow}>
                  <Text style={styles.costSummaryLabel}>Total Cost:</Text>
                  <Text style={styles.costSummaryValue}>
                    ${costAnalysis.total.cost.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.costSummaryRow}>
                  <Text style={styles.costSummaryLabel}>Net Profit:</Text>
                  <Text style={[
                    styles.costSummaryValue,
                    { color: costAnalysis.profitAnalysis.netProfit >= 0 ? COLORS.success : COLORS.error }
                  ]}>
                    ${costAnalysis.profitAnalysis.netProfit.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.costSummaryRow}>
                  <Text style={styles.costSummaryLabel}>Profit Margin:</Text>
                  <Text style={[
                    styles.costSummaryValue,
                    { color: costAnalysis.profitAnalysis.profitMargin >= 20 ? COLORS.success : 
                             costAnalysis.profitAnalysis.profitMargin >= 10 ? COLORS.warning : COLORS.error }
                  ]}>
                    {costAnalysis.profitAnalysis.profitMargin.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
            
            {/* Loading indicator for cost calculation */}
            {isCalculating && (
              <View style={styles.calculatingIndicator}>
                <Ionicons name="calculator" size={16} color={COLORS.primary} />
                <Text style={styles.calculatingText}>Calculating costs...</Text>
              </View>
            )}
          </View>

          {/* Fare Calculation Card */}
          {driverVehicle && FareCalculationCard && (
            <FareCalculationCard
              rideRequest={rideRequest}
              driverVehicle={driverVehicle}
              driverLocation={null} // Uses safe fallback location internally
              onCalculationComplete={handleFareCalculationComplete}
              style={styles.fareCard}
            />
          )}

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

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Cost Analysis Button */}
            {costAnalysis && (
              <TouchableOpacity
                style={styles.costAnalysisButton}
                onPress={() => setShowCostBreakdown(true)}
              >
                <Ionicons name="calculator" size={16} color={COLORS.primary} />
                <Text style={styles.costAnalysisButtonText}>Cost Details</Text>
              </TouchableOpacity>
            )}
            
            {/* Bid Options */}
            <TouchableOpacity
              style={styles.bidButton}
              onPress={() => setShowBidOptions(!showBidOptions)}
            >
              <Ionicons name="trending-up" size={16} color={COLORS.primary} />
              <Text style={styles.bidButtonText}>Custom Bid</Text>
            </TouchableOpacity>
          </View>

          {showBidOptions && (
            <View style={styles.bidOptionsContainer}>
              {/* Quick bid buttons row */}
              <View style={styles.bidOptions}>
                <TouchableOpacity
                  style={styles.bidOption}
                  onPress={() => {
                    const currentPrice = parseFloat(getSafePrice(rideRequest));
                    const newBid = Math.max(5, currentPrice - 1);
                    handleCustomBid(newBid);
                  }}
                >
                  <Text style={styles.bidOptionText}>-$1.00</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.bidOption, styles.acceptOption]}
                  onPress={() => handleAccept()}
                >
                  <Text style={[styles.bidOptionText, styles.acceptOptionText]}>Accept</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.bidOption}
                  onPress={() => {
                    const currentPrice = parseFloat(getSafePrice(rideRequest));
                    handleCustomBid(currentPrice + 2);
                  }}
                >
                  <Text style={styles.bidOptionText}>+$2.00</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.bidOption}
                  onPress={() => {
                    const currentPrice = parseFloat(getSafePrice(rideRequest));
                    handleCustomBid(currentPrice + 5);
                  }}
                >
                  <Text style={styles.bidOptionText}>+$5.00</Text>
                </TouchableOpacity>
                
                {/* Smart bid option based on costs */}
                {fareCalculation && fareCalculation.totalEstimatedCosts && (
                  <TouchableOpacity
                    style={[styles.bidOption, styles.smartBidOption]}
                    onPress={() => {
                      const smartBid = fareCalculation.totalEstimatedCosts * 1.3; // 30% profit margin
                      const currentPrice = parseFloat(getSafePrice(rideRequest));
                      const finalBid = Math.max(smartBid, currentPrice + 2, 5); // Ensure minimum $5
                      Alert.alert(
                        'Smart Bid', 
                        `Calculated bid: $${finalBid.toFixed(2)}\nBased on: $${fareCalculation.totalEstimatedCosts.toFixed(2)} costs + 30% profit`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Submit Bid', onPress: () => handleCustomBid(finalBid) }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.smartBidOptionText}>Smart</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Manual bid input row - separate from buttons */}
              <View style={styles.manualBidContainer}>
                <Text style={styles.manualBidLabel}>Custom Amount:</Text>
                <TextInput
                  style={styles.manualBidInput}
                  placeholder="$0.00"
                  value={customBidAmount}
                  onChangeText={setCustomBidAmount}
                  keyboardType="numeric"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleManualBidSubmit}
                  blurOnSubmit={true}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    styles.manualBidSubmit,
                    (!customBidAmount || parseFloat(customBidAmount) <= 0) && styles.manualBidSubmitDisabled
                  ]}
                  onPress={handleManualBidSubmit}
                  disabled={!customBidAmount || parseFloat(customBidAmount) <= 0}
                >
                  <Text style={[
                    styles.manualBidSubmitText,
                    (!customBidAmount || parseFloat(customBidAmount) <= 0) && styles.manualBidSubmitTextDisabled
                  ]}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Cost Breakdown Modal */}
      {CostBreakdownModal && (
        <CostBreakdownModal
          visible={showCostBreakdown}
          costAnalysis={costAnalysis}
          onClose={() => setShowCostBreakdown(false)}
          onAccept={handleAccept}
          onCustomBid={handleCustomBid}
        />
      )}
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
  // bidButton style moved below to avoid duplicate
  bidButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  costAnalysisButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.secondary[100] || '#F3F4F6',
    borderRadius: 8,
    gap: 8,
    minHeight: 48,
  },
  costAnalysisButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  bidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
    minHeight: 48,
  },
  bidOptionsContainer: {
    marginTop: 12,
  },
  bidOptions: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  bidOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    maxWidth: 80, // Prevent buttons from getting too wide
  },
  bidOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  costSummary: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  costSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  costSummaryLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  costSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  calculatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  calculatingText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  fareCard: {
    marginBottom: 16,
  },
  smartBidOption: {
    backgroundColor: COLORS.success,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: 6,
  },
  smartBidOptionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptOption: {
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  acceptOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  manualBidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  manualBidLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[700],
    minWidth: 90,
  },
  manualBidInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[300] || '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 44,
    textAlign: 'center',
  },
  manualBidSubmit: {
    backgroundColor: COLORS.success || '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  manualBidSubmitDisabled: {
    backgroundColor: COLORS.gray[300] || '#D1D5DB',
  },
  manualBidSubmitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  manualBidSubmitTextDisabled: {
    color: COLORS.gray[400] || '#9CA3AF',
  },
});

export default RideRequestModal; 