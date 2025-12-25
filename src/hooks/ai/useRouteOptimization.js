/**
 * 🧠 ROUTE OPTIMIZATION HOOKS
 * 
 * React Query hooks for AI-powered route optimization
 * Provides multi-factor route planning, traffic optimization, fuel efficiency, and alternative routes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import routeOptimizationService from '../../services/ai/routeOptimizationService';

// Query Keys
export const ROUTE_OPTIMIZATION_KEYS = {
  all: ['routeOptimization'],
  optimalRoute: (origin, destination, options) => [...ROUTE_OPTIMIZATION_KEYS.all, 'optimalRoute', origin, destination, options],
  trafficRoute: (origin, destination, trafficConditions) => [...ROUTE_OPTIMIZATION_KEYS.all, 'trafficRoute', origin, destination, trafficConditions],
  multiStopRoute: (stops, options) => [...ROUTE_OPTIMIZATION_KEYS.all, 'multiStopRoute', stops, options],
  fuelRoute: (origin, destination, vehicleProfile) => [...ROUTE_OPTIMIZATION_KEYS.all, 'fuelRoute', origin, destination, vehicleProfile],
  eta: (origin, destination, route, trafficConditions) => [...ROUTE_OPTIMIZATION_KEYS.all, 'eta', origin, destination, route, trafficConditions],
  alternatives: (origin, destination, preferences) => [...ROUTE_OPTIMIZATION_KEYS.all, 'alternatives', origin, destination, preferences],
  dashboard: (origin, destination, options) => [...ROUTE_OPTIMIZATION_KEYS.all, 'dashboard', origin, destination, options],
};

/**
 * Hook for optimal route
 */
export const useOptimalRoute = (origin, destination, options = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.optimalRoute(origin, destination, options),
    queryFn: () => routeOptimizationService.getOptimalRoute(origin, destination, options),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Optimal route query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for traffic optimized route
 */
export const useTrafficOptimizedRoute = (origin, destination, trafficConditions = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.trafficRoute(origin, destination, trafficConditions),
    queryFn: () => routeOptimizationService.getTrafficOptimizedRoute(origin, destination, trafficConditions),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Traffic optimized route query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for multi-stop route
 */
export const useMultiStopRoute = (stops = [], options = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.multiStopRoute(stops, options),
    queryFn: () => routeOptimizationService.getMultiStopRoute(stops, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Multi-stop route query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for fuel efficient route
 */
export const useFuelEfficientRoute = (origin, destination, vehicleProfile = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.fuelRoute(origin, destination, vehicleProfile),
    queryFn: () => routeOptimizationService.getFuelEfficientRoute(origin, destination, vehicleProfile),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Fuel efficient route query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for ETA prediction
 */
export const useETAPrediction = (origin, destination, route = null, trafficConditions = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.eta(origin, destination, route, trafficConditions),
    queryFn: () => routeOptimizationService.getETAPrediction(origin, destination, route, trafficConditions),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ ETA prediction query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for alternative routes
 */
export const useAlternativeRoutes = (origin, destination, preferences = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.alternatives(origin, destination, preferences),
    queryFn: () => routeOptimizationService.getAlternativeRoutes(origin, destination, preferences),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Alternative routes query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for comprehensive route optimization dashboard
 */
export const useRouteOptimizationDashboard = (origin, destination, options = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ROUTE_OPTIMIZATION_KEYS.dashboard(origin, destination, options),
    queryFn: () => routeOptimizationService.getRouteOptimizationDashboard(origin, destination, options),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Route optimization dashboard query failed:', error);
    },
    ...queryOptions
  });
};

/**
 * Hook for route optimization initialization
 */
export const useRouteOptimizationInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => routeOptimizationService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Route optimization service initialized');
    },
    onError: (error) => {
      console.error('❌ Route optimization initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive route optimization
 */
export const useComprehensiveRouteOptimization = (origin, destination, options = {}) => {
  const queryClient = useQueryClient();

  // Individual queries
  const optimalRouteQuery = useOptimalRoute(origin, destination, options);
  const trafficRouteQuery = useTrafficOptimizedRoute(origin, destination, options.traffic);
  const multiStopRouteQuery = useMultiStopRoute(options.stops || [], options);
  const fuelRouteQuery = useFuelEfficientRoute(origin, destination, options.vehicle);
  const etaQuery = useETAPrediction(origin, destination, null, options.traffic);
  const alternativesQuery = useAlternativeRoutes(origin, destination, options.preferences);
  const dashboardQuery = useRouteOptimizationDashboard(origin, destination, options);

  // Combined loading state
  const isLoading = optimalRouteQuery.isLoading || 
                   trafficRouteQuery.isLoading || 
                   multiStopRouteQuery.isLoading || 
                   fuelRouteQuery.isLoading || 
                   etaQuery.isLoading || 
                   alternativesQuery.isLoading || 
                   dashboardQuery.isLoading;

  // Combined error state
  const hasError = optimalRouteQuery.isError || 
                  trafficRouteQuery.isError || 
                  multiStopRouteQuery.isError || 
                  fuelRouteQuery.isError || 
                  etaQuery.isError || 
                  alternativesQuery.isError || 
                  dashboardQuery.isError;

  // Combined data
  const data = {
    optimalRoute: optimalRouteQuery.data,
    trafficRoute: trafficRouteQuery.data,
    multiStopRoute: multiStopRouteQuery.data,
    fuelRoute: fuelRouteQuery.data,
    eta: etaQuery.data,
    alternatives: alternativesQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    errors: {
      optimalRoute: optimalRouteQuery.error,
      trafficRoute: trafficRouteQuery.error,
      multiStopRoute: multiStopRouteQuery.error,
      fuelRoute: fuelRouteQuery.error,
      eta: etaQuery.error,
      alternatives: alternativesQuery.error,
      dashboard: dashboardQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    optimalRouteQuery,
    trafficRouteQuery,
    multiStopRouteQuery,
    fuelRouteQuery,
    etaQuery,
    alternativesQuery,
    dashboardQuery,
  };
};

/**
 * Hook for route optimization analytics
 */
export const useRouteOptimizationAnalytics = (origin, destination, options = {}) => {
  const { data: dashboard, isLoading, error } = useRouteOptimizationDashboard(origin, destination, options);

  const analytics = {
    optimizationScore: dashboard?.optimalRoute?.totalScore || 0,
    trafficLevel: dashboard?.trafficRoute?.trafficLevel || 'normal',
    fuelEfficiency: dashboard?.fuelRoute?.fuelEfficiency || 0,
    alternativesCount: dashboard?.alternatives?.alternatives?.length || 0,
    etaAccuracy: dashboard?.eta?.confidence || 0,
    dataQuality: dashboard?.dataQuality || 0,
    insights: dashboard?.insights || [],
    lastUpdated: dashboard?.lastUpdated || new Date().toISOString(),
  };

  return {
    analytics,
    isLoading,
    error,
    dashboard
  };
};

/**
 * Hook for route optimization performance
 */
export const useRouteOptimizationPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const routeQueries = cache.findAll({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });

    return {
      totalQueries: routeQueries.length,
      staleQueries: routeQueries.filter(q => q.isStale()).length,
      freshQueries: routeQueries.filter(q => !q.isStale()).length,
      errorQueries: routeQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const routeQueries = cache.findAll({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });

    return routeQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getRouteMetrics = () => {
    const cache = queryClient.getQueryCache();
    const routeQueries = cache.findAll({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });

    const metrics = {
      totalQueries: routeQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (routeQueries.length > 0) {
      const staleTimes = routeQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = routeQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / routeQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getRouteMetrics,
  };
};

/**
 * Hook for route optimization actions
 */
export const useRouteOptimizationActions = () => {
  const queryClient = useQueryClient();

  const updateRouteData = async (origin, destination, newData) => {
    try {
      // This would typically update the route optimization service
      console.log('🗺️ Updating route data:', { origin, destination, newData });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ROUTE_OPTIMIZATION_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update route data:', error);
      return { success: false, error };
    }
  };

  const refreshRouteData = async (origin, destination) => {
    try {
      // Force refresh of route data
      queryClient.invalidateQueries({
        queryKey: ROUTE_OPTIMIZATION_KEYS.dashboard(origin, destination)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to refresh route data:', error);
      return { success: false, error };
    }
  };

  const clearRouteCache = async () => {
    try {
      // Clear all route optimization cache
      queryClient.removeQueries({
        queryKey: ROUTE_OPTIMIZATION_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear route cache:', error);
      return { success: false, error };
    }
  };

  return {
    updateRouteData,
    refreshRouteData,
    clearRouteCache,
  };
};

/**
 * Hook for route optimization cache management
 */
export const useRouteOptimizationCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });
  };

  const clearOptimalRouteCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'optimalRoute']
    });
  };

  const clearTrafficRouteCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'trafficRoute']
    });
  };

  const clearMultiStopRouteCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'multiStopRoute']
    });
  };

  const clearFuelRouteCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'fuelRoute']
    });
  };

  const clearETACache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'eta']
    });
  };

  const clearAlternativesCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'alternatives']
    });
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({
      queryKey: [...ROUTE_OPTIMIZATION_KEYS.all, 'dashboard']
    });
  };

  return {
    clearCache,
    clearOptimalRouteCache,
    clearTrafficRouteCache,
    clearMultiStopRouteCache,
    clearFuelRouteCache,
    clearETACache,
    clearAlternativesCache,
    clearDashboardCache,
  };
};

/**
 * Hook for route optimization refresh
 */
export const useRouteOptimizationRefresh = () => {
  const queryClient = useQueryClient();

  const refreshOptimalRoute = (origin, destination, options) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.optimalRoute(origin, destination, options)
    });
  };

  const refreshTrafficRoute = (origin, destination, trafficConditions) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.trafficRoute(origin, destination, trafficConditions)
    });
  };

  const refreshMultiStopRoute = (stops, options) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.multiStopRoute(stops, options)
    });
  };

  const refreshFuelRoute = (origin, destination, vehicleProfile) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.fuelRoute(origin, destination, vehicleProfile)
    });
  };

  const refreshETA = (origin, destination, route, trafficConditions) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.eta(origin, destination, route, trafficConditions)
    });
  };

  const refreshAlternatives = (origin, destination, preferences) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.alternatives(origin, destination, preferences)
    });
  };

  const refreshDashboard = (origin, destination, options) => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.dashboard(origin, destination, options)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: ROUTE_OPTIMIZATION_KEYS.all
    });
  };

  return {
    refreshOptimalRoute,
    refreshTrafficRoute,
    refreshMultiStopRoute,
    refreshFuelRoute,
    refreshETA,
    refreshAlternatives,
    refreshDashboard,
    refreshAll,
  };
};

export default {
  useOptimalRoute,
  useTrafficOptimizedRoute,
  useMultiStopRoute,
  useFuelEfficientRoute,
  useETAPrediction,
  useAlternativeRoutes,
  useRouteOptimizationDashboard,
  useRouteOptimizationInitialization,
  useComprehensiveRouteOptimization,
  useRouteOptimizationAnalytics,
  useRouteOptimizationPerformance,
  useRouteOptimizationActions,
  useRouteOptimizationCache,
  useRouteOptimizationRefresh,
};
