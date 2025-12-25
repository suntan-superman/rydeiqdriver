/**
 * 🧠 DEMAND FORECASTING HOOKS
 * 
 * React Query hooks for AI-powered demand forecasting
 * Provides ride demand prediction, event-based forecasting, weather impact analysis, and seasonal patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import demandForecastingService from '../../services/ai/demandForecastingService';

// Query Keys
export const DEMAND_FORECASTING_KEYS = {
  all: ['demandForecasting'],
  demandForecast: (location, timeRange) => [...DEMAND_FORECASTING_KEYS.all, 'demandForecast', location, timeRange],
  eventForecast: (location, timeRange, events) => [...DEMAND_FORECASTING_KEYS.all, 'eventForecast', location, timeRange, events],
  weatherForecast: (location, timeRange, weather) => [...DEMAND_FORECASTING_KEYS.all, 'weatherForecast', location, timeRange, weather],
  seasonalForecast: (location, timeRange, season) => [...DEMAND_FORECASTING_KEYS.all, 'seasonalForecast', location, timeRange, season],
  demandTrends: (timeframe) => [...DEMAND_FORECASTING_KEYS.all, 'demandTrends', timeframe],
  demandHotspots: (location, radius, timeRange) => [...DEMAND_FORECASTING_KEYS.all, 'demandHotspots', location, radius, timeRange],
  dashboard: (location, timeRange) => [...DEMAND_FORECASTING_KEYS.all, 'dashboard', location, timeRange],
};

/**
 * Hook for demand forecast
 */
export const useDemandForecast = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.demandForecast(location, timeRange),
    queryFn: () => demandForecastingService.getDemandForecast(location, timeRange, options),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Demand forecast query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for event-based forecast
 */
export const useEventBasedForecast = (location, timeRange = '24h', events = [], options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.eventForecast(location, timeRange, events),
    queryFn: () => demandForecastingService.getEventBasedForecast(location, timeRange, events),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Event-based forecast query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for weather impact forecast
 */
export const useWeatherImpactForecast = (location, timeRange = '24h', weatherConditions = {}, options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.weatherForecast(location, timeRange, weatherConditions),
    queryFn: () => demandForecastingService.getWeatherImpactForecast(location, timeRange, weatherConditions),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Weather impact forecast query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for seasonal forecast
 */
export const useSeasonalForecast = (location, timeRange = '24h', season = 'current', options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.seasonalForecast(location, timeRange, season),
    queryFn: () => demandForecastingService.getSeasonalForecast(location, timeRange, season),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Seasonal forecast query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for demand trends
 */
export const useDemandTrends = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.demandTrends(timeframe),
    queryFn: () => demandForecastingService.getDemandTrends(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Demand trends query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for demand hotspots
 */
export const useDemandHotspots = (location, radius = 5, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.demandHotspots(location, radius, timeRange),
    queryFn: () => demandForecastingService.getDemandHotspots(location, radius, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Demand hotspots query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for comprehensive demand forecasting dashboard
 */
export const useDemandForecastingDashboard = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: DEMAND_FORECASTING_KEYS.dashboard(location, timeRange),
    queryFn: () => demandForecastingService.getDemandForecastingDashboard(location, timeRange),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Demand forecasting dashboard query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for demand forecasting initialization
 */
export const useDemandForecastingInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => demandForecastingService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Demand forecasting service initialized');
    },
    onError: (error) => {
      console.error('❌ Demand forecasting initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive demand forecasting
 */
export const useComprehensiveDemandForecasting = (location, timeRange = '24h') => {
  const queryClient = useQueryClient();

  // Individual queries
  const demandForecastQuery = useDemandForecast(location, timeRange);
  const eventForecastQuery = useEventBasedForecast(location, timeRange);
  const weatherForecastQuery = useWeatherImpactForecast(location, timeRange);
  const seasonalForecastQuery = useSeasonalForecast(location, timeRange);
  const trendsQuery = useDemandTrends('30d');
  const hotspotsQuery = useDemandHotspots(location, 5, timeRange);
  const dashboardQuery = useDemandForecastingDashboard(location, timeRange);

  // Combined loading state
  const isLoading = demandForecastQuery.isLoading || 
                   eventForecastQuery.isLoading || 
                   weatherForecastQuery.isLoading || 
                   seasonalForecastQuery.isLoading || 
                   trendsQuery.isLoading || 
                   hotspotsQuery.isLoading || 
                   dashboardQuery.isLoading;

  // Combined error state
  const hasError = demandForecastQuery.isError || 
                  eventForecastQuery.isError || 
                  weatherForecastQuery.isError || 
                  seasonalForecastQuery.isError || 
                  trendsQuery.isError || 
                  hotspotsQuery.isError || 
                  dashboardQuery.isError;

  // Combined data
  const data = {
    demandForecast: demandForecastQuery.data,
    eventForecast: eventForecastQuery.data,
    weatherForecast: weatherForecastQuery.data,
    seasonalForecast: seasonalForecastQuery.data,
    trends: trendsQuery.data,
    hotspots: hotspotsQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    errors: {
      demandForecast: demandForecastQuery.error,
      eventForecast: eventForecastQuery.error,
      weatherForecast: weatherForecastQuery.error,
      seasonalForecast: seasonalForecastQuery.error,
      trends: trendsQuery.error,
      hotspots: hotspotsQuery.error,
      dashboard: dashboardQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    demandForecastQuery,
    eventForecastQuery,
    weatherForecastQuery,
    seasonalForecastQuery,
    trendsQuery,
    hotspotsQuery,
    dashboardQuery,
  };
};

/**
 * Hook for demand forecasting analytics
 */
export const useDemandForecastingAnalytics = (location, timeRange = '24h') => {
  const { data: dashboard, isLoading, error } = useDemandForecastingDashboard(location, timeRange);

  const analytics = {
    totalDemand: dashboard?.demandForecast?.totalDemand || 0,
    demandLevel: getDemandLevel(dashboard?.demandForecast?.totalDemand || 0),
    eventImpact: dashboard?.eventForecast?.totalEventImpact || 0,
    weatherMultiplier: dashboard?.weatherForecast?.demandMultiplier || 1.0,
    totalHotspots: dashboard?.hotspots?.totalHotspots || 0,
    highDemandHotspots: dashboard?.hotspots?.highDemandHotspots || 0,
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
 * Hook for demand forecasting performance
 */
export const useDemandForecastingPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const demandQueries = cache.findAll({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });

    return {
      totalQueries: demandQueries.length,
      staleQueries: demandQueries.filter(q => q.isStale()).length,
      freshQueries: demandQueries.filter(q => !q.isStale()).length,
      errorQueries: demandQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const demandQueries = cache.findAll({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });

    return demandQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getDemandMetrics = () => {
    const cache = queryClient.getQueryCache();
    const demandQueries = cache.findAll({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });

    const metrics = {
      totalQueries: demandQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (demandQueries.length > 0) {
      const staleTimes = demandQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = demandQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / demandQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getDemandMetrics,
  };
};

/**
 * Hook for demand forecasting actions
 */
export const useDemandForecastingActions = () => {
  const queryClient = useQueryClient();

  const updateDemandData = async (location, timeRange, newData) => {
    try {
      // This would typically update the demand forecasting service
      console.log('📊 Updating demand data:', { location, timeRange, newData });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: DEMAND_FORECASTING_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update demand data:', error);
      return { success: false, error };
    }
  };

  const refreshDemandData = async (location, timeRange) => {
    try {
      // Force refresh of demand data
      queryClient.invalidateQueries({
        queryKey: DEMAND_FORECASTING_KEYS.dashboard(location, timeRange)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to refresh demand data:', error);
      return { success: false, error };
    }
  };

  const clearDemandCache = async () => {
    try {
      // Clear all demand forecasting cache
      queryClient.removeQueries({
        queryKey: DEMAND_FORECASTING_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear demand cache:', error);
      return { success: false, error };
    }
  };

  return {
    updateDemandData,
    refreshDemandData,
    clearDemandCache,
  };
};

/**
 * Hook for demand forecasting cache management
 */
export const useDemandForecastingCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });
  };

  const clearDemandForecastCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'demandForecast']
    });
  };

  const clearEventForecastCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'eventForecast']
    });
  };

  const clearWeatherForecastCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'weatherForecast']
    });
  };

  const clearSeasonalForecastCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'seasonalForecast']
    });
  };

  const clearTrendsCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'demandTrends']
    });
  };

  const clearHotspotsCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'demandHotspots']
    });
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({
      queryKey: [...DEMAND_FORECASTING_KEYS.all, 'dashboard']
    });
  };

  return {
    clearCache,
    clearDemandForecastCache,
    clearEventForecastCache,
    clearWeatherForecastCache,
    clearSeasonalForecastCache,
    clearTrendsCache,
    clearHotspotsCache,
    clearDashboardCache,
  };
};

/**
 * Hook for demand forecasting refresh
 */
export const useDemandForecastingRefresh = () => {
  const queryClient = useQueryClient();

  const refreshDemandForecast = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.demandForecast(location, timeRange)
    });
  };

  const refreshEventForecast = (location, timeRange, events) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.eventForecast(location, timeRange, events)
    });
  };

  const refreshWeatherForecast = (location, timeRange, weather) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.weatherForecast(location, timeRange, weather)
    });
  };

  const refreshSeasonalForecast = (location, timeRange, season) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.seasonalForecast(location, timeRange, season)
    });
  };

  const refreshTrends = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.demandTrends(timeframe)
    });
  };

  const refreshHotspots = (location, radius, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.demandHotspots(location, radius, timeRange)
    });
  };

  const refreshDashboard = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.dashboard(location, timeRange)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: DEMAND_FORECASTING_KEYS.all
    });
  };

  return {
    refreshDemandForecast,
    refreshEventForecast,
    refreshWeatherForecast,
    refreshSeasonalForecast,
    refreshTrends,
    refreshHotspots,
    refreshDashboard,
    refreshAll,
  };
};

// Helper function
const getDemandLevel = (score) => {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
};

export default {
  useDemandForecast,
  useEventBasedForecast,
  useWeatherImpactForecast,
  useSeasonalForecast,
  useDemandTrends,
  useDemandHotspots,
  useDemandForecastingDashboard,
  useDemandForecastingInitialization,
  useComprehensiveDemandForecasting,
  useDemandForecastingAnalytics,
  useDemandForecastingPerformance,
  useDemandForecastingActions,
  useDemandForecastingCache,
  useDemandForecastingRefresh,
};
