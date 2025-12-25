/**
 * 🧠 PREDICTIVE ANALYTICS HOOK
 * 
 * React Query hook for AI-powered predictive analytics
 * Provides earnings predictions, demand forecasting, and smart recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import predictiveAnalyticsService from '../../services/ai/predictiveAnalyticsService';

// Query Keys
export const PREDICTIVE_ANALYTICS_KEYS = {
  all: ['predictiveAnalytics'],
  earnings: (timeframe, options) => [...PREDICTIVE_ANALYTICS_KEYS.all, 'earnings', timeframe, options],
  demand: (location, timeframe) => [...PREDICTIVE_ANALYTICS_KEYS.all, 'demand', location, timeframe],
  timing: (area, days) => [...PREDICTIVE_ANALYTICS_KEYS.all, 'timing', area, days],
  weather: (location, timeframe) => [...PREDICTIVE_ANALYTICS_KEYS.all, 'weather', location, timeframe],
  recommendations: (driverId, options) => [...PREDICTIVE_ANALYTICS_KEYS.all, 'recommendations', driverId, options],
};

/**
 * Hook for earnings prediction
 */
export const useEarningsPrediction = (timeframe = 'today', options = {}) => {
  return useQuery({
    queryKey: PREDICTIVE_ANALYTICS_KEYS.earnings(timeframe, options),
    queryFn: () => predictiveAnalyticsService.predictEarnings(timeframe, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Earnings prediction query failed:', error);
    }
  });
};

/**
 * Hook for demand forecasting
 */
export const useDemandForecast = (location, timeframe = 'today', options = {}) => {
  return useQuery({
    queryKey: PREDICTIVE_ANALYTICS_KEYS.demand(location, timeframe),
    queryFn: () => predictiveAnalyticsService.predictDemand(location, timeframe, options),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    enabled: !!location,
    onError: (error) => {
      console.error('❌ Demand forecast query failed:', error);
    }
  });
};

/**
 * Hook for optimal timing analysis
 */
export const useOptimalTiming = (area = 'downtown', days = 7) => {
  return useQuery({
    queryKey: PREDICTIVE_ANALYTICS_KEYS.timing(area, days),
    queryFn: () => predictiveAnalyticsService.getOptimalTiming(area, days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Optimal timing query failed:', error);
    }
  });
};

/**
 * Hook for weather impact analysis
 */
export const useWeatherImpact = (location, timeframe = 'today') => {
  return useQuery({
    queryKey: PREDICTIVE_ANALYTICS_KEYS.weather(location, timeframe),
    queryFn: () => predictiveAnalyticsService.getWeatherImpact(location, timeframe),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!location,
    onError: (error) => {
      console.error('❌ Weather impact query failed:', error);
    }
  });
};

/**
 * Hook for smart recommendations
 */
export const useSmartRecommendations = (driverId, options = {}) => {
  return useQuery({
    queryKey: PREDICTIVE_ANALYTICS_KEYS.recommendations(driverId, options),
    queryFn: () => predictiveAnalyticsService.getSmartRecommendations(driverId, options),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    enabled: !!driverId,
    onError: (error) => {
      console.error('❌ Smart recommendations query failed:', error);
    }
  });
};

/**
 * Hook for comprehensive analytics data
 */
export const useComprehensiveAnalytics = (driverId, location, options = {}) => {
  const queryClient = useQueryClient();

  // Individual queries
  const earningsQuery = useEarningsPrediction('today', options);
  const demandQuery = useDemandForecast(location, 'today', options);
  const timingQuery = useOptimalTiming('downtown', 7);
  const weatherQuery = useWeatherImpact(location, 'today');
  const recommendationsQuery = useSmartRecommendations(driverId, options);

  // Combined loading state
  const isLoading = earningsQuery.isLoading || 
                   demandQuery.isLoading || 
                   timingQuery.isLoading || 
                   weatherQuery.isLoading || 
                   recommendationsQuery.isLoading;

  // Combined error state
  const hasError = earningsQuery.isError || 
                  demandQuery.isError || 
                  timingQuery.isError || 
                  weatherQuery.isError || 
                  recommendationsQuery.isError;

  // Combined data
  const data = {
    earnings: earningsQuery.data,
    demand: demandQuery.data,
    timing: timingQuery.data,
    weather: weatherQuery.data,
    recommendations: recommendationsQuery.data,
    isLoading,
    hasError,
    errors: {
      earnings: earningsQuery.error,
      demand: demandQuery.error,
      timing: timingQuery.error,
      weather: weatherQuery.error,
      recommendations: recommendationsQuery.error,
    }
  };

  // Refresh all analytics
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    earningsQuery,
    demandQuery,
    timingQuery,
    weatherQuery,
    recommendationsQuery,
  };
};

/**
 * Hook for analytics initialization
 */
export const useAnalyticsInitialization = (driverId) => {
  return useMutation({
    mutationFn: () => predictiveAnalyticsService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Analytics service initialized successfully');
    },
    onError: (error) => {
      console.error('❌ Analytics initialization failed:', error);
    }
  });
};

/**
 * Hook for refreshing specific analytics
 */
export const useRefreshAnalytics = () => {
  const queryClient = useQueryClient();

  const refreshEarnings = (timeframe, options) => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.earnings(timeframe, options)
    });
  };

  const refreshDemand = (location, timeframe) => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.demand(location, timeframe)
    });
  };

  const refreshTiming = (area, days) => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.timing(area, days)
    });
  };

  const refreshWeather = (location, timeframe) => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.weather(location, timeframe)
    });
  };

  const refreshRecommendations = (driverId, options) => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.recommendations(driverId, options)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.all
    });
  };

  return {
    refreshEarnings,
    refreshDemand,
    refreshTiming,
    refreshWeather,
    refreshRecommendations,
    refreshAll,
  };
};

/**
 * Hook for analytics cache management
 */
export const useAnalyticsCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.all
    });
  };

  const clearEarningsCache = () => {
    queryClient.removeQueries({
      queryKey: [...PREDICTIVE_ANALYTICS_KEYS.all, 'earnings']
    });
  };

  const clearDemandCache = () => {
    queryClient.removeQueries({
      queryKey: [...PREDICTIVE_ANALYTICS_KEYS.all, 'demand']
    });
  };

  const clearTimingCache = () => {
    queryClient.removeQueries({
      queryKey: [...PREDICTIVE_ANALYTICS_KEYS.all, 'timing']
    });
  };

  const clearWeatherCache = () => {
    queryClient.removeQueries({
      queryKey: [...PREDICTIVE_ANALYTICS_KEYS.all, 'weather']
    });
  };

  const clearRecommendationsCache = () => {
    queryClient.removeQueries({
      queryKey: [...PREDICTIVE_ANALYTICS_KEYS.all, 'recommendations']
    });
  };

  return {
    clearCache,
    clearEarningsCache,
    clearDemandCache,
    clearTimingCache,
    clearWeatherCache,
    clearRecommendationsCache,
  };
};

/**
 * Hook for analytics performance monitoring
 */
export const useAnalyticsPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const analyticsQueries = cache.findAll({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.all
    });

    return {
      totalQueries: analyticsQueries.length,
      staleQueries: analyticsQueries.filter(q => q.isStale()).length,
      freshQueries: analyticsQueries.filter(q => !q.isStale()).length,
      errorQueries: analyticsQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const analyticsQueries = cache.findAll({
      queryKey: PREDICTIVE_ANALYTICS_KEYS.all
    });

    return analyticsQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  return {
    getCacheStats,
    getQueryTimes,
  };
};

export default {
  useEarningsPrediction,
  useDemandForecast,
  useOptimalTiming,
  useWeatherImpact,
  useSmartRecommendations,
  useComprehensiveAnalytics,
  useAnalyticsInitialization,
  useRefreshAnalytics,
  useAnalyticsCache,
  useAnalyticsPerformance,
};
