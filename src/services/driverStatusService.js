import { auth, db } from './firebase/config';
import { 
  doc, 
  updateDoc, 
  setDoc,
  onSnapshot, 
  getDoc, 
  GeoPoint, 
  serverTimestamp 
} from 'firebase/firestore';
import { getCurrentLocation } from './location';

// Import simple location service that won't crash
import SimpleLocationService from './simpleLocationService';

class DriverStatusService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.currentDriverId = null;
    this.statusListeners = new Map();
    this.locationUpdateInterval = null;
    this.isOnline = false;
  }

  // Initialize service with current driver
  async initialize(driverId, userData = null) {
    this.currentDriverId = driverId;
    
    // Initialize driver document with timeout
    try {
      await Promise.race([
        this.initializeDriverDocument(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Driver document init timeout')), 3000)
        )
      ]);
    } catch (error) {
      console.warn('⚠️ Driver document initialization timeout/error:', error);
      // Continue anyway
    }
    
    // Initialize simple location service with timeout
    try {
      await Promise.race([
        SimpleLocationService.initialize(driverId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location service init timeout')), 2000)
        )
      ]);
      console.log('✅ Simple location service initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize location service:', error);
      // Continue anyway
    }
    
    // Update with user data if provided (with timeout)
    if (userData) {
      try {
        await Promise.race([
          this.updateDriverInfo(userData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Update driver info timeout')), 2000)
          )
        ]);
      } catch (error) {
        console.warn('⚠️ Update driver info timeout/error:', error);
        // Continue anyway
      }
    }
  }

  // Check if service is initialized
  isInitialized() {
    return this.currentDriverId !== null;
  }

  // Update driver information with user data
  async updateDriverInfo(userData) {
    if (!this.currentDriverId) {
      return;
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      await updateDoc(driverRef, {
        email: userData.email || '',
        displayName: userData.displayName || 'Driver',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating driver info:', error);
    }
  }

  // Initialize driver document for mobile app (don't overwrite existing web app data)
  async initializeDriverDocument() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      
      // Check if document exists first
      const driverDoc = await getDoc(driverRef);
      
      if (driverDoc.exists()) {
        console.log('✅ Driver document already exists, using existing data');
        // Document exists, just update mobile-specific fields
        await updateDoc(driverRef, {
          mobileAppStatus: {
            accountCreated: true,
            accountCreatedAt: serverTimestamp(),
            lastMobileLogin: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      } else {
        console.log('⚠️ Driver document not found, creating basic mobile app document');
        // Document doesn't exist, create a basic one for mobile app
        await setDoc(driverRef, {
          userId: this.currentDriverId,
          email: '',
          status: 'offline',
          isOnline: false,
          mobileAppStatus: {
            accountCreated: true,
            accountCreatedAt: serverTimestamp(),
            lastMobileLogin: serverTimestamp()
          },
          lastStatusUpdate: serverTimestamp(),
          lastLocationUpdate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error initializing driver document:', error);
    }
  }

  // Update driver status
  async updateDriverStatus(status) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      await updateDoc(driverRef, {
        status: status,
        isOnline: status === 'available',
        lastStatusUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.isOnline = status === 'available';
      return { success: true, status };
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      throw error;
    }
  }

  // Update driver location
  async updateDriverLocation(location) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      await updateDoc(driverRef, {
        location: new GeoPoint(location.latitude, location.longitude),
        lastLocationUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating driver location:', error);
      throw error;
    }
  }

  // Start automatic location updates using simple service
  async startLocationUpdates(intervalMs = 30000) {
    try {
      const result = await SimpleLocationService.startTracking();
      
      if (result && result.success) {
        // console.log('📍 Simple location tracking started');
        return { success: true, usingSimpleService: true };
      } else {
        console.warn('⚠️ Simple location service failed, using basic fallback');
        return this.startBasicLocationUpdates(intervalMs);
      }
    } catch (error) {
      console.warn('⚠️ Error with location tracking, using fallback:', error);
      return this.startBasicLocationUpdates(intervalMs);
    }
  }

  // Fallback basic location updates (legacy method)
  async startBasicLocationUpdates(intervalMs = 30000) {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    this.locationUpdateInterval = setInterval(async () => {
      try {
        const location = await getCurrentLocation();
        await this.updateDriverLocation(location);
      } catch (error) {
        console.error('Error in location update interval:', error);
      }
    }, intervalMs);

    // console.log('📍 Basic location tracking started');
    return { success: true, usingRealTimeService: false };
  }

  // Stop automatic location updates
  async stopLocationUpdates() {
    try {
      // Stop simple location tracking
      await SimpleLocationService.stopTracking();
    } catch (error) {
      console.warn('⚠️ Error stopping location service:', error);
    }

    // Also stop basic location updates (fallback)
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }

    // console.log('🛑 Location tracking stopped');
  }

  // Listen for driver status changes
  listenForDriverStatus(callback) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    // console.log('🔍 Listening for driver status for driverId:', this.currentDriverId);
    const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
    
    const unsubscribe = onSnapshot(driverRef, (doc) => {
      // console.log('📊 Driver status snapshot received:', doc.exists() ? 'exists' : 'not found');
      if (doc.exists()) {
        const driverData = doc.data();
        callback({
          id: doc.id,
          ...driverData,
          isOnline: driverData.isOnline || false,
          status: driverData.status || 'offline'
        });
      } else {
        console.warn('⚠️ Driver document not found in driverApplications collection');
        // Call callback with default offline status
        callback({
          id: this.currentDriverId,
          isOnline: false,
          status: 'offline'
        });
      }
    }, (error) => {
      console.error('❌ Error listening to driver status:', error);
    });

    this.statusListeners.set('driverStatus', unsubscribe);
    return unsubscribe;
  }

  // Get current driver status
  async getCurrentDriverStatus() {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      const driverDoc = await getDoc(driverRef);
      
      if (driverDoc.exists()) {
        const driverData = driverDoc.data();
        return {
          id: driverDoc.id,
          ...driverData,
          isOnline: driverData.isOnline || false,
          status: driverData.status || 'offline'
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting driver status:', error);
      throw error;
    }
  }

  // Go online
  async goOnline() {
    if (!this.isInitialized()) {
      throw new Error('DriverStatusService not initialized. Call initialize() first.');
    }
    await this.updateDriverStatus('available');
    await this.startLocationUpdates();
  }

  // Go offline
  async goOffline() {
    if (!this.isInitialized()) {
      throw new Error('DriverStatusService not initialized. Call initialize() first.');
    }
    await this.updateDriverStatus('offline');
    this.stopLocationUpdates();
  }

  // Set busy status (during ride)
  async setBusy() {
    await this.updateDriverStatus('busy');
  }

  // Set break status
  async setBreak() {
    await this.updateDriverStatus('break');
  }

  // Cleanup listeners
  cleanup() {
    this.statusListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.statusListeners.clear();
    this.stopLocationUpdates();
  }
}

// Export singleton instance
export default new DriverStatusService(); 