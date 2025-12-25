/**
 * API Service Layer (React Native/Expo Compatible)
 * Centralized fetch-based client with authentication, error handling, and retry logic
 */

import { auth } from './firebase/config';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Retry logic with exponential backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryFetch = async (url, options = {}, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle non-2xx responses
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          data,
          response,
        };
      }

      return response;
    } catch (error) {
      lastError = error;

      // Only retry on server errors (500+) or network errors
      if (error.status && error.status < 500) {
        throw error; // Don't retry client errors
      }

      // If this is the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const waitTime = Math.pow(2, attempt + 1) * 1000;
      console.warn(`⚠️ Request failed - Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${maxRetries})`);
      await sleep(waitTime);
    }
  }

  throw lastError;
};

/**
 * Make an API request
 */
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get auth token
    let token = null;
    try {
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }

    // Build request options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    // Add body for methods that support it
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    // Make request with retry logic
    const response = await retryFetch(url, options);

    // Parse response
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`✅ API Response: ${method} ${endpoint}`);
    return responseData;
  } catch (error) {
    // Handle different error types
    if (error.status === 401) {
      console.error('🔑 Unauthorized (401) - Logging out user');
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Failed to sign out:', signOutError);
      }
      throw new Error('Session expired. Please login again.');
    }

    if (error.status === 403) {
      console.error('🚫 Forbidden (403):', error.data?.message || 'Permission denied');
      throw new Error('Permission denied. You do not have access to this resource.');
    }

    if (error.status === 404) {
      console.error('❌ Not Found (404):', error.data?.message || 'Resource not found');
      throw new Error('Resource not found.');
    }

    if (error.status === 409) {
      console.error('⚠️ Conflict (409):', error.data?.message || 'Data conflict');
      throw new Error('Data conflict. Please refresh and try again.');
    }

    if (error.status === 429) {
      console.error('⏱️ Rate Limited (429) - Too many requests');
      throw new Error('Too many requests. Please wait and try again.');
    }

    if (error.status >= 500) {
      console.error(`❌ Server Error (${error.status}) - Max retries exceeded`);
      throw new Error('Server error. Please try again later.');
    }

    // Network error
    if (!error.status) {
      console.error('🌐 Network Error:', error.message);
      throw new Error('Network error. Please check your connection.');
    }

    console.error(`❌ API Error:`, error.data?.message || error.message);
    throw error;
  }
};

/**
 * API Client - main export
 */
const apiClient = {
  /**
   * GET request
   */
  get: async (endpoint) => {
    return makeRequest('GET', endpoint);
  },

  /**
   * POST request
   */
  post: async (endpoint, data) => {
    return makeRequest('POST', endpoint, data);
  },

  /**
   * PUT request
   */
  put: async (endpoint, data) => {
    return makeRequest('PUT', endpoint, data);
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data) => {
    return makeRequest('PATCH', endpoint, data);
  },

  /**
   * DELETE request
   */
  delete: async (endpoint) => {
    return makeRequest('DELETE', endpoint);
  },
};

export default apiClient;
