import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const { width: CHART_WIDTH } = Dimensions.get('window');

const BidSuccessRate = ({ data, successRate }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return COLORS.success[600];
    if (rate >= 60) return COLORS.warning[600];
    if (rate >= 40) return COLORS.error[500];
    return COLORS.error[600];
  };

  const getSuccessRateIcon = (rate) => {
    if (rate >= 80) return 'checkmark-circle';
    if (rate >= 60) return 'warning';
    if (rate >= 40) return 'alert-circle';
    return 'close-circle';
  };

  const getSuccessRateMessage = (rate) => {
    if (rate >= 80) return 'Excellent bidding strategy!';
    if (rate >= 60) return 'Good success rate, room for improvement';
    if (rate >= 40) return 'Consider adjusting your bidding approach';
    return 'Review your rate settings and bidding strategy';
  };

  // Calculate bid amount insights
  const averageBid = data.average || 0;
  const acceptedAverage = data.acceptedAverage || 0;
  const rejectedAverage = data.rejectedAverage || 0;
  const bidRange = data.max - data.min || 1;

  return (
    <View style={styles.container}>
      {/* Success Rate Overview */}
      <View style={styles.successRateCard}>
        <View style={styles.successRateHeader}>
          <Ionicons 
            name={getSuccessRateIcon(successRate)} 
            size={24} 
            color={getSuccessRateColor(successRate)} 
          />
          <View style={styles.successRateInfo}>
            <Text style={styles.successRateTitle}>Bid Success Rate</Text>
            <Text style={styles.successRateMessage}>
              {getSuccessRateMessage(successRate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.successRateValue}>
          <Text style={[styles.successRateNumber, { color: getSuccessRateColor(successRate) }]}>
            {successRate.toFixed(1)}%
          </Text>
        </View>

        {/* Success Rate Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${Math.min(successRate, 100)}%`,
                  backgroundColor: getSuccessRateColor(successRate)
                }
              ]} 
            />
          </View>
          <View style={styles.progressBarLabels}>
            <Text style={styles.progressBarLabel}>0%</Text>
            <Text style={styles.progressBarLabel}>50%</Text>
            <Text style={styles.progressBarLabel}>100%</Text>
          </View>
        </View>
      </View>

      {/* Bid Amount Analysis */}
      <View style={styles.bidAnalysisContainer}>
        <Text style={styles.sectionTitle}>Bid Amount Analysis</Text>
        
        <View style={styles.bidStatsGrid}>
          <View style={styles.bidStatCard}>
            <Text style={styles.bidStatValue}>{formatCurrency(averageBid)}</Text>
            <Text style={styles.bidStatLabel}>Average Bid</Text>
          </View>
          
          <View style={styles.bidStatCard}>
            <Text style={styles.bidStatValue}>{formatCurrency(acceptedAverage)}</Text>
            <Text style={styles.bidStatLabel}>Accepted Avg</Text>
          </View>
          
          <View style={styles.bidStatCard}>
            <Text style={styles.bidStatValue}>{formatCurrency(rejectedAverage)}</Text>
            <Text style={styles.bidStatLabel}>Rejected Avg</Text>
          </View>
          
          <View style={styles.bidStatCard}>
            <Text style={styles.bidStatValue}>{formatCurrency(bidRange)}</Text>
            <Text style={styles.bidStatLabel}>Bid Range</Text>
          </View>
        </View>

        {/* Bid Amount Comparison */}
        {acceptedAverage > 0 && rejectedAverage > 0 && (
          <View style={styles.bidComparison}>
            <Text style={styles.comparisonTitle}>Accepted vs Rejected Bids</Text>
            
            <View style={styles.comparisonBars}>
              <View style={styles.comparisonBar}>
                <Text style={styles.comparisonLabel}>Accepted</Text>
                <View style={styles.comparisonBarContainer}>
                  <View 
                    style={[
                      styles.comparisonBarFill,
                      { 
                        width: '100%',
                        backgroundColor: COLORS.success[500]
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.comparisonValue}>{formatCurrency(acceptedAverage)}</Text>
              </View>
              
              <View style={styles.comparisonBar}>
                <Text style={styles.comparisonLabel}>Rejected</Text>
                <View style={styles.comparisonBarContainer}>
                  <View 
                    style={[
                      styles.comparisonBarFill,
                      { 
                        width: `${(rejectedAverage / acceptedAverage) * 100}%`,
                        backgroundColor: COLORS.error[500]
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.comparisonValue}>{formatCurrency(rejectedAverage)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bid Strategy Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Bidding Insights</Text>
          
          {acceptedAverage > rejectedAverage ? (
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
              <Text style={styles.insightText}>
                Your accepted bids are {((acceptedAverage - rejectedAverage) / rejectedAverage * 100).toFixed(1)}% higher than rejected ones
              </Text>
            </View>
          ) : (
            <View style={styles.insightItem}>
              <Ionicons name="trending-down" size={16} color={COLORS.error[600]} />
              <Text style={styles.insightText}>
                Your rejected bids are {((rejectedAverage - acceptedAverage) / acceptedAverage * 100).toFixed(1)}% higher than accepted ones
              </Text>
            </View>
          )}

          {successRate < 50 && (
            <View style={styles.insightItem}>
              <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
              <Text style={styles.insightText}>
                Consider lowering your bid amounts to increase acceptance rate
              </Text>
            </View>
          )}

          {successRate > 80 && (
            <View style={styles.insightItem}>
              <Ionicons name="bulb" size={16} color={COLORS.success[600]} />
              <Text style={styles.insightText}>
                High success rate! You might be able to increase your bids slightly
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  successRateCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  successRateInfo: {
    flex: 1,
  },
  successRateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  successRateMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  successRateValue: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successRateNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBarLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  bidAnalysisContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  bidStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bidStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  bidStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  bidStatLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  bidComparison: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  comparisonBars: {
    gap: 12,
  },
  comparisonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    width: 60,
  },
  comparisonBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.gray[200],
    borderRadius: 10,
    overflow: 'hidden',
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  comparisonValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
    width: 60,
    textAlign: 'right',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
});

export default BidSuccessRate;
