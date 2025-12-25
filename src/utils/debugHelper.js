import { auth, db } from '../services/firebase/config';

class DebugHelper {
  constructor() {
    this.isDebugMode = __DEV__;
  }

  // Log debug information
  log(message, data = null) {
    if (this.isDebugMode) {
      if (data) {
        console.log(`🔍 [DEBUG] ${message}`, data);
      } else {
        console.log(`🔍 [DEBUG] ${message}`);
      }
    }
  }

  // Check Firebase connection
  async checkFirebaseConnection() {
    try {
      this.log('Checking Firebase connection...');
      
      // Check if auth is available
      if (!auth) {
        this.log('❌ Firebase Auth is not available');
        return { success: false, error: 'Firebase Auth not available' };
      }

      // Check if db is available
      if (!db) {
        this.log('❌ Firebase Firestore is not available');
        return { success: false, error: 'Firebase Firestore not available' };
      }

      // Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        this.log('✅ Firebase Auth user found', {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        });
      } else {
        this.log('⚠️ No authenticated user found');
      }

      this.log('✅ Firebase connection check completed');
      return { success: true, user: currentUser };
    } catch (error) {
      this.log('❌ Firebase connection check failed', error);
      return { success: false, error: error.message };
    }
  }

  // Check service initialization
  async checkServiceInitialization() {
    try {
      this.log('Checking service initialization...');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        this.log('❌ Cannot check services - no authenticated user');
        return { success: false, error: 'No authenticated user' };
      }

      // Test RideRequestService
      try {
        const RideRequestService = require('@/services/rideRequestService').default;
        this.log('✅ RideRequestService imported successfully');
      } catch (error) {
        this.log('❌ RideRequestService import failed', error);
      }

      // Test DriverStatusService
      try {
        const DriverStatusService = require('@/services/driverStatusService').default;
        this.log('✅ DriverStatusService imported successfully');
      } catch (error) {
        this.log('❌ DriverStatusService import failed', error);
      }

      // Test RideRequestModal
      try {
        const RideRequestModal = require('@/components/RideRequestModal').default;
        this.log('✅ RideRequestModal imported successfully');
      } catch (error) {
        this.log('❌ RideRequestModal import failed', error);
      }

      this.log('✅ Service initialization check completed');
      return { success: true };
    } catch (error) {
      this.log('❌ Service initialization check failed', error);
      return { success: false, error: error.message };
    }
  }

  // Check user authentication state
  checkUserAuthState() {
    try {
      this.log('Checking user authentication state...');
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        this.log('✅ User is authenticated', {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          emailVerified: currentUser.emailVerified,
          isAnonymous: currentUser.isAnonymous
        });
        return { success: true, user: currentUser };
      } else {
        this.log('⚠️ User is not authenticated');
        return { success: false, error: 'User not authenticated' };
      }
    } catch (error) {
      this.log('❌ User auth state check failed', error);
      return { success: false, error: error.message };
    }
  }

  // Run comprehensive debug check
  async runDebugCheck() {
    this.log('🚀 Starting comprehensive debug check...');
    
    const results = {
      firebase: await this.checkFirebaseConnection(),
      services: await this.checkServiceInitialization(),
      auth: this.checkUserAuthState()
    };

    this.log('📊 Debug check results', results);

    const allPassed = results.firebase.success && 
                     results.services.success && 
                     results.auth.success;

    if (allPassed) {
      this.log('🎉 All debug checks passed!');
    } else {
      this.log('⚠️ Some debug checks failed');
    }

    return {
      success: allPassed,
      results
    };
  }

  // Get system information
  getSystemInfo() {
    return {
      platform: require('react-native').Platform.OS,
      version: require('react-native').Platform.Version,
      isDebug: this.isDebugMode,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export default new DebugHelper(); 