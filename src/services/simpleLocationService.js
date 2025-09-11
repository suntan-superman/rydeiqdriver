// Ultra-simple location service to prevent crashes
import { doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { db } from './firebase/config';

class SimpleLocationService {
  constructor() {
    this.currentDriverId = null;
    this.locationInterval = null;
    this.bakersFieldLocation = {
      latitude: 35.3733,
      longitude: -119.0187
    };
  }

  async initialize(driverId) {
    try {
      this.currentDriverId = driverId;
      console.log('📍 Simple location service initialized');
      
      // Set initial Bakersfield location
      await this.updateLocation();
      
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Simple location service init error:', error);
      return { success: false, error: error.message };
    }
  }

  async startTracking() {
    try {
      // Clear any existing interval
      if (this.locationInterval) {
        clearInterval(this.locationInterval);
      }

      // Update location immediately
      await this.updateLocation();

      // Set up interval for continuous updates
      this.locationInterval = setInterval(async () => {
        try {
          await this.updateLocation();
        } catch (error) {
          console.warn('⚠️ Location update error:', error);
        }
      }, 60000); // Every 60 seconds

      console.log('📍 Simple location tracking started (Bakersfield)');
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Error starting simple location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  async stopTracking() {
    try {
      if (this.locationInterval) {
        clearInterval(this.locationInterval);
        this.locationInterval = null;
      }
      console.log('🛑 Simple location tracking stopped');
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Error stopping location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  async updateLocation() {
    try {
      if (!this.currentDriverId) {
        return;
      }

      const driverRef = doc(db, 'drivers', this.currentDriverId);
      await updateDoc(driverRef, {
        location: new GeoPoint(
          this.bakersFieldLocation.latitude,
          this.bakersFieldLocation.longitude
        ),
        lastLocationUpdate: new Date(),
        locationSource: 'simple',
        status: 'available',
        isOnline: true
      });

      console.log('📍 Simple location updated: Bakersfield');
    } catch (error) {
      console.warn('⚠️ Error updating location:', error);
    }
  }

  setEmulatorLocation(latitude, longitude) {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      this.bakersFieldLocation = { latitude, longitude };
      console.log(`🖥️ Location set to: ${latitude}, ${longitude}`);
    }
  }

  async forceLocationUpdate() {
    try {
      await this.updateLocation();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTrackingStatus() {
    return {
      isTracking: !!this.locationInterval,
      driverId: this.currentDriverId,
      lastKnownLocation: this.bakersFieldLocation
    };
  }
}

export default new SimpleLocationService();
