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
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  startAfter,
  endBefore
} from 'firebase/firestore';

class VehicleManagementService {
  constructor() {
    this.db = db;
    this.vehicleData = {};
    this.maintenanceSchedule = [];
    this.expenseHistory = [];
    this.fuelEfficiencyData = [];
    this.healthAlerts = [];
  }

  /**
   * Initialize the vehicle management service
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      
      // Load vehicle data
      await this.loadVehicleData();
      
      // Load maintenance schedule
      await this.loadMaintenanceSchedule();
      
      // Load expense history
      await this.loadExpenseHistory();
      
      // Load fuel efficiency data
      await this.loadFuelEfficiencyData();
      
      // Initialize health monitoring
      await this.initializeHealthMonitoring();
      
      console.log('✅ Vehicle Management Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Vehicle Management Service:', error);
      return false;
    }
  }

  /**
   * Register a new vehicle
   * @param {Object} vehicleData - Vehicle information
   * @returns {Promise<Object>} Registered vehicle
   */
  async registerVehicle(vehicleData) {
    try {
      const vehicle = {
        driverId: this.driverId,
        ...vehicleData,
        healthScore: 100,
        totalMileage: 0,
        fuelEfficiency: 0,
        lastServiceDate: null,
        nextServiceDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'vehicles'), vehicle);
      
      // Update local data
      this.vehicleData[docRef.id] = { id: docRef.id, ...vehicle };
      
      return { id: docRef.id, ...vehicle };
    } catch (error) {
      console.error('Error registering vehicle:', error);
      throw error;
    }
  }

  /**
   * Get vehicle health score and diagnostics
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle health data
   */
  async getVehicleHealth(vehicleId) {
    try {
      // In a real implementation, this would connect to OBD-II or vehicle API
      const healthData = {
        overallScore: 85,
        engine: {
          score: 90,
          status: 'Good',
          issues: []
        },
        transmission: {
          score: 85,
          status: 'Good',
          issues: []
        },
        brakes: {
          score: 80,
          status: 'Fair',
          issues: ['Brake pads at 60% wear']
        },
        tires: {
          score: 75,
          status: 'Fair',
          issues: ['Front tires at 40% tread']
        },
        battery: {
          score: 95,
          status: 'Excellent',
          issues: []
        },
        fluids: {
          score: 88,
          status: 'Good',
          issues: ['Oil change due in 500 miles']
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'warning',
            message: 'Brake pads need attention soon',
            priority: 'medium',
            date: new Date()
          },
          {
            id: 'alert-2',
            type: 'info',
            message: 'Oil change due in 500 miles',
            priority: 'low',
            date: new Date()
          }
        ],
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      return healthData;
    } catch (error) {
      console.error('Error getting vehicle health:', error);
      return this.getDefaultHealthData();
    }
  }

  /**
   * Get maintenance schedule and history
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Maintenance data
   */
  async getMaintenanceSchedule(vehicleId) {
    try {
      const maintenanceData = {
        upcoming: [
          {
            id: 'maint-1',
            type: 'Oil Change',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            dueMileage: 75000,
            currentMileage: 74500,
            estimatedCost: 45,
            priority: 'high',
            description: 'Regular oil change due'
          },
          {
            id: 'maint-2',
            type: 'Brake Service',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            dueMileage: 76000,
            currentMileage: 74500,
            estimatedCost: 150,
            priority: 'medium',
            description: 'Brake pad replacement needed'
          },
          {
            id: 'maint-3',
            type: 'Tire Rotation',
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            dueMileage: 77000,
            currentMileage: 74500,
            estimatedCost: 25,
            priority: 'low',
            description: 'Regular tire rotation'
          }
        ],
        history: [
          {
            id: 'hist-1',
            type: 'Oil Change',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            mileage: 72000,
            cost: 42,
            provider: 'Quick Lube',
            description: 'Regular oil change'
          },
          {
            id: 'hist-2',
            type: 'Tire Replacement',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            mileage: 70000,
            cost: 400,
            provider: 'Tire Shop',
            description: 'Replaced all 4 tires'
          }
        ],
        totalSpent: 442,
        averageCost: 221,
        nextService: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      };

      return maintenanceData;
    } catch (error) {
      console.error('Error getting maintenance schedule:', error);
      return this.getDefaultMaintenanceData();
    }
  }

  /**
   * Track fuel efficiency and costs
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} fuelData - Fuel fill-up data
   * @returns {Promise<Object>} Fuel efficiency data
   */
  async trackFuelEfficiency(vehicleId, fuelData) {
    try {
      const fuelEntry = {
        vehicleId,
        ...fuelData,
        timestamp: serverTimestamp(),
        calculatedMPG: this.calculateMPG(fuelData)
      };

      // Save fuel entry
      const docRef = await addDoc(collection(this.db, 'fuelEntries'), fuelEntry);
      
      // Update fuel efficiency data
      await this.updateFuelEfficiencyData(vehicleId);
      
      return { id: docRef.id, ...fuelEntry };
    } catch (error) {
      console.error('Error tracking fuel efficiency:', error);
      throw error;
    }
  }

  /**
   * Get fuel efficiency analytics
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Fuel efficiency analytics
   */
  async getFuelEfficiencyAnalytics(vehicleId, options = {}) {
    try {
      const timeRange = options.timeRange || '30d';
      const startDate = this.getStartDate(timeRange);
      
      const analytics = {
        currentMPG: 28.5,
        averageMPG: 27.8,
        bestMPG: 32.1,
        worstMPG: 24.3,
        totalFuelCost: 450,
        totalGallons: 16.2,
        averageCostPerGallon: 2.78,
        efficiencyTrend: 'improving',
        savings: {
          vsAverage: 45,
          vsWorst: 120,
          monthly: 25
        },
        recommendations: [
          'Maintain steady speed on highways',
          'Avoid aggressive acceleration',
          'Keep tires properly inflated',
          'Use cruise control when possible'
        ],
        chartData: this.generateFuelEfficiencyChartData(),
        lastUpdated: new Date()
      };

      return analytics;
    } catch (error) {
      console.error('Error getting fuel efficiency analytics:', error);
      return this.getDefaultFuelAnalytics();
    }
  }

  /**
   * Track vehicle expenses
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} expenseData - Expense information
   * @returns {Promise<Object>} Tracked expense
   */
  async trackExpense(vehicleId, expenseData) {
    try {
      const expense = {
        vehicleId,
        driverId: this.driverId,
        ...expenseData,
        timestamp: serverTimestamp(),
        category: expenseData.category || 'other'
      };

      const docRef = await addDoc(collection(this.db, 'vehicleExpenses'), expense);
      
      // Update expense analytics
      await this.updateExpenseAnalytics(vehicleId);
      
      return { id: docRef.id, ...expense };
    } catch (error) {
      console.error('Error tracking expense:', error);
      throw error;
    }
  }

  /**
   * Get expense analytics and reports
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Expense analytics
   */
  async getExpenseAnalytics(vehicleId, options = {}) {
    try {
      const timeRange = options.timeRange || '30d';
      const startDate = this.getStartDate(timeRange);
      
      const analytics = {
        totalExpenses: 1250,
        monthlyAverage: 625,
        categories: {
          fuel: 450,
          maintenance: 300,
          insurance: 200,
          registration: 50,
          repairs: 150,
          other: 100
        },
        trends: {
          fuel: 'increasing',
          maintenance: 'stable',
          insurance: 'decreasing'
        },
        profitMargin: 65.5,
        costPerMile: 0.45,
        recommendations: [
          'Consider switching insurance providers',
          'Schedule maintenance during off-peak hours',
          'Track fuel efficiency more closely'
        ],
        chartData: this.generateExpenseChartData(),
        lastUpdated: new Date()
      };

      return analytics;
    } catch (error) {
      console.error('Error getting expense analytics:', error);
      return this.getDefaultExpenseAnalytics();
    }
  }

  /**
   * Get insurance information and claims
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Insurance data
   */
  async getInsuranceInfo(vehicleId) {
    try {
      const insuranceData = {
        policy: {
          provider: 'State Farm',
          policyNumber: 'SF-123456789',
          coverage: 'Full Coverage',
          premium: 120,
          renewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          deductible: 500
        },
        claims: [
          {
            id: 'claim-1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            type: 'Accident',
            amount: 2500,
            status: 'Approved',
            description: 'Rear-end collision'
          }
        ],
        coverage: {
          liability: 100000,
          collision: 500,
          comprehensive: 500,
          uninsured: 25000
        },
        discounts: [
          'Safe Driver',
          'Multi-Vehicle',
          'Good Student'
        ],
        nextPayment: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      };

      return insuranceData;
    } catch (error) {
      console.error('Error getting insurance info:', error);
      return this.getDefaultInsuranceData();
    }
  }

  /**
   * Get vehicle marketplace listings
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Marketplace listings
   */
  async getMarketplaceListings(filters = {}) {
    try {
      const listings = {
        forSale: [
          {
            id: 'listing-1',
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            mileage: 45000,
            price: 22000,
            condition: 'Excellent',
            location: 'Los Angeles, CA',
            seller: 'Dealer',
            features: ['Bluetooth', 'Backup Camera', 'Cruise Control'],
            images: ['image1.jpg', 'image2.jpg'],
            listingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ],
        marketValue: {
          current: 22000,
          range: {
            min: 20000,
            max: 24000
          },
          trend: 'stable',
          kbbValue: 22500,
          edmundsValue: 21800
        },
        recommendations: [
          'Consider selling in spring for better prices',
          'Complete minor repairs before listing',
          'Get professional photos taken'
        ]
      };

      return listings;
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      return this.getDefaultMarketplaceData();
    }
  }

  // Helper methods
  calculateMPG(fuelData) {
    if (!fuelData.gallons || !fuelData.miles) return 0;
    return fuelData.miles / fuelData.gallons;
  }

  async updateFuelEfficiencyData(vehicleId) {
    // Implementation for updating fuel efficiency data
  }

  async updateExpenseAnalytics(vehicleId) {
    // Implementation for updating expense analytics
  }

  generateFuelEfficiencyChartData() {
    // Implementation for generating fuel efficiency chart data
    return [];
  }

  generateExpenseChartData() {
    // Implementation for generating expense chart data
    return [];
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  async loadVehicleData() {
    // Implementation for loading vehicle data
  }

  async loadMaintenanceSchedule() {
    // Implementation for loading maintenance schedule
  }

  async loadExpenseHistory() {
    // Implementation for loading expense history
  }

  async loadFuelEfficiencyData() {
    // Implementation for loading fuel efficiency data
  }

  async initializeHealthMonitoring() {
    // Implementation for initializing health monitoring
  }

  // Default fallback methods
  getDefaultHealthData() {
    return {
      overallScore: 75,
      engine: { score: 80, status: 'Good', issues: [] },
      transmission: { score: 75, status: 'Fair', issues: [] },
      brakes: { score: 70, status: 'Fair', issues: [] },
      tires: { score: 65, status: 'Fair', issues: [] },
      battery: { score: 85, status: 'Good', issues: [] },
      fluids: { score: 80, status: 'Good', issues: [] },
      alerts: [],
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }

  getDefaultMaintenanceData() {
    return {
      upcoming: [],
      history: [],
      totalSpent: 0,
      averageCost: 0,
      nextService: null
    };
  }

  getDefaultFuelAnalytics() {
    return {
      currentMPG: 25,
      averageMPG: 24,
      bestMPG: 28,
      worstMPG: 20,
      totalFuelCost: 0,
      totalGallons: 0,
      averageCostPerGallon: 0,
      efficiencyTrend: 'stable',
      savings: { vsAverage: 0, vsWorst: 0, monthly: 0 },
      recommendations: [],
      chartData: [],
      lastUpdated: new Date()
    };
  }

  getDefaultExpenseAnalytics() {
    return {
      totalExpenses: 0,
      monthlyAverage: 0,
      categories: {},
      trends: {},
      profitMargin: 0,
      costPerMile: 0,
      recommendations: [],
      chartData: [],
      lastUpdated: new Date()
    };
  }

  getDefaultInsuranceData() {
    return {
      policy: {},
      claims: [],
      coverage: {},
      discounts: [],
      nextPayment: null
    };
  }

  getDefaultMarketplaceData() {
    return {
      forSale: [],
      marketValue: { current: 0, range: { min: 0, max: 0 }, trend: 'stable' },
      recommendations: []
    };
  }
}

// Export singleton instance
export default new VehicleManagementService();
