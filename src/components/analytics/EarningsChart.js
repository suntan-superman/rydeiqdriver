import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/constants';

const { width: CHART_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const PADDING = 20;

const EarningsChart = ({ data, timeRange }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No earnings data available</Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const chartWidth = CHART_WIDTH - (PADDING * 2) - 40; // Account for container padding
  const chartHeight = CHART_HEIGHT - 60; // Account for labels

  // Find min and max values
  const maxEarnings = Math.max(...data.map(item => item.earnings));
  const minEarnings = Math.min(...data.map(item => item.earnings));
  const range = maxEarnings - minEarnings || 1;

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.earnings - minEarnings) / range) * chartHeight;
    return { x, y, earnings: item.earnings, date: item.date };
  });

  // Create path for the line
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Calculate total earnings for display
  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const averageEarnings = totalEarnings / data.length;

  return (
    <View style={styles.container}>
      {/* Chart Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.totalEarnings}>
            ${totalEarnings.toFixed(2)}
          </Text>
          <Text style={styles.totalLabel}>Total Earnings</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.averageEarnings}>
            ${averageEarnings.toFixed(2)}
          </Text>
          <Text style={styles.averageLabel}>Daily Average</Text>
        </View>
      </View>

      {/* Chart Area */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>${maxEarnings.toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>${(maxEarnings * 0.75).toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>${(maxEarnings * 0.5).toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>${(maxEarnings * 0.25).toFixed(0)}</Text>
          <Text style={styles.yAxisLabel}>${minEarnings.toFixed(0)}</Text>
        </View>

        {/* Chart */}
        <View style={styles.chart}>
          {/* Grid lines */}
          <View style={styles.gridContainer}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: ratio * chartHeight }
                ]}
              />
            ))}
          </View>

          {/* Data points and line */}
          <View style={styles.dataContainer}>
            {/* Line */}
            <View style={styles.lineContainer}>
              {points.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = points[index - 1];
                return (
                  <View
                    key={index}
                    style={[
                      styles.lineSegment,
                      {
                        left: prevPoint.x,
                        top: prevPoint.y,
                        width: Math.sqrt(
                          Math.pow(point.x - prevPoint.x, 2) + 
                          Math.pow(point.y - prevPoint.y, 2)
                        ),
                        transform: [{
                          rotate: `${Math.atan2(
                            point.y - prevPoint.y, 
                            point.x - prevPoint.x
                          )}rad`
                        }]
                      }
                    ]}
                  />
                );
              })}
            </View>

            {/* Data points */}
            {points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {data.map((item, index) => {
          if (data.length > 7 && index % Math.ceil(data.length / 5) !== 0) {
            return null;
          }
          const date = new Date(item.date);
          const label = timeRange === '7d' 
            ? date.toLocaleDateString('en-US', { weekday: 'short' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <Text key={index} style={styles.xAxisLabel}>
              {label}
            </Text>
          );
        })}
      </View>

      {/* Chart Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data.reduce((sum, item) => sum + item.rides, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.rides, 0) / data.length).toFixed(1) : 0}
          </Text>
          <Text style={styles.statLabel}>Avg Rides/Day</Text>
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
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  totalEarnings: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success[600],
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  averageEarnings: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  averageLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'right',
  },
  chart: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dataContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.primary[500],
    transformOrigin: '0 50%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary[600],
    borderWidth: 2,
    borderColor: 'white',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  xAxisLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
});

export default EarningsChart;
