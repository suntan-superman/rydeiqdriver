import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import driverSlice from './slices/driverSlice';
import ridesSlice from './slices/ridesSlice';
import biddingSlice from './slices/biddingSlice';
import locationSlice from './slices/locationSlice';
import earningsSlice from './slices/earningsSlice';
import notificationSlice from './slices/notificationSlice';
import appSlice from './slices/appSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'driver', 'earnings', 'app'], // Only persist these slices
  blacklist: ['rides', 'bidding', 'location', 'notification'] // Don't persist real-time data
};

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  driver: driverSlice,
  rides: ridesSlice,
  bidding: biddingSlice,
  location: locationSlice,
  earnings: earningsSlice,
  notification: notificationSlice,
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

// Persistor
export const persistor = persistStore(store);

// Types for TypeScript (optional - since we're using JavaScript)
export const getState = () => store.getState();
export const dispatch = store.dispatch;

export default store; 