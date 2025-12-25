import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice'; // ✅ Fixed - uses lazy Firebase imports
import driverSlice from './slices/driverSlice'; // ✅ Re-enabled - uses lazy Firebase imports
import ridesSlice from './slices/ridesSlice'; // ✅ Re-enabled - uses lazy Firebase imports
import biddingSlice from './slices/biddingSlice'; // ✅ Re-enabled - uses lazy Firebase imports
import locationSlice from './slices/locationSlice'; // ✅ Should work now with lazy Firebase config
import earningsSlice from './slices/earningsSlice'; // ✅ Re-enabled - uses lazy Firebase imports
import notificationSlice from './slices/notificationSlice'; // ✅ Re-enabled - uses lazy Firebase imports
import appSlice from './slices/appSlice'; // ✅ No Firebase imports - safe
import analyticsSlice from './slices/analyticsSlice'; // ✅ Analytics slice for dashboard
import driverToolsSlice from './slices/driverToolsSlice'; // ✅ Driver tools slice for dashboard
import sustainabilitySlice from './slices/sustainabilitySlice'; // ✅ Sustainability slice for dashboard
import communitySlice from './slices/communitySlice'; // ✅ Community slice for driver community features
import safetySlice from './slices/safetySlice'; // ✅ Safety slice for enhanced safety features
import communicationSlice from './slices/communicationSlice'; // ✅ Communication slice for real-time communication features
import vehicleSlice from './slices/vehicleSlice'; // ✅ Vehicle slice for advanced vehicle management features
import paymentSlice from './slices/paymentSlice'; // ✅ Payment slice for advanced payment and banking features
import dynamicPricingSlice from './slices/dynamicPricingSlice'; // ✅ Dynamic pricing slice for AI-powered pricing system
import gamificationSlice from './slices/gamificationSlice'; // ✅ Gamification slice for enhanced gamification system
import accessibilitySlice from './slices/accessibilitySlice'; // ✅ Accessibility slice for advanced accessibility features
import wellnessSlice from './slices/wellnessSlice'; // ✅ Wellness slice for advanced driver wellness & safety system

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'app', 'driver', 'notification'], // Persist auth, app settings, driver profile, and notification settings
  blacklist: ['location', 'rides', 'bidding', 'earnings'] // Don't persist real-time data
};

// Root reducer - testing with Firebase config fix
const rootReducer = combineReducers({
  auth: authSlice,
  driver: driverSlice, // ✅ Re-enabled
  rides: ridesSlice, // ✅ Re-enabled
  bidding: biddingSlice, // ✅ Re-enabled
  location: locationSlice, // Re-enabled - should work now
  earnings: earningsSlice, // ✅ Re-enabled
  notification: notificationSlice, // ✅ Re-enabled
  app: appSlice,
  analytics: analyticsSlice, // ✅ Add analytics slice
  driverTools: driverToolsSlice, // ✅ Add driver tools slice
  sustainability: sustainabilitySlice, // ✅ Add sustainability slice
  community: communitySlice, // ✅ Add community slice
  safety: safetySlice, // ✅ Add safety slice
  communication: communicationSlice, // ✅ Add communication slice
  vehicle: vehicleSlice, // ✅ Add vehicle slice
  payment: paymentSlice, // ✅ Add payment slice
  dynamicPricing: dynamicPricingSlice, // ✅ Add dynamic pricing slice
  gamification: gamificationSlice, // ✅ Add gamification slice
  accessibility: accessibilitySlice, // ✅ Add accessibility slice
  wellness: wellnessSlice // ✅ Add wellness slice
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