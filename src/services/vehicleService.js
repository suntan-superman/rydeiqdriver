import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit } from 'firebase/firestore';

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

class VehicleService {
  async getVehicleDashboard(userId = null, timeRange = '30d') {
    // Vehicle tracking
    const vehicleTracking = await this.getVehicleTracking(userId, timeRange);
    // Maintenance scheduling
    const maintenance = await this.getMaintenanceScheduling(userId);
    // Fuel management
    const fuelManagement = await this.getFuelManagement(userId, timeRange);
    // Vehicle analytics
    const analytics = await this.getVehicleAnalytics(userId, timeRange);
    // Insurance tracking
    const insurance = await this.getInsuranceTracking(userId);
    // Vehicle documentation
    const documentation = await this.getVehicleDocumentation(userId);
    // Vehicle health
    const vehicleHealth = await this.getVehicleHealth(userId);
    // Cost tracking
    const costTracking = await this.getCostTracking(userId, timeRange);
    
    return {
      vehicleTracking,
      maintenance,
      fuelManagement,
      analytics,
      insurance,
      documentation,
      vehicleHealth,
      costTracking,
      timestamp: Date.now()
    };
  }

  async getVehicleTracking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const trackingRef = collection(db, 'vehicleTracking');
    let trackingQuery;
    
    if (userId) {
      trackingQuery = query(
        trackingRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      trackingQuery = query(
        trackingRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const trackingSnapshot = await getDocs(trackingQuery);
    const trackingData = trackingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentLocation: trackingData[0] || null,
      trackingHistory: trackingData,
      totalTrips: trackingData.filter(t => t.tripId).length,
      totalDistance: trackingData.reduce((sum, t) => sum + (t.distance || 0), 0),
      averageSpeed: this.calculateAverageSpeed(trackingData),
      idleTime: this.calculateIdleTime(trackingData)
    };
  }

  async getMaintenanceScheduling(userId) {
    const maintenanceRef = collection(db, 'vehicleMaintenance');
    let maintenanceQuery;
    
    if (userId) {
      maintenanceQuery = query(
        maintenanceRef,
        where('driverId', '==', userId),
        orderBy('scheduledDate', 'asc')
      );
    } else {
      maintenanceQuery = query(maintenanceRef, limit(10));
    }
    
    const maintenanceSnapshot = await getDocs(maintenanceQuery);
    const maintenance = maintenanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      scheduledMaintenance: maintenance.filter(m => m.status === 'scheduled'),
      completedMaintenance: maintenance.filter(m => m.status === 'completed'),
      overdueMaintenance: maintenance.filter(m => m.status === 'overdue'),
      maintenanceTypes: ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Tune-up', 'Filter Replacement'],
      nextMaintenance: maintenance.find(m => m.status === 'scheduled' && new Date(m.scheduledDate) > new Date())
    };
  }

  async getFuelManagement(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const fuelRef = collection(db, 'fuelRecords');
    let fuelQuery;
    
    if (userId) {
      fuelQuery = query(
        fuelRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      fuelQuery = query(
        fuelRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(20)
      );
    }
    
    const fuelSnapshot = await getDocs(fuelQuery);
    const fuelRecords = fuelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      fuelRecords,
      totalFuelCost: fuelRecords.reduce((sum, record) => sum + (record.cost || 0), 0),
      totalFuelUsed: fuelRecords.reduce((sum, record) => sum + (record.gallons || 0), 0),
      averageMPG: this.calculateAverageMPG(fuelRecords),
      fuelEfficiency: this.calculateFuelEfficiency(fuelRecords),
      fuelTypes: ['Regular', 'Premium', 'Diesel', 'Electric']
    };
  }

  async getVehicleAnalytics(userId, timeRange) {
    // Mock analytics data
    return {
      vehicleUtilization: '78%',
      averageDailyMiles: 45.2,
      peakUsageHours: ['8-10 AM', '5-7 PM'],
      fuelEfficiencyTrend: '+12% improvement',
      maintenanceCosts: '$1,250',
      vehicleReliability: '94%',
      costPerMile: '$0.28',
      environmentalImpact: '2.3 tons CO2 saved'
    };
  }

  async getInsuranceTracking(userId) {
    // Mock insurance data
    return {
      currentPolicy: {
        provider: 'RydeIQ Insurance',
        policyNumber: 'RID-2024-001',
        coverage: '$1,000,000',
        premium: '$125/month',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'Active'
      },
      claims: [
        { date: '2024-01-15', type: 'Minor Accident', status: 'Resolved', amount: '$500' },
        { date: '2024-02-20', type: 'Windshield', status: 'Pending', amount: '$300' }
      ],
      totalClaims: 2,
      claimsHistory: 'Good',
      renewalDate: '2024-12-01'
    };
  }

  async getVehicleDocumentation(userId) {
    // Mock documentation data
    return {
      documents: [
        { name: 'Vehicle Registration', status: 'Valid', expiryDate: '2025-06-15' },
        { name: 'Driver License', status: 'Valid', expiryDate: '2026-03-20' },
        { name: 'Vehicle Inspection', status: 'Valid', expiryDate: '2024-12-10' },
        { name: 'Insurance Certificate', status: 'Valid', expiryDate: '2024-12-31' }
      ],
      totalDocuments: 4,
      expiringSoon: 1,
      expiredDocuments: 0,
      documentTypes: ['Registration', 'License', 'Inspection', 'Insurance', 'Permits']
    };
  }

  async getVehicleHealth(userId) {
    // Mock vehicle health data
    return {
      overallHealth: 87,
      engineHealth: 92,
      transmissionHealth: 85,
      brakeHealth: 89,
      tireHealth: 78,
      batteryHealth: 94,
      alerts: [
        { type: 'Warning', message: 'Tire pressure low', priority: 'Medium' },
        { type: 'Info', message: 'Oil change due soon', priority: 'Low' }
      ],
      lastDiagnostic: '2024-01-25',
      nextDiagnostic: '2024-02-25'
    };
  }

  async getCostTracking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const costsRef = collection(db, 'vehicleCosts');
    let costsQuery;
    
    if (userId) {
      costsQuery = query(
        costsRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      costsQuery = query(
        costsRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(20)
      );
    }
    
    const costsSnapshot = await getDocs(costsQuery);
    const costs = costsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      costRecords: costs,
      totalCosts: costs.reduce((sum, cost) => sum + (cost.amount || 0), 0),
      costBreakdown: {
        fuel: costs.filter(c => c.category === 'fuel').reduce((sum, c) => sum + (c.amount || 0), 0),
        maintenance: costs.filter(c => c.category === 'maintenance').reduce((sum, c) => sum + (c.amount || 0), 0),
        insurance: costs.filter(c => c.category === 'insurance').reduce((sum, c) => sum + (c.amount || 0), 0),
        other: costs.filter(c => !['fuel', 'maintenance', 'insurance'].includes(c.category)).reduce((sum, c) => sum + (c.amount || 0), 0)
      },
      costCategories: ['Fuel', 'Maintenance', 'Insurance', 'Repairs', 'Registration', 'Other']
    };
  }

  calculateAverageSpeed(trackingData) {
    if (trackingData.length === 0) return 0;
    const speeds = trackingData.filter(t => t.speed > 0).map(t => t.speed);
    return speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
  }

  calculateIdleTime(trackingData) {
    if (trackingData.length === 0) return 0;
    return trackingData.filter(t => t.speed === 0).length * 5; // Assuming 5-minute intervals
  }

  calculateAverageMPG(fuelRecords) {
    if (fuelRecords.length < 2) return 0;
    const totalMiles = fuelRecords.reduce((sum, record) => sum + (record.miles || 0), 0);
    const totalGallons = fuelRecords.reduce((sum, record) => sum + (record.gallons || 0), 0);
    return totalGallons > 0 ? totalMiles / totalGallons : 0;
  }

  calculateFuelEfficiency(fuelRecords) {
    if (fuelRecords.length === 0) return 0;
    const recentRecords = fuelRecords.slice(0, 5); // Last 5 records
    const avgMPG = this.calculateAverageMPG(recentRecords);
    return avgMPG > 25 ? 'Excellent' : avgMPG > 20 ? 'Good' : avgMPG > 15 ? 'Fair' : 'Poor';
  }

  // Additional methods for vehicle management
  async addMaintenanceRecord(maintenanceData) {
    const maintenanceRef = collection(db, 'vehicleMaintenance');
    return await addDoc(maintenanceRef, {
      ...maintenanceData,
      createdAt: new Date(),
      status: 'scheduled'
    });
  }

  async addFuelRecord(fuelData) {
    const fuelRef = collection(db, 'fuelRecords');
    return await addDoc(fuelRef, {
      ...fuelData,
      date: new Date(),
      createdAt: new Date()
    });
  }

  async addCostRecord(costData) {
    const costsRef = collection(db, 'vehicleCosts');
    return await addDoc(costsRef, {
      ...costData,
      date: new Date(),
      createdAt: new Date()
    });
  }

  async updateVehicleLocation(locationData) {
    const trackingRef = collection(db, 'vehicleTracking');
    return await addDoc(trackingRef, {
      ...locationData,
      timestamp: new Date()
    });
  }

  async updateMaintenanceStatus(maintenanceId, status) {
    const maintenanceRef = doc(db, 'vehicleMaintenance', maintenanceId);
    await updateDoc(maintenanceRef, {
      status,
      updatedAt: new Date()
    });
  }
}

export const vehicleService = new VehicleService();
export default vehicleService; 