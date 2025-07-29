import { auth, db } from './firebase/config';
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  getDoc,
  GeoPoint,
  serverTimestamp 
} from 'firebase/firestore';
import { getCurrentLocation } from './location';

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
  initialize(driverId) {
    this.currentDriverId = driverId;
    this.createDriverDocument();
  }

  // Create or update driver document
  async createDriverDocument() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }

    try {
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
      const currentUser = this.auth.currentUser;
      
      await updateDoc(driverRef, {
        id: this.currentDriverId,
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || 'Driver',
        status: 'offline',
        isOnline: false,
        lastStatusUpdate: serverTimestamp(),
        lastLocationUpdate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Driver document created/updated');
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
      console.log('📱 Driver status updated:', status);
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

  // Start automatic location updates
  async startLocationUpdates(intervalMs = 30000) {
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

    console.log('📍 Location updates started');
  }

  // Stop automatic location updates
  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
      console.log('📍 Location updates stopped');
    }
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
    await this.updateDriverStatus('available');
    await this.startLocationUpdates();
  }

  // Go offline
  async goOffline() {
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