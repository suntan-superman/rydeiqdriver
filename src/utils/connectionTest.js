import RideRequestService from '@/services/rideRequestService';
import DriverStatusService from '@/services/driverStatusService';
import { auth } from '@/services/firebase/config';

// Test data for simulating rider requests
const mockRideRequest = {
  id: `test_ride_${Date.now()}`,
  riderId: 'test_rider_123',
  riderInfo: {
    name: 'Test Rider',
    phone: '+1234567890',
    rating: 4.8
  },
  pickup: {
    address: '123 Test Street, Test City',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  dropoff: {
    address: '456 Test Avenue, Test City',
    coordinates: { lat: 40.7589, lng: -73.9851 }
  },
  estimatedPrice: 25.50,
  estimatedDistance: 3.2,
  estimatedDuration: '15 minutes',
  distanceInMiles: 3.2,
  status: 'pending',
  timestamp: new Date()
};

class ConnectionTestService {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  // Run all connection tests
  async runAllTests() {
    if (this.isRunning) {
      console.log('⚠️ Tests already running');
      return;
    }

    this.isRunning = true;
    this.testResults = [];

    console.log('🧪 Starting Rider-Driver Connection Tests...');

    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();
      
      // Test 2: Driver Status Management
      await this.testDriverStatusManagement();
      
      // Test 3: Location Updates
      await this.testLocationUpdates();
      
      // Test 4: Ride Request Handling
      await this.testRideRequestHandling();
      
      // Test 5: Real-time Communication
      await this.testRealTimeCommunication();

      console.log('✅ All tests completed successfully!');
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.printTestResults();
    } finally {
      this.isRunning = false;
    }
  }

  // Test 1: Service Initialization
  async testServiceInitialization() {
    console.log('🔧 Testing Service Initialization...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Initialize services
      RideRequestService.initialize(currentUser.uid);
      DriverStatusService.initialize(currentUser.uid, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });

      this.addTestResult('Service Initialization', 'PASS', 'Services initialized successfully');
    } catch (error) {
      this.addTestResult('Service Initialization', 'FAIL', error.message);
      throw error;
    }
  }

  // Test 2: Driver Status Management
  async testDriverStatusManagement() {
    console.log('📱 Testing Driver Status Management...');
    
    try {
      // Test going online
      await DriverStatusService.goOnline();
      await this.delay(1000);
      
      const onlineStatus = await DriverStatusService.getCurrentDriverStatus();
      if (!onlineStatus.isOnline) {
        throw new Error('Failed to go online');
      }

      // Test going offline
      await DriverStatusService.goOffline();
      await this.delay(1000);
      
      const offlineStatus = await DriverStatusService.getCurrentDriverStatus();
      if (offlineStatus.isOnline) {
        throw new Error('Failed to go offline');
      }

      this.addTestResult('Driver Status Management', 'PASS', 'Status updates working correctly');
    } catch (error) {
      this.addTestResult('Driver Status Management', 'FAIL', error.message);
      throw error;
    }
  }

  // Test 3: Location Updates
  async testLocationUpdates() {
    console.log('📍 Testing Location Updates...');
    
    try {
      // Start location updates
      await DriverStatusService.startLocationUpdates(5000); // 5 second interval for testing
      await this.delay(6000); // Wait for location update
      
      const status = await DriverStatusService.getCurrentDriverStatus();
      if (!status.lastLocationUpdate) {
        throw new Error('Location not updated');
      }

      // Stop location updates
      DriverStatusService.stopLocationUpdates();

      this.addTestResult('Location Updates', 'PASS', 'Location tracking working correctly');
    } catch (error) {
      this.addTestResult('Location Updates', 'FAIL', error.message);
      throw error;
    }
  }

  // Test 4: Ride Request Handling
  async testRideRequestHandling() {
    console.log('🚗 Testing Ride Request Handling...');
    
    try {
      let requestReceived = false;
      
      // Set up callback to listen for ride requests
      RideRequestService.setRideRequestCallback((rideRequest) => {
        requestReceived = true;
        console.log('✅ Ride request received:', rideRequest.id);
      });

      // Simulate a ride request (this would normally come from rider app)
      // For testing, we'll manually trigger the callback
      setTimeout(() => {
        RideRequestService.handleNewRideRequest(mockRideRequest);
      }, 1000);

      // Wait for request to be processed
      await this.delay(2000);

      if (!requestReceived) {
        throw new Error('Ride request callback not triggered');
      }

      this.addTestResult('Ride Request Handling', 'PASS', 'Ride requests processed correctly');
    } catch (error) {
      this.addTestResult('Ride Request Handling', 'FAIL', error.message);
      throw error;
    }
  }

  // Test 5: Real-time Communication
  async testRealTimeCommunication() {
    console.log('📡 Testing Real-time Communication...');
    
    try {
      let statusUpdateReceived = false;
      
      // Listen for status changes
      const unsubscribe = DriverStatusService.listenForDriverStatus((status) => {
        statusUpdateReceived = true;
        console.log('✅ Status update received:', status.status);
      });

      // Trigger a status change
      await DriverStatusService.updateDriverStatus('available');
      await this.delay(2000);

      if (!statusUpdateReceived) {
        throw new Error('Real-time status updates not working');
      }

      // Cleanup
      unsubscribe();

      this.addTestResult('Real-time Communication', 'PASS', 'Real-time updates working correctly');
    } catch (error) {
      this.addTestResult('Real-time Communication', 'FAIL', error.message);
      throw error;
    }
  }

  // Simulate ride request from rider app
  async simulateRiderRequest() {
    console.log('🎭 Simulating Rider Request...');
    
    try {
      // Create a test ride request
      const testRequest = {
        ...mockRideRequest,
        id: `simulated_ride_${Date.now()}`,
        driverId: auth.currentUser?.uid || 'test_driver'
      };

      // This would normally be sent from the rider app
      // For testing, we'll trigger the service directly
      RideRequestService.handleNewRideRequest(testRequest);

      console.log('✅ Simulated ride request sent');
      return testRequest;
    } catch (error) {
      console.error('❌ Failed to simulate ride request:', error);
      throw error;
    }
  }

  // Test ride acceptance flow
  async testRideAcceptanceFlow() {
    console.log('✅ Testing Ride Acceptance Flow...');
    
    try {
      // Simulate a ride request
      const testRequest = await this.simulateRiderRequest();
      await this.delay(1000);

      // Accept the ride
      const result = await RideRequestService.acceptRideRequest(testRequest.id);
      
      if (!result.success) {
        throw new Error('Failed to accept ride request');
      }

      console.log('✅ Ride acceptance flow completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Ride acceptance flow failed:', error);
      throw error;
    }
  }

  // Test ride rejection flow
  async testRideRejectionFlow() {
    console.log('❌ Testing Ride Rejection Flow...');
    
    try {
      // Simulate a ride request
      const testRequest = await this.simulateRiderRequest();
      await this.delay(1000);

      // Reject the ride
      const result = await RideRequestService.rejectRideRequest(testRequest.id, 'test_rejection');
      
      if (!result.success) {
        throw new Error('Failed to reject ride request');
      }

      console.log('✅ Ride rejection flow completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Ride rejection flow failed:', error);
      throw error;
    }
  }

  // Test custom bidding flow
  async testCustomBiddingFlow() {
    console.log('💰 Testing Custom Bidding Flow...');
    
    try {
      // Simulate a ride request
      const testRequest = await this.simulateRiderRequest();
      await this.delay(1000);

      // Submit a custom bid
      const bidAmount = testRequest.estimatedPrice + 5;
      const result = await RideRequestService.submitCustomBid(testRequest.id, bidAmount);
      
      if (!result.success) {
        throw new Error('Failed to submit custom bid');
      }

      console.log('✅ Custom bidding flow completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Custom bidding flow failed:', error);
      throw error;
    }
  }

  // Helper methods
  addTestResult(testName, status, message) {
    this.testResults.push({
      test: testName,
      status: status,
      message: message,
      timestamp: new Date()
    });
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status} - ${result.message}`);
    });
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Connection is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the implementation.');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  cleanup() {
    RideRequestService.cleanup();
    DriverStatusService.cleanup();
    console.log('🧹 Test cleanup completed');
  }
}

// Export singleton instance
export default new ConnectionTestService(); 