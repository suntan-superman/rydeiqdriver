import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class SustainabilityService {
  async getSustainabilityDashboard(userId = null, timeRange = '30d') {
    // Carbon footprint
    const carbonFootprint = await this.getCarbonFootprint(userId, timeRange);
    // Green initiatives
    const greenInitiatives = await this.getGreenInitiatives(userId, timeRange);
    // Eco-friendly drivers
    const ecoDrivers = await this.getEcoFriendlyDrivers(timeRange);
    // Analytics (stub)
    const analytics = {};
    // Carbon offset programs (stub)
    const carbonOffsets = {};
    // Environmental impact (stub)
    const environmentalImpact = {};
    // Green rewards (stub)
    const greenRewards = {};
    // Goals (stub)
    const goals = {};
    // Recommendations (stub)
    const recommendations = {};
    return {
      carbonFootprint,
      greenInitiatives,
      ecoDrivers,
      analytics,
      carbonOffsets,
      environmentalImpact,
      greenRewards,
      goals,
      recommendations,
      timestamp: Date.now()
    };
  }

  async getCarbonFootprint(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    let ridesQuery;
    const ridesRef = collection(db, 'rideRequests');
    if (userId) {
      ridesQuery = query(
        ridesRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      ridesQuery = query(
        ridesRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    }
    const ridesSnapshot = await getDocs(ridesQuery);
    const rides = ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Calculate carbon footprint (simple sum of distance * emission factor)
    let totalCarbon = 0;
    rides.forEach(ride => {
      if (ride.status === 'completed' && ride.distance) {
        const distance = ride.distance / 1000; // Convert to km
        const emissionFactor = 170; // Use gasoline as default (g CO2/km)
        totalCarbon += distance * emissionFactor;
      }
    });
    return {
      total: Math.round(totalCarbon),
      rides: rides.length
    };
  }

  async getGreenInitiatives(userId, timeRange) {
    // Stub: return static initiatives
    return {
      platform: [
        { name: 'Carbon Neutral by 2025', progress: 65, target: 100 },
        { name: '100% Electric Fleet', progress: 30, target: 100 },
        { name: 'Green Driver Program', progress: 80, target: 100 }
      ],
      user: [
        { name: 'Eco-Friendly Rides', progress: 75, target: 100 },
        { name: 'Carbon Offset Participation', progress: 40, target: 100 },
        { name: 'Green Rewards', progress: 60, target: 100 }
      ]
    };
  }

  async getEcoFriendlyDrivers(timeRange) {
    const usersRef = collection(db, 'users');
    const driversQuery = query(
      usersRef,
      where('role', '==', 'driver'),
      where('isEcoFriendly', '==', true)
    );
    const driversSnapshot = await getDocs(driversQuery);
    const ecoDrivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return {
      drivers: ecoDrivers,
      total: ecoDrivers.length
    };
  }
}

export const sustainabilityService = new SustainabilityService();
export default sustainabilityService; 