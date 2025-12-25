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

const MarketComparison = ({ data, driverEarnings }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!data || !data.marketAverages) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color={COLORS.gray[400]} />
        <Text style={styles.emptyText}>Market comparison data not available</Text>
        <Text style={styles.emptySubtext}>More data needed for accurate comparison</Text>
      </View>
    );
  }

  const { marketAverages, driverAverages, comparison, sampleSize } = data;
  const driverTotalEarnings = driverEarnings?.totalEarnings || 0;
  const driverTotalRides = driverEarnings?.totalRides || 0;
  const driverAvgPerRide = driverEarnings?.averageEarningsPerRide || 0;

  const marketAvgPerRide = marketAverages.averageEarnings || 0;
  const earningsVsMarket = comparison.earningsVsMarket || 1;
  const ridesVsMarket = comparison.ridesVsMarket || 1;

  const getPerformanceColor = (ratio) => {
    if (ratio >= 1.1) return COLORS.success[600];
    if (ratio >= 0.9) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getPerformanceIcon = (ratio) => {
    if (ratio >= 1.1) return 'trending-up';
    if (ratio >= 0.9) return 'remove';
    return 'trending-down';
  };

  const getPerformanceMessage = (ratio, type) => {
    if (type === 'earnings') {
      if (ratio >= 1.1) return 'Above market average';
      if (ratio >= 0.9) return 'Near market average';
      return 'Below market average';
    } else {
      if (ratio >= 1.1) return 'More active than average';
      if (ratio >= 0.9) return 'Average activity level';
      return 'Less active than average';
    }
  };

  return (
    <View style={styles.container}>
      {/* Market Overview */}
      <View style={styles.marketOverviewCard}>
        <View style={styles.marketOverviewHeader}>
          <Ionicons name="people" size={24} color={COLORS.primary[600]} />
          <Text style={styles.marketOverviewTitle}>Market Overview</Text>
        </View>
        <Text style={styles.marketOverviewSubtext}>
          Based on {sampleSize} rides in your area
        </Text>
      </View>

      {/* Performance Comparison */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.sectionTitle}>Your Performance vs Market</Text>
        
        {/* Earnings Comparison */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonTitle}>Earnings per Ride</Text>
              <Text style={styles.comparisonSubtitle}>
                {getPerformanceMessage(earningsVsMarket, 'earnings')}
              </Text>
            </View>
            <View style={styles.comparisonIcon}>
              <Ionicons 
                name={getPerformanceIcon(earningsVsMarket)} 
                size={24} 
                color={getPerformanceColor(earningsVsMarket)} 
              />
            </View>
          </View>
          
          <View style={styles.comparisonValues}>
            <View style={styles.comparisonValue}>
              <Text style={styles.comparisonValueLabel}>Your Average</Text>
              <Text style={[styles.comparisonValueAmount, { color: getPerformanceColor(earningsVsMarket) }]}>
                {formatCurrency(driverAvgPerRide)}
              </Text>
            </View>
            
            <View style={styles.comparisonValue}>
              <Text style={styles.comparisonValueLabel}>Market Average</Text>
              <Text style={styles.comparisonValueAmount}>
                {formatCurrency(marketAvgPerRide)}
              </Text>
            </View>
          </View>

          {/* Performance Bar */}
          <View style={styles.performanceBarContainer}>
            <View style={styles.performanceBar}>
              <View 
                style={[
                  styles.performanceBarFill,
                  { 
                    width: `${Math.min(earningsVsMarket * 50, 100)}%`,
                    backgroundColor: getPerformanceColor(earningsVsMarket)
                  }
                ]} 
              />
            </View>
            <View style={styles.performanceBarLabels}>
              <Text style={styles.performanceBarLabel}>0%</Text>
              <Text style={styles.performanceBarLabel}>100%</Text>
              <Text style={styles.performanceBarLabel}>200%</Text>
            </View>
          </View>

          <Text style={styles.performanceRatio}>
            {formatPercentage(earningsVsMarket)} of market average
          </Text>
        </View>

        {/* Activity Comparison */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonTitle}>Activity Level</Text>
              <Text style={styles.comparisonSubtitle}>
                {getPerformanceMessage(ridesVsMarket, 'activity')}
              </Text>
            </View>
            <View style={styles.comparisonIcon}>
              <Ionicons 
                name={getPerformanceIcon(ridesVsMarket)} 
                size={24} 
                color={getPerformanceColor(ridesVsMarket)} 
              />
            </View>
          </View>
          
          <View style={styles.comparisonValues}>
            <View style={styles.comparisonValue}>
              <Text style={styles.comparisonValueLabel}>Your Rides</Text>
              <Text style={[styles.comparisonValueAmount, { color: getPerformanceColor(ridesVsMarket) }]}>
                {driverTotalRides}
              </Text>
            </View>
            
            <View style={styles.comparisonValue}>
              <Text style={styles.comparisonValueLabel}>Market Sample</Text>
              <Text style={styles.comparisonValueAmount}>
                {sampleSize}
              </Text>
            </View>
          </View>

          <Text style={styles.performanceRatio}>
            {formatPercentage(ridesVsMarket)} of market activity
          </Text>
        </View>
      </View>

      {/* Market Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Market Insights</Text>
        
        {earningsVsMarket >= 1.1 && (
          <View style={styles.insightItem}>
            <Ionicons name="star" size={16} color={COLORS.success[600]} />
            <Text style={styles.insightText}>
              You're earning above market average! Your pricing strategy is working well.
            </Text>
          </View>
        )}

        {earningsVsMarket < 0.9 && (
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.insightText}>
              Consider reviewing your rate settings to match market conditions.
            </Text>
          </View>
        )}

        {ridesVsMarket >= 1.1 && (
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color={COLORS.success[600]} />
            <Text style={styles.insightText}>
              You're more active than the average driver in your area.
            </Text>
          </View>
        )}

        {ridesVsMarket < 0.9 && (
          <View style={styles.insightItem}>
            <Ionicons name="time" size={16} color={COLORS.warning[600]} />
            <Text style={styles.insightText}>
              Consider increasing your availability to match market activity.
            </Text>
          </View>
        )}

        <View style={styles.insightItem}>
          <Ionicons name="information-circle" size={16} color={COLORS.info[600]} />
          <Text style={styles.insightText}>
            Market data is based on recent rides in your service area.
          </Text>
        </View>
      </View>

      {/* Competitive Position */}
      <View style={styles.positionContainer}>
        <Text style={styles.positionTitle}>Your Competitive Position</Text>
        
        <View style={styles.positionCard}>
          <View style={styles.positionHeader}>
            <Ionicons name="trophy" size={20} color={COLORS.warning[600]} />
            <Text style={styles.positionLabel}>Earnings Performance</Text>
          </View>
          <Text style={[styles.positionValue, { color: getPerformanceColor(earningsVsMarket) }]}>
            {earningsVsMarket >= 1.1 ? 'Above Average' : 
             earningsVsMarket >= 0.9 ? 'Average' : 'Below Average'}
          </Text>
        </View>

        <View style={styles.positionCard}>
          <View style={styles.positionHeader}>
            <Ionicons name="pulse" size={20} color={COLORS.primary[600]} />
            <Text style={styles.positionLabel}>Activity Level</Text>
          </View>
          <Text style={[styles.positionValue, { color: getPerformanceColor(ridesVsMarket) }]}>
            {ridesVsMarket >= 1.1 ? 'High Activity' : 
             ridesVsMarket >= 0.9 ? 'Average Activity' : 'Low Activity'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  marketOverviewCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  marketOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  marketOverviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  marketOverviewSubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  comparisonContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonInfo: {
    flex: 1,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  comparisonIcon: {
    padding: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonValue: {
    alignItems: 'center',
  },
  comparisonValueLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  comparisonValueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  performanceBarContainer: {
    marginBottom: 8,
  },
  performanceBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceBarLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  performanceRatio: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  positionContainer: {
    marginBottom: 16,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  positionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  positionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  positionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MarketComparison;
