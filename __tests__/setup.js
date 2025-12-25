/**
 * Jest Test Setup
 * Configures React Native testing environment and provides shared utilities
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock console methods to reduce test output noise
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

/**
 * Create a fresh QueryClient for each test
 * This prevents cache contamination between tests
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retry for tests
        cacheTime: 0, // Disable caching for tests
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Wrapper component for tests
 * Provides QueryClient and other context providers
 */
export const TestWrapper = ({ children }) => {
  const testQueryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Mock Firebase Auth
 */
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', id: 'test-user-123' },
    isAuthenticated: true,
    signOut: jest.fn(),
  }),
}));

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  driverProfile: {
    id: 'driver-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    status: 'online',
    rating: 4.8,
  },
  rides: [
    {
      id: 'ride-1',
      passengerId: 'passenger-123',
      pickupLocation: 'Downtown',
      dropoffLocation: 'Airport',
      status: 'completed',
      fare: 25.50,
      tip: 5.00,
    },
    {
      id: 'ride-2',
      passengerId: 'passenger-456',
      pickupLocation: 'Mall',
      dropoffLocation: 'University',
      status: 'completed',
      fare: 15.75,
      tip: 2.50,
    },
  ],
  earnings: {
    total: 187.50,
    breakdown: {
      rides: 150.00,
      tips: 37.50,
    },
    period: 'today',
  },
  notifications: [
    {
      id: 'notif-1',
      type: 'ride_request',
      message: 'New ride request',
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      type: 'payment',
      message: 'Payment received',
      read: true,
      timestamp: new Date().toISOString(),
    },
  ],
};

/**
 * Mock API client
 */
export const mockApiClient = {
  get: jest.fn((url) => {
    // Return appropriate mock data based on URL
    if (url.includes('profile')) {
      return Promise.resolve(mockApiResponses.driverProfile);
    }
    if (url.includes('rides')) {
      return Promise.resolve(mockApiResponses.rides);
    }
    if (url.includes('earnings')) {
      return Promise.resolve(mockApiResponses.earnings);
    }
    if (url.includes('notifications')) {
      return Promise.resolve(mockApiResponses.notifications);
    }
    return Promise.resolve({});
  }),
  post: jest.fn(() => Promise.resolve({ success: true })),
  put: jest.fn(() => Promise.resolve({ success: true })),
  delete: jest.fn(() => Promise.resolve({ success: true })),
};

/**
 * Helper to wait for async operations in tests
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Reset all mocks before each test
 */
beforeEach(() => {
  jest.clearAllMocks();
});
