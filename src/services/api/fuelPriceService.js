// Real-time Fuel Price Service for AnyRyde Driver App
// Fetches current fuel prices from multiple APIs with intelligent fallbacks

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_KEYS, API_ENDPOINTS, REGIONAL_CONFIG, currentConfig } from '@/constants/config';

// Cache configuration
const CACHE_KEYS = {
  FUEL_PRICES: 'fuel_prices_cache',
  LAST_UPDATE: 'fuel_prices_last_update',
  USER_LOCATION: 'user_location_cache'
};

// Cache duration (30 minutes for fuel prices)
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Default fallback prices (US national averages)
const FALLBACK_PRICES = {
  gasoline: 3.45,
  premium: 3.85,
  diesel: 3.95,
  electricity: 0.13, // per kWh
  hybrid: 3.45
};

/**
 * Fetch fuel prices from EIA API (Primary source - free and reliable)
 * @param {Object} location - User location {latitude, longitude, state}
 * @returns {Object|null} Fuel prices data or null if failed
 */
const fetchEIAPrices = async (location = null) => {
  try {
    const apiKey = API_KEYS.FUEL_PRICES.EIA;
    if (!apiKey || apiKey === 'YOUR_EIA_API_KEY') {
      console.warn('EIA API key not configured');
      return null;
    }

    const baseUrl = API_ENDPOINTS.FUEL_PRICES.EIA.baseUrl;
    
    // EIA provides national and regional gasoline prices
    // Documentation: https://www.eia.gov/opendata/browser/petroleum/pri/gnd
    const gasolineUrl = `${baseUrl}/petroleum/pri/gnd/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1`;
    
    const response = await fetch(gasolineUrl);
    if (!response.ok) {
      throw new Error(`EIA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response && data.response.data && data.response.data.length > 0) {
      const latestPrice = data.response.data[0].value;
      
      // Apply regional adjustments if location is provided
      let adjustedPrice = latestPrice;
      if (location && location.state) {
        const stateAdjustment = REGIONAL_CONFIG.priceAdjustments[location.state] || 1.0;
        adjustedPrice = latestPrice * stateAdjustment;
      }

      return {
        gasoline: adjustedPrice,
        premium: adjustedPrice * 1.15, // Premium typically 15% higher
        diesel: adjustedPrice * 1.12, // Diesel typically 12% higher
        electricity: 0.13, // Average US electricity rate per kWh
        hybrid: adjustedPrice,
        source: 'eia',
        lastUpdated: new Date().toISOString(),
        period: data.response.data[0].period,
        location: location || 'national_average'
      };
    }

    return null;
  } catch (error) {
    console.error('EIA API error:', error);
    return null;
  }
};

/**
 * Fetch fuel prices from MyGasFeed API (Secondary source)
 * @param {Object} location - User location {latitude, longitude}
 * @returns {Object|null} Fuel prices data or null if failed
 */
const fetchMyGasFeedPrices = async (location = null) => {
  try {
    if (!location || !location.latitude || !location.longitude) {
      return null;
    }

    const baseUrl = API_ENDPOINTS.FUEL_PRICES.MYGASFEED.baseUrl;
    const radiusUrl = `${baseUrl}/radius/${location.latitude}/${location.longitude}.json`;
    
    // Add timeout and error handling for SSL issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(radiusUrl, {
      signal: controller.signal,
      // Add headers to handle potential SSL issues
      headers: {
        'User-Agent': 'AnyRydeDriver/1.0',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`MyGasFeed API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.stations && data.stations.length > 0) {
      // Calculate average prices from nearby stations
      const prices = {
        gasoline: [],
        premium: [],
        diesel: []
      };

      data.stations.forEach(station => {
        if (station.reg_price) prices.gasoline.push(parseFloat(station.reg_price));
        if (station.pre_price) prices.premium.push(parseFloat(station.pre_price));
        if (station.diesel_price) prices.diesel.push(parseFloat(station.diesel_price));
      });

      const avgGasoline = prices.gasoline.length > 0 
        ? prices.gasoline.reduce((a, b) => a + b, 0) / prices.gasoline.length 
        : FALLBACK_PRICES.gasoline;
        
      const avgPremium = prices.premium.length > 0 
        ? prices.premium.reduce((a, b) => a + b, 0) / prices.premium.length 
        : avgGasoline * 1.15;
        
      const avgDiesel = prices.diesel.length > 0 
        ? prices.diesel.reduce((a, b) => a + b, 0) / prices.diesel.length 
        : avgGasoline * 1.12;

      return {
        gasoline: avgGasoline,
        premium: avgPremium,
        diesel: avgDiesel,
        electricity: 0.13,
        hybrid: avgGasoline,
        source: 'mygasfeed',
        lastUpdated: new Date().toISOString(),
        stationCount: data.stations.length,
        location: location
      };
    }

    return null;
  } catch (error) {
    console.error('MyGasFeed API error:', error);
    return null;
  }
};

/**
 * Get cached fuel prices
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

    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = new Date().getTime();

    // Check if cache is still valid (30 minutes)
    if (now - lastUpdateTime < CACHE_DURATION) {
      return JSON.parse(cachedPrices);
    }

    return null;
  } catch (error) {
    console.error('Error reading cached fuel prices:', error);
    return null;
  }
};

/**
 * Cache fuel prices
 * @param {Object} prices - Fuel prices object to cache
 */
const cacheFuelPrices = async (prices) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEYS.FUEL_PRICES, JSON.stringify(prices)),
      AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString())
    ]);
  } catch (error) {
    console.error('Error caching fuel prices:', error);
  }
};

/**
 * Fetch fuel prices from alternative sources (when MyGasFeed fails)
 * @param {Object} location - User location
 * @returns {Object|null} Fuel prices data or null if failed
 */
const fetchAlternativePrices = async (location = null) => {
  try {
    // Use regional estimates based on location
    if (location && location.state) {
      const stateAdjustments = {
        'CA': 1.25, // California - 25% higher
        'NY': 1.15, // New York - 15% higher
        'TX': 0.95, // Texas - 5% lower
        'FL': 1.05, // Florida - 5% higher
        'IL': 1.10, // Illinois - 10% higher
        'PA': 1.08, // Pennsylvania - 8% higher
        'OH': 0.98, // Ohio - 2% lower
        'GA': 0.97, // Georgia - 3% lower
        'NC': 0.99, // North Carolina - 1% lower
        'MI': 1.02, // Michigan - 2% higher
      };
      
      const adjustment = stateAdjustments[location.state] || 1.0;
      const basePrice = 3.45; // National average
      
      return {
        gasoline: basePrice * adjustment,
        premium: basePrice * adjustment * 1.15,
        diesel: basePrice * adjustment * 1.12,
        electricity: 0.13,
        hybrid: basePrice * adjustment,
        source: 'regional_estimate',
        lastUpdated: new Date().toISOString(),
        location: location
      };
    }
    
    return null;
  } catch (error) {
    console.error('Alternative price fetch error:', error);
    return null;
  }
};

/**
 * Fetch fresh fuel prices from APIs with fallback chain
 * @param {Object} location - User location
 * @returns {Object|null} Fresh prices or null if all APIs fail
 */
const fetchFreshFuelPrices = async (location = null) => {
  // In development mode, return mock data if configured
  if (currentConfig.mockApis) {
    return {
      ...FALLBACK_PRICES,
      source: 'mock',
      lastUpdated: new Date().toISOString(),
      location: location || 'mock_location'
    };
  }

  // Try APIs in order of priority
  const apiResults = await Promise.allSettled([
    fetchEIAPrices(location),
    fetchMyGasFeedPrices(location),
    fetchAlternativePrices(location)
  ]);

  // Return first successful result
  for (const result of apiResults) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
};

/**
 * Main function to get fuel prices
 * @param {Object} location - User location {latitude, longitude, state, city}
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
      // Apply metropolitan area adjustments if applicable
      if (location && location.city) {
        const metroAdjustment = REGIONAL_CONFIG.metroAdjustments[location.city] || 1.0;
        freshPrices.gasoline *= metroAdjustment;
        freshPrices.premium *= metroAdjustment;
        freshPrices.diesel *= metroAdjustment;
        freshPrices.hybrid *= metroAdjustment;
      }

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
      location: location || 'unknown'
    };
  }
};

/**
 * Get fuel price for specific fuel type
 * @param {string} fuelType - Type of fuel (gasoline, premium, diesel, electricity, hybrid)
 * @param {Object} location - User location
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {number} Price per gallon (or kWh for electricity)
 */
export const getFuelPrice = async (fuelType = 'gasoline', location = null, forceRefresh = false) => {
  const prices = await getFuelPrices(location, forceRefresh);
  return prices[fuelType] || prices.gasoline || FALLBACK_PRICES.gasoline;
};

/**
 * Find nearby gas stations (requires location)
 * @param {Object} location - User location {latitude, longitude}
 * @param {number} radius - Search radius in miles (default: 5)
 * @returns {Array} Array of nearby stations with prices
 */
export const getNearbyStations = async (location, radius = 5) => {
  try {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Location required for station search');
    }

    // Use MyGasFeed API for station data
    const baseUrl = API_ENDPOINTS.FUEL_PRICES.MYGASFEED.baseUrl;
    const radiusUrl = `${baseUrl}/radius/${location.latitude}/${location.longitude}.json`;
    
    const response = await fetch(radiusUrl);
    if (!response.ok) {
      throw new Error(`Station search failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.stations) {
      return data.stations.map(station => ({
        id: station.id,
        name: station.station,
        address: station.address,
        city: station.city,
        state: station.region,
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
        distance: parseFloat(station.distance),
        prices: {
          regular: parseFloat(station.reg_price) || null,
          premium: parseFloat(station.pre_price) || null,
          diesel: parseFloat(station.diesel_price) || null
        },
        lastUpdated: station.reg_date
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    return [];
  }
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

export default {
  getFuelPrices,
  getFuelPrice,
  getNearbyStations,
  clearFuelPriceCache
}; 