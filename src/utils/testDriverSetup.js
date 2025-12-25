import { auth, db } from '../services/firebase/config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  GeoPoint 
} from 'firebase/firestore';
import RideRequestService from '../services/rideRequestService';
import DriverStatusService from '../services/driverStatusService';

class TestDriverSetup {
  constructor() {
    this.testDriverId = 'test_driver_001';
    this.testRiderId = 'test_rider_001';
    this.testDriverData = {
      id: this.testDriverId,
      email: 'test.driver@anyryde.com',
      displayName: 'Test Driver',
      phone: '+1234567890',
      status: 'offline',
      isOnline: false,
      rating: 4.8,
      totalRides: 150,
      totalEarnings: 2500.00,
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'Silver',
        licensePlate: 'TEST123'
      },
      location: new GeoPoint(40.7128, -74.0060), // New York coordinates
      lastStatusUpdate: serverTimestamp(),
      lastLocationUpdate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    this.testRiderData = {
      id: this.testRiderId,
      email: 'test.rider@anyryde.com',
      displayName: 'Test Rider',
      phone: '+1987654321',
      rating: 4.9,
      totalRides: 75,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }

  // Create test driver profile
  async createTestDriver() {
    try {
      console.log('🚗 Creating test driver profile...');
      
      const driverRef = doc(db, 'driverApplications', this.testDriverId);
      await setDoc(driverRef, this.testDriverData);
      
      console.log('✅ Test driver profile created successfully');
      return { success: true, driverId: this.testDriverId };
    } catch (error) {
      console.error('❌ Error creating test driver:', error);
      throw error;
    }
  }

  // Create test rider profile
  async createTestRider() {
    try {
      console.log('👤 Creating test rider profile...');
      
      const riderRef = doc(db, 'users', this.testRiderId);
      await setDoc(riderRef, this.testRiderData);
      
      console.log('✅ Test rider profile created successfully');
      return { success: true, riderId: this.testRiderId };
    } catch (error) {
      console.error('❌ Error creating test rider:', error);
      throw error;
    }
  }

  // Get test driver profile
  async getTestDriver() {
    try {
      const driverRef = doc(db, 'driverApplications', this.testDriverId);
      const driverDoc = await getDoc(driverRef);
      
      if (driverDoc.exists()) {
        return { id: driverDoc.id, ...driverDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting test driver:', error);
      return null;
    }
  }

  // Update test driver status
  async updateTestDriverStatus(status, isOnline = false) {
    try {
      console.log(`📱 Updating test driver status to: ${status} (online: ${isOnline})`);
      
      const driverRef = doc(db, 'driverApplications', this.testDriverId);
      await setDoc(driverRef, {
        status: status,
        isOnline: isOnline,
        lastStatusUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Test driver status updated successfully');
      return { success: true, status, isOnline };
    } catch (error) {
      console.error('❌ Error updating test driver status:', error);
      throw error;
    }
  }

  // Update test driver location
  async updateTestDriverLocation(latitude, longitude) {
    try {
      console.log(`📍 Updating test driver location to: ${latitude}, ${longitude}`);
      
      const driverRef = doc(db, 'driverApplications', this.testDriverId);
      await setDoc(driverRef, {
        location: new GeoPoint(latitude, longitude),
        lastLocationUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Test driver location updated successfully');
      return { success: true, latitude, longitude };
    } catch (error) {
      console.error('❌ Error updating test driver location:', error);
      throw error;
    }
  }

  // Create test ride request
  async createTestRideRequest(driverId = this.testDriverId) {
    try {
      console.log('🚕 Creating test ride request...');
      
      const rideRequestData = {
        driverId: driverId,
        riderId: this.testRiderId,
        riderInfo: {
          name: this.testRiderData.displayName,
          phone: this.testRiderData.phone,
          rating: this.testRiderData.rating
        },
        pickup: {
          address: '123 Main St, New York, NY',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        },
        dropoff: {
          address: '456 Broadway, New York, NY',
          coordinates: {
            lat: 40.7589,
            lng: -73.9851
          }
        },
        status: 'pending',
        timestamp: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30000), // 30 seconds
        estimatedPrice: 25.50,
        companyBid: 25.50, // Add companyBid for cost estimation
        estimatedDistance: 2.5,
        estimatedDuration: '8 minutes',
        distanceInMiles: 2.5,
        specialRequests: [],
        rideType: 'standard'
      };

      const rideRequestsRef = collection(db, 'rideRequests');
      const rideRequestDoc = await addDoc(rideRequestsRef, rideRequestData);
      
      console.log('✅ Test ride request created successfully:', rideRequestDoc.id);
      return { 
        success: true, 
        rideRequestId: rideRequestDoc.id,
        rideRequest: { id: rideRequestDoc.id, ...rideRequestData }
      };
    } catch (error) {
      console.error('❌ Error creating test ride request:', error);
      throw error;
    }
  }

  // Simulate multiple ride requests
  async simulateMultipleRideRequests(count = 3, intervalMs = 2000) {
    console.log(`🚕 Simulating ${count} ride requests with ${intervalMs}ms intervals...`);
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      try {
        console.log(`Creating ride request ${i + 1}/${count}...`);
        const result = await this.createTestRideRequest();
        results.push(result);
        
        if (i < count - 1) {
          await this.delay(intervalMs);
        }
      } catch (error) {
        console.error(`Error creating ride request ${i + 1}:`, error);
        results.push({ error: error.message });
      }
    }
    
    console.log('✅ Multiple ride requests simulation completed');
    return results;
  }

  // Test driver service initialization
  async testDriverServiceInitialization() {
    try {
      console.log('🧪 Testing driver service initialization...');
      
      // Initialize services with test driver
      RideRequestService.initialize(this.testDriverId);
      DriverStatusService.initialize(this.testDriverId, {
        email: this.testDriverData.email,
        displayName: this.testDriverData.displayName
      });
      
      // Test service methods
      const driverStatus = await DriverStatusService.getCurrentDriverStatus();
      console.log('📱 Driver status:', driverStatus);
      
      const activeRequests = await RideRequestService.getActiveRideRequests();
      console.log('🚗 Active ride requests:', activeRequests.length);
      
      console.log('✅ Driver service initialization test completed');
      return { success: true, driverStatus, activeRequests };
    } catch (error) {
      console.error('❌ Driver service initialization test failed:', error);
      throw error;
    }
  }

  // Run comprehensive test
  async runComprehensiveTest() {
    console.log('🧪 Running comprehensive test driver setup...');
    
    try {
      // Step 1: Create test profiles
      await this.createTestDriver();
      await this.createTestRider();
      
      // Step 2: Update driver status to online
      await this.updateTestDriverStatus('available', true);
      
      // Step 3: Update driver location (with error handling)
      try {
        await this.updateTestDriverLocation(40.7128, -74.0060);
      } catch (locationError) {
        console.warn('⚠️ Location update failed, continuing with test:', locationError.message);
      }
      
      // Step 4: Test service initialization
      await this.testDriverServiceInitialization();
      
      // Step 5: Create test ride request
      await this.createTestRideRequest();
      
      console.log('🎉 Comprehensive test completed successfully!');
      return { success: true, message: 'All tests passed' };
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
      // Return error instead of throwing to prevent app crash
      return { success: false, error: error.message };
    }
  }

  // Clean up test data
  async cleanupTestData() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Note: In a real app, you might want to delete the test documents
      // For now, we'll just mark the test driver as offline
      await this.updateTestDriverStatus('offline', false);
      
      console.log('✅ Test data cleanup completed');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
      throw error;
    }
  }

  // Helper method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get test driver info for display
  getTestDriverInfo() {
    return {
      id: this.testDriverId,
      name: this.testDriverData.displayName,
      email: this.testDriverData.email,
      vehicle: this.testDriverData.vehicle,
      rating: this.testDriverData.rating,
      totalRides: this.testDriverData.totalRides,
      totalEarnings: this.testDriverData.totalEarnings
    };
  }

  // Get test rider info for display
  getTestRiderInfo() {
    return {
      id: this.testRiderId,
      name: this.testRiderData.displayName,
      email: this.testRiderData.email,
      rating: this.testRiderData.rating,
      totalRides: this.testRiderData.totalRides
    };
  }
}

// Export singleton instance
export default new TestDriverSetup(); 