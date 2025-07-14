import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';

// Device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors - Using green theme as per user preference
export const COLORS = {
  // Primary green theme
  primary: '#10B981',
  primaryDark: '#047857',
  primaryLight: '#34D399',
  
  // Secondary colors
  secondary: '#6B7280',
  accent: '#F59E0B',
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  // Map colors
  mapRoute: '#3B82F6',
  mapPickup: '#10B981',
  mapDestination: '#EF4444',
  
  // Status colors
  online: '#10B981',
  offline: '#6B7280',
  busy: '#F59E0B',
  emergency: '#EF4444'
};

// Dimensions
export const DIMENSIONS = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  
  // Padding and margins
  paddingXS: 4,
  paddingS: 8,
  paddingM: 16,
  paddingL: 24,
  paddingXL: 32,
  
  // Border radius
  radiusS: 4,
  radiusM: 8,
  radiusL: 12,
  radiusXL: 16,
  radiusRound: 50,
  
  // Icon sizes
  iconXS: 16,
  iconS: 20,
  iconM: 24,
  iconL: 32,
  iconXL: 40,
  
  // Button heights
  buttonS: 36,
  buttonM: 44,
  buttonL: 52,
  
  // Map
  mapHeight: SCREEN_HEIGHT * 0.4,
  mapFullHeight: SCREEN_HEIGHT * 0.7
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6
  }
};

// App configuration
export const APP_CONFIG = {
  name: 'RydeIQ Driver',
  version: '1.0.0',
  environment: Constants.expoConfig?.extra?.environment || 'development',
  
  // Timing configurations
  rideRequestTimeout: 30, // seconds
  biddingWindow: 45, // seconds
  locationUpdateInterval: 5000, // 5 seconds
  backgroundLocationInterval: 10000, // 10 seconds
  
  // Limits
  maxBidAmount: 999.99,
  minBidPercentage: -10, // 10% below company bid
  maxBidPercentage: 50, // 50% above company bid
  warningThreshold: 25, // 25% above company bid
  
  // Map configuration
  mapDefaults: {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  },
  
  // API endpoints
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 'https://api.rydeiq.com',
  googleMapsApiKey: Constants.expoConfig?.extra?.googleMapsApiKey || 'YOUR_GOOGLE_MAPS_API_KEY'
};

// Driver status constants
export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  BREAK: 'break'
};

// Ride status constants  
export const RIDE_STATUS = {
  PENDING: 'pending',
  BID_SUBMITTED: 'bid-submitted',
  ACCEPTED: 'accepted',
  EN_ROUTE_PICKUP: 'en-route-pickup',
  ARRIVED_PICKUP: 'arrived-pickup',
  CUSTOMER_ONBOARD: 'customer-onboard',
  TRIP_ACTIVE: 'trip-active',
  TRIP_COMPLETED: 'trip-completed',
  CANCELLED: 'cancelled'
};

// Bid status constants
export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

// Ride types
export const RIDE_TYPES = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  WHEELCHAIR: 'wheelchair',
  PET: 'pet'
};

// Notification types
export const NOTIFICATION_TYPES = {
  RIDE_REQUEST: 'ride-request',
  BID_ACCEPTED: 'bid-accepted',
  BID_DECLINED: 'bid-declined',
  RIDE_CANCELLED: 'ride-cancelled',
  CUSTOMER_MESSAGE: 'customer-message',
  PAYMENT_RECEIVED: 'payment-received',
  SYSTEM_UPDATE: 'system-update'
};

// Platform specific constants
export const PLATFORM = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web'
};

// Animation durations
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 200
  }
};

// Quick bid amounts (relative to company bid)
export const QUICK_BID_OPTIONS = [
  { label: '+$2', value: 2 },
  { label: '+$5', value: 5 },
  { label: '+$10', value: 10 },
  { label: 'Custom', value: 'custom' }
];

// Template messages for customer communication
export const MESSAGE_TEMPLATES = [
  "I'm 5 minutes away",
  "I've arrived at pickup location",
  "Running 2 minutes late due to traffic",
  "Would you like me to wait?",
  "Thank you for riding with RydeIQ!"
];

// Emergency contacts
export const EMERGENCY_NUMBERS = {
  police: '911',
  support: '+1-800-RYDEIQ'
};

// Sound files
export const SOUNDS = {
  rideRequest: require('../../assets/sounds/ride-request.wav'),
  bidAccepted: require('../../assets/sounds/bid-accepted.wav'),
  tripCompleted: require('../../assets/sounds/trip-completed.wav'),
  notification: require('../../assets/sounds/notification.wav')
};

export default {
  COLORS,
  DIMENSIONS,
  TYPOGRAPHY,
  APP_CONFIG,
  DRIVER_STATUS,
  RIDE_STATUS,
  BID_STATUS,
  RIDE_TYPES,
  NOTIFICATION_TYPES,
  PLATFORM,
  ANIMATIONS,
  QUICK_BID_OPTIONS,
  MESSAGE_TEMPLATES,
  EMERGENCY_NUMBERS,
  SOUNDS
}; 