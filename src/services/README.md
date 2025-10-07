# Services Layer

## Overview

The services layer handles all external integrations and business logic for the RydeIQ Driver app. Services are organized by domain and provide clean interfaces between the app and external systems.

## Service Architecture

```
services/
├── api/                    # API integrations
│   └── fuelPriceService.js # Fuel price API integration
├── firebase/              # Firebase services
│   └── config.js          # Firebase configuration
├── location/              # Location services
│   └── index.js           # Location service implementation
├── notifications/         # Push notification services
│   └── index.js           # FCM implementation
├── rideRequestService.js  # Ride request management
├── driverStatusService.js # Driver status and location
├── costEstimationService.js # Fuel cost calculations
├── analyticsService.js    # Analytics and tracking
├── communicationService.js # Driver-rider communication
├── safetyService.js       # Safety features
├── vehicleService.js      # Vehicle management
└── paymentService.js      # Payment processing
```

## Core Services

### Authentication Services

**File**: `firebase/config.js`
- **Purpose**: Firebase Authentication integration
- **Features**: Email/password, Google Sign-In, phone auth
- **Key Methods**:
  - `signIn(email, password)`
  - `signUp(email, password, userData)`
  - `signOut()`
  - `onAuthStateChanged(callback)`

### Ride Request Service

**File**: `rideRequestService.js`
- **Purpose**: Manage ride requests and bidding
- **Features**: Real-time ride matching, bid submission, status updates
- **Key Methods**:
  - `initialize(driverId)`
  - `startListeningForRideRequests()`
  - `submitCustomBid(rideRequestId, bidAmount)`
  - `acceptRideRequest(rideRequestId)`

### Driver Status Service

**File**: `driverStatusService.js`
- **Purpose**: Manage driver availability and location
- **Features**: Online/offline status, location tracking, profile updates
- **Key Methods**:
  - `updateDriverStatus(status)`
  - `updateDriverLocation(location)`
  - `startLocationUpdates()`
  - `goOnline() / goOffline()`

### Location Services

**File**: `location/index.js`
- **Purpose**: GPS tracking and location management
- **Features**: Current location, background tracking, permissions
- **Key Methods**:
  - `getCurrentLocation()`
  - `startLocationTracking()`
  - `stopLocationTracking()`
  - `calculateDistance(lat1, lon1, lat2, lon2)`

### Notification Service

**File**: `notifications/index.js`
- **Purpose**: Push notification handling
- **Features**: FCM integration, notification channels, topic subscriptions
- **Key Methods**:
  - `initializeNotifications()`
  - `getNotificationToken()`
  - `subscribeToTopic(topic)`
  - `handleForegroundMessage(callback)`

## Business Logic Services

### Cost Estimation Service

**File**: `costEstimationService.js`
- **Purpose**: Calculate fuel costs and profit margins
- **Features**: Real-time fuel prices, route optimization, profit calculations
- **Integration**: EIA API, GasBuddy API

### Analytics Service

**File**: `analyticsService.js`
- **Purpose**: Track app usage and performance
- **Features**: User behavior, performance metrics, business analytics
- **Integration**: Firebase Analytics, custom metrics

### Communication Service

**File**: `communicationService.js`
- **Purpose**: Driver-rider communication
- **Features**: In-app messaging, call functionality, emergency contacts
- **Integration**: Firebase Firestore, phone services

### Safety Service

**File**: `safetyService.js`
- **Purpose**: Safety features and emergency protocols
- **Features**: Emergency button, trip recording, safety checks
- **Integration**: Emergency services, location tracking

## API Integration Services

### Fuel Price Service

**File**: `api/fuelPriceService.js`
- **Purpose**: Fetch real-time fuel prices
- **APIs**: EIA, GasBuddy, MyGasFeed
- **Features**: Price caching, regional adjustments, trend analysis

### Vehicle Service

**File**: `vehicleService.js`
- **Purpose**: Vehicle information and management
- **Features**: Vehicle profiles, maintenance tracking, efficiency metrics

### Payment Service

**File**: `paymentService.js`
- **Purpose**: Handle payments and earnings
- **Features**: Payment processing, earnings tracking, payout management

## Service Patterns

### Singleton Pattern

Most services use the singleton pattern for consistent state management:

```javascript
class RideRequestService {
  constructor() {
    // Initialize service
  }
  
  // Service methods
}

export default new RideRequestService();
```

### Async/Await Pattern

All service methods use async/await for clean asynchronous code:

```javascript
const submitBid = async (rideRequestId, bidAmount) => {
  try {
    const result = await RideRequestService.submitCustomBid(rideRequestId, bidAmount);
    return result;
  } catch (error) {
    console.error('Bid submission failed:', error);
    throw error;
  }
};
```

### Error Handling

Services implement comprehensive error handling:

```javascript
const handleServiceCall = async (serviceMethod) => {
  try {
    return await serviceMethod();
  } catch (error) {
    // Log error
    console.error('Service error:', error);
    
    // Return fallback or rethrow
    if (error.code === 'network-error') {
      return { success: false, error: 'Network unavailable' };
    }
    throw error;
  }
};
```

## Service Dependencies

### Firebase Services
- **Authentication**: User management
- **Firestore**: Real-time database
- **Cloud Messaging**: Push notifications
- **Storage**: File uploads

### External APIs
- **Google Maps**: Navigation and geocoding
- **Fuel Price APIs**: Real-time fuel costs
- **Analytics APIs**: Usage tracking

### Device Services
- **Location**: GPS tracking
- **Camera**: Document capture
- **Storage**: Local data persistence

## Testing Services

### Unit Testing
```bash
# Test specific service
yarn test services/rideRequestService.test.js

# Test all services
yarn test services/
```

### Integration Testing
```bash
# Test Firebase integration
yarn test:firebase

# Test API integrations
yarn test:apis
```

## Service Configuration

### Environment Variables
Services use environment variables for configuration:

```javascript
const API_CONFIG = {
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  EIA_API_KEY: process.env.EXPO_PUBLIC_EIA_API_KEY,
  FIREBASE_CONFIG: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    // ... other config
  }
};
```

### Service Initialization
Services are initialized in the app startup:

```javascript
// In App.js
import '@/services/firebase/config';
import RideRequestService from '@/services/rideRequestService';
import DriverStatusService from '@/services/driverStatusService';

// Initialize services after authentication
const initializeServices = async (userId) => {
  await RideRequestService.initialize(userId);
  await DriverStatusService.initialize(userId);
};
```

## Best Practices

### 1. Error Handling
- Always wrap async calls in try/catch
- Provide meaningful error messages
- Implement fallback mechanisms

### 2. Performance
- Cache frequently accessed data
- Implement request debouncing
- Use background processing for heavy operations

### 3. Security
- Never expose sensitive data in logs
- Validate all inputs
- Use secure storage for sensitive data

### 4. Testing
- Write unit tests for all service methods
- Mock external dependencies
- Test error scenarios

## Documentation

- **[API Documentation](../../docs/architecture/api-documentation.md)**
- **[Firebase Setup](../../docs/getting-started/configuration.md#firebase-configuration)**
- **[Service Testing](../../docs/technical/testing.md)**

## Contributing

1. Follow the established service patterns
2. Add comprehensive error handling
3. Write tests for new services
4. Update documentation
5. Use TypeScript for better type safety
