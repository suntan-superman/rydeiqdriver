import { Platform } from 'react-native';

export const COLORS = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5', 
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  primaryDark: '#047857',
  primaryLight: '#34D399',
  secondary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Legacy gray colors for backward compatibility
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  mapRoute: '#3B82F6',
  mapPickup: '#10B981',
  mapDestination: '#EF4444',
  online: '#10B981',
  offline: '#6B7280',
  busy: '#F59E0B',
  emergency: '#EF4444'
};

export const DIMENSIONS = {
  screenWidth: 400,
  screenHeight: 800,
  paddingXS: 4,
  paddingS: 8,
  paddingM: 16,
  paddingL: 24,
  paddingXL: 32,
  radiusS: 4,
  radiusM: 8,
  radiusL: 12,
  radiusXL: 16
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const APP_CONFIG = {
  appName: 'AnyRyde Driver',
  version: '1.0.0'
};

export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  BREAK: 'break'
};

export const RIDE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EN_ROUTE_PICKUP: 'en_route_pickup',
  ARRIVED_PICKUP: 'arrived_pickup',
  CUSTOMER_ONBOARD: 'customer_onboard',
  TRIP_ACTIVE: 'trip_active',
  TRIP_COMPLETED: 'trip_completed',
  CANCELLED: 'cancelled'
};

export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

export const NOTIFICATION_TYPES = {
  RIDE_REQUEST: 'ride_request',
  BID_ACCEPTED: 'bid_accepted',
  BID_DECLINED: 'bid_declined',
  TRIP_COMPLETED: 'trip_completed',
  EARNINGS: 'earnings',
  SYSTEM: 'system'
};

export const PLATFORM = {
  ios: 'ios',
  android: 'android',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android'
};

export default {
  COLORS,
  DIMENSIONS,
  TYPOGRAPHY,
  APP_CONFIG,
  DRIVER_STATUS,
  RIDE_STATUS,
  BID_STATUS,
  NOTIFICATION_TYPES,
  PLATFORM
}; 