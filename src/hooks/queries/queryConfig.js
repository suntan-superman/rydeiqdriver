/**
 * Query Configuration
 * Defines cache and stale times for different types of data
 * Balances freshness with performance
 */

export const queryConfig = {
  // HIGH PRIORITY: Critical data updated frequently
  driver: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  },
  
  rides: {
    staleTime: 1000 * 30, // 30 seconds (critical, very dynamic)
    gcTime: 1000 * 60 * 5, // 5 minutes
  },
  
  bids: {
    staleTime: 1000 * 30, // 30 seconds (real-time bidding)
    gcTime: 1000 * 60 * 5, // 5 minutes
  },
  
  earnings: {
    staleTime: 1000 * 60 * 10, // 10 minutes (updates per ride)
    gcTime: 1000 * 60 * 30, // 30 minutes
  },
  
  // REAL-TIME: Location updates frequently
  location: {
    staleTime: 0, // Always stale to get fresh updates
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 5000, // Refetch every 5 seconds
  },
  
  // MEDIUM PRIORITY: Important but less frequent updates
  notifications: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  },
  
  payment: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
  
  safety: {
    staleTime: 1000 * 60 * 60, // 1 hour (infrequently changed)
    gcTime: 1000 * 60 * 120, // 2 hours
  },
  
  vehicle: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  },
  
  // LOW PRIORITY: Rarely updated
  analytics: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
  
  communication: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  },
  
  accessibility: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  },
  
  dynamicPricing: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },
  
  gamification: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  },
  
  driverTools: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
  
  community: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
  
  sustainability: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  },
  
  wellness: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  },
};
