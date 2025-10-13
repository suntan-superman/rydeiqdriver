import { auth, db } from './firebase/config';
import { Alert } from 'react-native';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  GeoPoint,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import FirebaseIndexHelper from '@/utils/firebaseIndexHelper';

class RideRequestService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.rideRequestListeners = new Map();
    this.currentDriverId = null;
    this.declinedRideRequests = new Set(); // Track declined/ignored ride requests
  }

  // Initialize service with current driver
  initialize(driverId) {
    this.currentDriverId = driverId;
    this.startListeningForRideRequests();
    
    // Log index requirements in development
    if (__DEV__) {
      FirebaseIndexHelper.checkIndexRequirements();
    }
  }

  // Check if service is initialized
  isInitialized() {
    return this.currentDriverId !== null;
  }

  // Helper: Check if driver's vehicle type can fulfill the requested vehicle type
  canVehicleTypeFulfillRequest(driverVehicleType, requestedVehicleType) {
    // If no driver vehicle type specified, assume standard
    const driverType = driverVehicleType || 'standard';
    const requestType = requestedVehicleType || 'standard';
    
    // Exact match always works
    if (driverType === requestType) {
      return true;
    }
    
    // Large vehicles can accept standard requests (they're just bigger)
    if (driverType === 'large' && requestType === 'standard') {
      return true;
    }
    
    // Standard vehicles cannot accept large requests (not enough capacity)
    if (driverType === 'standard' && requestType === 'large') {
      return false;
    }
    
    // Specialty vehicles (wheelchair_accessible, tow_truck, etc.) must match exactly
    // They cannot accept standard or large requests
    return false;
  }

  // DEBUG: Check existing ride requests for this driver
  async debugCheckExistingRequests() {
    // Removed debug logging
  }

  // Start listening for incoming ride requests
  startListeningForRideRequests() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }

    // IMPORTANT: Don't create duplicate listeners
    if (this.rideRequestListeners.has('rideRequests')) {
      console.log('📡 Ride request listener already active, skipping duplicate');
      return;
    }

    const rideRequestsRef = collection(this.db, 'rideRequests');
    
    // SIMPLIFIED QUERY - Listen for broadcast requests where this driver is in availableDrivers array
    const q = query(
      rideRequestsRef,
      where('availableDrivers', 'array-contains', this.currentDriverId),
      where('status', 'in', ['open_for_bids', 'pending'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const rideRequest = change.doc.data();
          // Add the document ID to the ride request data
          rideRequest.id = change.doc.id;
          
          // Check if driver has already declined this request
          if (this.declinedRideRequests.has(rideRequest.id)) {
            return;
          }
          
          // IMPORTANT: Filter out old ride requests (older than 30 minutes)
          // This prevents showing old requests when the listener first starts
          const now = Date.now();
          const thirtyMinutesAgo = now - (30 * 60 * 1000);
          const requestTimestamp = rideRequest.timestamp?.toMillis?.() || rideRequest.timestamp || rideRequest.createdAt || 0;
          
          if (requestTimestamp < thirtyMinutesAgo) {
            // Silently skip old ride requests
            return;
          }
          
          // Server-side filtering is now handled by the query
          this.handleNewRideRequest(rideRequest);
        }
      });
    }, (error) => {
      // Silently handle permission errors (user logged out)
      if (error.code === 'permission-denied' || 
          error.message?.includes('Missing or insufficient permissions')) {
        // User logged out - silently stop listening
        this.stopListeningForRideRequests();
        return;
      }
      
      // Handle index errors gracefully
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Firebase index required. Using simplified query.');
        // Fallback to simplified query if index is not available
        this.startListeningForRideRequestsFallback();
      } else {
        console.error('❌ Error in ride request listener:', error);
      }
    });

    this.rideRequestListeners.set('rideRequests', unsubscribe);
  }

  // Stop listening for new ride requests (when driver submits bid or goes offline)
  stopListeningForRideRequests() {
    if (this.rideRequestListeners.has('rideRequests')) {
      this.rideRequestListeners.get('rideRequests')();
      this.rideRequestListeners.delete('rideRequests');
    }
  }

  // Fallback method for when composite index is not available
  startListeningForRideRequestsFallback() {
    if (!this.currentDriverId) {
      return;
    }

    const rideRequestsRef = collection(this.db, 'rideRequests');
    
    // Calculate timestamp for last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Simplified query without timestamp filter
    const q = query(
      rideRequestsRef,
      where('availableDrivers', 'array-contains', this.currentDriverId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const rideRequest = change.doc.data();
          // Add the document ID to the ride request data
          rideRequest.id = change.doc.id;
          // Handle both broadcast and direct requests
          if (rideRequest.status === 'pending' || rideRequest.status === 'open_for_bids') {
            // Check if driver has already declined this request
            if (this.declinedRideRequests.has(rideRequest.id)) {
              console.log('🚫 Ignoring previously declined ride request:', rideRequest.id);
              return;
            }
            
            // Process the ride request (timestamp filtering is now done server-side)
            console.log('🔄 Processing recent ride request:', rideRequest.id);
            this.handleNewRideRequest(rideRequest);
          }
        }
      });
    }, (error) => {
      console.error('❌ Error in fallback ride request listener:', error);
    });

    this.rideRequestListeners.set('rideRequests', unsubscribe);
  }

  // Check if driver can fulfill ride request based on specialty vehicle capabilities
  async canDriverFulfillRequest(rideRequest, driverId) {
    try {
      // Get driver's specialty vehicle information
      const driverDoc = await getDoc(doc(this.db, 'driverApplications', driverId));
      if (!driverDoc.exists()) {
        return false;
      }
      
      const driverData = driverDoc.data();
      const specialtyVehicleInfo = driverData.specialtyVehicleInfo || {};
      
      // Try to get vehicle type from multiple possible locations
      const driverSpecialtyType = specialtyVehicleInfo.specialtyVehicleType || 
                                   driverData.vehicleType ||
                                   driverData.vehicleInfo?.vehicle_info?.vehicleType ||
                                   'standard';
      
      // Ensure service capabilities is always an array, never null
      const driverServiceCapabilities = Array.isArray(specialtyVehicleInfo.serviceCapabilities) 
        ? specialtyVehicleInfo.serviceCapabilities 
        : [];
      
      // Check if driver can fulfill the vehicle type requirement
      const requiredVehicleType = rideRequest.requiredVehicleType || 'standard';
      
      // Vehicle type matching logic:
      // - Large vehicles can accept both 'standard' and 'large' requests
      // - Standard vehicles can only accept 'standard' requests
      // - Specialty vehicles (wheelchair, tow_truck) must match exactly
      const canFulfillVehicleType = this.canVehicleTypeFulfillRequest(driverSpecialtyType, requiredVehicleType);
      
      if (!canFulfillVehicleType) {
        return false;
      }
      
      // Check if driver has required service capabilities
      // Ensure requiredCapabilities is also an array
      const requiredCapabilities = Array.isArray(rideRequest.requiredCapabilities) 
        ? rideRequest.requiredCapabilities 
        : [];
      const missingCapabilities = requiredCapabilities.filter(capability => 
        !driverServiceCapabilities.includes(capability)
      );
      
      if (missingCapabilities.length > 0) {
        return false;
      }
      
      // Check if driver has any of the optional preferences
      const optionalPreferences = Array.isArray(rideRequest.optionalPreferences) 
        ? rideRequest.optionalPreferences 
        : [];
      const hasOptionalCapabilities = optionalPreferences.some(preference => 
        driverServiceCapabilities.includes(preference)
      );
      
      // If there are optional preferences, driver should have at least one
      if (optionalPreferences.length > 0 && !hasOptionalCapabilities) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking driver capabilities:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  // Handle new ride request from rider
  async handleNewRideRequest(rideRequest) {
    // Check if driver can fulfill this request
    const canFulfill = await this.canDriverFulfillRequest(rideRequest, this.currentDriverId);
    if (!canFulfill) {
      return;
    }
    
    // Transform data for UI compatibility
    const transformedRequest = {
      id: rideRequest.id,
      customerId: rideRequest.riderId,
      customerName: rideRequest.riderInfo?.name || 'Rider',
      customerRating: rideRequest.riderInfo?.rating || 5.0,
      customerPhoto: null,
      pickup: {
        address: rideRequest.pickup?.address || 'Pickup location',
        coordinates: rideRequest.pickup?.coordinates || { lat: 0, lng: 0 }
      },
      destination: {
        address: rideRequest.dropoff?.address || 'Destination',
        coordinates: rideRequest.dropoff?.coordinates || { lat: 0, lng: 0 }
      },
      estimatedDistance: `${rideRequest.estimatedDistance?.toFixed(1) || '0'} miles`,
      estimatedDuration: rideRequest.estimatedDuration || '12 minutes',
      companyBid: rideRequest.estimatedPrice || 0,
      rideType: rideRequest.requiredVehicleType || 'standard',
      specialRequests: rideRequest.requiredCapabilities || [],
      optionalPreferences: rideRequest.optionalPreferences || [],
      distanceInMiles: rideRequest.distanceInMiles || 0
    };
    
    // Emit event for UI to handle
    if (this.onRideRequestReceived) {
      this.onRideRequestReceived(transformedRequest);
    }
  }

  // Accept ride request
  async acceptRideRequest(rideRequestId, bidAmount = null) {
    try {
      if (!this.isInitialized()) {
        throw new Error('RideRequestService not initialized. Call initialize() first.');
      }

      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      const rideRequest = rideRequestDoc.data();
      
      // Calculate final price (use bid amount if provided, otherwise use estimated price)
      const finalPrice = bidAmount || rideRequest.estimatedPrice;

      // Get driver info for acceptance - Steve Roy
      const driverInfo = {
        name: 'Steve Roy', // From existing driver: displayName
        rating: 4.8, // Default rating
        totalRides: 150 // Default rides
      };

      // Update ride request with acceptance
      await updateDoc(rideRequestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedDriver: {
          driverId: this.currentDriverId,
          ...driverInfo
        },
        acceptedBid: finalPrice,
        driverResponse: {
          driverId: this.currentDriverId,
          acceptedAt: new Date(),
          finalPrice: finalPrice,
          estimatedArrival: this.calculateEstimatedArrival(rideRequest.pickup)
        }
      });

      return { success: true, rideRequestId, finalPrice };
    } catch (error) {
      console.error('❌ Error accepting ride request:', error);
      throw error;
    }
  }

  // Reject ride request
  async rejectRideRequest(rideRequestId, reason = 'driver_unavailable') {
    try {
      if (!this.isInitialized()) {
        throw new Error('RideRequestService not initialized. Call initialize() first.');
      }

      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      
      await updateDoc(rideRequestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: reason,
        driverResponse: {
          driverId: this.currentDriverId,
          rejectedAt: new Date(),
          reason: reason
        }
      });

      return { success: true, rideRequestId };
    } catch (error) {
      console.error('❌ Error rejecting ride request:', error);
      throw error;
    }
  }

  // Accept a specific driver's bid (for rider app to call)
  async acceptDriverBid(rideRequestId, selectedBid) {
    try {
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      const rideRequest = rideRequestDoc.data();
      
      // Update ride request with bid acceptance
      await updateDoc(rideRequestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedDriver: {
          driverId: selectedBid.driverId,
          name: selectedBid.driverInfo?.name || 'Driver',
          rating: selectedBid.driverInfo?.rating || 4.8,
          totalRides: selectedBid.driverInfo?.totalRides || 100
        },
        acceptedBid: selectedBid.bidAmount,
        finalPrice: selectedBid.bidAmount
      });

      // console.log('✅ Driver bid accepted:', { rideRequestId, driverId: selectedBid.driverId, bidAmount: selectedBid.bidAmount });
      return { success: true, rideRequestId, selectedBid };
    } catch (error) {
      console.error('❌ Error accepting driver bid:', error);
      throw error;
    }
  }

  // Submit custom bid for ride request
  async submitCustomBid(rideRequestId, bidAmount, bidType = 'custom') {
    try {
      if (!this.isInitialized()) {
        throw new Error('RideRequestService not initialized. Call initialize() first.');
      }

      // ✅ RELIABILITY CHECK: Check if driver is in cooldown
      const reliabilityService = (await import('./reliabilityService')).default;
      const cooldownCheck = await reliabilityService.checkCooldown(this.currentDriverId);
      
      if (cooldownCheck.isInCooldown) {
        const error = new Error(`You cannot bid while in cooldown. Please wait ${cooldownCheck.retrySec} seconds.`);
        error.code = 'BID_COOLDOWN';
        error.retrySec = cooldownCheck.retrySec;
        error.reason = cooldownCheck.reason;
        throw error;
      }

      // ✅ RELIABILITY CHECK: Check if driver can bid on this specific ride
      const eligibilityCheck = await reliabilityService.checkBidEligibility(
        this.currentDriverId,
        rideRequestId
      );
      
      if (!eligibilityCheck.canBid) {
        const error = new Error(eligibilityCheck.reason || 'You cannot bid on this ride');
        error.code = 'BID_LOCKED';
        error.type = eligibilityCheck.type;
        throw error;
      }

      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      const rideRequest = rideRequestDoc.data();
      
      // Get driver's specialty vehicle information
      const driverDoc = await getDoc(doc(this.db, 'driverApplications', this.currentDriverId));
      let driverData = {};
      if (driverDoc.exists()) {
        driverData = driverDoc.data();
      }
      
      const vehicleInfo = {
        make: driverData.vehicle_info?.make || driverData.vehicleInfo?.make || 'Jeep',
        model: driverData.vehicle_info?.model || driverData.vehicleInfo?.model || 'Wrangler',
        color: driverData.vehicle_info?.color || driverData.vehicleInfo?.color || 'Black'
      };

      const specialtyVehicleInfo = driverData.specialtyVehicleInfo || {};
      
      const driverInfo = {
        name: driverData.displayName || 'Driver',
        rating: 4.8, // Default rating (can be calculated from reviews later)
        reviewCount: 150, // Changed from totalRides to reviewCount to match rider expectations
        vehicleInfo: vehicleInfo, // Move vehicleInfo inside driverInfo to match rider structure
        specialtyVehicleType: specialtyVehicleInfo.specialtyVehicleType,
        serviceCapabilities: specialtyVehicleInfo.serviceCapabilities || []
      };

      // Validate bid amount with proper limits
      const validatedBidAmount = this.validateBidAmount(bidAmount, rideRequest);
      
      const newBid = {
        driverId: this.currentDriverId,
        bidAmount: validatedBidAmount,
        bidType: bidType,
        submittedAt: new Date(),
        driverInfo: driverInfo,
        estimatedArrival: 5, // TODO: Calculate based on driver location
        distanceFromPickup: 0.5, // Add missing field that rider expects
        specialtyVehicleType: specialtyVehicleInfo.specialtyVehicleType,
        serviceCapabilities: specialtyVehicleInfo.serviceCapabilities || [],
        canFulfillRequirements: true // Driver has already been validated
      };

      // For broadcast requests, append to driverBids array (consistent with rider app)
      if (rideRequest.status === 'open_for_bids') {
        await updateDoc(rideRequestRef, {
          driverBids: arrayUnion(newBid),
          lastBidUpdate: new Date()
        });
      } else {
        // For direct requests, use legacy format
        await updateDoc(rideRequestRef, {
          status: 'bidding',
          bidSubmittedAt: new Date(),
          driverBid: newBid
        });
      }

      // console.log('💰 Custom bid submitted:', validatedBidAmount);
      
      // Stop listening for new ride requests once bid is submitted
      this.stopListeningForRideRequests();
      console.log('🛑 Stopped listening for new ride requests after bid submission');
      
      // ✅ RELIABILITY METRIC: Track bid submission (will be used for scoring)
      // This will be incremented when bid is awarded (handled by Cloud Functions or rider app)
      
      return { success: true, rideRequestId, bidAmount: validatedBidAmount };
    } catch (error) {
      console.error('❌ Error submitting bid:', error);
      // Pass through reliability errors with their codes
      if (error.code === 'BID_COOLDOWN' || error.code === 'BID_LOCKED') {
        throw error;
      }
      throw error;
    }
  }

  // Validate bid amount against minimum and maximum limits (using configurable values)
  validateBidAmount(bidAmount, rideRequest) {
    // Configuration values (can be updated by admin via web app)
    const MINIMUM_FARE = 5.00; // $5 minimum - configurable
    const MAXIMUM_FARE_PER_MILE = 7.50; // $7.50 per mile maximum - configurable
    
    // Calculate maximum allowed bid based on distance
    const distance = rideRequest.estimatedDistance || rideRequest.distanceInMiles || 2.5; // fallback to 2.5 miles
    const maxAllowedBid = MINIMUM_FARE + (distance * MAXIMUM_FARE_PER_MILE);
    
    // Validate and constrain bid amount
    let validatedBid = parseFloat(bidAmount);
    
    if (isNaN(validatedBid) || !isFinite(validatedBid)) {
      console.warn('⚠️ Invalid bid amount, using minimum fare');
      validatedBid = MINIMUM_FARE;
    }
    
    // Apply minimum constraint
    if (validatedBid < MINIMUM_FARE) {
      console.warn(`⚠️ Bid amount $${bidAmount} below minimum $${MINIMUM_FARE}, adjusting to minimum`);
      validatedBid = MINIMUM_FARE;
    }
    
    // Apply maximum constraint
    if (validatedBid > maxAllowedBid) {
      console.warn(`⚠️ Bid amount $${bidAmount} exceeds maximum $${maxAllowedBid.toFixed(2)} for ${distance} miles, adjusting to maximum`);
      validatedBid = maxAllowedBid;
    }
    
    // Round to 2 decimal places
    validatedBid = Math.round(validatedBid * 100) / 100;
    
    // if (__DEV__) {
    //   console.log('💰 Bid validation:', {
    //     originalBid: bidAmount,
    //     distance: distance,
    //     minimumFare: MINIMUM_FARE,
    //     maxAllowedBid: maxAllowedBid.toFixed(2),
    //     validatedBid: validatedBid
    //   });
    // }
    
    return validatedBid;
  }

  // Get active ride requests for current driver
  async getActiveRideRequests() {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const rideRequestsRef = collection(this.db, 'rideRequests');
      
      // OPTIMIZED QUERY - Listen for both direct and broadcast requests
      const q = query(
        rideRequestsRef,
        where('availableDrivers', 'array-contains', this.currentDriverId),
        where('status', 'in', ['pending', 'bidding', 'open_for_bids']),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const rideRequests = [];
      
      snapshot.forEach(doc => {
        rideRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return rideRequests;
    } catch (error) {
      // Fallback to simplified query if index is not available
      if (error.code === 'failed-precondition') {
        return this.getActiveRideRequestsFallback();
      }
      console.error('❌ Error getting active ride requests:', error);
      throw error;
    }
  }

  // Fallback method for getting active ride requests
  async getActiveRideRequestsFallback() {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const rideRequestsRef = collection(this.db, 'rideRequests');
      const q = query(
        rideRequestsRef,
        where('availableDrivers', 'array-contains', this.currentDriverId)
      );

      const snapshot = await getDocs(q);
      const rideRequests = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter active requests in memory
        if (data.status === 'pending' || data.status === 'bidding' || data.status === 'open_for_bids') {
          rideRequests.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by timestamp in memory
      rideRequests.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return timeB - timeA; // Descending order
      });

      return rideRequests;
    } catch (error) {
      console.error('❌ Error getting active ride requests (fallback):', error);
      throw error;
    }
  }

  // Get ride request details
  async getRideRequestDetails(rideRequestId) {
    try {
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      return {
        id: rideRequestDoc.id,
        ...rideRequestDoc.data()
      };
    } catch (error) {
      console.error('❌ Error getting ride request details:', error);
      throw error;
    }
  }

  // Update driver status (online/offline)
  async updateDriverStatus(status) {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const driverRef = doc(this.db, 'driverApplications', this.currentDriverId);
      await updateDoc(driverRef, {
        status: status,
        isOnline: status === 'available',
        lastStatusUpdate: new Date()
      });

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
        lastLocationUpdate: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating driver location:', error);
      throw error;
    }
  }

  // Mark a ride request as declined by this driver
  declineRideRequest(rideRequestId) {
    this.declinedRideRequests.add(rideRequestId);
    console.log('🚫 Marked ride request as declined:', rideRequestId);
    console.log('📝 Total declined requests:', this.declinedRideRequests.size);
    console.log('📝 Declined list:', Array.from(this.declinedRideRequests));
  }

  // Clear all declined requests (useful for new session or periodic cleanup)
  clearDeclinedRequests() {
    const count = this.declinedRideRequests.size;
    this.declinedRideRequests.clear();
    // console.log('🧹 Cleared', count, 'declined ride requests');
  }

  // Force clear all listeners and restart fresh (useful for getting out of loops)
  forceRestartListening() {
    // console.log('🔄 Force restarting all ride request listeners...');
    
    // Stop all existing listeners
    this.stopListeningForRideRequests();
    
    // Clear declined requests on force restart (fresh session)
    this.clearDeclinedRequests();
    
    // Wait a moment for cleanup
    setTimeout(() => {
      // Start listening again with fresh state
      this.startListeningForRideRequests();
      // console.log('✅ Force restart completed - fresh listening state');
    }, 1000);
  }

  // Calculate estimated arrival time
  calculateEstimatedArrival(pickupLocation) {
    // Simple calculation - in production, use Google Maps API
    const estimatedMinutes = 5; // Default 5 minutes
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedMinutes);
    return estimatedArrival;
  }

  // Get driver's specialty vehicle capabilities
  async getDriverSpecialtyCapabilities(driverId) {
    try {
      const driverDoc = await getDoc(doc(this.db, 'driverApplications', driverId));
      if (!driverDoc.exists()) {
        return null;
      }
      
      const driverData = driverDoc.data();
      const specialtyVehicleInfo = driverData.specialtyVehicleInfo || {};
      
      return {
        specialtyVehicleType: specialtyVehicleInfo.specialtyVehicleType,
        serviceCapabilities: specialtyVehicleInfo.serviceCapabilities || [],
        certificationFiles: specialtyVehicleInfo.certificationFiles || {}
      };
    } catch (error) {
      console.error('Error getting driver specialty capabilities:', error);
      return null;
    }
  }

  // Set callback for new ride requests
  setRideRequestCallback(callback) {
    this.onRideRequestReceived = callback;
  }

  // Cleanup listeners
  cleanup() {
    this.rideRequestListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.rideRequestListeners.clear();
    this.currentDriverId = null; // Reset driver ID on cleanup
    this.clearDeclinedRequests(); // Clear declined requests
  }
}

// Export singleton instance
export default new RideRequestService(); 