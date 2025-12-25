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

const TimeBlockPerformance = ({ data, bidData }) => {
  const timeBlocks = [
    { id: 'morning_rush', name: 'Morning Rush', icon: 'sunny', color: COLORS.warning[500] },
    { id: 'lunch_rush', name: 'Lunch Rush', icon: 'restaurant', color: COLORS.info[500] },
    { id: 'evening_rush', name: 'Evening Rush', icon: 'moon', color: COLORS.error[500] },
    { id: 'late_night', name: 'Late Night', icon: 'moon-outline', color: COLORS.primary[500] },
    { id: 'default', name: 'Standard Hours', icon: 'time', color: COLORS.gray[500] },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getTimeBlockData = (blockId) => {
    return data[blockId] || { earnings: 0, rides: 0, averagePerRide: 0, hourlyRate: 0 };
  };

  const getBidData = (blockId) => {
    return bidData[blockId] || { total: 0, accepted: 0, successRate: 0 };
  };

  // Find the best performing time block
  const bestTimeBlock = timeBlocks.reduce((best, block) => {
    const currentData = getTimeBlockData(block.id);
    const bestData = getTimeBlockData(best.id);
    return currentData.hourlyRate > bestData.hourlyRate ? block : best;
  }, timeBlocks[0]);

  return (
    <View style={styles.container}>
      {/* Best Performance Highlight */}
      <View style={[styles.bestPerformanceCard, { borderLeftColor: bestTimeBlock.color }]}>
        <View style={styles.bestPerformanceHeader}>
          <Ionicons name={bestTimeBlock.icon} size={20} color={bestTimeBlock.color} />
          <Text style={styles.bestPerformanceTitle}>Best Earning Time</Text>
        </View>
        <Text style={styles.bestPerformanceName}>{bestTimeBlock.name}</Text>
        <Text style={styles.bestPerformanceRate}>
          {formatCurrency(getTimeBlockData(bestTimeBlock.id).hourlyRate)}/hour
        </Text>
        <Text style={styles.bestPerformanceSubtext}>
          {getTimeBlockData(bestTimeBlock.id).rides} rides • {formatCurrency(getTimeBlockData(bestTimeBlock.id).earnings)} earned
        </Text>
      </View>

      {/* Time Block Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Performance by Time Block</Text>
        
        {timeBlocks.map((block) => {
          const blockData = getTimeBlockData(block.id);
          const bidBlockData = getBidData(block.id);
          
          if (blockData.rides === 0 && bidBlockData.total === 0) {
            return null; // Don't show empty time blocks
          }

          return (
            <View key={block.id} style={styles.timeBlockCard}>
              <View style={styles.timeBlockHeader}>
                <View style={styles.timeBlockInfo}>
                  <Ionicons name={block.icon} size={18} color={block.color} />
                  <Text style={styles.timeBlockName}>{block.name}</Text>
                </View>
                <View style={styles.timeBlockStats}>
                  <Text style={styles.timeBlockEarnings}>
                    {formatCurrency(blockData.earnings)}
                  </Text>
                  <Text style={styles.timeBlockRides}>
                    {blockData.rides} rides
                  </Text>
                </View>
              </View>

              <View style={styles.timeBlockDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hourly Rate:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(blockData.hourlyRate)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Avg per Ride:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(blockData.averagePerRide)}
                  </Text>
                </View>

                {bidBlockData.total > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bid Success:</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: bidBlockData.successRate >= 70 ? COLORS.success[600] : 
                               bidBlockData.successRate >= 50 ? COLORS.warning[600] : COLORS.error[600] }
                    ]}>
                      {formatPercentage(bidBlockData.successRate)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Performance Bar */}
              <View style={styles.performanceBar}>
                <View 
                  style={[
                    styles.performanceBarFill,
                    { 
                      width: `${Math.min((blockData.hourlyRate / Math.max(getTimeBlockData(bestTimeBlock.id).hourlyRate, 1)) * 100, 100)}%`,
                      backgroundColor: block.color
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {timeBlocks.reduce((sum, block) => sum + getTimeBlockData(block.id).rides, 0)}
          </Text>
          <Text style={styles.summaryStatLabel}>Total Rides</Text>
        </View>
        
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {formatCurrency(timeBlocks.reduce((sum, block) => sum + getTimeBlockData(block.id).earnings, 0))}
          </Text>
          <Text style={styles.summaryStatLabel}>Total Earnings</Text>
        </View>
        
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {timeBlocks.filter(block => getTimeBlockData(block.id).rides > 0).length}
          </Text>
          <Text style={styles.summaryStatLabel}>Active Blocks</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  bestPerformanceCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  bestPerformanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bestPerformanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  bestPerformanceName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  bestPerformanceRate: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success[600],
    marginBottom: 4,
  },
  bestPerformanceSubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  timeBlockCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  timeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBlockName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  timeBlockStats: {
    alignItems: 'flex-end',
  },
  timeBlockEarnings: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success[600],
  },
  timeBlockRides: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  timeBlockDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  performanceBar: {
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  summaryStatLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
});

export default TimeBlockPerformance;
