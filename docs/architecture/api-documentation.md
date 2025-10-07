# API Documentation

## Overview

RydeIQ Driver integrates with multiple external APIs to provide comprehensive functionality including maps, navigation, fuel pricing, and analytics.

## External API Integrations

### Google Maps API

**Base URL**: `https://maps.googleapis.com/maps/api`

**Authentication**: API Key (restricted by platform and domain)

#### Available Endpoints

##### 1. Directions API
```
GET /directions/json
```

**Purpose**: Get turn-by-turn directions between two points.

**Parameters**:
- `origin`: Starting point (lat,lng or address)
- `destination`: Ending point (lat,lng or address)
- `key`: Google Maps API key
- `mode`: Transportation mode (`driving`, `walking`, `bicycling`, `transit`)
- `alternatives`: Return alternative routes (`true`/`false`)
- `avoid`: Route restrictions (`tolls`, `highways`, `ferries`, `indoor`)

**Example Request**:
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/directions/json?` +
  `origin=37.7749,-122.4194&` +
  `destination=37.7849,-122.4094&` +
  `mode=driving&` +
  `alternatives=true&` +
  `key=${GOOGLE_MAPS_API_KEY}`
);
```

**Example Response**:
```json
{
  "routes": [
    {
      "legs": [
        {
          "distance": { "text": "1.2 mi", "value": 1931 },
          "duration": { "text": "8 mins", "value": 480 },
          "start_address": "San Francisco, CA, USA",
          "end_address": "San Francisco, CA, USA",
          "steps": [...]
        }
      ],
      "overview_polyline": {
        "points": "encoded_polyline_string"
      }
    }
  ],
  "status": "OK"
}
```

##### 2. Distance Matrix API
```
GET /distancematrix/json
```

**Purpose**: Calculate distances and travel times between multiple origins and destinations.

**Parameters**:
- `origins`: Comma-separated list of origin points
- `destinations`: Comma-separated list of destination points
- `key`: Google Maps API key
- `mode`: Transportation mode
- `units`: Unit system (`metric`, `imperial`)
- `traffic_model`: Traffic prediction model (`best_guess`, `pessimistic`, `optimistic`)

**Example Request**:
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/distancematrix/json?` +
  `origins=37.7749,-122.4194|37.7849,-122.4094&` +
  `destinations=37.7649,-122.4294|37.7549,-122.4394&` +
  `mode=driving&` +
  `units=imperial&` +
  `key=${GOOGLE_MAPS_API_KEY}`
);
```

##### 3. Geocoding API
```
GET /geocode/json
```

**Purpose**: Convert addresses to coordinates and vice versa.

**Parameters**:
- `address`: Address to geocode
- `latlng`: Coordinates to reverse geocode
- `key`: Google Maps API key
- `region`: Bias results to specific region
- `language`: Response language

**Example Request**:
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?` +
  `address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&` +
  `key=${GOOGLE_MAPS_API_KEY}`
);
```

##### 4. Places API
```
GET /place/findplacefromtext/json
```

**Purpose**: Find places based on text input.

**Parameters**:
- `input`: Text to search for
- `inputtype`: Input type (`textquery`, `phonenumber`)
- `key`: Google Maps API key
- `fields`: Comma-separated list of fields to return
- `locationbias`: Bias results to specific location

**Example Request**:
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
  `input=Starbucks&` +
  `inputtype=textquery&` +
  `fields=formatted_address,name,geometry&` +
  `key=${GOOGLE_MAPS_API_KEY}`
);
```

### Fuel Price APIs

#### 1. EIA (Energy Information Administration) API

**Base URL**: `https://api.eia.gov/v2`

**Authentication**: API Key (free registration required)

**Rate Limits**: 5,000 requests per day

##### Gasoline Prices Endpoint
```
GET /petroleum/pri/gnd/data
```

**Purpose**: Get national and regional gasoline price data.

**Parameters**:
- `api_key`: EIA API key
- `frequency`: Data frequency (`weekly`, `monthly`)
- `data[0]`: Data series identifier
- `sort[0][column]`: Sort column
- `sort[0][direction]`: Sort direction (`asc`, `desc`)
- `offset`: Number of records to skip
- `length`: Number of records to return

**Example Request**:
```javascript
const response = await fetch(
  `https://api.eia.gov/v2/petroleum/pri/gnd/data/?` +
  `api_key=${EIA_API_KEY}&` +
  `frequency=weekly&` +
  `data[0]=value&` +
  `sort[0][column]=period&` +
  `sort[0][direction]=desc&` +
  `offset=0&` +
  `length=52`
);
```

**Example Response**:
```json
{
  "response": {
    "data": [
      {
        "period": "2025-01-13",
        "value": 3.45,
        "units": "dollars per gallon"
      }
    ],
    "total": 52
  }
}
```

#### 2. GasBuddy API (Commercial)

**Base URL**: `https://api.gasbuddy.com/v3`

**Authentication**: API Key (commercial license required)

**Rate Limits**: Varies by plan

##### Station Search Endpoint
```
GET /stations/search
```

**Purpose**: Find gas stations near a location.

**Parameters**:
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in miles
- `api_key`: GasBuddy API key

**Example Request**:
```javascript
const response = await fetch(
  `https://api.gasbuddy.com/v3/stations/search?` +
  `lat=37.7749&` +
  `lng=-122.4194&` +
  `radius=5&` +
  `api_key=${GASBUDDY_API_KEY}`
);
```

##### Price Data Endpoint
```
GET /prices/station
```

**Purpose**: Get current fuel prices for specific stations.

**Parameters**:
- `station_id`: Station identifier
- `fuel_type`: Fuel type (`regular`, `midgrade`, `premium`, `diesel`)
- `api_key`: GasBuddy API key

#### 3. MyGasFeed API (Alternative)

**Base URL**: `https://api.mygasfeed.com/stations`

**Authentication**: API Key (free tier available)

##### Station Search by Radius
```
GET /radius/{lat}/{lng}/{distance}
```

**Purpose**: Find stations within specified radius.

**Parameters**:
- `lat`: Latitude
- `lng`: Longitude
- `distance`: Radius in miles
- `api_key`: MyGasFeed API key
- `sort`: Sort order (`price`, `distance`)

**Example Request**:
```javascript
const response = await fetch(
  `https://api.mygasfeed.com/stations/radius/37.7749/-122.4194/5?` +
  `api_key=${MYGASFEED_API_KEY}&` +
  `sort=price`
);
```

## Firebase API Integration

### Firebase Authentication

**SDK**: Firebase Auth Web SDK v9+

#### Authentication Methods

```javascript
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Sign in with email and password
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Create new user account
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign out current user
const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Listen for authentication state changes
const listenToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};
```

### Firebase Firestore

**SDK**: Firebase Firestore Web SDK v9+

#### Database Operations

```javascript
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

// Initialize Firestore
const db = getFirestore();

// Get document
const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error('Document not found');
  }
};

// Set document
const setDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data);
};

// Update document
const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
};

// Query collection
const queryCollection = async (collectionName, constraints) => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Real-time listener
const listenToCollection = (collectionName, constraints, callback) => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// Batch operations
const batchWrite = async (operations) => {
  const batch = writeBatch(db);
  
  operations.forEach(({ type, collection, docId, data }) => {
    const docRef = doc(db, collection, docId);
    
    switch (type) {
      case 'set':
        batch.set(docRef, data);
        break;
      case 'update':
        batch.update(docRef, data);
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  });
  
  await batch.commit();
};
```

### Firebase Cloud Messaging

**SDK**: Firebase Cloud Messaging

#### Push Notification Setup

```javascript
import messaging from '@react-native-firebase/messaging';

// Request permission
const requestPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
};

// Get FCM token
const getToken = async () => {
  const token = await messaging().getToken();
  return token;
};

// Subscribe to topic
const subscribeToTopic = async (topic) => {
  await messaging().subscribeToTopic(topic);
};

// Handle foreground messages
const handleForegroundMessage = (callback) => {
  return messaging().onMessage(callback);
};

// Handle background messages
const handleBackgroundMessage = (callback) => {
  messaging().setBackgroundMessageHandler(callback);
};
```

## API Configuration

### Environment Variables

```bash
# Google Maps API Keys
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your_android_key
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=your_ios_key
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=your_web_key

# Fuel Price API Keys
EXPO_PUBLIC_EIA_API_KEY=your_eia_key
EXPO_PUBLIC_GASBUDDY_API_KEY=your_gasbuddy_key
EXPO_PUBLIC_FUEL_ECONOMY_API_KEY=your_fuel_economy_key

# Analytics API Keys
EXPO_PUBLIC_MIXPANEL_KEY=your_mixpanel_key
EXPO_PUBLIC_AMPLITUDE_KEY=your_amplitude_key
```

### API Key Restrictions

#### Google Maps API Keys

**Android Key Restrictions**:
- Package name: `com.rydeiq.driver`
- SHA-1 certificate fingerprint: Your app's fingerprint

**iOS Key Restrictions**:
- Bundle identifier: `com.rydeiq.driver`

**Web Key Restrictions**:
- HTTP referrers: `https://yourdomain.com/*`

#### Fuel Price API Keys

**EIA API**:
- Rate limit: 5,000 requests/day
- No geographic restrictions
- Free tier available

**GasBuddy API**:
- Rate limits vary by plan
- Geographic restrictions may apply
- Commercial license required

## Error Handling

### API Error Response Format

```javascript
// Standard error response structure
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "specific field error",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes

| Code | Description | Action |
|------|-------------|---------|
| `INVALID_API_KEY` | API key is invalid or expired | Check API key configuration |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement exponential backoff |
| `PERMISSION_DENIED` | Insufficient permissions | Check API key restrictions |
| `NETWORK_ERROR` | Network connectivity issue | Retry with exponential backoff |
| `QUOTA_EXCEEDED` | API quota exceeded | Check usage limits |

### Retry Logic

```javascript
const retryWithBackoff = async (apiCall, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## Rate Limiting

### Implementation Strategy

```javascript
class RateLimiter {
  constructor(requestsPerMinute = 60) {
    this.requests = [];
    this.limit = requestsPerMinute;
  }
  
  async waitForSlot() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Add current request
    this.requests.push(now);
  }
}

// Usage
const rateLimiter = new RateLimiter(60); // 60 requests per minute

const makeAPICall = async () => {
  await rateLimiter.waitForSlot();
  return fetch(apiUrl);
};
```

## Caching Strategy

### API Response Caching

```javascript
class APICache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage
const apiCache = new APICache();

const getCachedData = async (key, apiCall) => {
  let data = apiCache.get(key);
  
  if (!data) {
    data = await apiCall();
    apiCache.set(key, data);
  }
  
  return data;
};
```

---

**Next**: [State Management](./state-management.md) - Redux store structure and data flow
