import { auth, db } from './firebase/config';
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
  writeBatch
} from 'firebase/firestore';

class RideRequestService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.rideRequestListeners = new Map();
    this.currentDriverId = null;
  }

  // Initialize service with current driver
  initialize(driverId) {
    this.currentDriverId = driverId;
    this.startListeningForRideRequests();
  }

  // Start listening for incoming ride requests
  startListeningForRideRequests() {
    if (!this.currentDriverId) {
      console.error('Driver ID not set. Call initialize() first.');
      return;
    }

    const rideRequestsRef = collection(this.db, 'rideRequests');
    const q = query(
      rideRequestsRef,
      where('driverId', '==', this.currentDriverId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const rideRequest = change.doc.data();
          this.handleNewRideRequest(rideRequest);
        }
      });
    });

    this.rideRequestListeners.set('rideRequests', unsubscribe);
  }

  // Handle new ride request from rider
  handleNewRideRequest(rideRequest) {
    console.log('🚗 New ride request received:', rideRequest.id);
    
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
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      const rideRequestDoc = await getDoc(rideRequestRef);
      
      if (!rideRequestDoc.exists()) {
        throw new Error('Ride request not found');
      }

      const rideRequest = rideRequestDoc.data();
      
      // Calculate final price (use bid amount if provided, otherwise use estimated price)
      const finalPrice = bidAmount || rideRequest.estimatedPrice;

      // Update ride request with acceptance
      await updateDoc(rideRequestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        driverResponse: {
          driverId: this.currentDriverId,
          acceptedAt: new Date(),
          finalPrice: finalPrice,
          estimatedArrival: this.calculateEstimatedArrival(rideRequest.pickup)
        }
      });

      console.log('✅ Ride request accepted:', rideRequestId);
      return { success: true, rideRequestId, finalPrice };
    } catch (error) {
      console.error('❌ Error accepting ride request:', error);
      throw error;
    }
  }

  // Reject ride request
  async rejectRideRequest(rideRequestId, reason = 'driver_unavailable') {
    try {
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

      console.log('❌ Ride request rejected:', rideRequestId);
      return { success: true, rideRequestId };
    } catch (error) {
      console.error('❌ Error rejecting ride request:', error);
      throw error;
    }
  }

  // Submit custom bid for ride request
  async submitCustomBid(rideRequestId, bidAmount, bidType = 'custom') {
    try {
      const rideRequestRef = doc(this.db, 'rideRequests', rideRequestId);
      
      await updateDoc(rideRequestRef, {
        status: 'bidding',
        bidSubmittedAt: new Date(),
        driverBid: {
          driverId: this.currentDriverId,
          bidAmount: bidAmount,
          bidType: bidType,
          submittedAt: new Date()
        }
      });

      console.log('💰 Custom bid submitted:', bidAmount);
      return { success: true, rideRequestId, bidAmount };
    } catch (error) {
      console.error('❌ Error submitting bid:', error);
      throw error;
    }
  }

  // Get active ride requests for current driver
  async getActiveRideRequests() {
    if (!this.currentDriverId) {
      throw new Error('Driver ID not set. Call initialize() first.');
    }

    try {
      const rideRequestsRef = collection(this.db, 'rideRequests');
      const q = query(
        rideRequestsRef,
        where('driverId', '==', this.currentDriverId),
        where('status', 'in', ['pending', 'bidding']),
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
      console.error('❌ Error getting active ride requests:', error);
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
        lastLocationUpdate: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating driver location:', error);
      throw error;
    }
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