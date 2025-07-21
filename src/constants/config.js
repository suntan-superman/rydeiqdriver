// Application Configuration
// Centralized config for API keys, endpoints, and environment settings

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

// API Keys (Replace with actual production keys)
export const API_KEYS = {
  // Google Services
  GOOGLE_MAPS: {
    // Get from Google Cloud Console: https://console.cloud.google.com/
    ANDROID: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || 'YOUR_ANDROID_MAPS_API_KEY',
    IOS: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || 'YOUR_IOS_MAPS_API_KEY',
    WEB: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY || 'YOUR_WEB_MAPS_API_KEY',
  },
  
  // Fuel Price APIs
  FUEL_PRICES: {
    // EIA (Energy Information Administration) - Free API
    // Register at: https://www.eia.gov/opendata/register.php
    EIA: process.env.EXPO_PUBLIC_EIA_API_KEY || 'YOUR_EIA_API_KEY',
    
    // GasBuddy API (Commercial - requires subscription)
    // Contact: https://www.gasbuddy.com/business/api
    GASBUDDY: process.env.EXPO_PUBLIC_GASBUDDY_API_KEY || 'YOUR_GASBUDDY_API_KEY',
    
    // Alternative fuel price APIs
    FUEL_ECONOMY: process.env.EXPO_PUBLIC_FUEL_ECONOMY_API_KEY || 'YOUR_FUEL_ECONOMY_API_KEY',
  },
  
  // Analytics and Monitoring
  ANALYTICS: {
    // Firebase Analytics (already configured)
    FIREBASE_MEASUREMENT_ID: 'G-YQJHJBNZJ7',
    
    // Optional: Additional analytics services
    MIXPANEL: process.env.EXPO_PUBLIC_MIXPANEL_KEY || '',
    AMPLITUDE: process.env.EXPO_PUBLIC_AMPLITUDE_KEY || '',
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Fuel Price Services
  FUEL_PRICES: {
    // US Energy Information Administration (Free, reliable)
    EIA: {
      baseUrl: 'https://api.eia.gov/v2',
      endpoints: {
        gasolinePrices: '/petroleum/pri/gnd/data',
        dieselPrices: '/petroleum/pri/gnd/data',
        stateData: '/petroleum/pri/gnd/data'
      }
    },
    
    // GasBuddy (Commercial API)
    GASBUDDY: {
      baseUrl: 'https://api.gasbuddy.com/v3',
      endpoints: {
        stations: '/stations/search',
        prices: '/prices/station',
        trends: '/trends/area'
      }
    },
    
    // Alternative: MyGasFeed API
    MYGASFEED: {
      baseUrl: 'https://api.mygasfeed.com/stations',
      endpoints: {
        radius: '/radius',
        state: '/state',
        city: '/city'
      }
    }
  },
  
  // Google Services
  GOOGLE: {
    MAPS: {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      endpoints: {
        directions: '/directions/json',
        distanceMatrix: '/distancematrix/json',
        geocoding: '/geocode/json',
        places: '/place/findplacefromtext/json'
      }
    }
  }
};

// App Configuration
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

// Environment-specific settings
export const ENVIRONMENT = {
  isDevelopment,
  isProduction,
  
  // Development settings
  development: {
    enableLogging: true,
    enableDebugMode: true,
    mockApis: true, // Use mock data in development
    skipOnboarding: false,
  },
  
  // Production settings
  production: {
    enableLogging: false,
    enableDebugMode: false,
    mockApis: false,
    skipOnboarding: false,
  }
};

// Regional Settings
export const REGIONAL_CONFIG = {
  // US Regional fuel price adjustments
  priceAdjustments: {
    'CA': 1.25, // California - 25% higher
    'NY': 1.15, // New York - 15% higher
    'HI': 1.30, // Hawaii - 30% higher
    'AK': 1.20, // Alaska - 20% higher
    'TX': 0.95, // Texas - 5% lower
    'LA': 0.93, // Louisiana - 7% lower
    'MS': 0.92, // Mississippi - 8% lower
  },
  
  // Metropolitan area adjustments
  metroAdjustments: {
    'San Francisco': 1.25,
    'Los Angeles': 1.15,
    'New York': 1.15,
    'Chicago': 1.10,
    'Boston': 1.12,
    'Seattle': 1.08,
    'Miami': 1.05,
    'Houston': 0.95,
    'Dallas': 0.96,
  }
};

// Validation functions
export const validateConfig = () => {
  const errors = [];
  
  // Check essential API keys
  if (!API_KEYS.GOOGLE_MAPS.ANDROID || API_KEYS.GOOGLE_MAPS.ANDROID === 'YOUR_ANDROID_MAPS_API_KEY') {
    errors.push('Missing Google Maps Android API key');
  }
  
  if (!API_KEYS.GOOGLE_MAPS.IOS || API_KEYS.GOOGLE_MAPS.IOS === 'YOUR_IOS_MAPS_API_KEY') {
    errors.push('Missing Google Maps iOS API key');
  }
  
  if (isProduction) {
    if (!API_KEYS.FUEL_PRICES.EIA || API_KEYS.FUEL_PRICES.EIA === 'YOUR_EIA_API_KEY') {
      errors.push('Missing EIA API key for production');
    }
  }
  
  return errors;
};

// Export current environment config
export const currentConfig = isDevelopment ? ENVIRONMENT.development : ENVIRONMENT.production;

export default {
  API_KEYS,
  API_ENDPOINTS,
  APP_CONFIG,
  ENVIRONMENT,
  REGIONAL_CONFIG,
  validateConfig,
  currentConfig
}; 