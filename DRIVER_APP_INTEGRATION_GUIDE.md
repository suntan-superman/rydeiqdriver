# Driver App Integration Guide
## Medical Scheduling, Pending Rides & Ride Acceptance

**Version:** 1.0  
**Last Updated:** October 1, 2025  
**Target Platform:** React Native (Driver Mobile App)  
**Backend:** Firebase Firestore  

---

## Table of Contents

1. [Overview](#overview)
2. [Firebase Collections](#firebase-collections)
3. [Data Models](#data-models)
4. [Authentication & Permissions](#authentication--permissions)
5. [Real-Time Subscriptions](#real-time-subscriptions)
6. [Feature Implementation](#feature-implementation)
7. [API Reference](#api-reference)
8. [Code Examples](#code-examples)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Overview

This guide provides comprehensive integration instructions for implementing three core features in the driver app:

1. **Medical Scheduling Integration** - View and accept scheduled medical transport rides
2. **Pending Rides Display** - Real-time updates of available ride requests
3. **Ride Acceptance Flow** - Accept/decline rides and update status

### Architecture

```
Driver App → Firebase Firestore ← Web Portal/Rider App
     ↓
Real-time Listeners (onSnapshot)
     ↓
UI Updates (React State)
```

---

## Firebase Collections

### Primary Collections

| Collection | Purpose | Driver Access |
|------------|---------|---------------|
| `rideRequests` | Immediate ride requests with driver bidding | Read (filtered by specialty), Write (bids) |
| `medicalRideSchedule` | Scheduled medical transport rides | Read, Write (status updates) |
| `scheduledRides` | Regular scheduled rides | Read, Write (status updates) |
| `notifications` | Driver notifications for new requests | Read/Write (own notifications) |
| `driverApplications` | Driver profile and capabilities | Read (own profile) |
| `driverBids` | Driver bids on ride requests | Read/Write (own bids) |

### Supporting Collections

| Collection | Purpose |
|------------|---------|
| `vehicle_info` | Driver vehicle details and specialties |
| `profilePictures` | Profile picture URLs configuration |
| `earnings` | Driver earnings tracking |

---

## Data Models

### 1. RideRequest (Immediate Rides)

```javascript
{
  id: "ride_abc123",
  riderId: "user123",
  
  // Location data
  pickup: {
    address: "123 Main St, Bakersfield, CA 93301",
    coordinates: {
      latitude: 35.3733,
      longitude: -119.0187
    }
  },
  destination: {
    address: "456 Hospital Ave, Bakersfield, CA 93305",
    coordinates: {
      latitude: 35.3789,
      longitude: -119.0234
    }
  },
  
  // Ride details
  rideType: "standard", // or "tow_truck", "companion_driver", "medical", "wheelchair"
  status: "pending", // "pending", "bidding", "matched", "active", "completed", "cancelled"
  
  // Specialty options (if applicable)
  specialtyRideOptions: {
    vehicleType: "wheelchair", // Driver filtering criteria
    requirements: {
      wheelchairAccessible: true,
      oxygenSupport: false,
      companionSeats: 0
    }
  },
  
  // Driver tracking
  availableDrivers: ["driver1", "driver2"], // Array of driver IDs who can see this request
  timestamp: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Bidding
  biddingEnabled: true,
  driverBids: [], // Populated separately in driverBids collection
  
  // Pricing
  estimatedPrice: {
    min: 15.00,
    max: 25.00,
    currency: "USD"
  }
}
```

### 2. MedicalRideSchedule

```javascript
{
  id: "medical_abc123",
  rideId: "medical_abc123",
  
  // Request type
  requestType: "medical",
  
  // Patient information
  patientId: "PATIENT_001",
  appointmentType: "Dialysis", // "Dialysis", "Physical Therapy", "Doctor Visit", etc.
  
  // Scheduling
  pickupDateTime: Timestamp, // When to pick up patient
  appointmentDateTime: Timestamp, // Same as pickupDateTime
  estimatedDuration: 120, // Duration in minutes
  
  // Location data
  pickupLocation: {
    address: "123 Main St, Bakersfield, CA 93301",
    facilityName: "Green Acres Nursing Home",
    coordinates: {
      lat: 35.3733,
      lng: -119.0187
    }
  },
  dropoffLocation: {
    address: "456 Hospital Ave, Bakersfield, CA 93305",
    facilityName: "Kern Medical Center",
    coordinates: {
      lat: 35.3789,
      lng: -119.0234
    }
  },
  
  // Medical requirements
  medicalRequirements: {
    wheelchairAccessible: true,
    oxygenSupport: false,
    stretcherRequired: false,
    assistanceLevel: "moderate", // "minimal", "moderate", "full"
    specialInstructions: "Patient requires assistance getting in and out of vehicle"
  },
  
  // Priority
  priorityLevel: "routine", // "routine", "urgent", "emergency"
  
  // Assignment
  status: "pending", // "pending", "assigned", "in_progress", "completed", "cancelled"
  assignmentStatus: "pending", // "pending", "assigned", "confirmed"
  assignedDriverId: null, // Set when driver accepts
  assignedAt: null,
  
  // Compliance
  complianceRequirements: {
    hipaCompliant: true,
    driverBackgroundCheck: true,
    medicalTransportCertification: true,
    insuranceRequired: "medical_transport"
  },
  
  // Source tracking
  sourceType: "medical_portal",
  sourceMetadata: {
    organizationId: "org123",
    organizationName: "Kern Medical Center",
    dispatcherId: "dispatcher123"
  },
  
  // Metadata
  dispatcherId: "dispatcher123",
  organizationId: "org123",
  organizationName: "Kern Medical Center",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "dispatcher123",
  
  // Audit trail
  auditLog: [
    {
      action: "ride_scheduled",
      timestamp: "2025-10-01T10:00:00Z",
      userId: "dispatcher123",
      details: "Medical ride scheduled via Advanced Scheduling Portal"
    }
  ]
}
```

### 3. ScheduledRides (Regular Scheduled)

```javascript
{
  id: "regular_abc123",
  rideId: "regular_abc123",
  
  // Request type
  requestType: "regular",
  rideType: "standard",
  
  // Customer
  customerId: "CUSTOMER_001",
  
  // Scheduling
  scheduledDateTime: Timestamp,
  
  // Location data
  pickup: {
    address: "555 Elm St, Bakersfield, CA 93304",
    coordinates: {
      lat: 35.3767,
      lng: -119.0123
    }
  },
  dropoff: {
    address: "777 Pine Ave, Bakersfield, CA 93306",
    coordinates: {
      lat: 35.3798,
      lng: -119.0167
    }
  },
  
  // Pricing
  estimatedFare: 25.50,
  
  // Instructions
  specialInstructions: "Please call when arriving",
  customerNotes: "Business meeting - punctuality important",
  
  // Assignment
  status: "pending",
  assignedDriverId: null,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. Notification

```javascript
{
  id: "notification123",
  
  // Target
  userId: "driver123", // Driver ID
  
  // Notification details
  type: "medical_ride_request", // or "scheduled_ride_request", "ride_request"
  title: "Medical Transport Request",
  message: "Dialysis transport for PATIENT_001 - Tomorrow at 10:00 AM",
  
  // Related data
  data: {
    rideId: "medical_abc123",
    requestType: "medical",
    appointmentType: "Dialysis",
    patientId: "PATIENT_001",
    pickupDateTime: Timestamp,
    medicalRequirements: { /* ... */ }
  },
  
  // Status
  status: "pending", // "pending", "accepted", "declined", "expired"
  read: false,
  
  // Response tracking
  respondedAt: null,
  response: null, // "accepted" or "declined"
  
  // Metadata
  createdAt: Timestamp
}
```

### 5. DriverBid

```javascript
{
  id: "bid123",
  
  // References
  rideRequestId: "ride_abc123",
  driverId: "driver123",
  
  // Bid details
  bidAmount: 22.50,
  currency: "USD",
  
  // Driver info
  driverInfo: {
    name: "John Driver",
    rating: 4.8,
    vehicleType: "sedan",
    specialties: ["wheelchair_accessible", "medical_transport"]
  },
  
  // Location
  driverLocation: {
    latitude: 35.3700,
    longitude: -119.0150
  },
  eta: 8, // Minutes to pickup
  
  // Status
  status: "pending", // "pending", "accepted", "rejected", "expired"
  
  // Metadata
  createdAt: Timestamp,
  expiresAt: Timestamp
}
```

---

## Authentication & Permissions

### Firestore Security Rules

```javascript
// rideRequests - Drivers can read requests they're eligible for
match /rideRequests/{requestId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.availableDrivers;
  allow write: if request.auth != null && 
    request.auth.uid in resource.data.availableDrivers;
  allow create: if request.auth != null;
}

// medicalRideSchedule - Drivers can read and update assigned rides
match /medicalRideSchedule/{rideId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (resource.data.driverId == request.auth.uid ||
     resource.data.dispatcherId == request.auth.uid);
  allow create: if request.auth != null;
}

// scheduledRides - Similar permissions
match /scheduledRides/{rideId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (resource.data.driverId == request.auth.uid ||
     resource.data.dispatcherId == request.auth.uid);
  allow create: if request.auth != null;
}

// notifications - Drivers can only access their own
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null;
}

// driverApplications - Drivers read own profile, riders read for matching
match /driverApplications/{applicationId} {
  allow read, update: if request.auth != null && 
    request.auth.uid == applicationId;
  allow read: if request.auth != null;
}

// driverBids - Drivers manage their own bids
match /driverBids/{bidId} {
  allow read, write: if request.auth != null && 
    resource.data.driverId == request.auth.uid;
  allow read: if request.auth != null; // Riders can view bids
}
```

### Required Firestore Indexes

```json
{
  "indexes": [
    // Notifications by user and creation time
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // RideRequests by status and time (for pending rides)
    {
      "collectionGroup": "rideRequests",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // RideRequests by availableDrivers array (driver-specific)
    {
      "collectionGroup": "rideRequests",
      "fields": [
        { "fieldPath": "availableDrivers", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    
    // Medical rides by driver and status
    {
      "collectionGroup": "medicalRideSchedule",
      "fields": [
        { "fieldPath": "assignedDriverId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "appointmentDateTime", "order": "ASCENDING" }
      ]
    },
    
    // Driver bids by driver
    {
      "collectionGroup": "driverBids",
      "fields": [
        { "fieldPath": "driverId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Real-Time Subscriptions

### 1. Subscribe to Pending Ride Requests (Immediate Rides)

Drivers should see ride requests that match their vehicle type and specialty capabilities.

```javascript
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

/**
 * Subscribe to pending ride requests filtered by driver capabilities
 * @param {string} driverId - Current driver's ID
 * @param {Array} driverSpecialtyTypes - Driver's specialty types: ["standard", "wheelchair", "tow_truck", etc.]
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
const subscribeToPendingRides = (driverId, driverSpecialtyTypes = [], callback) => {
  // Filter by availableDrivers array (backend populates this based on location and specialty)
  const q = query(
    collection(db, 'rideRequests'),
    where('availableDrivers', 'array-contains', driverId),
    where('status', '==', 'pending'),
    orderBy('timestamp', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps to JavaScript Dates
        timestamp: doc.data().timestamp?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Additional client-side filtering for specialty types
      const filteredRequests = requests.filter(request => {
        // If it's a specialty ride, check if driver can handle it
        if (['tow_truck', 'companion_driver', 'medical', 'wheelchair'].includes(request.rideType)) {
          return driverSpecialtyTypes.includes(request.rideType);
        }
        // Standard rides can be seen by all drivers
        return true;
      });
      
      callback(filteredRequests);
    },
    (error) => {
      console.error('Error in pending rides subscription:', error);
      callback([], error);
    }
  );
  
  return unsubscribe;
};
```

### 2. Subscribe to Scheduled Ride Notifications

Medical and regular scheduled rides are communicated via notifications.

```javascript
/**
 * Subscribe to scheduled ride notifications
 * @param {string} driverId - Current driver's ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
const subscribeToScheduledRideNotifications = (driverId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', driverId),
    where('type', 'in', ['scheduled_ride_request', 'medical_ride_request']),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q,
    async (snapshot) => {
      const notifications = [];
      
      for (const doc of snapshot.docs) {
        const notificationData = doc.data();
        const rideId = notificationData.data?.rideId;
        
        if (rideId) {
          // Fetch the full ride details
          const rideCollection = notificationData.type === 'medical_ride_request' 
            ? 'medicalRideSchedule' 
            : 'scheduledRides';
          
          try {
            const rideDoc = await getDoc(doc(db, rideCollection, rideId));
            
            if (rideDoc.exists()) {
              notifications.push({
                notificationId: doc.id,
                ...notificationData,
                rideDetails: {
                  id: rideDoc.id,
                  ...rideDoc.data(),
                  // Convert timestamps
                  pickupDateTime: rideDoc.data().pickupDateTime?.toDate() || 
                                  rideDoc.data().appointmentDateTime?.toDate(),
                  scheduledDateTime: rideDoc.data().scheduledDateTime?.toDate()
                }
              });
            }
          } catch (error) {
            console.error('Error fetching ride details:', error);
          }
        }
      }
      
      callback(notifications);
    },
    (error) => {
      console.error('Error in scheduled rides subscription:', error);
      callback([], error);
    }
  );
  
  return unsubscribe;
};
```

### 3. Subscribe to Active Rides

Monitor rides the driver has accepted and their status changes.

```javascript
/**
 * Subscribe to driver's active rides
 * @param {string} driverId - Current driver's ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
const subscribeToActiveRides = (driverId, callback) => {
  const queries = [
    // Immediate rides
    query(
      collection(db, 'rideRequests'),
      where('driverId', '==', driverId),
      where('status', 'in', ['matched', 'active', 'driver_assigned'])
    ),
    // Medical scheduled rides
    query(
      collection(db, 'medicalRideSchedule'),
      where('assignedDriverId', '==', driverId),
      where('status', 'in', ['assigned', 'in_progress'])
    ),
    // Regular scheduled rides
    query(
      collection(db, 'scheduledRides'),
      where('assignedDriverId', '==', driverId),
      where('status', 'in', ['assigned', 'confirmed', 'active'])
    )
  ];
  
  const unsubscribes = queries.map(q => 
    onSnapshot(q, () => {
      // Aggregate all results
      Promise.all(queries.map(q => getDocs(q)))
        .then(snapshots => {
          const allRides = snapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              source: doc.ref.parent.id // Track which collection
            }))
          );
          callback(allRides);
        })
        .catch(error => {
          console.error('Error fetching active rides:', error);
          callback([], error);
        });
    })
  );
  
  // Return combined unsubscribe function
  return () => unsubscribes.forEach(unsub => unsub());
};
```

---

## Feature Implementation

### Feature 1: Medical Scheduling Integration

#### Display Medical Ride Requests

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { subscribeToScheduledRideNotifications } from '../services/rideService';

const MedicalRidesScreen = ({ driverId }) => {
  const [medicalRides, setMedicalRides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = subscribeToScheduledRideNotifications(
      driverId,
      (notifications) => {
        // Filter for medical rides only
        const medical = notifications.filter(n => 
          n.type === 'medical_ride_request'
        );
        setMedicalRides(medical);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [driverId]);
  
  const renderMedicalRide = ({ item }) => {
    const { rideDetails } = item;
    
    return (
      <TouchableOpacity 
        style={styles.rideCard}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.header}>
          <Text style={styles.appointmentType}>
            {rideDetails.appointmentType}
          </Text>
          <Text style={styles.priority}>
            {rideDetails.priorityLevel.toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.patientId}>
          Patient: {rideDetails.patientId}
        </Text>
        
        <Text style={styles.time}>
          Pickup: {formatDateTime(rideDetails.pickupDateTime)}
        </Text>
        
        <Text style={styles.location}>
          From: {rideDetails.pickupLocation.facilityName || 
                 rideDetails.pickupLocation.address}
        </Text>
        <Text style={styles.location}>
          To: {rideDetails.dropoffLocation.facilityName || 
               rideDetails.dropoffLocation.address}
        </Text>
        
        {rideDetails.medicalRequirements.wheelchairAccessible && (
          <View style={styles.badge}>
            <Text>♿ Wheelchair Required</Text>
          </View>
        )}
        
        {rideDetails.medicalRequirements.oxygenSupport && (
          <View style={styles.badge}>
            <Text>🫁 Oxygen Support</Text>
          </View>
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptMedicalRide(item)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.declineButton}
            onPress={() => handleDeclineRide(item)}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Transport Requests</Text>
      
      <FlatList
        data={medicalRides}
        renderItem={renderMedicalRide}
        keyExtractor={item => item.notificationId}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No pending medical rides
          </Text>
        }
      />
    </View>
  );
};
```

#### Accept Medical Ride

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const handleAcceptMedicalRide = async (notification) => {
  try {
    const { notificationId, rideDetails } = notification;
    const rideId = rideDetails.id;
    
    // 1. Update notification status
    await updateDoc(doc(db, 'notifications', notificationId), {
      status: 'accepted',
      respondedAt: serverTimestamp(),
      response: 'accepted'
    });
    
    // 2. Update ride status in medicalRideSchedule
    await updateDoc(doc(db, 'medicalRideSchedule', rideId), {
      assignedDriverId: driverId,
      status: 'assigned',
      assignmentStatus: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      driverInfo: {
        driverId: driverId,
        name: driverProfile.name,
        phone: driverProfile.phone,
        vehicleInfo: driverProfile.vehicle
      }
    });
    
    // 3. Add to audit log
    const auditEntry = {
      action: 'ride_accepted_by_driver',
      timestamp: new Date().toISOString(),
      userId: driverId,
      details: `Driver ${driverProfile.name} accepted medical ride`
    };
    
    await updateDoc(doc(db, 'medicalRideSchedule', rideId), {
      auditLog: arrayUnion(auditEntry)
    });
    
    // 4. Show success message
    Alert.alert('Success', 'Medical ride accepted!');
    
    // 5. Navigate to active rides
    navigation.navigate('ActiveRides');
    
  } catch (error) {
    console.error('Error accepting medical ride:', error);
    Alert.alert('Error', 'Failed to accept ride. Please try again.');
  }
};
```

---

### Feature 2: Pending Rides Display

#### Display Pending Immediate Rides

```javascript
const PendingRidesScreen = ({ driverId, driverSpecialties }) => {
  const [pendingRides, setPendingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get driver specialty types from profile
    const specialtyTypes = driverSpecialties.map(s => s.type);
    
    const unsubscribe = subscribeToPendingRides(
      driverId,
      specialtyTypes,
      (rides) => {
        setPendingRides(rides);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [driverId, driverSpecialties]);
  
  const renderPendingRide = ({ item }) => (
    <View style={styles.rideCard}>
      <View style={styles.header}>
        <Text style={styles.rideType}>
          {formatRideType(item.rideType)}
        </Text>
        <Text style={styles.time}>
          {formatTimeAgo(item.timestamp)}
        </Text>
      </View>
      
      <Text style={styles.location}>
        📍 From: {item.pickup.address}
      </Text>
      <Text style={styles.location}>
        🎯 To: {item.destination.address}
      </Text>
      
      {item.estimatedPrice && (
        <Text style={styles.price}>
          Estimated: ${item.estimatedPrice.min} - ${item.estimatedPrice.max}
        </Text>
      )}
      
      {/* Specialty Requirements */}
      {item.specialtyRideOptions && (
        <View style={styles.specialtyBadges}>
          {renderSpecialtyBadges(item.specialtyRideOptions.requirements)}
        </View>
      )}
      
      <TouchableOpacity
        style={styles.bidButton}
        onPress={() => handleOpenBidModal(item)}
      >
        <Text style={styles.bidButtonText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Rides</Text>
      
      <FlatList
        data={pendingRides}
        renderItem={renderPendingRide}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={() => {/* Optional manual refresh */}}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No pending rides at the moment
          </Text>
        }
      />
    </View>
  );
};
```

---

### Feature 3: Ride Acceptance Flow

#### Submit Bid on Immediate Ride

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const submitBid = async (rideRequestId, bidAmount, driverLocation) => {
  try {
    // Calculate ETA based on distance
    const eta = await calculateETA(
      driverLocation,
      rideRequest.pickup.coordinates
    );
    
    // Create bid document
    const bidData = {
      rideRequestId: rideRequestId,
      driverId: driverId,
      bidAmount: bidAmount,
      currency: 'USD',
      
      driverInfo: {
        name: driverProfile.personalInfo.firstName + ' ' + 
              driverProfile.personalInfo.lastName,
        rating: driverProfile.rating || 4.5,
        vehicleType: driverProfile.vehicle.type,
        vehicleMake: driverProfile.vehicle.make,
        vehicleModel: driverProfile.vehicle.model,
        vehicleColor: driverProfile.vehicle.color,
        licensePlate: driverProfile.vehicle.licensePlate,
        specialties: driverProfile.specialties || []
      },
      
      driverLocation: {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude
      },
      
      eta: eta, // Minutes to pickup
      
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    // Add bid to driverBids collection
    const bidRef = await addDoc(collection(db, 'driverBids'), bidData);
    
    Alert.alert('Success', 'Your bid has been submitted!');
    
    return { success: true, bidId: bidRef.id };
    
  } catch (error) {
    console.error('Error submitting bid:', error);
    Alert.alert('Error', 'Failed to submit bid. Please try again.');
    return { success: false, error };
  }
};
```

#### Accept Scheduled Ride

```javascript
const acceptScheduledRide = async (notification) => {
  try {
    const { notificationId, rideDetails, type } = notification;
    const rideId = rideDetails.id;
    const rideCollection = type === 'medical_ride_request' 
      ? 'medicalRideSchedule' 
      : 'scheduledRides';
    
    // 1. Update notification
    await updateDoc(doc(db, 'notifications', notificationId), {
      status: 'accepted',
      respondedAt: serverTimestamp(),
      response: 'accepted'
    });
    
    // 2. Update ride assignment
    await updateDoc(doc(db, rideCollection, rideId), {
      assignedDriverId: driverId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      driverInfo: {
        driverId: driverId,
        name: `${driverProfile.personalInfo.firstName} ${driverProfile.personalInfo.lastName}`,
        phone: driverProfile.personalInfo.phone,
        vehicleInfo: {
          make: driverProfile.vehicle.make,
          model: driverProfile.vehicle.model,
          color: driverProfile.vehicle.color,
          licensePlate: driverProfile.vehicle.licensePlate
        }
      }
    });
    
    // 3. Create notification for dispatcher/customer
    await addDoc(collection(db, 'notifications'), {
      userId: rideDetails.dispatcherId || rideDetails.customerId,
      type: 'ride_accepted',
      title: 'Ride Accepted',
      message: `Driver has accepted your scheduled ride for ${formatDateTime(rideDetails.pickupDateTime || rideDetails.scheduledDateTime)}`,
      data: {
        rideId: rideId,
        driverId: driverId
      },
      status: 'pending',
      read: false,
      createdAt: serverTimestamp()
    });
    
    Alert.alert('Success', 'Ride accepted successfully!');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error accepting ride:', error);
    Alert.alert('Error', 'Failed to accept ride. Please try again.');
    return { success: false, error };
  }
};
```

#### Decline Ride

```javascript
const declineRide = async (notification, reason = '') => {
  try {
    const { notificationId } = notification;
    
    // Update notification status
    await updateDoc(doc(db, 'notifications', notificationId), {
      status: 'declined',
      respondedAt: serverTimestamp(),
      response: 'declined',
      declineReason: reason
    });
    
    Alert.alert('Declined', 'Ride request declined.');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error declining ride:', error);
    Alert.alert('Error', 'Failed to decline ride.');
    return { success: false, error };
  }
};
```

---

## API Reference

### Service Functions

```javascript
// rideService.js - Main service file for driver app

import { db } from './firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

export const RideService = {
  
  /**
   * Subscribe to pending ride requests for driver
   */
  subscribeToPendingRides(driverId, specialtyTypes, callback) {
    // Implementation above
  },
  
  /**
   * Subscribe to scheduled ride notifications
   */
  subscribeToScheduledRideNotifications(driverId, callback) {
    // Implementation above
  },
  
  /**
   * Subscribe to active rides
   */
  subscribeToActiveRides(driverId, callback) {
    // Implementation above
  },
  
  /**
   * Submit bid on ride request
   */
  async submitBid(rideRequestId, bidAmount, driverInfo, driverLocation) {
    // Implementation above
  },
  
  /**
   * Accept scheduled ride
   */
  async acceptScheduledRide(notificationId, rideId, rideType, driverId, driverInfo) {
    // Implementation above
  },
  
  /**
   * Decline ride request
   */
  async declineRide(notificationId, reason = '') {
    // Implementation above
  },
  
  /**
   * Update ride status
   */
  async updateRideStatus(rideId, rideCollection, status, additionalData = {}) {
    try {
      await updateDoc(doc(db, rideCollection, rideId), {
        status: status,
        updatedAt: serverTimestamp(),
        ...additionalData
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating ride status:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Start ride (driver picks up customer)
   */
  async startRide(rideId, rideCollection, driverId) {
    return this.updateRideStatus(rideId, rideCollection, 'in_progress', {
      startedAt: serverTimestamp()
    });
  },
  
  /**
   * Complete ride
   */
  async completeRide(rideId, rideCollection, completionData = {}) {
    return this.updateRideStatus(rideId, rideCollection, 'completed', {
      completedAt: serverTimestamp(),
      ...completionData
    });
  },
  
  /**
   * Cancel ride
   */
  async cancelRide(rideId, rideCollection, reason = '') {
    return this.updateRideStatus(rideId, rideCollection, 'cancelled', {
      cancelledAt: serverTimestamp(),
      cancellationReason: reason,
      cancelledBy: 'driver'
    });
  }
};
```

---

## Code Examples

### Complete Integration Example

```javascript
// screens/DriverHomeScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { RideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';

const DriverHomeScreen = () => {
  const { user } = useAuth();
  const [pendingRides, setPendingRides] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load driver profile
  useEffect(() => {
    const loadDriverProfile = async () => {
      const profile = await getDoc(doc(db, 'driverApplications', user.uid));
      if (profile.exists()) {
        setDriverProfile(profile.data());
      }
    };
    
    if (user?.uid) {
      loadDriverProfile();
    }
  }, [user]);
  
  // Subscribe to all ride types
  useEffect(() => {
    if (!user?.uid || !driverProfile) return;
    
    const specialtyTypes = driverProfile.specialties?.map(s => s.type) || [];
    
    // Pending immediate rides
    const unsubPending = RideService.subscribeToPendingRides(
      user.uid,
      specialtyTypes,
      (rides) => {
        setPendingRides(rides);
        setLoading(false);
      }
    );
    
    // Scheduled rides (notifications)
    const unsubScheduled = RideService.subscribeToScheduledRideNotifications(
      user.uid,
      (notifications) => {
        setScheduledRides(notifications);
      }
    );
    
    // Active rides
    const unsubActive = RideService.subscribeToActiveRides(
      user.uid,
      (rides) => {
        setActiveRides(rides);
      }
    );
    
    return () => {
      unsubPending();
      unsubScheduled();
      unsubActive();
    };
  }, [user, driverProfile]);
  
  // Handle bid submission
  const handleSubmitBid = async (rideRequest, bidAmount) => {
    const location = await getCurrentLocation(); // Get driver's current location
    
    const result = await RideService.submitBid(
      rideRequest.id,
      bidAmount,
      {
        name: `${driverProfile.personalInfo.firstName} ${driverProfile.personalInfo.lastName}`,
        rating: driverProfile.rating || 4.5,
        vehicleType: driverProfile.vehicle.type,
        specialties: driverProfile.specialties || []
      },
      location
    );
    
    if (result.success) {
      Alert.alert('Success', 'Your bid has been submitted!');
    }
  };
  
  // Handle scheduled ride acceptance
  const handleAcceptScheduledRide = async (notification) => {
    const result = await RideService.acceptScheduledRide(
      notification.notificationId,
      notification.rideDetails.id,
      notification.type === 'medical_ride_request' ? 'medicalRideSchedule' : 'scheduledRides',
      user.uid,
      {
        name: `${driverProfile.personalInfo.firstName} ${driverProfile.personalInfo.lastName}`,
        phone: driverProfile.personalInfo.phone,
        vehicleInfo: driverProfile.vehicle
      }
    );
    
    if (result.success) {
      Alert.alert('Success', 'Ride accepted!');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Active Rides Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Rides ({activeRides.length})</Text>
        {/* Render active rides */}
      </View>
      
      {/* Scheduled Rides Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Scheduled Rides ({scheduledRides.length})
        </Text>
        <FlatList
          data={scheduledRides}
          renderItem={({ item }) => (
            <ScheduledRideCard 
              notification={item}
              onAccept={handleAcceptScheduledRide}
              onDecline={(item) => RideService.declineRide(item.notificationId)}
            />
          )}
          keyExtractor={item => item.notificationId}
        />
      </View>
      
      {/* Pending Immediate Rides Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Available Rides ({pendingRides.length})
        </Text>
        <FlatList
          data={pendingRides}
          renderItem={({ item }) => (
            <PendingRideCard 
              ride={item}
              onBid={(bidAmount) => handleSubmitBid(item, bidAmount)}
            />
          )}
          keyExtractor={item => item.id}
        />
      </View>
    </View>
  );
};
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing or insufficient permissions` | Firestore rules blocking access | Ensure driver is authenticated and document ownership is correct |
| `Failed to get document because the client is offline` | Network connectivity | Implement offline support with Firestore cache |
| `Firebase index required` | Missing composite index | Add required index to `firestore.indexes.json` |
| `Invalid query: Inequality filter property and first sort order must be the same` | Query structure issue | Reorder query constraints |
| `Document does not exist` | Ride/notification deleted | Add null checks before accessing data |

### Error Handling Pattern

```javascript
const safeRideOperation = async (operation, errorMessage = 'Operation failed') => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(errorMessage, error);
    
    // Check for specific errors
    if (error.code === 'permission-denied') {
      Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
    } else if (error.code === 'not-found') {
      Alert.alert('Not Found', 'The requested ride could not be found.');
    } else if (error.code === 'unavailable') {
      Alert.alert('Offline', 'You appear to be offline. Please check your connection.');
    } else {
      Alert.alert('Error', errorMessage);
    }
    
    return { success: false, error };
  }
};

// Usage
const result = await safeRideOperation(
  () => RideService.acceptScheduledRide(notification),
  'Failed to accept ride'
);

if (result.success) {
  // Handle success
}
```

---

## Testing

### Test Scenarios

#### 1. Medical Ride Flow
```
1. Create test medical ride in backend (use create-test-scheduled-ride-requests.js)
2. Driver app should receive notification
3. Driver views ride details
4. Driver accepts ride
5. Verify ride status updates to "assigned"
6. Verify notification sent to dispatcher
```

#### 2. Immediate Ride Bidding
```
1. Rider creates immediate ride request with specialty requirements
2. Driver app shows request (if specialty matches)
3. Driver places bid
4. Verify bid appears in rider app
5. Rider accepts bid
6. Driver receives acceptance notification
```

#### 3. Scheduled Ride
```
1. Create scheduled ride for future date
2. Driver receives notification
3. Driver accepts ride
4. Verify ride appears in driver's schedule
5. On scheduled date, driver starts ride
6. Driver completes ride
```

### Test Data Generation

Use the provided script to create test rides:

```bash
# Run from web app directory
node create-test-scheduled-ride-requests.js
```

This creates:
- Medical transport requests (dialysis, physical therapy)
- Regular scheduled rides
- Notifications for all approved drivers

---

## Quick Start Checklist

- [ ] **Install Firebase dependencies**
  ```bash
  npm install firebase
  # or
  yarn add firebase
  ```

- [ ] **Configure Firebase in app**
  - Add `firebase.js` config file with your project credentials
  - Initialize Firestore

- [ ] **Add required permissions to Firestore**
  - Deploy updated `firestore.rules`
  - Deploy required indexes from `firestore.indexes.json`

- [ ] **Create ride service**
  - Copy `RideService` implementation
  - Add to `services/rideService.js`

- [ ] **Implement UI screens**
  - Pending Rides Screen
  - Scheduled Rides Screen
  - Medical Rides Screen
  - Ride Details Modal
  - Bid Submission Form

- [ ] **Add real-time listeners**
  - Subscribe to pending rides
  - Subscribe to scheduled ride notifications
  - Subscribe to active rides

- [ ] **Implement action handlers**
  - Submit bid
  - Accept scheduled ride
  - Decline ride
  - Start ride
  - Complete ride

- [ ] **Test with sample data**
  - Run test script to create sample rides
  - Verify real-time updates
  - Test all user flows

---

## Support & Resources

### Firebase Documentation
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

### Code Repository
- Web App (Backend): `C:\Users\sjroy\Source\rydeIQ\rydeiqWeb`
- Rider App: `C:\Users\sjroy\Source\rydeIQ\rydeiqMobile`
- Driver App: `C:\Users\sjroy\Source\rydeIQ\rydeIQDriver`

### Key Files Reference
- **Firestore Rules**: `rydeiqWeb/firestore.rules`
- **Indexes**: `rydeiqWeb/firestore.indexes.json`
- **Test Script**: `rydeiqWeb/create-test-scheduled-ride-requests.js`
- **Medical Service**: `rydeiqWeb/src/services/medicalDriverIntegrationService.js`
- **Ride Request Service**: `rydeiqWeb/src/services/rideRequestService.js`

---

**Document Version:** 1.0  
**Created:** October 1, 2025  
**Contact:** Development Team  
**Status:** Ready for Implementation

