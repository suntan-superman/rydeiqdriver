// Simple fallback location service for testing
import { getCurrentLocation } from './location';
import { doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { db } from './firebase/config';

class LocationFallback {
  constructor() {
    this.currentDriverId = null;
    this.isTracking = false;
    this.locationInterval = null;
    this.emulatorLocation = {
      latitude: 35.3733,  // Bakersfield, CA
      longitude: -119.0187
    };
  }

  async initialize(driverId) {
    this.currentDriverId = driverId;
    console.log('📍 Location fallback initialized for:', driverId);
    return { success: true };
  }

  async startTracking() {
    if (this.isTracking) {
      return { success: true, alreadyTracking: true };
    }

    try {
      // Set Bakersfield location immediately
      await this.setDriverLocation(
        this.emulatorLocation.latitude,
        this.emulatorLocation.longitude
      );

      // Update every 60 seconds
      this.locationInterval = setInterval(async () => {
        try {
          await this.setDriverLocation(
            this.emulatorLocation.latitude,
            this.emulatorLocation.longitude
          );
        } catch (error) {
          console.warn('⚠️ Error in location update:', error);
        }
      }, 60000);

      this.isTracking = true;
      console.log('📍 Fallback location tracking started (Bakersfield)');
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting fallback location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  async stopTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
    this.isTracking = false;
    console.log('🛑 Fallback location tracking stopped');
    return { success: true };
  }

  async setDriverLocation(latitude, longitude) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set');
    }

    const driverRef = doc(db, 'drivers', this.currentDriverId);
    await updateDoc(driverRef, {
      location: new GeoPoint(latitude, longitude),
      lastLocationUpdate: new Date(),
      locationSource: 'fallback',
      status: 'available',
      isOnline: true
    });

    console.log(`📍 Fallback location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }

  setEmulatorLocation(latitude, longitude) {
    this.emulatorLocation = { latitude, longitude };
    console.log(`🖥️ Fallback emulator location set to: ${latitude}, ${longitude}`);
  }

  async forceLocationUpdate() {
    try {
      await this.setDriverLocation(
        this.emulatorLocation.latitude,
        this.emulatorLocation.longitude
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Error in fallback force update:', error);
      return { success: false, error: error.message };
    }
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      driverId: this.currentDriverId,
      lastKnownLocation: this.emulatorLocation
    };
  }
}

export default new LocationFallback();
