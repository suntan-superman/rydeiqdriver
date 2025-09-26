import * as Location from 'expo-location';
import { doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { db } from './firebase/config';
import { getCurrentLocation, watchPosition, initializeLocationServices } from './location';

class RealTimeLocationService {
  constructor() {
    this.db = db;
    this.isTracking = false;
    this.locationSubscription = null;
    this.currentDriverId = null;
    this.lastLocationUpdate = null;
    this.updateInterval = 30000; // Update Firebase every 30 seconds
    this.forceUpdateDistance = 100; // Force update if moved more than 100 meters
    this.emulatorLocation = {
      latitude: 35.3733,  // Bakersfield, CA
      longitude: -119.0187
    };
  }

  // Initialize the service with driver ID
  async initialize(driverId) {
    try {
      this.currentDriverId = driverId;
      
      // Initialize location services
      const locationResult = await initializeLocationServices();
      
      if (!locationResult.success) {
        console.warn('⚠️ Location services not available, using emulator location for testing');
        // For emulator testing, set Bakersfield location
        await this.updateDriverLocationInFirebase(
          this.emulatorLocation.latitude,
          this.emulatorLocation.longitude,
          true // isEmulator
        );
        return { success: true, usingEmulatorLocation: true };
      }

      // console.log('✅ RealTimeLocationService initialized for driver:', driverId);
      return { success: true, locationPermissions: locationResult };
    } catch (error) {
      console.error('❌ Error initializing RealTimeLocationService:', error);
      return { success: false, error: error.message };
    }
  }

  // Start continuous location tracking
  async startTracking() {
    if (this.isTracking) {
      // console.log('📍 Location tracking already active');
      return { success: true, alreadyTracking: true };
    }

    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      // console.log('📍 Starting location tracking for driver:', this.currentDriverId);
      
      // Check if we're in emulator environment
      const isEmulator = await this.isRunningInEmulator();
      
      if (isEmulator) {
        // For emulator: Set Bakersfield location and start periodic updates
        await this.startEmulatorLocationTracking();
      } else {
        // For real device: Start GPS tracking
        await this.startGPSLocationTracking();
      }

      this.isTracking = true;
      return { success: true, isEmulator };
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Start emulator-specific location tracking
  async startEmulatorLocationTracking() {
    // console.log('🖥️ Starting emulator location tracking (Bakersfield, CA)');
    
    // Set initial location
    await this.updateDriverLocationInFirebase(
      this.emulatorLocation.latitude,
      this.emulatorLocation.longitude,
      true
    );

    // Update location every 60 seconds for emulator
    this.locationSubscription = setInterval(async () => {
      try {
        // Try to get emulator's mock location, fallback to Bakersfield
        const location = await getCurrentLocation();
        
        // If location is NYC (default fallback), use Bakersfield instead
        if (this.isNYCLocation(location)) {
          await this.updateDriverLocationInFirebase(
            this.emulatorLocation.latitude,
            this.emulatorLocation.longitude,
            true
          );
        } else {
          await this.updateDriverLocationInFirebase(
            location.latitude,
            location.longitude,
            true
          );
        }
      } catch (error) {
        console.warn('⚠️ Error in emulator location update, using Bakersfield coordinates');
        await this.updateDriverLocationInFirebase(
          this.emulatorLocation.latitude,
          this.emulatorLocation.longitude,
          true
        );
      }
    }, 60000); // Every 60 seconds for emulator
  }

  // Start GPS location tracking for real devices
  async startGPSLocationTracking() {
    // console.log('📱 Starting GPS location tracking');
    
    // Get initial location
    const initialLocation = await getCurrentLocation();
    await this.updateDriverLocationInFirebase(
      initialLocation.latitude,
      initialLocation.longitude,
      false
    );

    // Start watching position changes
    this.locationSubscription = await watchPosition(
      async (location) => {
        await this.handleLocationUpdate(location);
      },
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Check every 10 seconds
        distanceInterval: 50, // Update when moved 50+ meters
      }
    );
  }

  // Handle location updates
  async handleLocationUpdate(location) {
    try {
      // Validate location object
      if (!location || !location.coords) {
        console.warn('⚠️ Invalid location object received');
        return;
      }
      
      const { latitude, longitude } = location.coords;
      
      // Validate coordinates
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.warn('⚠️ Invalid coordinates received:', { latitude, longitude });
        return;
      }
      
      if (this.shouldUpdateLocation(latitude, longitude)) {
        await this.updateDriverLocationInFirebase(latitude, longitude, false);
        this.lastLocationUpdate = Date.now();
      }
    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }

  // Check if location should be updated
  shouldUpdateLocation(latitude, longitude) {
    // Validate inputs
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return false;
    }
    
    const now = Date.now();
    
    // Force update every 30 seconds
    if (!this.lastLocationUpdate || (now - this.lastLocationUpdate) > this.updateInterval) {
      return true;
    }

    // Update if moved significant distance
    if (this.lastKnownLocation && 
        this.lastKnownLocation.latitude && 
        this.lastKnownLocation.longitude) {
      const distance = this.calculateDistance(
        this.lastKnownLocation.latitude,
        this.lastKnownLocation.longitude,
        latitude,
        longitude
      );
      
      if (distance > this.forceUpdateDistance) {
        return true;
      }
    }

    return false;
  }

  // Update driver location in Firebase
  async updateDriverLocationInFirebase(latitude, longitude, isEmulator = false) {
    try {
      if (!this.currentDriverId) {
        throw new Error('Driver ID not set');
      }

      // Validate coordinates
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`Invalid coordinates: ${latitude}, ${longitude}`);
      }

      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error(`Coordinates out of range: ${latitude}, ${longitude}`);
      }

      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      const updateData = {
        location: new GeoPoint(latitude, longitude),
        lastLocationUpdate: new Date(),
        locationSource: isEmulator ? 'emulator' : 'gps',
        status: 'available', // Ensure driver stays available
        isOnline: true
      };

      await updateDoc(driverRef, updateData);
      
      this.lastKnownLocation = { latitude, longitude };
      
      // if (__DEV__) {
      //   console.log(`📍 Driver location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${isEmulator ? 'emulator' : 'GPS'})`);
      // }

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating driver location in Firebase:', error);
      throw error;
    }
  }

  // Stop location tracking
  async stopTracking() {
    try {
      // console.log('🛑 Stopping location tracking');
      
      if (this.locationSubscription) {
        if (typeof this.locationSubscription === 'object' && this.locationSubscription.remove) {
          // GPS subscription
          this.locationSubscription.remove();
        } else {
          // Interval subscription
          clearInterval(this.locationSubscription);
        }
        this.locationSubscription = null;
      }

      this.isTracking = false;
      
      // Update driver status to offline
      if (this.currentDriverId) {
        const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
        await updateDoc(driverRef, {
          isOnline: false,
          status: 'offline',
          lastStatusUpdate: new Date()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      driverId: this.currentDriverId,
      lastLocationUpdate: this.lastLocationUpdate,
      lastKnownLocation: this.lastKnownLocation
    };
  }

  // Force update location now
  async forceLocationUpdate() {
    try {
      // console.log('🔄 Forcing location update');
      
      const isEmulator = await this.isRunningInEmulator();
      
      if (isEmulator) {
        await this.updateDriverLocationInFirebase(
          this.emulatorLocation.latitude,
          this.emulatorLocation.longitude,
          true
        );
      } else {
        const location = await getCurrentLocation();
        await this.updateDriverLocationInFirebase(
          location.latitude,
          location.longitude,
          false
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error forcing location update:', error);
      return { success: false, error: error.message };
    }
  }

  // Set custom emulator location (for testing different cities)
  setEmulatorLocation(latitude, longitude) {
    this.emulatorLocation = { latitude, longitude };
    // console.log(`🖥️ Emulator location set to: ${latitude}, ${longitude}`);
  }

  // Utility methods
  isRunningInEmulator() {
    // Simple check - in a real app you might use expo-device
    return new Promise((resolve) => {
      // For now, assume emulator if we can't get reliable location
      getCurrentLocation().then((location) => {
        // If we get NYC coordinates, likely emulator fallback
        resolve(this.isNYCLocation(location));
      }).catch(() => {
        resolve(true); // Assume emulator if location fails
      });
    });
  }

  isNYCLocation(location) {
    // Check if location is the NYC fallback coordinates
    return (
      Math.abs(location.latitude - 40.7128) < 0.001 &&
      Math.abs(location.longitude - (-74.006)) < 0.001
    );
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }
}

export default new RealTimeLocationService();
