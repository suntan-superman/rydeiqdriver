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

  // Start listening for incoming ride requests
  startListeningForRideRequests() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }



    const rideRequestsRef = collection(this.db, 'rideRequests');
    
    // UPDATED QUERY - Listen for broadcast requests where this driver is in availableDrivers array
    const q = query(
      rideRequestsRef,
      where('availableDrivers', 'array-contains', this.currentDriverId),
      where('status', 'in', ['open_for_bids', 'pending']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const rideRequest = change.doc.data();
          // Add the document ID to the ride request data
          rideRequest.id = change.doc.id;
          // Server-side filtering is now handled by the query
          this.handleNewRideRequest(rideRequest);
        }
      });
    }, (error) => {
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
    console.log('🛑 Stopping ride request listener');
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
    
    // Simplified query - listen for broadcast requests
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
          // Handle both broadcast and direct requests (client-side filtering)
          if (rideRequest.status === 'pending' || rideRequest.status === 'open_for_bids') {
            // Check if driver has already declined this request
            if (this.declinedRideRequests.has(rideRequest.id)) {
              console.log('🚫 Ignoring previously declined ride request:', rideRequest.id);
              return;
            }
            
            // Check if the ride request is not expired (within last 10 minutes)
            const now = new Date();
            let rideRequestTime;
            
            try {
              if (rideRequest.timestamp && rideRequest.timestamp.toDate) {
                // Firestore Timestamp
                rideRequestTime = rideRequest.timestamp.toDate();
              } else if (rideRequest.timestamp) {
                // Regular Date or timestamp
                rideRequestTime = new Date(rideRequest.timestamp);
              } else {
                // No timestamp, treat as current (for safety)
                rideRequestTime = now;
              }
              
              const timeDiff = now - rideRequestTime;
              const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
              
              if (timeDiff <= tenMinutes) {
                console.log('🔄 Processing recent ride request:', rideRequest.id, 'Age:', Math.round(timeDiff / 1000), 'seconds');
                this.handleNewRideRequest(rideRequest);
              } else {
                console.log('⏰ Ignoring old ride request:', rideRequest.id, 'Age:', Math.round(timeDiff / 60000), 'minutes');
              }
            } catch (timeError) {
              console.warn('⚠️ Error processing ride request timestamp, allowing it through:', timeError);
              this.handleNewRideRequest(rideRequest);
            }
          }
        }
      });
    }, (error) => {
      console.error('❌ Error in fallback ride request listener:', error);
    });

    this.rideRequestListeners.set('rideRequests', unsubscribe);
  }

  // Handle new ride request from rider
  handleNewRideRequest(rideRequest) {
    
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
      rideType: 'standard',
      specialRequests: [],
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

      console.log('✅ Driver bid accepted:', { rideRequestId, driverId: selectedBid.driverId, bidAmount: selectedBid.bidAmount });
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

      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      const rideRequest = rideRequestDoc.data();
      
      // Get driver info from stored profile or use defaults for Steve Roy  
      const vehicleInfo = {
        make: 'Jeep', // From existing driver: vehicleInfo.vehicle_info.make
        model: 'Wrangler', // From existing driver: vehicleInfo.vehicle_info.model
        color: 'Black' // From existing driver: vehicleInfo.vehicle_info.color
      };

      const driverInfo = {
        name: 'Steve Roy', // From existing driver: displayName
        rating: 4.8, // Default rating (can be calculated from reviews later)
        reviewCount: 150, // Changed from totalRides to reviewCount to match rider expectations
        vehicleInfo: vehicleInfo // Move vehicleInfo inside driverInfo to match rider structure
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
        distanceFromPickup: 0.5 // Add missing field that rider expects
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

      console.log('💰 Custom bid submitted:', validatedBidAmount);
      
      // Stop listening for new ride requests once bid is submitted
      this.stopListeningForRideRequests();
      console.log('🛑 Stopped listening for new ride requests after bid submission');
      
      return { success: true, rideRequestId, bidAmount: validatedBidAmount };
    } catch (error) {
      console.error('❌ Error submitting bid:', error);
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
    
    if (__DEV__) {
      console.log('💰 Bid validation:', {
        originalBid: bidAmount,
        distance: distance,
        minimumFare: MINIMUM_FARE,
        maxAllowedBid: maxAllowedBid.toFixed(2),
        validatedBid: validatedBid
      });
    }
    
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
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
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
      const driverRef = doc(this.db, 'drivers', this.currentDriverId);
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
  }

  // Clear all declined requests (useful for new session or periodic cleanup)
  clearDeclinedRequests() {
    const count = this.declinedRideRequests.size;
    this.declinedRideRequests.clear();
    console.log('🧹 Cleared', count, 'declined ride requests');
  }

  // Force clear all listeners and restart fresh (useful for getting out of loops)
  forceRestartListening() {
    console.log('🔄 Force restarting all ride request listeners...');
    
    // Stop all existing listeners
    this.stopListeningForRideRequests();
    
    // Clear declined requests on force restart (fresh session)
    this.clearDeclinedRequests();
    
    // Wait a moment for cleanup
    setTimeout(() => {
      // Start listening again with fresh state
      this.startListeningForRideRequests();
      console.log('✅ Force restart completed - fresh listening state');
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
  }
}

// Export singleton instance
export default new RideRequestService(); 