# Redux to React Query Migration Template

## Overview
This template shows how to migrate Redux-dependent components to use React Query hooks. React Query handles server state while Redux is kept for UI-only state.

---

## Phase 1: Assessment

### Identify Redux Usage in Component
```javascript
// BEFORE: Redux Dependencies
import { useSelector, useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();
  const rides = useSelector(state => state.rides.available);
  const loading = useSelector(state => state.rides.loading);
  const error = useSelector(state => state.rides.error);
}
```

### Categorize State
- **Server State** (from API) → React Query
- **UI State** (local UI control) → React or local state

---

## Phase 2: Replace with React Query

### Step 1: Import React Query Hooks
```javascript
// AFTER: React Query
import { useAvailableRides } from '@/hooks/queries';
import { useSelector } from 'react-redux'; // Keep only for UI state
```

### Step 2: Replace useSelector with Query Hook
```javascript
// BEFORE
const rides = useSelector(state => state.rides.available);
const loading = useSelector(state => state.rides.loading);
const error = useSelector(state => state.rides.error);

// AFTER
const { data: rides = [], isLoading: loading, error } = useAvailableRides(driverId);
```

### Step 3: Replace useDispatch with Mutations
```javascript
// BEFORE: Redux dispatch
const dispatch = useDispatch();
const handleAcceptRide = (rideId) => {
  dispatch(acceptRideAction(rideId));
};

// AFTER: React Query mutation
const { mutate: acceptRide } = useAcceptRide(driverId);
const handleAcceptRide = (rideId) => {
  acceptRide(rideId);
};
```

---

## Complete Migration Example

### BEFORE: Redux Component
```javascript
import React, { useEffect } from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRides, acceptRide } from '@/store/slices/ridesSlice';

function RidesScreen() {
  const dispatch = useDispatch();
  const { available, loading, error } = useSelector(state => state.rides);
  const driverId = useSelector(state => state.driver.id);

  useEffect(() => {
    dispatch(fetchRides(driverId));
  }, [driverId, dispatch]);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <FlatList
      data={available}
      renderItem={({ item }) => (
        <View>
          <Text>{item.destination}</Text>
          <Button
            title="Accept"
            onPress={() => dispatch(acceptRide(item.id))}
          />
        </View>
      )}
    />
  );
}
```

### AFTER: React Query Component
```javascript
import React from 'react';
import { View, FlatList, ActivityIndicator, Text, Button } from 'react-native';
import { useAvailableRides, useAcceptRide } from '@/hooks/queries';
import { useSelector } from 'react-redux';

function RidesScreen() {
  const driverId = useSelector(state => state.driver.id);
  
  // Query: Fetch rides
  const { data: available = [], isLoading: loading, error } = useAvailableRides(driverId);
  
  // Mutation: Accept ride
  const { mutate: acceptRide, isPending } = useAcceptRide(driverId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error?.message}</Text>;

  return (
    <FlatList
      data={available}
      renderItem={({ item }) => (
        <View>
          <Text>{item.destination}</Text>
          <Button
            title="Accept"
            disabled={isPending}
            onPress={() => acceptRide(item.id)}
          />
        </View>
      )}
    />
  );
}
```

---

## Benefits of This Migration

| Aspect | Redux | React Query |
|--------|-------|-------------|
| **Server State** | Manual handling | Automatic syncing |
| **Caching** | Manual implementation | Built-in deduplication |
| **Refetching** | Manual triggers | Automatic on focus/reconnect |
| **Boilerplate** | Slice + actions + reducers | Single hook |
| **Real-time** | Poll manually | Built-in refetch intervals |

---

## Migration Checklist

- [ ] Identify all useSelector/useDispatch in component
- [ ] Categorize state (server vs UI)
- [ ] Replace server state with React Query hooks
- [ ] Replace mutations with useMutation
- [ ] Remove useEffect dispatch calls
- [ ] Test component functionality
- [ ] Verify loading/error states work
- [ ] Check network requests in DevTools

---

## Common Patterns

### Pattern 1: Fetching on Mount
```javascript
// OLD: Manual useEffect dispatch
useEffect(() => {
  dispatch(fetchData(id));
}, [id, dispatch]);

// NEW: Automatic with React Query
const { data } = useMyQuery(id);
// No useEffect needed!
```

### Pattern 2: Dependent Queries
```javascript
// OLD: Chain dispatches
useEffect(() => {
  if (user) {
    dispatch(fetchUserRides(user.id));
  }
}, [user, dispatch]);

// NEW: Built-in with enabled
const { data: rides } = useDriverRides(driverId, {
  enabled: !!driverId // Only fetch when driverId exists
});
```

### Pattern 3: Mutations with Side Effects
```javascript
// OLD: Dispatch action, handle in reducer
dispatch(updateProfile(data)).then(() => {
  dispatch(refetchProfile());
});

// NEW: Built-in invalidation
const { mutate } = useUpdateDriverProfile(driverId);
mutate(data, {
  onSuccess: () => {
    // Cache automatically invalidated
  }
});
```

---

## Redux Still Used For

React Query migration doesn't remove Redux entirely. Keep Redux for:

1. **Global UI State**
   - Theme (dark/light)
   - Language/i18n settings
   - User preferences
   - Navigation state

2. **Complex App State**
   - Authentication tokens
   - Persisted preferences
   - Feature flags

3. **Real-time State** (Eventually migrate to socket.io + React Query)
   - Location tracking
   - Active ride status
   - Notifications

---

## Testing After Migration

```javascript
// Test loading state
const { isLoading } = useAvailableRides(driverId);
expect(isLoading).toBe(true);

// Test success
await waitFor(() => {
  expect(screen.getByText('Ride to Downtown')).toBeInTheDocument();
});

// Test error handling
const { error } = useAvailableRides(driverId);
expect(error).toBeDefined();
```

---

## Performance Improvements

- **Reduced re-renders**: React Query prevents unnecessary updates
- **Automatic deduplication**: Same query called multiple times = 1 request
- **Smart caching**: Stale-while-revalidate pattern
- **Smaller bundle**: ~14KB vs Redux + thunk (~50KB)
