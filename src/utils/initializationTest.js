import RideRequestService from '@/services/rideRequestService';
import DriverStatusService from '@/services/driverStatusService';

class InitializationTest {
  constructor() {
    this.testResults = [];
  }

  // Test service initialization
  async testServiceInitialization(userId, userData = null) {
    console.log('🧪 Testing Service Initialization...');
    
    try {
      // Test RideRequestService
      console.log('🔧 Testing RideRequestService initialization...');
      RideRequestService.initialize(userId);
      
      if (RideRequestService.isInitialized()) {
        console.log('✅ RideRequestService initialized successfully');
        this.addTestResult('RideRequestService', 'PASS', 'Service initialized');
      } else {
        console.log('❌ RideRequestService initialization failed');
        this.addTestResult('RideRequestService', 'FAIL', 'Service not initialized');
      }

      // Test DriverStatusService
      console.log('🔧 Testing DriverStatusService initialization...');
      DriverStatusService.initialize(userId, userData);
      
      if (DriverStatusService.isInitialized()) {
        console.log('✅ DriverStatusService initialized successfully');
        this.addTestResult('DriverStatusService', 'PASS', 'Service initialized');
      } else {
        console.log('❌ DriverStatusService initialization failed');
        this.addTestResult('DriverStatusService', 'FAIL', 'Service not initialized');
      }

      // Test service methods
      await this.testServiceMethods();

      console.log('✅ Service initialization test completed');
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Service initialization test failed:', error);
      this.addTestResult('Initialization', 'FAIL', error.message);
      this.printTestResults();
    }
  }

  // Test service methods
  async testServiceMethods() {
    console.log('🔧 Testing service methods...');
    
    try {
      // Test DriverStatusService methods
      console.log('📱 Testing DriverStatusService methods...');
      
      // Test getCurrentDriverStatus
      try {
        const status = await DriverStatusService.getCurrentDriverStatus();
        console.log('✅ getCurrentDriverStatus works:', status ? 'Status retrieved' : 'No status found');
        this.addTestResult('getCurrentDriverStatus', 'PASS', 'Method works');
      } catch (error) {
        console.log('❌ getCurrentDriverStatus failed:', error.message);
        this.addTestResult('getCurrentDriverStatus', 'FAIL', error.message);
      }

      // Test updateDriverStatus
      try {
        await DriverStatusService.updateDriverStatus('offline');
        console.log('✅ updateDriverStatus works');
        this.addTestResult('updateDriverStatus', 'PASS', 'Method works');
      } catch (error) {
        console.log('❌ updateDriverStatus failed:', error.message);
        this.addTestResult('updateDriverStatus', 'FAIL', error.message);
      }

      // Test RideRequestService methods
      console.log('🚗 Testing RideRequestService methods...');
      
      // Test getActiveRideRequests
      try {
        const requests = await RideRequestService.getActiveRideRequests();
        console.log('✅ getActiveRideRequests works:', requests.length, 'requests found');
        this.addTestResult('getActiveRideRequests', 'PASS', 'Method works');
      } catch (error) {
        console.log('❌ getActiveRideRequests failed:', error.message);
        this.addTestResult('getActiveRideRequests', 'FAIL', error.message);
      }

    } catch (error) {
      console.error('❌ Service methods test failed:', error);
      this.addTestResult('Service Methods', 'FAIL', error.message);
    }
  }

  // Test status toggle functionality
  async testStatusToggle() {
    console.log('🔄 Testing status toggle functionality...');
    
    try {
      // Test going online
      console.log('📱 Testing goOnline...');
      await DriverStatusService.goOnline();
      console.log('✅ goOnline works');
      this.addTestResult('goOnline', 'PASS', 'Method works');

      // Wait a moment
      await this.delay(1000);

      // Test going offline
      console.log('📱 Testing goOffline...');
      await DriverStatusService.goOffline();
      console.log('✅ goOffline works');
      this.addTestResult('goOffline', 'PASS', 'Method works');

    } catch (error) {
      console.error('❌ Status toggle test failed:', error);
      this.addTestResult('Status Toggle', 'FAIL', error.message);
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
    console.log('\n📊 Initialization Test Results:');
    console.log('================================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status} - ${result.message}`);
    });
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All initialization tests passed!');
    } else {
      console.log('⚠️ Some initialization tests failed. Check the implementation.');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  cleanup() {
    try {
      RideRequestService.cleanup();
      DriverStatusService.cleanup();
      console.log('🧹 Initialization test cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export default new InitializationTest(); 