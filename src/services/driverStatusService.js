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
    await this.createDriverDocument();
    
    // Initialize simple location service
    try {
      await SimpleLocationService.initialize(driverId);
      console.log('✅ Simple location service initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize location service:', error);
    }
    
    // Update with user data if provided
    if (userData) {
      await this.updateDriverInfo(userData);
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
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
      await updateDoc(driverRef, {
        email: userData.email || '',
        displayName: userData.displayName || 'Driver',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating driver info:', error);
    }
  }

  // Create or update driver document
  async createDriverDocument() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }

    try {
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
      
      await setDoc(driverRef, {
        id: this.currentDriverId,
        email: '', // Will be updated when user data is available
        displayName: 'Driver',
        status: 'offline',
        isOnline: false,
        lastStatusUpdate: serverTimestamp(),
        lastLocationUpdate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Driver document created/updated
    } catch (error) {
      console.error('❌ Error creating driver document:', error);
    }
  }

  // Update driver status
  async updateDriverStatus(status) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
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
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
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
        console.log('📍 Simple location tracking started');
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

    console.log('📍 Basic location tracking started');
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

    console.log('🛑 Location tracking stopped');
  }

  // Listen for driver status changes
  listenForDriverStatus(callback) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    const driverRef = doc(this.db, 'drivers', this.currentDriverId);
    
    const unsubscribe = onSnapshot(driverRef, (doc) => {
      if (doc.exists()) {
        const driverData = doc.data();
        callback({
          id: doc.id,
          ...driverData,
          isOnline: driverData.isOnline || false,
          status: driverData.status || 'offline'
        });
      }
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
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
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