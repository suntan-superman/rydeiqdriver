import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '7d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '7d':
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

class DriverToolsService {
  async getDriverToolsDashboard(driverId, timeRange = '7d') {
    // Profile
    const profile = await this.getDriverProfile(driverId);
    // Performance
    const performance = await this.getDriverPerformance(driverId, timeRange);
    // Earnings
    const earnings = await this.getEarningsOptimization(driverId, timeRange);
    // Coaching
    const coaching = await this.getPerformanceCoaching(driverId, timeRange);
    // Maintenance
    const maintenance = await this.getVehicleMaintenance(driverId);
    // Fuel
    const fuel = await this.getFuelOptimization(driverId);
    // Taxes
    const taxes = await this.getTaxPreparation(driverId, timeRange);
    // Analytics (reuse performance for now)
    const analytics = performance;
    // Gamification (stub)
    const gamification = { achievements: [], points: 0, challenges: [] };
    // Recommendations (stub)
    const recommendations = { daily: [], weekly: [], monthly: [] };
    return {
      profile,
      performance,
      earnings,
      coaching,
      maintenance,
      fuel,
      taxes,
      analytics,
      gamification,
      recommendations,
      timestamp: Date.now()
    };
  }

  async getDriverProfile(driverId) {
    const driverDoc = await getDoc(doc(db, 'users', driverId));
    if (!driverDoc.exists()) return {};
    const driver = driverDoc.data();
    return {
      id: driverDoc.id,
      name: driver.displayName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
      email: driver.email,
      phone: driver.phoneNumber,
      rating: driver.rating || 0,
      totalRides: driver.totalRides || 0,
      memberSince: driver.createdAt,
      status: driver.isActive ? 'Active' : 'Inactive',
      vehicle: driver.vehicle || {},
      documents: driver.documents || {},
      preferences: driver.preferences || {}
    };
  }

  async getDriverPerformance(driverId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const ridesRef = collection(db, 'rideRequests');
    const ridesQuery = query(
      ridesRef,
      where('driverId', '==', driverId),
      where('createdAt', '>=', timeFilter),
      orderBy('createdAt', 'desc')
    );
    const ridesSnapshot = await getDocs(ridesQuery);
    const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalRides = rides.length;
    const completedRides = rides.filter(ride => ride.status === 'completed').length;
    const cancelledRides = rides.filter(ride => ride.status === 'cancelled').length;
    const completionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;
    const ratedRides = rides.filter(ride => ride.riderRating);
    const averageRating = ratedRides.length > 0 
      ? ratedRides.reduce((sum, ride) => sum + ride.riderRating, 0) / ratedRides.length 
      : 0;
    const totalEarnings = rides.reduce((sum, ride) => {
      if (ride.status === 'completed' && ride.fare) {
        const commission = ride.commission || 0.15;
        return sum + (ride.fare * (1 - commission));
      }
      return sum;
    }, 0);
    return {
      overview: {
        totalRides,
        completedRides,
        cancelledRides,
        completionRate: Math.round(completionRate * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        averageEarningsPerRide: totalRides > 0 ? Math.round((totalEarnings / totalRides) * 100) / 100 : 0
      }
    };
  }

  async getEarningsOptimization(driverId, timeRange) {
    // For now, reuse performance earnings
    const perf = await this.getDriverPerformance(driverId, timeRange);
    return {
      analysis: perf.overview,
      recommendations: [],
      optimalTimes: [],
      optimalAreas: [],
      projections: {},
      strategies: []
    };
  }

  async getPerformanceCoaching(driverId, timeRange) {
    // Stub: return empty coaching
    return {
      insights: [],
      tips: [],
      improvementPlan: {},
      progress: {},
      goals: {}
    };
  }

  async getVehicleMaintenance(driverId) {
    // Stub: return empty maintenance
    return {
      make: '',
      model: '',
      year: '',
      mileage: 0,
      lastService: null,
      nextService: null,
      alerts: [],
      recommendations: []
    };
  }

  async getFuelOptimization(driverId) {
    // Stub: return empty fuel optimization
    return {
      efficiency: null,
      prices: null,
      recommendations: [],
      savings: null,
      routes: []
    };
  }

  async getTaxPreparation(driverId, timeRange) {
    // Stub: return empty tax preparation
    return {
      summary: {},
      report: {},
      expenses: {},
      deductions: {},
      estimatedTax: {},
      documents: []
    };
  }
}

export const driverToolsService = new DriverToolsService();
export default driverToolsService; 