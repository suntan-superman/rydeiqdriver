import { db } from './firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Helper to get time range filter
function getTimeRangeFilter(timeRange = '24h') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '24h':
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

class AnalyticsService {
  // Get driver analytics for a time range
  async getDriverAnalytics(timeRange = '24h') {
    const timeFilter = getTimeRangeFilter(timeRange);
    // Get all drivers
    const driversRef = collection(db, 'users');
    const driversQuery = query(driversRef, where('role', '==', 'driver'), orderBy('createdAt', 'desc'));
    const driversSnapshot = await getDocs(driversQuery);
    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Get all rides in time range
    const ridesRef = collection(db, 'rideRequests');
    const ridesQuery = query(ridesRef, where('createdAt', '>=', timeFilter), orderBy('createdAt', 'desc'));
    const ridesSnapshot = await getDocs(ridesQuery);
    const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Calculate metrics
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(driver => driver.isActive).length;
    const newDrivers = drivers.filter(driver => {
      const createdAt = driver.createdAt?.toDate ? driver.createdAt.toDate() : new Date(driver.createdAt);
      return createdAt >= timeFilter;
    }).length;
    const driversWithRating = drivers.filter(driver => driver.rating);
    const averageRating = driversWithRating.length > 0
      ? driversWithRating.reduce((sum, driver) => sum + driver.rating, 0) / driversWithRating.length
      : 0;
    // Earnings
    const driverRides = rides.filter(ride => ride.driverId);
    const totalEarnings = driverRides.reduce((sum, ride) => {
      const fare = ride.fare || 0;
      const commission = ride.commission || 0.15;
      return sum + (fare * (1 - commission));
    }, 0);
    const averageEarnings = driverRides.length > 0 ? totalEarnings / driverRides.length : 0;
    return {
      overview: {
        totalDrivers,
        activeDrivers,
        newDrivers,
        averageRating: Math.round(averageRating * 100) / 100,
        averageEarnings: Math.round(averageEarnings * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100
      },
      // Add more analytics as needed
    };
  }

  // Get platform analytics for a time range
  async getPlatformAnalytics(timeRange = '24h') {
    const timeFilter = getTimeRangeFilter(timeRange);
    const ridesRef = collection(db, 'rideRequests');
    const ridesQuery = query(ridesRef, where('createdAt', '>=', timeFilter), orderBy('createdAt', 'desc'));
    const ridesSnapshot = await getDocs(ridesQuery);
    const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalRides = rides.length;
    const completedRides = rides.filter(ride => ride.status === 'completed').length;
    const activeRides = rides.filter(ride => ['accepted', 'in_progress'].includes(ride.status)).length;
    const cancelledRides = rides.filter(ride => ride.status === 'cancelled').length;
    const completionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;
    return {
      overview: {
        totalRides,
        completedRides,
        activeRides,
        cancelledRides,
        completionRate: Math.round(completionRate * 100) / 100
      },
      // Add more analytics as needed
    };
  }

  // Get revenue analytics for a time range
  async getRevenueAnalytics(timeRange = '24h') {
    const timeFilter = getTimeRangeFilter(timeRange);
    const ridesRef = collection(db, 'rideRequests');
    const ridesQuery = query(ridesRef, where('status', '==', 'completed'), where('createdAt', '>=', timeFilter), orderBy('createdAt', 'desc'));
    const ridesSnapshot = await getDocs(ridesQuery);
    const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalRevenue = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const platformRevenue = rides.reduce((sum, ride) => {
      const commission = ride.commission || 0.15;
      return sum + ((ride.fare || 0) * commission);
    }, 0);
    const driverRevenue = totalRevenue - platformRevenue;
    const averageFare = rides.length > 0 ? totalRevenue / rides.length : 0;
    return {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformRevenue: Math.round(platformRevenue * 100) / 100,
        driverRevenue: Math.round(driverRevenue * 100) / 100,
        averageFare: Math.round(averageFare * 100) / 100,
        totalRides: rides.length,
        revenuePerRide: Math.round((totalRevenue / rides.length) * 100) / 100
      },
      // Add more analytics as needed
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 