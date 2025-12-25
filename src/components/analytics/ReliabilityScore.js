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

const ReliabilityScore = ({ data, trends }) => {
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return COLORS.success[600];
    if (score >= 80) return COLORS.warning[500];
    if (score >= 70) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return 'shield-checkmark';
    if (score >= 80) return 'shield';
    if (score >= 70) return 'shield-outline';
    return 'alert';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent reliability!';
    if (score >= 80) return 'Good reliability score';
    if (score >= 70) return 'Fair reliability, room for improvement';
    return 'Focus on improving reliability metrics';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return 'trending-up';
    if (trend < 0) return 'trending-down';
    return 'remove';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return COLORS.success[600];
    if (trend < 0) return COLORS.error[600];
    return COLORS.gray[500];
  };

  const currentScore = data.currentScore || 0;
  const acceptanceRate = data.acceptanceRate || 0;
  const cancellationRate = data.cancellationRate || 0;
  const onTimeArrival = data.ontimeArrival || 0;
  const bidHonoring = data.bidHonoring || 0;
  const totalRides = data.totalRides || 0;

  return (
    <View style={styles.container}>
      {/* Main Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Ionicons 
            name={getScoreIcon(currentScore)} 
            size={32} 
            color={getScoreColor(currentScore)} 
          />
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Reliability Score</Text>
            <Text style={styles.scoreMessage}>
              {getScoreMessage(currentScore)}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreValue}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(currentScore) }]}>
            {currentScore}
          </Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>

        {/* Score Progress Bar */}
        <View style={styles.scoreProgressContainer}>
          <View style={styles.scoreProgressBar}>
            <View 
              style={[
                styles.scoreProgressFill,
                { 
                  width: `${Math.min(currentScore, 100)}%`,
                  backgroundColor: getScoreColor(currentScore)
                }
              ]} 
            />
          </View>
          <View style={styles.scoreProgressLabels}>
            <Text style={styles.scoreProgressLabel}>0</Text>
            <Text style={styles.scoreProgressLabel}>50</Text>
            <Text style={styles.scoreProgressLabel}>100</Text>
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success[600]} />
            <Text style={styles.metricTitle}>Acceptance Rate</Text>
          </View>
          <Text style={styles.metricValue}>{formatPercentage(acceptanceRate)}</Text>
          {trends.acceptanceRate !== undefined && (
            <View style={styles.metricTrend}>
              <Ionicons 
                name={getTrendIcon(trends.acceptanceRate)} 
                size={14} 
                color={getTrendColor(trends.acceptanceRate)} 
              />
              <Text style={[styles.metricTrendText, { color: getTrendColor(trends.acceptanceRate) }]}>
                {Math.abs(trends.acceptanceRate).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="close-circle" size={20} color={COLORS.error[600]} />
            <Text style={styles.metricTitle}>Cancellation Rate</Text>
          </View>
          <Text style={styles.metricValue}>{formatPercentage(cancellationRate)}</Text>
          {trends.cancellationRate !== undefined && (
            <View style={styles.metricTrend}>
              <Ionicons 
                name={getTrendIcon(-trends.cancellationRate)} 
                size={14} 
                color={getTrendColor(-trends.cancellationRate)} 
              />
              <Text style={[styles.metricTrendText, { color: getTrendColor(-trends.cancellationRate) }]}>
                {Math.abs(trends.cancellationRate).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="time" size={20} color={COLORS.primary[600]} />
            <Text style={styles.metricTitle}>On-Time Arrival</Text>
          </View>
          <Text style={styles.metricValue}>{formatPercentage(onTimeArrival)}</Text>
          <Text style={styles.metricSubtext}>Punctuality</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="hand-left" size={20} color={COLORS.warning[600]} />
            <Text style={styles.metricTitle}>Bid Honoring</Text>
          </View>
          <Text style={styles.metricValue}>{formatPercentage(bidHonoring)}</Text>
          <Text style={styles.metricSubtext}>Commitment</Text>
        </View>
      </View>

      {/* Total Rides */}
      <View style={styles.totalRidesCard}>
        <View style={styles.totalRidesHeader}>
          <Ionicons name="car" size={24} color={COLORS.primary[600]} />
          <Text style={styles.totalRidesTitle}>Total Rides Completed</Text>
        </View>
        <Text style={styles.totalRidesValue}>{totalRides}</Text>
        <Text style={styles.totalRidesSubtext}>
          {totalRides > 0 ? 'Great job maintaining activity!' : 'Start completing rides to build your reliability score'}
        </Text>
      </View>

      {/* Improvement Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Improvement Tips</Text>
        
        {currentScore < 80 && (
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.tipText}>
              Accept more ride requests to improve your acceptance rate
            </Text>
          </View>
        )}

        {cancellationRate > 10 && (
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color={COLORS.error[600]} />
            <Text style={styles.tipText}>
              Reduce cancellations by planning your schedule better
            </Text>
          </View>
        )}

        {onTimeArrival < 90 && (
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color={COLORS.primary[600]} />
            <Text style={styles.tipText}>
              Leave earlier for pickups to improve on-time arrival rate
            </Text>
          </View>
        )}

        {bidHonoring < 95 && (
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.tipText}>
              Honor your accepted bids to maintain trust with riders
            </Text>
          </View>
        )}

        {currentScore >= 90 && (
          <View style={styles.tipItem}>
            <Ionicons name="star" size={16} color={COLORS.success[600]} />
            <Text style={styles.tipText}>
              Excellent reliability! Keep up the great work
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scoreCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  scoreMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  scoreValue: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  scoreProgressContainer: {
    marginTop: 8,
  },
  scoreProgressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreProgressLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  totalRidesCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  totalRidesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  totalRidesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  totalRidesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  totalRidesSubtext: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
});

export default ReliabilityScore;
