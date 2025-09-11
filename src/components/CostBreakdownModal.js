import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CostBreakdownModal = ({ 
  visible = false, 
  costAnalysis = null,
  onClose,
  onAccept,
  onCustomBid
}) => {
  if (!costAnalysis) return null;

  const { pickup, trip, total, profitAnalysis, recommendations, fuelPrices } = costAnalysis;

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      case 'caution': return 'alert-circle';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      case 'caution': return COLORS.warning;
      case 'info': return COLORS.info;
      default: return COLORS.secondary[500];
    }
  };

  const handleCustomBid = (suggestedAmount) => {
    Alert.alert(
      'Custom Bid',
      `Submit a bid of $${suggestedAmount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit Bid', 
          onPress: () => onCustomBid?.(suggestedAmount)
        }
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
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="calculator" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Cost Analysis</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.secondary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cost Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
              
              {/* Pickup Cost */}
              <View style={styles.costCard}>
                <View style={styles.costHeader}>
                  <Ionicons name="car" size={20} color={COLORS.primary} />
                  <Text style={styles.costTitle}>Pickup Cost</Text>
                  <Text style={styles.costAmount}>${pickup.cost.totalCost.toFixed(2)}</Text>
                </View>
                <View style={styles.costDetails}>
                  <Text style={styles.costDetail}>
                    Distance: {pickup.distance.toFixed(1)} miles
                  </Text>
                  <Text style={styles.costDetail}>
                    Time: {pickup.estimatedTime.formatted}
                  </Text>
                  <Text style={styles.costDetail}>
                    Fuel: ${pickup.cost.fuelCost.totalCost.toFixed(2)}
                  </Text>
                  <Text style={styles.costDetail}>
                    Other: ${pickup.cost.otherExpenses.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Trip Cost */}
              <View style={styles.costCard}>
                <View style={styles.costHeader}>
                  <Ionicons name="location" size={20} color={COLORS.success} />
                  <Text style={styles.costTitle}>Trip Cost</Text>
                  <Text style={styles.costAmount}>${trip.cost.totalCost.toFixed(2)}</Text>
                </View>
                <View style={styles.costDetails}>
                  <Text style={styles.costDetail}>
                    Distance: {trip.distance.toFixed(1)} miles
                  </Text>
                  <Text style={styles.costDetail}>
                    Time: {trip.estimatedTime.formatted}
                  </Text>
                  <Text style={styles.costDetail}>
                    Fuel: ${trip.cost.fuelCost.totalCost.toFixed(2)}
                  </Text>
                  <Text style={styles.costDetail}>
                    Other: ${trip.cost.otherExpenses.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Total Cost */}
              <View style={[styles.costCard, styles.totalCard]}>
                <View style={styles.costHeader}>
                  <Ionicons name="wallet" size={20} color={COLORS.secondary[700]} />
                  <Text style={styles.costTitle}>Total Cost</Text>
                  <Text style={styles.totalAmount}>${total.cost.toFixed(2)}</Text>
                </View>
                <View style={styles.costDetails}>
                  <Text style={styles.costDetail}>
                    Total Distance: {total.distance.toFixed(1)} miles
                  </Text>
                  <Text style={styles.costDetail}>
                    Fuel Cost: ${total.fuelCost.toFixed(2)}
                  </Text>
                  <Text style={styles.costDetail}>
                    Other Expenses: ${total.otherExpenses.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Profit Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profit Analysis</Text>
              
              <View style={styles.profitCard}>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Company Bid:</Text>
                  <Text style={styles.profitValue}>${profitAnalysis.bidAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Total Expenses:</Text>
                  <Text style={styles.profitValue}>${profitAnalysis.breakdown.totalExpenses.toFixed(2)}</Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Platform Commission:</Text>
                  <Text style={styles.profitValue}>${profitAnalysis.breakdown.commission.toFixed(2)}</Text>
                </View>
                <View style={[styles.profitRow, styles.netProfitRow]}>
                  <Text style={styles.profitLabel}>Net Profit:</Text>
                  <Text style={[
                    styles.profitValue, 
                    { color: profitAnalysis.netProfit >= 0 ? COLORS.success : COLORS.error }
                  ]}>
                    ${profitAnalysis.netProfit.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Profit Margin:</Text>
                  <Text style={[
                    styles.profitValue,
                    { color: profitAnalysis.profitMargin >= 20 ? COLORS.success : 
                             profitAnalysis.profitMargin >= 10 ? COLORS.warning : COLORS.error }
                  ]}>
                    {profitAnalysis.profitMargin.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Profit per Mile:</Text>
                  <Text style={[
                    styles.profitValue,
                    { color: profitAnalysis.profitPerMile >= 1 ? COLORS.success : COLORS.warning }
                  ]}>
                    ${profitAnalysis.profitPerMile.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Vehicle Efficiency */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Efficiency</Text>
              
              <View style={styles.efficiencyCard}>
                <View style={styles.efficiencyRow}>
                  <Text style={styles.efficiencyLabel}>Combined MPG:</Text>
                  <Text style={styles.efficiencyValue}>
                    {pickup.cost.vehicleEfficiency.mpg} MPG
                  </Text>
                </View>
                <View style={styles.efficiencyRow}>
                  <Text style={styles.efficiencyLabel}>Fuel Type:</Text>
                  <Text style={styles.efficiencyValue}>
                    {pickup.cost.vehicleEfficiency.fuelType}
                  </Text>
                </View>
                <View style={styles.efficiencyRow}>
                  <Text style={styles.efficiencyLabel}>Effective MPG:</Text>
                  <Text style={styles.efficiencyValue}>
                    {pickup.cost.trafficImpact.effectiveMPG} MPG
                  </Text>
                </View>
                <View style={styles.efficiencyRow}>
                  <Text style={styles.efficiencyLabel}>Traffic Factor:</Text>
                  <Text style={styles.efficiencyValue}>
                    {pickup.cost.trafficImpact.factor.toFixed(1)}x
                  </Text>
                </View>
              </View>
            </View>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                
                {recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <Ionicons 
                        name={getRecommendationIcon(rec.type)} 
                        size={20} 
                        color={getRecommendationColor(rec.type)} 
                      />
                      <Text style={styles.recommendationTitle}>
                        {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.recommendationMessage}>{rec.message}</Text>
                    {rec.suggestedIncrease && (
                      <TouchableOpacity
                        style={styles.suggestionButton}
                        onPress={() => handleCustomBid(profitAnalysis.bidAmount + rec.suggestedIncrease)}
                      >
                        <Text style={styles.suggestionButtonText}>
                          Bid +${rec.suggestedIncrease.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Fuel Price Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fuel Prices</Text>
              
              <View style={styles.fuelInfoCard}>
                <Text style={styles.fuelInfoText}>
                  Source: {fuelPrices.source}
                </Text>
                <Text style={styles.fuelInfoText}>
                  Updated: {new Date(fuelPrices.lastUpdated).toLocaleTimeString()}
                </Text>
                {fuelPrices.location && (
                  <Text style={styles.fuelInfoText}>
                    Location: {typeof fuelPrices.location === 'string' ? 
                      fuelPrices.location : 
                      `${fuelPrices.location.latitude?.toFixed(2)}, ${fuelPrices.location.longitude?.toFixed(2)}`
                    }
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.declineButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    margin: 20,
    width: SCREEN_WIDTH - 40,
    maxHeight: '90%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  costCard: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  totalCard: {
    backgroundColor: COLORS.primary[50],
    borderLeftColor: COLORS.primary[500],
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    flex: 1,
    marginLeft: 8,
  },
  costAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary[500],
  },
  costDetails: {
    marginLeft: 28,
  },
  costDetail: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  profitCard: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  netProfitRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
    marginTop: 8,
    paddingTop: 12,
  },
  profitLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  efficiencyCard: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
  },
  efficiencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
    fontWeight: '500',
  },
  efficiencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  recommendationCard: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginLeft: 8,
  },
  recommendationMessage: {
    fontSize: 14,
    color: COLORS.secondary[700],
    lineHeight: 20,
  },
  suggestionButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  suggestionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  fuelInfoCard: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 12,
    padding: 16,
  },
  fuelInfoText: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
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
});

export default CostBreakdownModal; 