// Real-time Fuel Price Service for RydeIQ Driver App
// Fetches current fuel prices from multiple APIs with intelligent fallbacks

import AsyncStorage from '@react-native-async-storage/async-storage';

// Fuel price API configurations
const FUEL_PRICE_APIS = {
  // Primary API - GasBuddy (hypothetical API structure)
  gasbuddy: {
    baseUrl: 'https://api.gasbuddy.com/v1',
    endpoints: {
      prices: '/prices/search',
      stations: '/stations/nearby'
    },
    apiKey: null, // Would need actual API key
    priority: 1
  },
  
  // Secondary API - AAA Gas Prices (hypothetical)
  aaa: {
    baseUrl: 'https://api.fueleconomy.gov/v1',
    endpoints: {
      prices: '/fuel-prices/current'
    },
    priority: 2
  },
  
  // Tertiary API - Local government data
  eia: {
    baseUrl: 'https://api.eia.gov/v2',
    endpoints: {
      prices: '/petroleum/pri/gnd/data'
    },
    apiKey: null, // Would need actual EIA API key
    priority: 3
  }
};

// Cache configuration
const CACHE_KEYS = {
  FUEL_PRICES: 'fuel_prices_cache',
  LAST_UPDATE: 'fuel_prices_last_update',
  USER_LOCATION: 'user_location_cache'
};

// Cache duration (30 minutes for fuel prices)
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Default fallback prices (US national averages as of late 2023)
const FALLBACK_PRICES = {
  gasoline: 3.45,
  diesel: 3.85,
  electricity: 0.13, // per kWh
  hybrid: 3.45
};

/**
 * Fetch fuel prices from cache or API
 * @param {Object} location - User location {latitude, longitude}
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Object} Fuel prices object
 */
export const getFuelPrices = async (location = null, forceRefresh = false) => {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedPrices = await getCachedFuelPrices();
      if (cachedPrices) {
        return cachedPrices;
      }
    }

    // Try to fetch from APIs
    const freshPrices = await fetchFreshFuelPrices(location);
    
    if (freshPrices) {
      // Cache the fresh prices
      await cacheFuelPrices(freshPrices);
      return freshPrices;
    }

    // Fallback to default prices if all APIs fail
    return {
      ...FALLBACK_PRICES,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      location: location || 'national_average'
    };

  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    
    // Try cache as fallback
    const cachedPrices = await getCachedFuelPrices();
    if (cachedPrices) {
      return { ...cachedPrices, source: 'cache_fallback' };
    }

    // Ultimate fallback
    return {
      ...FALLBACK_PRICES,
      source: 'error_fallback',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Get cached fuel prices if still valid
 * @returns {Object|null} Cached prices or null if expired/not found
 */
const getCachedFuelPrices = async () => {
  try {
    const [cachedPrices, lastUpdate] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.FUEL_PRICES),
      AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE)
    ]);

    if (!cachedPrices || !lastUpdate) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(lastUpdate);
    if (cacheAge > CACHE_DURATION) {
      // Cache expired
      return null;
    }

    return JSON.parse(cachedPrices);
  } catch (error) {
    console.error('Error reading fuel price cache:', error);
    return null;
  }
};

/**
 * Cache fuel prices with timestamp
 * @param {Object} prices - Fuel prices to cache
 */
const cacheFuelPrices = async (prices) => {
  try {
    const timestamp = Date.now().toString();
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEYS.FUEL_PRICES, JSON.stringify(prices)),
      AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, timestamp)
    ]);
  } catch (error) {
    console.error('Error caching fuel prices:', error);
  }
};

/**
 * Fetch fresh fuel prices from APIs
 * @param {Object} location - User location
 * @returns {Object|null} Fresh fuel prices or null if all APIs fail
 */
const fetchFreshFuelPrices = async (location) => {
  // For demo purposes, we'll simulate API calls with realistic data
  // In production, replace with actual API calls
  
  try {
    // Simulate fetching from primary API (GasBuddy-style)
    const mockApiResponse = await simulateGasBuddyAPI(location);
    if (mockApiResponse) {
      return mockApiResponse;
    }

    // If primary fails, try secondary API
    const mockEIAResponse = await simulateEIAAPI(location);
    if (mockEIAResponse) {
      return mockEIAResponse;
    }

    return null;
  } catch (error) {
    console.error('Error fetching from fuel price APIs:', error);
    return null;
  }
};

/**
 * Simulate GasBuddy API response (replace with real API call)
 * @param {Object} location - User location
 * @returns {Object} Simulated fuel prices
 */
const simulateGasBuddyAPI = async (location) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate location-based price variations
  const baseGasPrice = 3.45;
  const locationMultiplier = getLocationPriceMultiplier(location);
  
  return {
    gasoline: Math.round((baseGasPrice * locationMultiplier) * 100) / 100,
    diesel: Math.round((3.85 * locationMultiplier) * 100) / 100,
    electricity: Math.round((0.13 * locationMultiplier) * 100) / 100,
    hybrid: Math.round((baseGasPrice * locationMultiplier) * 100) / 100,
    source: 'gasbuddy_api',
    lastUpdated: new Date().toISOString(),
    location: location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'current',
    confidence: 0.95,
    stationCount: Math.floor(Math.random() * 20) + 5 // 5-25 stations
  };
};

/**
 * Simulate EIA API response (replace with real API call)
 * @param {Object} location - User location
 * @returns {Object} Simulated fuel prices
 */
const simulateEIAAPI = async (location) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const locationMultiplier = getLocationPriceMultiplier(location);
  
  return {
    gasoline: Math.round((3.42 * locationMultiplier) * 100) / 100,
    diesel: Math.round((3.88 * locationMultiplier) * 100) / 100,
    electricity: Math.round((0.12 * locationMultiplier) * 100) / 100,
    hybrid: Math.round((3.42 * locationMultiplier) * 100) / 100,
    source: 'eia_api',
    lastUpdated: new Date().toISOString(),
    location: location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'regional',
    confidence: 0.85
  };
};

/**
 * Get location-based price multiplier (simulates regional price differences)
 * @param {Object} location - User location
 * @returns {number} Price multiplier
 */
const getLocationPriceMultiplier = (location) => {
  if (!location) return 1.0;

  const { latitude, longitude } = location;
  
  // Simulate regional price variations
  // Higher prices in major metropolitan areas
  const metropolitanAreas = [
    { lat: 40.7128, lng: -74.0060, multiplier: 1.15 }, // NYC
    { lat: 34.0522, lng: -118.2437, multiplier: 1.20 }, // LA
    { lat: 41.8781, lng: -87.6298, multiplier: 1.10 }, // Chicago
    { lat: 37.7749, lng: -122.4194, multiplier: 1.25 }, // San Francisco
    { lat: 25.7617, lng: -80.1918, multiplier: 1.05 }, // Miami
  ];

  // Find closest metropolitan area
  let closestMultiplier = 1.0;
  let minDistance = Infinity;

  metropolitanAreas.forEach(area => {
    const distance = calculateDistance(latitude, longitude, area.lat, area.lng);
    if (distance < minDistance && distance < 50) { // Within 50 miles
      minDistance = distance;
      closestMultiplier = area.multiplier;
    }
  });

  // Add some random variation (±5%)
  const randomVariation = 0.95 + (Math.random() * 0.1);
  return closestMultiplier * randomVariation;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in miles
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Get fuel stations near location with prices
 * @param {Object} location - User location
 * @param {number} radius - Search radius in miles
 * @returns {Array} Array of nearby fuel stations
 */
export const getNearbyFuelStations = async (location, radius = 5) => {
  try {
    // Simulate API call to get nearby stations
    // In production, replace with actual API calls
    
    const mockStations = generateMockStations(location, radius);
    return mockStations;
  } catch (error) {
    console.error('Error fetching nearby fuel stations:', error);
    return [];
  }
};

/**
 * Generate mock fuel stations for demo
 * @param {Object} location - User location
 * @param {number} radius - Search radius
 * @returns {Array} Mock fuel stations
 */
const generateMockStations = (location, radius) => {
  const stationBrands = [
    'Shell', 'Exxon', 'Chevron', 'BP', 'Mobil', 'Texaco', 'Citgo', 'Speedway'
  ];

  const stations = [];
  const stationCount = Math.floor(Math.random() * 15) + 5; // 5-20 stations

  for (let i = 0; i < stationCount; i++) {
    // Random location within radius
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * radius;
    
    const lat = location.latitude + (randomDistance / 69) * Math.cos(randomAngle);
    const lng = location.longitude + (randomDistance / 69) * Math.sin(randomAngle);

    const basePrice = 3.45;
    const priceVariation = 0.85 + (Math.random() * 0.3); // ±15 cents variation

    stations.push({
      id: `station_${i}`,
      name: stationBrands[Math.floor(Math.random() * stationBrands.length)],
      address: `${Math.floor(Math.random() * 9999)} Main St`,
      location: { latitude: lat, longitude: lng },
      distance: randomDistance,
      prices: {
        gasoline: Math.round((basePrice * priceVariation) * 100) / 100,
        diesel: Math.round((3.85 * priceVariation) * 100) / 100,
        premium: Math.round((basePrice * priceVariation * 1.2) * 100) / 100
      },
      amenities: ['convenience_store', 'restroom', 'atm'].filter(() => Math.random() > 0.5),
      lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString() // Random time within last hour
    });
  }

  // Sort by distance
  return stations.sort((a, b) => a.distance - b.distance);
};

/**
 * Clear fuel price cache
 */
export const clearFuelPriceCache = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEYS.FUEL_PRICES),
      AsyncStorage.removeItem(CACHE_KEYS.LAST_UPDATE)
    ]);
  } catch (error) {
    console.error('Error clearing fuel price cache:', error);
  }
};

/**
 * Get cache status
 * @returns {Object} Cache status information
 */
export const getFuelPriceCacheStatus = async () => {
  try {
    const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
    if (!lastUpdate) {
      return { cached: false, age: null, expired: true };
    }

    const cacheAge = Date.now() - parseInt(lastUpdate);
    const expired = cacheAge > CACHE_DURATION;

    return {
      cached: true,
      age: cacheAge,
      expired,
      lastUpdated: new Date(parseInt(lastUpdate)).toISOString()
    };
  } catch (error) {
    return { cached: false, age: null, expired: true, error: error.message };
  }
};

// Export the service
export default {
  getFuelPrices,
  getNearbyFuelStations,
  clearFuelPriceCache,
  getFuelPriceCacheStatus,
  FALLBACK_PRICES
}; 