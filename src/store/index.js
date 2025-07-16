import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice'; // ✅ Fixed - uses lazy Firebase imports
// import driverSlice from './slices/driverSlice'; // ❌ Has Firebase imports - temporarily disabled
// import ridesSlice from './slices/ridesSlice'; // ❌ Has Firebase imports - temporarily disabled
// import biddingSlice from './slices/biddingSlice'; // ❌ Has Firebase imports - temporarily disabled
import locationSlice from './slices/locationSlice'; // ✅ Should work now with lazy Firebase config
// import earningsSlice from './slices/earningsSlice'; // ❌ Has Firebase imports - temporarily disabled
// import notificationSlice from './slices/notificationSlice'; // ❌ Has Firebase imports - temporarily disabled
import appSlice from './slices/appSlice'; // ✅ No Firebase imports - safe

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'app'], // Only persist safe slices for now
  blacklist: ['location'] // Don't persist real-time location data
};

// Root reducer - testing with Firebase config fix
const rootReducer = combineReducers({
  auth: authSlice,
  // driver: driverSlice, // Temporarily disabled
  // rides: ridesSlice, // Temporarily disabled
  // bidding: biddingSlice, // Temporarily disabled
  location: locationSlice, // Re-enabled - should work now
  // earnings: earningsSlice, // Temporarily disabled
  // notification: notificationSlice, // Temporarily disabled
  app: appSlice
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

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