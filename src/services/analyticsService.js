import { db } from './firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class AnalyticsService {
  constructor() {
    this.db = db;
  }

  /**
   * Get comprehensive driver analytics
   * @param {string} driverId - Driver's user ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getDriverAnalytics(driverId, options = {}) {
    try {
      const {
        timeRange = '30d', // '7d', '30d', '90d', '1y'
        includePredictions = true,
        includeMarketComparison = true
      } = options;

      const dateRange = this.getDateRange(timeRange);
      
      // Fetch all analytics data in parallel
      const [
        earningsData,
        bidData,
        reliabilityData,
        marketData,
        performanceData
      ] = await Promise.all([
        this.getEarningsAnalytics(driverId, dateRange),
        this.getBidAnalytics(driverId, dateRange),
        this.getReliabilityAnalytics(driverId),
        includeMarketComparison ? this.getMarketComparisonData(driverId, dateRange) : null,
        this.getPerformanceAnalytics(driverId, dateRange)
      ]);

      // Calculate insights and recommendations
      const insights = this.calculateInsights(earningsData, bidData, reliabilityData, performanceData);
      const recommendations = includePredictions ? 
        this.generateRecommendations(earningsData, bidData, marketData) : [];

      return {
        earnings: earningsData,
        bidding: bidData,
        reliability: reliabilityData,
        performance: performanceData,
        market: marketData,
        insights,
        recommendations,
        timeRange,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting driver analytics:', error);
      throw error;
    }
  }

  /**
   * Get earnings analytics by time blocks
   * @param {string} driverId - Driver's user ID
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} Earnings analytics
   */
  async getEarningsAnalytics(driverId, dateRange) {
    try {
      // Validate inputs
      if (!driverId || !dateRange || !dateRange.start || !dateRange.end) {
        console.warn('Invalid parameters for earnings analytics');
        return {
          totalEarnings: 0,
          averagePerRide: 0,
          rideCount: 0,
          timeBlockEarnings: {},
          dailyEarnings: [],
          weeklyEarnings: [],
          bidAmountAnalysis: { acceptedAverage: 0, rejectedAverage: 0 }
        };
      }

      // Get completed rides in date range
      const ridesQuery = query(
        collection(this.db, 'activeRides'),
        where('driverId', '==', driverId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', dateRange.start),
        where('completedAt', '<=', dateRange.end),
        orderBy('completedAt', 'desc')
      );

      const ridesSnapshot = await getDocs(ridesQuery);
      const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate earnings by time blocks
      const timeBlockEarnings = this.calculateTimeBlockEarnings(rides);
      
      // Calculate daily earnings
      const dailyEarnings = this.calculateDailyEarnings(rides);
      
      // Calculate weekly earnings
      const weeklyEarnings = this.calculateWeeklyEarnings(rides);

      // Calculate totals
      const totalEarnings = rides.reduce((sum, ride) => sum + (ride.bidAmount || 0), 0);
      const totalRides = rides.length;
      const averageEarningsPerRide = totalRides > 0 ? totalEarnings / totalRides : 0;

      return {
        totalEarnings,
        totalRides,
        averageEarningsPerRide,
        timeBlockEarnings,
        dailyEarnings,
        weeklyEarnings,
        rides: rides.slice(0, 10) // Last 10 rides for detailed view
      };
    } catch (error) {
      console.error('Error getting earnings analytics:', error);
      return {
        totalEarnings: 0,
        totalRides: 0,
        averageEarningsPerRide: 0,
        timeBlockEarnings: {},
        dailyEarnings: [],
        weeklyEarnings: [],
        rides: []
      };
    }
  }

  /**
   * Get bid analytics and success rates
   * @param {string} driverId - Driver's user ID
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} Bid analytics
   */
  async getBidAnalytics(driverId, dateRange) {
    try {
      // Validate inputs
      if (!driverId || !dateRange || !dateRange.start || !dateRange.end) {
        console.warn('Invalid parameters for bid analytics');
        return {
          totalBids: 0,
          acceptedBids: 0,
          successRate: 0,
          timeBlockPerformance: {},
          bidAmountAnalysis: {},
          recentBids: []
        };
      }

      // Get all bids submitted in date range
      const bidsQuery = query(
        collection(this.db, 'rideRequests'),
        where('driverBids', 'array-contains-any', [{ driverId }]),
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end),
        orderBy('createdAt', 'desc')
      );

      const bidsSnapshot = await getDocs(bidsQuery);
      const allBids = [];
      
      bidsSnapshot.docs.forEach(doc => {
        const rideRequest = doc.data();
        const driverBids = rideRequest.driverBids || [];
        const driverBid = driverBids.find(bid => bid.driverId === driverId);
        
        if (driverBid) {
          allBids.push({
            rideRequestId: doc.id,
            bidAmount: driverBid.bidAmount,
            bidType: driverBid.bidType,
            submittedAt: driverBid.submittedAt,
            wasAccepted: rideRequest.acceptedDriver?.driverId === driverId,
            rideRequest: rideRequest
          });
        }
      });

      // Calculate success rates
      const totalBids = allBids.length;
      const acceptedBids = allBids.filter(bid => bid.wasAccepted).length;
      const successRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;

      // Calculate bid performance by time blocks
      const timeBlockPerformance = this.calculateBidPerformanceByTimeBlocks(allBids);

      // Calculate bid amount analysis
      const bidAmountAnalysis = this.calculateBidAmountAnalysis(allBids);

      return {
        totalBids,
        acceptedBids,
        successRate,
        timeBlockPerformance,
        bidAmountAnalysis,
        recentBids: allBids.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting bid analytics:', error);
      return {
        totalBids: 0,
        acceptedBids: 0,
        successRate: 0,
        timeBlockPerformance: {},
        bidAmountAnalysis: {},
        recentBids: []
      };
    }
  }

  /**
   * Get reliability analytics
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object>} Reliability analytics
   */
  async getReliabilityAnalytics(driverId) {
    try {
      // Validate input
      if (!driverId) {
        console.warn('Invalid driverId for reliability analytics');
        return {
          currentScore: 0,
          acceptanceRate: 0,
          cancellationRate: 0,
          onTimeArrival: 0,
          bidHonoring: 0,
          totalRides: 0,
          trends: {},
          dailyMetrics: []
        };
      }

      // Get reliability score
      const scoreDoc = await getDoc(doc(this.db, 'driver_reliability_scores', driverId));
      const scoreData = scoreDoc.exists() ? scoreDoc.data() : null;

      // Get recent metrics
      const metricsQuery = query(
        collection(this.db, 'driver_metrics_daily'),
        where('driver_id', '==', driverId),
        orderBy('date', 'desc'),
        limit(30)
      );

      const metricsSnapshot = await getDocs(metricsQuery);
      const dailyMetrics = metricsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate trends
      const trends = dailyMetrics && dailyMetrics.length > 0 ? this.calculateReliabilityTrends(dailyMetrics) : {};

      return {
        currentScore: scoreData?.score || 0,
        acceptanceRate: scoreData?.acceptance_rate || 0,
        cancellationRate: scoreData?.cancellation_rate || 0,
        onTimeArrival: scoreData?.ontime_arrival || 0,
        bidHonoring: scoreData?.bid_honoring || 0,
        totalRides: scoreData?.total_rides || 0,
        trends,
        dailyMetrics: dailyMetrics.slice(0, 7) // Last 7 days
      };
    } catch (error) {
      console.error('Error getting reliability analytics:', error);
      return {
        currentScore: 0,
        acceptanceRate: 0,
        cancellationRate: 0,
        onTimeArrival: 0,
        bidHonoring: 0,
        totalRides: 0,
        trends: {},
        dailyMetrics: []
      };
    }
  }

  /**
   * Get market comparison data
   * @param {string} driverId - Driver's user ID
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} Market comparison data
   */
  async getMarketComparisonData(driverId, dateRange) {
    try {
      // Validate inputs
      if (!driverId || !dateRange || !dateRange.start || !dateRange.end) {
        console.warn('Invalid parameters for market comparison');
        return {
          marketAverages: { averageEarnings: 0, averageRides: 0 },
          comparison: { earningsVsMarket: 1, ridesVsMarket: 1 },
          percentile: 50
        };
      }

      // Get market averages (this would typically come from aggregated data)
      // For now, we'll calculate from available data
      const marketQuery = query(
        collection(this.db, 'activeRides'),
        where('status', '==', 'completed'),
        where('completedAt', '>=', dateRange.start),
        where('completedAt', '<=', dateRange.end),
        limit(1000) // Sample size for market data
      );

      const marketSnapshot = await getDocs(marketQuery);
      const marketRides = marketSnapshot.docs.map(doc => doc.data());

      // Calculate market averages
      const marketAverages = this.calculateMarketAverages(marketRides);

      // Get driver's performance for comparison
      const driverRides = marketRides.filter(ride => ride.driverId === driverId);
      const driverAverages = this.calculateMarketAverages(driverRides);

      return {
        marketAverages,
        driverAverages,
        comparison: this.compareWithMarket(driverAverages, marketAverages),
        sampleSize: marketRides.length
      };
    } catch (error) {
      console.error('Error getting market comparison data:', error);
      return null;
    }
  }

  /**
   * Get performance analytics
   * @param {string} driverId - Driver's user ID
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} Performance analytics
   */
  async getPerformanceAnalytics(driverId, dateRange) {
    try {
      // Validate inputs
      if (!driverId || !dateRange || !dateRange.start || !dateRange.end) {
        console.warn('Invalid parameters for performance analytics');
        return {
          trends: {},
          efficiency: {},
          dailyMetrics: []
        };
      }

      // Get performance metrics
      const metricsQuery = query(
        collection(this.db, 'driver_metrics_daily'),
        where('driver_id', '==', driverId),
        where('date', '>=', dateRange.start.toISOString().split('T')[0]),
        where('date', '<=', dateRange.end.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );

      const metricsSnapshot = await getDocs(metricsQuery);
      const metrics = metricsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate performance trends
      const trends = metrics && metrics.length > 0 ? this.calculatePerformanceTrends(metrics) : {};

      // Calculate efficiency metrics
      const efficiency = metrics && metrics.length > 0 ? this.calculateEfficiencyMetrics(metrics) : {};

      return {
        trends,
        efficiency,
        dailyMetrics: metrics
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      return {
        trends: {},
        efficiency: {},
        dailyMetrics: []
      };
    }
  }

  /**
   * Calculate earnings by time blocks
   * @param {Array} rides - Array of completed rides
   * @returns {Object} Time block earnings
   */
  calculateTimeBlockEarnings(rides) {
    const timeBlocks = {
      morning_rush: { earnings: 0, rides: 0, hours: 0 },
      lunch_rush: { earnings: 0, rides: 0, hours: 0 },
      evening_rush: { earnings: 0, rides: 0, hours: 0 },
      late_night: { earnings: 0, rides: 0, hours: 0 },
      default: { earnings: 0, rides: 0, hours: 0 }
    };

    rides.forEach(ride => {
      const completedAt = ride.completedAt?.toDate() || new Date();
      const hour = completedAt.getHours();
      const minutes = completedAt.getMinutes();
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const timeBlock = this.getTimeBlockForTime(timeString);
      const earnings = ride.bidAmount || 0;
      
      timeBlocks[timeBlock].earnings += earnings;
      timeBlocks[timeBlock].rides += 1;
    });

    // Calculate hourly rates
    Object.keys(timeBlocks).forEach(block => {
      if (timeBlocks[block].rides > 0) {
        timeBlocks[block].averagePerRide = timeBlocks[block].earnings / timeBlocks[block].rides;
        timeBlocks[block].hourlyRate = timeBlocks[block].earnings / Math.max(timeBlocks[block].rides * 0.5, 1); // Estimate 30 min per ride
      }
    });

    return timeBlocks;
  }

  /**
   * Calculate daily earnings
   * @param {Array} rides - Array of completed rides
   * @returns {Array} Daily earnings data
   */
  calculateDailyEarnings(rides) {
    const dailyMap = {};
    
    rides.forEach(ride => {
      const date = ride.completedAt?.toDate() || new Date();
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, earnings: 0, rides: 0 };
      }
      
      dailyMap[dateKey].earnings += ride.bidAmount || 0;
      dailyMap[dateKey].rides += 1;
    });

    return Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Calculate weekly earnings
   * @param {Array} rides - Array of completed rides
   * @returns {Array} Weekly earnings data
   */
  calculateWeeklyEarnings(rides) {
    const weeklyMap = {};
    
    rides.forEach(ride => {
      const date = ride.completedAt?.toDate() || new Date();
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { weekStart: weekKey, earnings: 0, rides: 0 };
      }
      
      weeklyMap[weekKey].earnings += ride.bidAmount || 0;
      weeklyMap[weekKey].rides += 1;
    });

    return Object.values(weeklyMap).sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
  }

  /**
   * Calculate bid performance by time blocks
   * @param {Array} bids - Array of bid data
   * @returns {Object} Time block performance
   */
  calculateBidPerformanceByTimeBlocks(bids) {
    const timeBlocks = {
      morning_rush: { total: 0, accepted: 0, successRate: 0 },
      lunch_rush: { total: 0, accepted: 0, successRate: 0 },
      evening_rush: { total: 0, accepted: 0, successRate: 0 },
      late_night: { total: 0, accepted: 0, successRate: 0 },
      default: { total: 0, accepted: 0, successRate: 0 }
    };

    bids.forEach(bid => {
      const submittedAt = bid.submittedAt?.toDate() || new Date();
      const hour = submittedAt.getHours();
      const minutes = submittedAt.getMinutes();
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const timeBlock = this.getTimeBlockForTime(timeString);
      
      timeBlocks[timeBlock].total += 1;
      if (bid.wasAccepted) {
        timeBlocks[timeBlock].accepted += 1;
      }
    });

    // Calculate success rates
    Object.keys(timeBlocks).forEach(block => {
      if (timeBlocks[block].total > 0) {
        timeBlocks[block].successRate = (timeBlocks[block].accepted / timeBlocks[block].total) * 100;
      }
    });

    return timeBlocks;
  }

  /**
   * Calculate bid amount analysis
   * @param {Array} bids - Array of bid data
   * @returns {Object} Bid amount analysis
   */
  calculateBidAmountAnalysis(bids) {
    if (bids.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        acceptedAverage: 0,
        rejectedAverage: 0
      };
    }

    const amounts = bids.map(bid => bid.bidAmount);
    const acceptedAmounts = bids.filter(bid => bid.wasAccepted).map(bid => bid.bidAmount);
    const rejectedAmounts = bids.filter(bid => !bid.wasAccepted).map(bid => bid.bidAmount);

    return {
      average: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      median: this.calculateMedian(amounts),
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      acceptedAverage: acceptedAmounts.length > 0 ? 
        acceptedAmounts.reduce((sum, amount) => sum + amount, 0) / acceptedAmounts.length : 0,
      rejectedAverage: rejectedAmounts.length > 0 ? 
        rejectedAmounts.reduce((sum, amount) => sum + amount, 0) / rejectedAmounts.length : 0
    };
  }

  /**
   * Calculate insights from analytics data
   * @param {Object} earningsData - Earnings analytics
   * @param {Object} bidData - Bid analytics
   * @param {Object} reliabilityData - Reliability analytics
   * @param {Object} performanceData - Performance analytics
   * @returns {Object} Insights
   */
  calculateInsights(earningsData, bidData, reliabilityData, performanceData) {
    const insights = [];

    // Earnings insights
    if (earningsData.timeBlockEarnings) {
      const bestTimeBlock = Object.keys(earningsData.timeBlockEarnings).reduce((best, block) => {
        const current = earningsData.timeBlockEarnings[block];
        const bestData = earningsData.timeBlockEarnings[best];
        return current.hourlyRate > bestData.hourlyRate ? block : best;
      }, 'default');

      if (bestTimeBlock !== 'default') {
        insights.push({
          type: 'earnings',
          title: 'Best Earning Time',
          message: `You earn the most during ${this.getTimeBlockName(bestTimeBlock)}`,
          value: `$${earningsData.timeBlockEarnings[bestTimeBlock].hourlyRate.toFixed(2)}/hour`,
          recommendation: 'Consider focusing on this time period for maximum earnings'
        });
      }
    }

    // Bid success insights
    if (bidData.successRate < 50) {
      insights.push({
        type: 'bidding',
        title: 'Low Bid Success Rate',
        message: `Your bid success rate is ${bidData.successRate.toFixed(1)}%`,
        value: `${bidData.acceptedBids}/${bidData.totalBids} bids accepted`,
        recommendation: 'Consider adjusting your bidding strategy or rate settings'
      });
    } else if (bidData.successRate > 80) {
      insights.push({
        type: 'bidding',
        title: 'High Bid Success Rate',
        message: `Excellent! Your bid success rate is ${bidData.successRate.toFixed(1)}%`,
        value: `${bidData.acceptedBids}/${bidData.totalBids} bids accepted`,
        recommendation: 'You might be able to increase your rates slightly'
      });
    }

    // Reliability insights
    if (reliabilityData.currentScore < 70) {
      insights.push({
        type: 'reliability',
        title: 'Reliability Score',
        message: `Your reliability score is ${reliabilityData.currentScore}`,
        value: `${reliabilityData.acceptanceRate}% acceptance rate`,
        recommendation: 'Focus on accepting more rides and reducing cancellations'
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on analytics
   * @param {Object} earningsData - Earnings analytics
   * @param {Object} bidData - Bid analytics
   * @param {Object} marketData - Market comparison data
   * @returns {Array} Recommendations
   */
  generateRecommendations(earningsData, bidData, marketData) {
    const recommendations = [];

    // Time-based recommendations
    if (earningsData.timeBlockEarnings) {
      const timeBlocks = earningsData.timeBlockEarnings;
      const sortedBlocks = Object.keys(timeBlocks).sort((a, b) => 
        timeBlocks[b].hourlyRate - timeBlocks[a].hourlyRate
      );

      recommendations.push({
        type: 'schedule',
        priority: 'high',
        title: 'Optimize Your Schedule',
        description: `Focus on ${this.getTimeBlockName(sortedBlocks[0])} for maximum earnings`,
        impact: 'Increase hourly earnings by 15-25%',
        action: 'Adjust your availability to prioritize high-earning time blocks'
      });
    }

    // Bidding recommendations
    if (bidData.bidAmountAnalysis) {
      const analysis = bidData.bidAmountAnalysis;
      if (analysis.acceptedAverage > analysis.rejectedAverage) {
        recommendations.push({
          type: 'pricing',
          priority: 'medium',
          title: 'Optimize Your Bidding',
          description: 'Your accepted bids are higher than rejected ones',
          impact: 'Maintain current pricing strategy',
          action: 'Continue with your current rate settings'
        });
      }
    }

    // Market comparison recommendations
    if (marketData && marketData.comparison) {
      const comparison = marketData.comparison;
      if (comparison.earningsVsMarket < 0.9) {
        recommendations.push({
          type: 'market',
          priority: 'high',
          title: 'Below Market Earnings',
          description: 'Your earnings are below market average',
          impact: 'Increase earnings by 10-20%',
          action: 'Review and adjust your rate settings'
        });
      }
    }

    return recommendations;
  }

  // Helper methods
  getDateRange(timeRange) {
  const now = new Date();
    const start = new Date();
    
  switch (timeRange) {
    case '7d':
        start.setDate(now.getDate() - 7);
        break;
    case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        break;
    default:
        start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
  }

  getTimeBlockForTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Morning rush: 06:00-09:00
    if (timeInMinutes >= 360 && timeInMinutes <= 540) return 'morning_rush';
    // Lunch rush: 11:30-13:00
    if (timeInMinutes >= 690 && timeInMinutes <= 780) return 'lunch_rush';
    // Evening rush: 16:00-18:00
    if (timeInMinutes >= 960 && timeInMinutes <= 1080) return 'evening_rush';
    // Late night: 01:00-03:00
    if (timeInMinutes >= 60 && timeInMinutes <= 180) return 'late_night';
    
    return 'default';
  }

  getTimeBlockName(timeBlock) {
    const names = {
      morning_rush: 'Morning Rush (6-9 AM)',
      lunch_rush: 'Lunch Rush (11:30 AM-1 PM)',
      evening_rush: 'Evening Rush (4-6 PM)',
      late_night: 'Late Night (1-3 AM)',
      default: 'Standard Hours'
    };
    return names[timeBlock] || 'Standard Hours';
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[middle - 1] + sorted[middle]) / 2 : 
      sorted[middle];
  }

  getWeekStart(date) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  calculateMarketAverages(rides) {
    if (rides.length === 0) {
      return { averageEarnings: 0, averageRides: 0 };
    }

    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.bidAmount || 0), 0);
    return {
      averageEarnings: totalEarnings / rides.length,
      averageRides: rides.length
    };
  }

  compareWithMarket(driverAverages, marketAverages) {
    if (!marketAverages || marketAverages.averageEarnings === 0) {
      return { earningsVsMarket: 1, ridesVsMarket: 1 };
    }

    return {
      earningsVsMarket: driverAverages.averageEarnings / marketAverages.averageEarnings,
      ridesVsMarket: driverAverages.averageRides / marketAverages.averageRides
    };
  }

  calculateReliabilityTrends(dailyMetrics) {
    if (dailyMetrics.length < 2) {
      return { acceptanceRate: 0, cancellationRate: 0 };
    }

    const recent = dailyMetrics.slice(0, 7);
    const older = dailyMetrics.slice(7, 14);

    const recentAvg = this.calculateAverageMetrics(recent);
    const olderAvg = this.calculateAverageMetrics(older);

    return {
      acceptanceRate: recentAvg.acceptanceRate - olderAvg.acceptanceRate,
      cancellationRate: recentAvg.cancellationRate - olderAvg.cancellationRate
    };
  }

  calculateAverageMetrics(metrics) {
    if (metrics.length === 0) {
      return { acceptanceRate: 0, cancellationRate: 0 };
    }

    const total = metrics.reduce((sum, metric) => ({
      accepted: sum.accepted + metric.accepted,
      awarded: sum.awarded + metric.awarded,
      cancels: sum.cancels + metric.cancels
    }), { accepted: 0, awarded: 0, cancels: 0 });

    return {
      acceptanceRate: total.awarded > 0 ? (total.accepted / total.awarded) * 100 : 0,
      cancellationRate: total.accepted > 0 ? (total.cancels / total.accepted) * 100 : 0
    };
  }

  calculatePerformanceTrends(metrics) {
    if (metrics.length < 2) {
      return { rides: 0, earnings: 0 };
    }

    const recent = metrics.slice(0, 7);
    const older = metrics.slice(7, 14);

    const recentTotal = recent.reduce((sum, metric) => sum + metric.accepted, 0);
    const olderTotal = older.reduce((sum, metric) => sum + metric.accepted, 0);

    return {
      rides: recentTotal - olderTotal,
      earnings: 0 // Would need earnings data to calculate
    };
  }

  calculateEfficiencyMetrics(metrics) {
    if (metrics.length === 0) {
      return { ridesPerDay: 0, acceptanceRate: 0 };
    }

    const totalRides = metrics.reduce((sum, metric) => sum + metric.accepted, 0);
    const totalAwarded = metrics.reduce((sum, metric) => sum + metric.awarded, 0);

    return {
      ridesPerDay: totalRides / metrics.length,
      acceptanceRate: totalAwarded > 0 ? (totalRides / totalAwarded) * 100 : 0
    };
  }
}

// Export singleton instance
export default new AnalyticsService();