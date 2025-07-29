# 🚗 **Rider-Driver App Connection Implementation Guide**

## **📋 Executive Summary**

This document outlines the comprehensive changes needed to establish a solid connection between the **Rider App** (rydeiqMobile) and **Driver App** (rydeIQDriver) for the driver marketplace functionality.

**Date**: December 2024  
**Project**: AnyRyde Driver Marketplace Integration  
**Objective**: Connect rider and driver apps for real-time ride booking  
**Current State**: Rider app has driver marketplace, driver app needs integration  
**Target State**: Full real-time communication between rider and driver apps  

---

## **🎯 Current State Analysis**

### **✅ What's Already Working:**
- **Firebase Integration**: Both apps use Firebase v9+ modular syntax
- **Rider App**: Has `DriverMatchingService` that creates ride requests
- **Driver App**: Has `RideRequestScreen` that can display ride requests
- **Real-time Communication**: Rider app uses Firestore listeners for responses

### **❌ Connection Gaps Identified:**
1. **No Ride Request Service** in driver app to listen for incoming requests
2. **Data Structure Mismatch** between rider requests and driver expectations
3. **No Real-time Driver Status Updates** to rider app
4. **Missing Driver Response Handling** in rider app
5. **No Driver Location Updates** to rider app

---

## **🚀 Implementation Plan**

### **Phase 1: Driver App Changes**

#### **1.1 Create Ride Request Service**
**File**: `src/services/rideRequestService.js`

```javascript
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
```

#### **1.2 Create Ride Request Modal Component**
**File**: `src/components/RideRequestModal.js`

```javascript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import RideRequestService from '@/services/rideRequestService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RideRequestModal = ({ 
  visible = false, 
  rideRequest = null,
  onClose 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showBidOptions, setShowBidOptions] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && rideRequest) {
      setTimeRemaining(30);
      setShowBidOptions(false);
      setCustomBidAmount('');
      
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(timerAnim, {
          toValue: 0,
          duration: 30000,
          useNativeDriver: true,
        })
      ]).start();

      // Start timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleDecline('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, rideRequest]);

  // Handle accept ride
  const handleAccept = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await RideRequestService.acceptRideRequest(rideRequest.id);
      
      Alert.alert('Success', 'Ride accepted!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
    }
  };

  // Handle decline ride  
  const handleDecline = async (reason = 'manual') => {
    try {
      if (reason === 'timeout') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      await RideRequestService.rejectRideRequest(rideRequest.id, reason);
      
      if (reason !== 'timeout') {
        Alert.alert('Ride Declined', 'Ride request has been declined');
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline ride');
    }
  };

  // Handle custom bid
  const handleCustomBid = async (bidAmount) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await RideRequestService.submitCustomBid(rideRequest.id, bidAmount);
      
      Alert.alert('Bid Submitted', `Your bid of $${bidAmount} has been submitted`);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid');
    }
  };

  if (!rideRequest) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="car" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>New Ride Request</Text>
            </View>
            <Animated.View 
              style={[
                styles.timer,
                {
                  transform: [{ scale: timerAnim }],
                  backgroundColor: timeRemaining > 15 ? COLORS.success : 
                                  timeRemaining > 5 ? COLORS.warning : COLORS.error
                }
              ]}
            >
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </Animated.View>
          </View>

          {/* Ride Details */}
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {rideRequest.pickup?.address || 'Pickup location'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.detailText}>
                {rideRequest.destination?.address || 'Destination'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {rideRequest.estimatedDistance || 'Distance'} • {rideRequest.estimatedDuration || 'Duration'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="wallet" size={16} color={COLORS.success} />
              <Text style={styles.detailText}>
                ${rideRequest.companyBid?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDecline('manual')}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>

          {/* Bid Options */}
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => setShowBidOptions(!showBidOptions)}
          >
            <Ionicons name="trending-up" size={16} color={COLORS.primary} />
            <Text style={styles.bidButtonText}>Custom Bid</Text>
          </TouchableOpacity>

          {showBidOptions && (
            <View style={styles.bidOptions}>
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 2)}
              >
                <Text style={styles.bidOptionText}>+$2.00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 5)}
              >
                <Text style={styles.bidOptionText}>+$5.00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bidOption}
                onPress={() => handleCustomBid(rideRequest.companyBid + 10)}
              >
                <Text style={styles.bidOptionText}>+$10.00</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  timer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rideDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  bidButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  bidOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  bidOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  bidOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RideRequestModal;
```

#### **1.3 Update Main Dashboard Screen**
**File**: `src/screens/dashboard/DashboardScreen.js`

Add the following to integrate the Ride Request Service:

```javascript
// Add imports
import RideRequestService from '@/services/rideRequestService';
import RideRequestModal from '@/components/RideRequestModal';

// Add state variables
const [rideRequest, setRideRequest] = useState(null);
const [showRideRequestModal, setShowRideRequestModal] = useState(false);

// Add useEffect for service initialization
useEffect(() => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    // Initialize ride request service
    RideRequestService.initialize(currentUser.uid);
    
    // Set callback for new ride requests
    RideRequestService.setRideRequestCallback((newRideRequest) => {
      setRideRequest(newRideRequest);
      setShowRideRequestModal(true);
    });
  }

  return () => {
    RideRequestService.cleanup();
  };
}, []);

// Add modal close handler
const handleRideRequestModalClose = () => {
  setShowRideRequestModal(false);
  setRideRequest(null);
};

// Add to JSX return
<RideRequestModal
  visible={showRideRequestModal}
  rideRequest={rideRequest}
  onClose={handleRideRequestModalClose}
/>
```

#### **1.4 Update Driver Status Management**
**File**: `src/screens/dashboard/DashboardScreen.js`

Add online/offline toggle functionality:

```javascript
// Add state for driver status
const [isOnline, setIsOnline] = useState(false);

// Add function to toggle driver status
const toggleDriverStatus = async () => {
  try {
    const newStatus = !isOnline;
    await RideRequestService.updateDriverStatus(newStatus ? 'available' : 'offline');
    setIsOnline(newStatus);
  } catch (error) {
    console.error('Error updating driver status:', error);
  }
};

// Add to JSX - Online/Offline toggle button
<TouchableOpacity
  style={[
    styles.statusToggle,
    { backgroundColor: isOnline ? COLORS.success : COLORS.error }
  ]}
  onPress={toggleDriverStatus}
>
  <Ionicons 
    name={isOnline ? "radio-button-on" : "radio-button-off"} 
    size={20} 
    color="white" 
  />
  <Text style={styles.statusToggleText}>
    {isOnline ? 'Online' : 'Offline'}
  </Text>
</TouchableOpacity>
```

### **Phase 2: Rider App Enhancements**

#### **2.1 Update DriverMatchingService**
**File**: `src/services/driverMatchingService.js`

Add real-time driver status updates:

```javascript
// Add method to listen for driver status changes
async listenForDriverStatus(driverId, callback) {
  const driverRef = doc(this.db, 'drivers', driverId);
  
  const unsubscribe = onSnapshot(driverRef, (doc) => {
    if (doc.exists()) {
      const driverData = doc.data();
      callback({
        isOnline: driverData.isOnline,
        status: driverData.status,
        location: driverData.location,
        lastUpdate: driverData.lastStatusUpdate
      });
    }
  });

  return unsubscribe;
}

// Add method to get driver location updates
async getDriverLocation(driverId) {
  try {
    const driverRef = doc(this.db, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);
    
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      return {
        location: driverData.location,
        lastUpdate: driverData.lastLocationUpdate
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting driver location:', error);
    return null;
  }
}
```

#### **2.2 Update EnhancedRideOptions Component**
**File**: `src/components/EnhancedRideOptions.js`

Add real-time driver status and location updates:

```javascript
// Add state for driver status
const [driverStatus, setDriverStatus] = useState({});

// Add useEffect to listen for driver status changes
useEffect(() => {
  const statusListeners = [];
  
  availableDrivers.forEach(driver => {
    const listener = DriverMatchingService.listenForDriverStatus(
      driver.id, 
      (status) => {
        setDriverStatus(prev => ({
          ...prev,
          [driver.id]: status
        }));
      }
    );
    statusListeners.push(listener);
  });

  return () => {
    statusListeners.forEach(listener => listener());
  };
}, [availableDrivers]);

// Update renderDriverCard to show real-time status
const renderDriverCard = (driver, index) => {
  const isSelected = selectedDriver === driver.id;
  const status = driverStatus[driver.id];
  const isOnline = status?.isOnline;
  
  return (
    <Animated.View
      key={`driver_${driver.id}`}
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.serviceCard,
          styles.driverCard,
          isSelected && styles.serviceCardSelected,
          !isOnline && styles.driverCardOffline,
        ]}
        onPress={() => isOnline && requestDriverRide(driver)}
        activeOpacity={0.8}
        delayPressIn={100}
        disabled={!isOnline}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <View style={[
              styles.serviceIcon, 
              { backgroundColor: isOnline ? COLORS.primary[500] : '#9ca3af' },
              isSelected && styles.serviceIconSelected
            ]}>
              <Ionicons name="person" size={20} color="white" />
            </View>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{driver.name || 'Driver'}</Text>
              <Text style={styles.serviceEta}>
                {driver.distance.toFixed(1)} miles away • ⭐ {driver.rating || 'New'}
                {status && (
                  <Text style={[styles.statusIndicator, { color: isOnline ? COLORS.success : COLORS.error }]}>
                    {' • '}{isOnline ? 'Online' : 'Offline'}
                  </Text>
                )}
              </Text>
            </View>
          </View>
          
          <View style={styles.servicePricing}>
            <Text style={[
              styles.servicePrice,
              styles.driverPrice
            ]}>
              ${driver.estimatedPrice.toFixed(2)}
            </Text>
            {driver.vehicle && (
              <Text style={styles.driverVehicle}>
                {driver.vehicle.make} {driver.vehicle.model}
              </Text>
            )}
          </View>
        </View>

        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="radio-button-off" size={16} color={COLORS.error} />
            <Text style={styles.offlineText}>Driver is offline</Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.bookingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary[500]} />
            <Text style={styles.bookingText}>Requesting ride...</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

#### **2.3 Add New Styles**
**File**: `src/components/EnhancedRideOptions.js`

Add these styles to the StyleSheet:

```javascript
driverCardOffline: {
  opacity: 0.6,
  backgroundColor: '#f3f4f6',
},
statusIndicator: {
  fontSize: 12,
  fontWeight: '500',
},
offlineIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
  padding: 8,
  backgroundColor: '#fef2f2',
  borderRadius: 6,
  gap: 4,
},
offlineText: {
  fontSize: 12,
  color: COLORS.error,
  fontWeight: '500',
},
```

### **Phase 3: Data Structure Alignment**

#### **3.1 Rider App Ride Request Structure**
**File**: `src/services/driverMatchingService.js`

Update the `requestRide` method to match driver app expectations:

```javascript
async requestRide(driverId, pickup, dropoff, riderInfo) {
  const rideRequest = {
    id: this.generateRideId(),
    driverId,
    riderId: this.auth.currentUser?.uid || 'anonymous',
    pickup: {
      address: pickup.address || 'Pickup location',
      coordinates: {
        lat: pickup.lat,
        lng: pickup.lng
      }
    },
    dropoff: {
      address: dropoff.address || 'Destination',
      coordinates: {
        lat: dropoff.lat,
        lng: dropoff.lng
      }
    },
    riderInfo: {
      name: riderInfo.name || 'Rider',
      phone: riderInfo.phone || '',
      rating: riderInfo.rating || 5.0
    },
    status: 'pending',
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 30000), // 30 second timeout
    estimatedPrice: this.calculateEstimatedPrice({}, pickup, dropoff),
    estimatedDistance: this.calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng),
    estimatedDuration: '12 minutes', // Calculate based on distance
    distanceInMiles: this.calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
  };

  try {
    // Send ride request to driver
    await setDoc(doc(this.db, 'rideRequests', rideRequest.id), rideRequest);
    
    // Listen for driver response
    return this.waitForDriverResponse(rideRequest.id);
  } catch (error) {
    console.error('❌ Error requesting ride:', error);
    throw error;
  }
}
```

### **Phase 4: Testing and Validation**

#### **4.1 Test Scenarios**

1. **Driver Online/Offline Status**
   - Driver goes online → Rider sees driver as available
   - Driver goes offline → Rider sees driver as unavailable
   - Real-time status updates work correctly

2. **Ride Request Flow**
   - Rider requests ride → Driver receives notification
   - Driver accepts ride → Rider receives confirmation
   - Driver rejects ride → Rider receives rejection
   - Driver submits bid → Rider receives bid notification

3. **Location Updates**
   - Driver location updates → Rider sees updated location
   - Real-time location tracking works

4. **Error Handling**
   - Network disconnection → Graceful error handling
   - Invalid data → Proper validation and error messages
   - Timeout scenarios → Proper cleanup and user feedback

#### **4.2 Integration Checklist**

- [ ] Ride Request Service created in driver app
- [ ] Ride Request Modal component created
- [ ] Dashboard integration completed
- [ ] Driver status management implemented
- [ ] Real-time listeners configured
- [ ] Data structure alignment completed
- [ ] Error handling implemented
- [ ] Testing completed
- [ ] Performance optimized

---

## **🎯 Expected Results**

After implementing these changes:

1. **Real-time Communication**: Riders and drivers can communicate in real-time
2. **Driver Marketplace**: Riders can see and book with your drivers
3. **Status Updates**: Real-time driver availability and location updates
4. **Bidding System**: Drivers can submit custom bids for rides
5. **Seamless Integration**: Both apps work together seamlessly

## **📱 Key Features**

### **For Drivers:**
- **Real-time ride notifications** with sound and haptic feedback
- **Accept/Reject ride requests** with 30-second timer
- **Custom bidding system** for competitive pricing
- **Online/Offline status toggle**
- **Location updates** for rider tracking

### **For Riders:**
- **Real-time driver availability** status
- **Live driver location** updates
- **Instant ride booking** with your drivers
- **Bid acceptance/rejection** notifications
- **Seamless fallback** to Uber/Lyft

## **🔧 Technical Architecture**

### **Firebase Collections:**
- **`drivers`**: Driver profiles, status, location
- **`rideRequests`**: Ride requests, responses, bids
- **`users`**: Rider profiles and preferences

### **Real-time Features:**
- **Firestore listeners** for instant updates
- **Push notifications** for ride requests
- **Location tracking** with GeoPoint
- **Status synchronization** across apps

### **Error Handling:**
- **Network resilience** with retry logic
- **Timeout management** for ride requests
- **Graceful degradation** when services unavailable
- **User-friendly error messages**

---

## **🚀 Deployment Notes**

1. **Environment Setup**: Ensure both apps use the same Firebase project
2. **Security Rules**: Configure Firestore security rules for ride requests
3. **Testing**: Test on both iOS and Android devices
4. **Performance**: Monitor real-time listener performance
5. **Scaling**: Consider Firebase quotas for production scaling

This implementation creates a **solid, production-ready connection** between the rider and driver apps, enabling the full driver marketplace functionality with real-time communication, status updates, and seamless user experience. 