# Configuration Guide

## Overview

This guide covers all configuration options for the RydeIQ Driver app, including API keys, environment variables, Firebase settings, and app-specific configurations.

## Environment Variables

### Core Configuration

Create a `.env` file in the project root with the following variables:

```env
# =============================================================================
# GOOGLE MAPS API CONFIGURATION
# =============================================================================

# Android Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU

# iOS Google Maps API Key  
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU

# Web Google Maps API Key (for development/testing)
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================

# Firebase Project Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB9rIUiKOdcrEI3H8-OZ6STioLImUTfJ9o
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ryde-9d4bf.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ryde-9d4bf
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ryde-9d4bf.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=649308231342
EXPO_PUBLIC_FIREBASE_APP_ID=1:649308231342:web:1e6e424c4195c2ba72ff3f
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YQJHJBNZJ7

# =============================================================================
# FUEL PRICE API CONFIGURATION
# =============================================================================

# EIA (Energy Information Administration) API - FREE
EXPO_PUBLIC_EIA_API_KEY=your_eia_api_key_here

# GasBuddy API - COMMERCIAL (Optional)
EXPO_PUBLIC_GASBUDDY_API_KEY=your_gasbuddy_api_key_here

# Fuel Economy API - FREE (Optional)
EXPO_PUBLIC_FUEL_ECONOMY_API_KEY=your_fuel_economy_api_key_here

# =============================================================================
# ANALYTICS & MONITORING (Optional)
# =============================================================================

# Mixpanel Analytics
EXPO_PUBLIC_MIXPANEL_KEY=your_mixpanel_key_here

# Amplitude Analytics
EXPO_PUBLIC_AMPLITUDE_KEY=your_amplitude_key_here

# =============================================================================
# APP CONFIGURATION
# =============================================================================

# Environment (development | staging | production)
EXPO_PUBLIC_ENVIRONMENT=development

# Debug mode (true | false)
EXPO_PUBLIC_DEBUG_MODE=true

# Enable mock APIs in development
EXPO_PUBLIC_MOCK_APIS=true

# =============================================================================
# EAS BUILD CONFIGURATION
# =============================================================================

# EAS Project ID
EXPO_PUBLIC_EAS_PROJECT_ID=99bcac79-c28f-4d78-bd00-8a6f9ca54912
```

## App Configuration

### App.json Configuration

The main app configuration is in `app.json`:

```json
{
  "expo": {
    "name": "AnyRyde Driver",
    "slug": "rydeiq-driver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/app-icon-detailed.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.rydeiq.driver",
      "buildNumber": "1",
      "config": {
        "googleMapsApiKey": "AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU"
      }
    },
    
    "android": {
      "package": "com.rydeiq.driver",
      "versionCode": 1,
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU"
        }
      }
    },
    
    "extra": {
      "firebaseConfig": {
        "apiKey": "AIzaSyB9rIUiKOdcrEI3H8-OZ6STioLImUTfJ9o",
        "authDomain": "ryde-9d4bf.firebaseapp.com",
        "projectId": "ryde-9d4bf",
        "storageBucket": "ryde-9d4bf.firebasestorage.app",
        "messagingSenderId": "649308231342",
        "appId": "1:649308231342:web:1e6e424c4195c2ba72ff3f"
      },
      "googleMapsApiKey": "AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU",
      "environment": "development"
    }
  }
}
```

### Application Constants

**File**: `src/constants/config.js`

```javascript
// Application Configuration
export const APP_CONFIG = {
  name: 'AnyRyde Driver',
  version: '1.0.0',
  buildNumber: '1',
  
  // Feature Flags
  features: {
    fuelEstimation: true,
    aiLearning: true,
    realTimePricing: true,
    advancedAnalytics: true,
    biometricAuth: true,
    offlineMode: true
  },
  
  // Cache Configuration
  cache: {
    fuelPrices: 30 * 60 * 1000, // 30 minutes
    userPreferences: 24 * 60 * 60 * 1000, // 24 hours
    mapData: 60 * 60 * 1000, // 1 hour
    vehicleData: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // Limits and Thresholds
  limits: {
    maxBidAmount: 500, // $500 maximum bid
    minBidAmount: 1, // $1 minimum bid
    maxTripDistance: 500, // 500 miles
    fuelEstimationMinTrips: 10, // Minimum trips for AI learning
    maxCachedTrips: 1000, // Maximum cached trip data
  }
};
```

## Firebase Configuration

### Firebase Project Settings

#### 1. Authentication Configuration

**Sign-in Methods**:
- ✅ Email/Password
- ✅ Google (optional)
- ✅ Phone (optional)

**Authorized Domains**:
- `localhost` (development)
- `your-domain.com` (production)

#### 2. Firestore Database Rules

**Security Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Driver applications
    match /driverApplications/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Ride requests
    match /rideRequests/{requestId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.availableDrivers;
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.availableDrivers;
    }
    
    // Earnings
    match /earnings/{earningId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
    
    // Trip history
    match /tripHistory/{tripId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
  }
}
```

#### 3. Cloud Storage Rules

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Driver profile pictures
    match /drivers/{driverId}/profile/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Driver documents
    match /drivers/{driverId}/documents/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Vehicle photos
    match /drivers/{driverId}/vehicle/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
  }
}
```

### Firebase Configuration Files

#### google-services.json (Android)
Place in project root:
```json
{
  "project_info": {
    "project_number": "649308231342",
    "project_id": "ryde-9d4bf",
    "storage_bucket": "ryde-9d4bf.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:649308231342:android:your_android_app_id",
        "android_client_info": {
          "package_name": "com.rydeiq.driver"
        }
      },
      "oauth_client": [...],
      "api_key": [
        {
          "current_key": "AIzaSyB9rIUiKOdcrEI3H8-OZ6STioLImUTfJ9o"
        }
      ],
      "services": {...}
    }
  ]
}
```

#### GoogleService-Info.plist (iOS)
Place in project root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>your_client_id</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>your_reversed_client_id</string>
  <key>API_KEY</key>
  <string>AIzaSyB9rIUiKOdcrEI3H8-OZ6STioLImUTfJ9o</string>
  <key>GCM_SENDER_ID</key>
  <string>649308231342</string>
  <key>PLIST_VERSION</key>
  <string>1</string>
  <key>BUNDLE_ID</key>
  <string>com.rydeiq.driver</string>
  <key>PROJECT_ID</key>
  <string>ryde-9d4bf</string>
  <key>STORAGE_BUCKET</key>
  <string>ryde-9d4bf.firebasestorage.app</string>
  <key>IS_ADS_ENABLED</key>
  <false/>
  <key>IS_ANALYTICS_ENABLED</key>
  <false/>
  <key>IS_APPINVITE_ENABLED</key>
  <true/>
  <key>IS_GCM_ENABLED</key>
  <true/>
  <key>IS_SIGNIN_ENABLED</key>
  <true/>
  <key>GOOGLE_APP_ID</key>
  <string>1:649308231342:ios:your_ios_app_id</string>
</dict>
</plist>
```

## Google Maps API Configuration

### API Key Setup

#### 1. Android API Key Restrictions

**Application Restrictions**: Android apps
- Package name: `com.rydeiq.driver`
- SHA-1 certificate fingerprint: Get from your keystore

**API Restrictions**: Restrict to required APIs only
- Maps SDK for Android
- Directions API
- Distance Matrix API
- Geocoding API
- Places API

#### 2. iOS API Key Restrictions

**Application Restrictions**: iOS apps
- Bundle identifier: `com.rydeiq.driver`

**API Restrictions**: Restrict to required APIs only
- Maps SDK for iOS
- Directions API
- Distance Matrix API
- Geocoding API
- Places API

#### 3. Web API Key Restrictions (Development)

**Application Restrictions**: HTTP referrers
- Website restrictions:
  - `http://localhost:*`
  - `https://your-dev-domain.com/*`

**API Restrictions**: Same as mobile APIs

### Required APIs

Enable these APIs in Google Cloud Console:

1. **Maps SDK for Android** - Core maps functionality
2. **Maps SDK for iOS** - Core maps functionality
3. **Directions API** - Turn-by-turn directions
4. **Distance Matrix API** - Distance calculations
5. **Geocoding API** - Address to coordinates conversion
6. **Places API** - Place search and details
7. **Roads API** - Route snapping (optional)

## Fuel Price API Configuration

### EIA (Energy Information Administration) API

**Registration**: Free at [EIA Registration](https://www.eia.gov/opendata/register.php)

**Rate Limits**: 5,000 requests per day

**Configuration**:
```javascript
// In src/constants/config.js
export const API_ENDPOINTS = {
  FUEL_PRICES: {
    EIA: {
      baseUrl: 'https://api.eia.gov/v2',
      endpoints: {
        gasolinePrices: '/petroleum/pri/gnd/data',
        dieselPrices: '/petroleum/pri/gnd/data',
        stateData: '/petroleum/pri/gnd/data'
      }
    }
  }
};
```

### GasBuddy API (Optional - Commercial)

**Registration**: Contact GasBuddy for commercial API access

**Rate Limits**: Varies by plan

**Configuration**:
```javascript
export const API_ENDPOINTS = {
  FUEL_PRICES: {
    GASBUDDY: {
      baseUrl: 'https://api.gasbuddy.com/v3',
      endpoints: {
        stations: '/stations/search',
        prices: '/prices/station',
        trends: '/trends/area'
      }
    }
  }
};
```

## Redux Persist Configuration

**File**: `src/store/index.js`

```javascript
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'driver', 'app'], // Only persist these slices
  blacklist: ['location', 'rides', 'bidding'] // Don't persist real-time data
};
```

## Push Notification Configuration

### Firebase Cloud Messaging

**Android Configuration**:
```javascript
// Notification channels in src/services/notifications/index.js
await messaging().setNotificationChannelAsync('ride-requests', {
  name: 'Ride Requests',
  importance: 'high',
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#10B981',
  sound: 'mixkit-fast-car-drive-by-1538',
});
```

**iOS Configuration**:
- Configure in `app.json` under iOS permissions
- Add notification capabilities in Xcode

## Environment-Specific Configuration

### Development Environment

```env
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_MOCK_APIS=true
```

**Features**:
- Detailed logging enabled
- Mock APIs for testing
- Development Firebase project
- Test API keys

### Staging Environment

```env
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_MOCK_APIS=false
```

**Features**:
- Limited logging
- Real APIs with test data
- Staging Firebase project
- Restricted API keys

### Production Environment

```env
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_MOCK_APIS=false
```

**Features**:
- Minimal logging
- Production APIs
- Production Firebase project
- Fully restricted API keys

## Security Configuration

### API Key Security

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Restrict API keys** by platform and domain
4. **Rotate keys regularly** in production
5. **Monitor API usage** for anomalies

### Firebase Security

1. **Use Firestore Security Rules** to protect data
2. **Enable App Check** for additional security
3. **Configure CORS** for web applications
4. **Set up monitoring** and alerting

### Network Security

1. **Use HTTPS** for all API calls
2. **Implement certificate pinning** for critical APIs
3. **Validate SSL certificates** in production
4. **Use secure storage** for sensitive data

## Configuration Validation

### Validation Script

Create `scripts/validate-config.js`:

```javascript
import { validateConfig } from '../src/constants/config';

const validateConfiguration = () => {
  const errors = validateConfig();
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors found:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  } else {
    console.log('✅ Configuration is valid');
  }
};

validateConfiguration();
```

### Pre-commit Hook

Add to `package.json`:
```json
{
  "scripts": {
    "validate-config": "node scripts/validate-config.js",
    "precommit": "yarn validate-config"
  }
}
```

## Configuration Testing

### Test Configuration

```bash
# Test Firebase connection
yarn test:firebase

# Test Google Maps API
yarn test:maps

# Test fuel price APIs
yarn test:fuel-apis

# Validate all configuration
yarn validate-config
```

### Configuration Checklist

- [ ] Firebase project created and configured
- [ ] Google Maps API keys generated and restricted
- [ ] Fuel price API keys obtained (EIA minimum)
- [ ] Environment variables set correctly
- [ ] Firebase security rules configured
- [ ] Push notifications enabled
- [ ] App permissions configured
- [ ] API rate limits understood
- [ ] Security measures implemented
- [ ] Configuration validated

---

**Next**: [Development Workflow](./development.md) - Local development and testing procedures
