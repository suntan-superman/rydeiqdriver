/**
 * 🧠 SMART RECOMMENDATIONS HOOKS
 * 
 * React Query hooks for AI-powered smart recommendations
 * Provides route optimization, pricing, maintenance, and personalized suggestions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import smartRecommendationsService from '../../services/ai/smartRecommendationsService';

// Query Keys
export const SMART_RECOMMENDATIONS_KEYS = {
  all: ['smartRecommendations'],
  personalized: (context) => [...SMART_RECOMMENDATIONS_KEYS.all, 'personalized', context],
  route: (pickup, destination, options) => [...SMART_RECOMMENDATIONS_KEYS.all, 'route', pickup, destination, options],
  pricing: (location, time, options) => [...SMART_RECOMMENDATIONS_KEYS.all, 'pricing', location, time, options],
  maintenance: (vehicleId, options) => [...SMART_RECOMMENDATIONS_KEYS.all, 'maintenance', vehicleId, options],
  market: (location, time, options) => [...SMART_RECOMMENDATIONS_KEYS.all, 'market', location, time, options],
};

/**
 * Hook for personalized recommendations
 */
export const usePersonalizedRecommendations = (context = {}) => {
  return useQuery({
    queryKey: SMART_RECOMMENDATIONS_KEYS.personalized(context),
    queryFn: () => smartRecommendationsService.getPersonalizedRecommendations(context),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Personalized recommendations query failed:', error);
    }
  });
};

/**
 * Hook for route recommendations
 */
export const useRouteRecommendations = (pickup, destination, options = {}) => {
  return useQuery({
    queryKey: SMART_RECOMMENDATIONS_KEYS.route(pickup, destination, options),
    queryFn: () => smartRecommendationsService.getRouteRecommendations(pickup, destination, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(pickup && destination),
    onError: (error) => {
      console.error('❌ Route recommendations query failed:', error);
    }
  });
};

/**
 * Hook for pricing recommendations
 */
export const usePricingRecommendations = (location, time, options = {}) => {
  return useQuery({
    queryKey: SMART_RECOMMENDATIONS_KEYS.pricing(location, time, options),
    queryFn: () => smartRecommendationsService.getPricingRecommendations(location, time, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && time),
    onError: (error) => {
      console.error('❌ Pricing recommendations query failed:', error);
    }
  });
};

/**
 * Hook for maintenance recommendations
 */
export const useMaintenanceRecommendations = (vehicleId, options = {}) => {
  return useQuery({
    queryKey: SMART_RECOMMENDATIONS_KEYS.maintenance(vehicleId, options),
    queryFn: () => smartRecommendationsService.getMaintenanceRecommendations(vehicleId, options),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!vehicleId,
    onError: (error) => {
      console.error('❌ Maintenance recommendations query failed:', error);
    }
  });
};

/**
 * Hook for market recommendations
 */
export const useMarketRecommendations = (location, time, options = {}) => {
  return useQuery({
    queryKey: SMART_RECOMMENDATIONS_KEYS.market(location, time, options),
    queryFn: () => smartRecommendationsService.getMarketRecommendations(location, time, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && time),
    onError: (error) => {
      console.error('❌ Market recommendations query failed:', error);
    }
  });
};

/**
 * Hook for comprehensive recommendations
 */
export const useComprehensiveRecommendations = (driverId, context = {}) => {
  const queryClient = useQueryClient();

  // Individual queries
  const personalizedQuery = usePersonalizedRecommendations(context);
  const routeQuery = useRouteRecommendations(
    context.pickup, 
    context.destination, 
    context.routeOptions
  );
  const pricingQuery = usePricingRecommendations(
    context.location, 
    context.time, 
    context.pricingOptions
  );
  const maintenanceQuery = useMaintenanceRecommendations(
    context.vehicleId, 
    context.maintenanceOptions
  );
  const marketQuery = useMarketRecommendations(
    context.location, 
    context.time, 
    context.marketOptions
  );

  // Combined loading state
  const isLoading = personalizedQuery.isLoading || 
                   routeQuery.isLoading || 
                   pricingQuery.isLoading || 
                   maintenanceQuery.isLoading || 
                   marketQuery.isLoading;

  // Combined error state
  const hasError = personalizedQuery.isError || 
                  routeQuery.isError || 
                  pricingQuery.isError || 
                  maintenanceQuery.isError || 
                  marketQuery.isError;

  // Combined data
  const data = {
    personalized: personalizedQuery.data,
    route: routeQuery.data,
    pricing: pricingQuery.data,
    maintenance: maintenanceQuery.data,
    market: marketQuery.data,
    isLoading,
    hasError,
    errors: {
      personalized: personalizedQuery.error,
      route: routeQuery.error,
      pricing: pricingQuery.error,
      maintenance: maintenanceQuery.error,
      market: marketQuery.error,
    }
  };

  // Refresh all recommendations
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    personalizedQuery,
    routeQuery,
    pricingQuery,
    maintenanceQuery,
    marketQuery,
  };
};

/**
 * Hook for behavioral learning
 */
export const useBehavioralLearning = () => {
  return useMutation({
    mutationFn: ({ action, outcome, context }) => 
      smartRecommendationsService.learnFromDriverAction(action, outcome, context),
    onSuccess: (data, variables) => {
      console.log('✅ Learned from driver action:', variables.action);
    },
    onError: (error, variables) => {
      console.error('❌ Behavioral learning failed:', error);
    }
  });
};

/**
 * Hook for recommendations initialization
 */
export const useRecommendationsInitialization = (driverId) => {
  return useMutation({
    mutationFn: () => smartRecommendationsService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Smart recommendations service initialized successfully');
    },
    onError: (error) => {
      console.error('❌ Recommendations initialization failed:', error);
    }
  });
};

/**
 * Hook for refreshing specific recommendations
 */
export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();

  const refreshPersonalized = (context) => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.personalized(context)
    });
  };

  const refreshRoute = (pickup, destination, options) => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.route(pickup, destination, options)
    });
  };

  const refreshPricing = (location, time, options) => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.pricing(location, time, options)
    });
  };

  const refreshMaintenance = (vehicleId, options) => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.maintenance(vehicleId, options)
    });
  };

  const refreshMarket = (location, time, options) => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.market(location, time, options)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.all
    });
  };

  return {
    refreshPersonalized,
    refreshRoute,
    refreshPricing,
    refreshMaintenance,
    refreshMarket,
    refreshAll,
  };
};

/**
 * Hook for recommendations cache management
 */
export const useRecommendationsCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: SMART_RECOMMENDATIONS_KEYS.all
    });
  };

  const clearPersonalizedCache = () => {
    queryClient.removeQueries({
      queryKey: [...SMART_RECOMMENDATIONS_KEYS.all, 'personalized']
    });
  };

  const clearRouteCache = () => {
    queryClient.removeQueries({
      queryKey: [...SMART_RECOMMENDATIONS_KEYS.all, 'route']
    });
  };

  const clearPricingCache = () => {
    queryClient.removeQueries({
      queryKey: [...SMART_RECOMMENDATIONS_KEYS.all, 'pricing']
    });
  };

  const clearMaintenanceCache = () => {
    queryClient.removeQueries({
      queryKey: [...SMART_RECOMMENDATIONS_KEYS.all, 'maintenance']
    });
  };

  const clearMarketCache = () => {
    queryClient.removeQueries({
      queryKey: [...SMART_RECOMMENDATIONS_KEYS.all, 'market']
    });
  };

  return {
    clearCache,
    clearPersonalizedCache,
    clearRouteCache,
    clearPricingCache,
    clearMaintenanceCache,
    clearMarketCache,
  };
};

/**
 * Hook for recommendations performance monitoring
 */
export const useRecommendationsPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const recommendationsQueries = cache.findAll({
      queryKey: SMART_RECOMMENDATIONS_KEYS.all
    });

    return {
      totalQueries: recommendationsQueries.length,
      staleQueries: recommendationsQueries.filter(q => q.isStale()).length,
      freshQueries: recommendationsQueries.filter(q => !q.isStale()).length,
      errorQueries: recommendationsQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const recommendationsQueries = cache.findAll({
      queryKey: SMART_RECOMMENDATIONS_KEYS.all
    });

    return recommendationsQueries.map(query => ({
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

/**
 * Hook for recommendation actions
 */
export const useRecommendationActions = () => {
  const queryClient = useQueryClient();
  const learnFromAction = useBehavioralLearning();

  const executeRecommendation = async (recommendation, action) => {
    try {
      // Execute the action
      console.log(`🎯 Executing recommendation: ${recommendation.title}`);
      
      // Learn from the action
      await learnFromAction.mutateAsync({
        action: action,
        outcome: 'positive', // Assume positive for now
        context: {
          recommendation: recommendation.title,
          type: recommendation.type,
          impact: recommendation.impact
        }
      });

      // Refresh related queries
      queryClient.invalidateQueries({
        queryKey: SMART_RECOMMENDATIONS_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to execute recommendation:', error);
      return { success: false, error };
    }
  };

  const dismissRecommendation = async (recommendation) => {
    try {
      // Learn from dismissal
      await learnFromAction.mutateAsync({
        action: 'dismiss',
        outcome: 'negative',
        context: {
          recommendation: recommendation.title,
          type: recommendation.type,
          impact: recommendation.impact
        }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to dismiss recommendation:', error);
      return { success: false, error };
    }
  };

  return {
    executeRecommendation,
    dismissRecommendation,
    isLearning: learnFromAction.isPending,
  };
};

export default {
  usePersonalizedRecommendations,
  useRouteRecommendations,
  usePricingRecommendations,
  useMaintenanceRecommendations,
  useMarketRecommendations,
  useComprehensiveRecommendations,
  useBehavioralLearning,
  useRecommendationsInitialization,
  useRefreshRecommendations,
  useRecommendationsCache,
  useRecommendationsPerformance,
  useRecommendationActions,
};
