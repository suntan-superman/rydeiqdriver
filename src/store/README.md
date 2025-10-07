# Redux Store

## Overview

The Redux store manages the global application state using Redux Toolkit with selective persistence via Redux Persist. The store is organized into focused slices that handle specific domains of the application.

## Store Structure

```
store/
├── index.js              # Store configuration and setup
├── middleware/           # Custom middleware
│   ├── authMiddleware.js # Authentication middleware
│   ├── locationMiddleware.js # Location middleware
│   └── notificationMiddleware.js # Notification middleware
└── slices/              # Redux slices
    ├── authSlice.js     # Authentication state
    ├── driverSlice.js   # Driver profile and status
    ├── ridesSlice.js    # Ride requests and history
    ├── biddingSlice.js  # Bidding system state
    ├── locationSlice.js # Location tracking
    ├── earningsSlice.js # Earnings and analytics
    ├── appSlice.js      # App-wide state
    └── [other slices]   # Additional feature slices
```

## Store Configuration

**File**: `index.js`

```javascript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'driver', 'app'], // Only persist these slices
  blacklist: ['location', 'rides', 'bidding'] // Don't persist real-time data
};

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  driver: driverSlice,
  rides: ridesSlice,
  bidding: biddingSlice,
  location: locationSlice,
  earnings: earningsSlice,
  app: appSlice,
  // Additional slices...
});

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: __DEV__
});

export const persistor = persistStore(store);
```

## Redux Slices

### Auth Slice

**File**: `slices/authSlice.js`
- **Purpose**: Manage user authentication state
- **State**: User profile, authentication status, onboarding status
- **Actions**: Sign in/out, profile updates, onboarding completion
- **Selectors**: `selectUser`, `selectIsAuthenticated`, `selectHasOnboarded`

### Driver Slice

**File**: `slices/driverSlice.js`
- **Purpose**: Manage driver profile and status
- **State**: Driver profile, vehicle info, online status, earnings
- **Actions**: Status updates, profile updates, earnings updates
- **Selectors**: `selectDriverProfile`, `selectDriverStatus`, `selectIsDriverOnline`

### Rides Slice

**File**: `slices/ridesSlice.js`
- **Purpose**: Manage ride requests and active rides
- **State**: Active rides, ride requests, ride history, filters
- **Actions**: Add/remove ride requests, update ride status, set filters
- **Selectors**: `selectRideRequests`, `selectActiveRide`, `selectRideHistory`

### Bidding Slice

**File**: `slices/biddingSlice.js`
- **Purpose**: Manage bidding system state
- **State**: Active bids, bid history, bidding settings
- **Actions**: Submit/cancel bids, update settings, clear current bid
- **Selectors**: `selectActiveBids`, `selectCurrentBid`, `selectBiddingSettings`

### Location Slice

**File**: `slices/locationSlice.js`
- **Purpose**: Manage location tracking and permissions
- **State**: Current location, location history, tracking status, permissions
- **Actions**: Update location, start/stop tracking, set permissions
- **Selectors**: `selectCurrentLocation`, `selectIsTracking`, `selectLocationPermissions`

### Earnings Slice

**File**: `slices/earningsSlice.js`
- **Purpose**: Manage earnings and financial data
- **State**: Daily/weekly/monthly earnings, payment history, analytics
- **Actions**: Update earnings, add payment, calculate totals
- **Selectors**: `selectDailyEarnings`, `selectWeeklyEarnings`, `selectTotalEarnings`

### App Slice

**File**: `slices/appSlice.js`
- **Purpose**: Manage app-wide state and settings
- **State**: App settings, UI state, network status, errors
- **Actions**: Update settings, set UI state, handle errors
- **Selectors**: `selectAppSettings`, `selectUIState`, `selectNetworkStatus`

## State Persistence

### Persistence Strategy

**Persistent Data** (whitelist):
- **Auth**: User authentication state
- **Driver**: Driver profile and preferences
- **App**: App settings and preferences

**Non-Persistent Data** (blacklist):
- **Location**: Real-time location data
- **Rides**: Active ride requests
- **Bidding**: Temporary bid data

### Persistence Configuration

```javascript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'driver', 'app'],
  blacklist: ['location', 'rides', 'bidding'],
  transforms: [
    // Custom transforms for data serialization
  ]
};
```

## Middleware

### Auth Middleware

**File**: `middleware/authMiddleware.js`
- **Purpose**: Sync authentication state with Firebase
- **Features**: Initialize services on login, cleanup on logout

### Location Middleware

**File**: `middleware/locationMiddleware.js`
- **Purpose**: Automatically update driver location
- **Features**: Background location updates, driver status sync

### Notification Middleware

**File**: `middleware/notificationMiddleware.js`
- **Purpose**: Handle push notifications based on state changes
- **Features**: Show notifications for new ride requests, bid updates

## Usage Patterns

### Using Redux in Components

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { updateDriverStatus } from '@/store/slices/driverSlice';

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const driverStatus = useSelector(selectDriverStatus);
  const isOnline = useSelector(selectIsDriverOnline);
  
  const handleStatusChange = (newStatus) => {
    dispatch(updateDriverStatus(newStatus));
  };
  
  return (
    // Component JSX
  );
};
```

### Async Actions with Redux Toolkit

```javascript
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchRideRequests = createAsyncThunk(
  'rides/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const requests = await RideRequestService.getActiveRideRequests();
      return requests;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Real-time State Updates

```javascript
// Service integration with Redux
class RideRequestService {
  constructor(dispatch) {
    this.dispatch = dispatch;
  }
  
  onRideRequestReceived = (rideRequest) => {
    this.dispatch(addRideRequest(rideRequest));
  };
  
  onBidAccepted = (bidData) => {
    this.dispatch(setActiveRide(bidData));
  };
}
```

## Selectors

### Basic Selectors

```javascript
// Simple selectors
export const selectUser = (state) => state.auth.user;
export const selectDriverStatus = (state) => state.driver.status;
export const selectActiveRide = (state) => state.rides.activeRide;
```

### Memoized Selectors

```javascript
import { createSelector } from '@reduxjs/toolkit';

// Memoized selector for filtered data
export const selectFilteredRideRequests = createSelector(
  [selectRideRequests, selectRidesFilters],
  (requests, filters) => {
    return requests.filter(request => {
      if (filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }
      return true;
    });
  }
);

// Memoized selector for computed values
export const selectEarningsSummary = createSelector(
  [selectDriverEarnings],
  (earnings) => ({
    daily: earnings.today,
    weekly: earnings.thisWeek,
    monthly: earnings.thisMonth,
    total: earnings.total,
    average: earnings.total / Math.max(earnings.totalRides, 1)
  })
);
```

## Performance Optimizations

### Selective Persistence
- Only persist essential data
- Exclude real-time data from persistence
- Use transforms for data serialization

### Memoized Selectors
- Use `createSelector` for computed values
- Prevent unnecessary re-renders
- Cache expensive calculations

### State Normalization
- Normalize nested data structures
- Use entities and IDs pattern
- Reduce data duplication

## Testing

### Testing Redux Slices

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';

describe('authSlice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authSlice }
    });
  });
  
  it('should handle sign in', () => {
    const user = { id: '1', email: 'test@example.com' };
    store.dispatch(signInUser.fulfilled(user));
    
    const state = store.getState();
    expect(state.auth.user).toEqual(user);
    expect(state.auth.isAuthenticated).toBe(true);
  });
});
```

### Testing Async Actions

```javascript
import { fetchRideRequests } from './ridesSlice';

describe('fetchRideRequests', () => {
  it('should fetch ride requests successfully', async () => {
    const mockRequests = [{ id: '1', status: 'pending' }];
    jest.spyOn(RideRequestService, 'getActiveRideRequests')
      .mockResolvedValue(mockRequests);
    
    const result = await store.dispatch(fetchRideRequests());
    expect(result.payload).toEqual(mockRequests);
  });
});
```

## Best Practices

### 1. State Structure
- Keep state flat and normalized
- Use consistent naming conventions
- Avoid nested state when possible

### 2. Actions
- Use descriptive action names
- Keep actions simple and focused
- Use async thunks for side effects

### 3. Selectors
- Create reusable selectors
- Use memoization for expensive calculations
- Keep selectors pure functions

### 4. Persistence
- Only persist necessary data
- Use transforms for data serialization
- Handle migration for schema changes

## Documentation

- **[State Management Architecture](../../docs/architecture/state-management.md)**
- **[Redux Toolkit Documentation](https://redux-toolkit.js.org/)**
- **[Redux Persist Documentation](https://github.com/rt2zz/redux-persist)**

## Contributing

1. Follow Redux Toolkit patterns
2. Write tests for new slices
3. Use TypeScript for better type safety
4. Update documentation
5. Follow naming conventions
