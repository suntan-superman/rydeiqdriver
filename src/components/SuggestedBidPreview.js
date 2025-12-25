import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';

const SuggestedBidPreview = ({
  rideData,
  rateSettings,
  onBidSubmit,
  onBidCancel,
  driverLocation,
}) => {
  const [suggestedBid, setSuggestedBid] = useState(0);
  const [customBid, setCustomBid] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [appliedTimeBlock, setAppliedTimeBlock] = useState(null);
  const [calculationDetails, setCalculationDetails] = useState({
    pickupDistance: 0,
    rideDistance: 0,
    pickupRate: 0,
    destinationRate: 0,
    pickupCost: 0,
    destinationCost: 0,
  });

  useEffect(() => {
    calculateSuggestedBid();
  }, [rideData, rateSettings, driverLocation]);

  const calculateSuggestedBid = () => {
    if (!rideData || !rateSettings) return;

    // Calculate distances (mock calculation - would use real distance service)
    const pickupDistance = calculateDistance(
      driverLocation,
      rideData.pickup.coordinates
    );
    const rideDistance = calculateDistance(
      rideData.pickup.coordinates,
      rideData.destination.coordinates
    );

    // Determine which rate to use based on scheduled time
    const scheduledTime = rideData.scheduledTime || new Date();
    const timeBlock = findApplicableTimeBlock(scheduledTime, rateSettings.timeBlocks);
    
    const rates = timeBlock || rateSettings.defaultRate;
    setAppliedTimeBlock(timeBlock);

    // Calculate costs
    const pickupCost = pickupDistance * rates.pickup;
    const destinationCost = rideDistance * rates.destination;
    const totalBid = pickupCost + destinationCost;

    setSuggestedBid(totalBid);
    setCustomBid(totalBid.toFixed(2));
    setCalculationDetails({
      pickupDistance,
      rideDistance,
      pickupRate: rates.pickup,
      destinationRate: rates.destination,
      pickupCost,
      destinationCost,
    });
  };

  const calculateDistance = (point1, point2) => {
    // Mock distance calculation - would use real geolocation service
    // For now, return random distances for demo
    return Math.random() * 5 + 0.5; // 0.5 to 5.5 miles
  };

  const findApplicableTimeBlock = (scheduledTime, timeBlocks) => {
    const time = new Date(scheduledTime);
    const currentTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    return timeBlocks.find(block => {
      if (!block.enabled) return false;
      return isTimeInRange(currentTime, block.start, block.end);
    });
  };

  const isTimeInRange = (currentTime, startTime, endTime) => {
    const current = timeToMinutes(currentTime);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    
    // Handle overnight ranges (e.g., 23:00 to 02:00)
    if (start > end) {
      return current >= start || current <= end;
    }
    
    return current >= start && current <= end;
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleEditBid = () => {
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBidChange = (value) => {
    setCustomBid(value);
  };

  const handleSaveBid = () => {
    const bidAmount = parseFloat(customBid);
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount greater than $0.00');
      return;
    }

    setIsEditing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmitBid = () => {
    const bidAmount = parseFloat(customBid);
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount greater than $0.00');
      return;
    }

    const bidData = {
      amount: bidAmount,
      calculationDetails,
      appliedTimeBlock,
      isCustomBid: bidAmount !== suggestedBid,
      submittedAt: new Date().toISOString(),
    };

    onBidSubmit(bidData);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeBlockColor = (timeBlock) => {
    if (!timeBlock) return COLORS.gray[500];
    
    const colors = {
      'morning_rush': COLORS.warning[500],
      'lunch_rush': COLORS.info[500],
      'evening_rush': COLORS.error[500],
      'late_night': COLORS.primary[500],
    };
    
    return colors[timeBlock.id] || COLORS.gray[500];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calculator" size={24} color={COLORS.primary[600]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Suggested Bid</Text>
          <Text style={styles.headerSubtitle}>
            Based on your rate settings and ride details
          </Text>
        </View>
      </View>

      {/* Time Block Applied */}
      {appliedTimeBlock && (
        <View style={[styles.timeBlockBadge, { backgroundColor: getTimeBlockColor(appliedTimeBlock) + '20' }]}>
          <View style={[styles.timeBlockDot, { backgroundColor: getTimeBlockColor(appliedTimeBlock) }]} />
          <Text style={[styles.timeBlockText, { color: getTimeBlockColor(appliedTimeBlock) }]}>
            {appliedTimeBlock.name} Rate Applied
          </Text>
        </View>
      )}

      {/* Calculation Details */}
      <View style={styles.calculationCard}>
        <Text style={styles.calculationTitle}>Calculation Breakdown</Text>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Pickup Distance:</Text>
          <Text style={styles.calculationValue}>
            {calculationDetails.pickupDistance.toFixed(1)} miles
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Pickup Rate:</Text>
          <Text style={styles.calculationValue}>
            ${calculationDetails.pickupRate.toFixed(2)}/mile
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Pickup Cost:</Text>
          <Text style={styles.calculationValue}>
            ${calculationDetails.pickupCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Ride Distance:</Text>
          <Text style={styles.calculationValue}>
            {calculationDetails.rideDistance.toFixed(1)} miles
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Destination Rate:</Text>
          <Text style={styles.calculationValue}>
            ${calculationDetails.destinationRate.toFixed(2)}/mile
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Destination Cost:</Text>
          <Text style={styles.calculationValue}>
            ${calculationDetails.destinationCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.calculationRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Suggested Bid:</Text>
          <Text style={styles.totalValue}>${suggestedBid.toFixed(2)}</Text>
        </View>
      </View>

      {/* Bid Input */}
      <View style={styles.bidInputCard}>
        <View style={styles.bidInputHeader}>
          <Text style={styles.bidInputTitle}>Your Bid</Text>
          {!isEditing && (
            <TouchableOpacity onPress={handleEditBid} style={styles.editButton}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary[600]} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editingContainer}>
            <View style={styles.bidInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.bidInput}
                value={customBid}
                onChangeText={handleBidChange}
                keyboardType="numeric"
                placeholder="0.00"
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={handleSaveBid} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bidDisplayContainer}>
            <Text style={styles.bidAmount}>${customBid}</Text>
            {parseFloat(customBid) !== suggestedBid && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onBidCancel}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={20} color={COLORS.gray[600]} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmitBid}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.submitButtonText}>Submit Bid</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={16} color={COLORS.info[600]} />
          <Text style={styles.infoTitle}>Bidding Tips</Text>
        </View>
        <Text style={styles.infoText}>
          • Your bid is based on the scheduled ride time, not current time
        </Text>
        <Text style={styles.infoText}>
          • You can always edit the suggested bid before submitting
        </Text>
        <Text style={styles.infoText}>
          • Consider traffic, distance, and your availability when bidding
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  timeBlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  timeBlockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timeBlockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calculationCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[300],
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  bidInputCard: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bidInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bidInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[800],
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '500',
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bidInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary[300],
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  saveButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bidDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bidAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary[800],
  },
  customBadge: {
    backgroundColor: COLORS.warning[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  submitButton: {
    backgroundColor: COLORS.primary[600],
    shadowColor: COLORS.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    backgroundColor: COLORS.info[50],
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.info[200],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.info[800],
    marginLeft: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.info[700],
    lineHeight: 16,
    marginBottom: 4,
  },
});

export default SuggestedBidPreview;
