/**
 * 🧠 DYNAMIC PRICING HOOKS
 * 
 * React Query hooks for AI-powered dynamic pricing
 * Provides intelligent rate optimization, competitive analysis, surge pricing, and revenue optimization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamicPricingService from '../../services/ai/dynamicPricingService';

// Query Keys
export const DYNAMIC_PRICING_KEYS = {
  all: ['dynamicPricing'],
  optimalPricing: (location, timeRange, context) => [...DYNAMIC_PRICING_KEYS.all, 'optimalPricing', location, timeRange, context],
  competitivePricing: (location, timeRange, competitors) => [...DYNAMIC_PRICING_KEYS.all, 'competitivePricing', location, timeRange, competitors],
  surgePricing: (location, timeRange, demandLevel) => [...DYNAMIC_PRICING_KEYS.all, 'surgePricing', location, timeRange, demandLevel],
  revenueOptimization: (location, timeRange, driverProfile) => [...DYNAMIC_PRICING_KEYS.all, 'revenueOptimization', location, timeRange, driverProfile],
  pricingStrategies: (location, timeRange, context) => [...DYNAMIC_PRICING_KEYS.all, 'pricingStrategies', location, timeRange, context],
  pricingTrends: (timeframe) => [...DYNAMIC_PRICING_KEYS.all, 'pricingTrends', timeframe],
  dashboard: (location, timeRange) => [...DYNAMIC_PRICING_KEYS.all, 'dashboard', location, timeRange],
};

/**
 * Hook for optimal pricing
 */
export const useOptimalPricing = (location, timeRange = '24h', context = {}, options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.optimalPricing(location, timeRange, context),
    queryFn: () => dynamicPricingService.getOptimalPricing(location, timeRange, context),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Optimal pricing query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for competitive pricing analysis
 */
export const useCompetitivePricing = (location, timeRange = '24h', competitors = [], options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.competitivePricing(location, timeRange, competitors),
    queryFn: () => dynamicPricingService.getCompetitivePricing(location, timeRange, competitors),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Competitive pricing query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for surge pricing
 */
export const useSurgePricing = (location, timeRange = '24h', demandLevel = 'medium', options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.surgePricing(location, timeRange, demandLevel),
    queryFn: () => dynamicPricingService.getSurgePricing(location, timeRange, demandLevel),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Surge pricing query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for revenue optimization
 */
export const useRevenueOptimization = (location, timeRange = '24h', driverProfile = {}, options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.revenueOptimization(location, timeRange, driverProfile),
    queryFn: () => dynamicPricingService.getRevenueOptimization(location, timeRange, driverProfile),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Revenue optimization query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for pricing strategy recommendations
 */
export const usePricingStrategyRecommendations = (location, timeRange = '24h', context = {}, options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.pricingStrategies(location, timeRange, context),
    queryFn: () => dynamicPricingService.getPricingStrategyRecommendations(location, timeRange, context),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Pricing strategy recommendations query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for pricing trends
 */
export const usePricingTrends = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.pricingTrends(timeframe),
    queryFn: () => dynamicPricingService.getPricingTrends(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Pricing trends query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for comprehensive dynamic pricing dashboard
 */
export const useDynamicPricingDashboard = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: DYNAMIC_PRICING_KEYS.dashboard(location, timeRange),
    queryFn: () => dynamicPricingService.getDynamicPricingDashboard(location, timeRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Dynamic pricing dashboard query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for dynamic pricing initialization
 */
export const useDynamicPricingInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => dynamicPricingService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Dynamic pricing service initialized');
    },
    onError: (error) => {
      console.error('❌ Dynamic pricing initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive dynamic pricing
 */
export const useComprehensiveDynamicPricing = (location, timeRange = '24h') => {
  const queryClient = useQueryClient();

  // Individual queries
  const optimalPricingQuery = useOptimalPricing(location, timeRange);
  const competitivePricingQuery = useCompetitivePricing(location, timeRange);
  const surgePricingQuery = useSurgePricing(location, timeRange);
  const revenueOptimizationQuery = useRevenueOptimization(location, timeRange);
  const strategiesQuery = usePricingStrategyRecommendations(location, timeRange);
  const trendsQuery = usePricingTrends('30d');
  const dashboardQuery = useDynamicPricingDashboard(location, timeRange);

  // Combined loading state
  const isLoading = optimalPricingQuery.isLoading || 
                   competitivePricingQuery.isLoading || 
                   surgePricingQuery.isLoading || 
                   revenueOptimizationQuery.isLoading || 
                   strategiesQuery.isLoading || 
                   trendsQuery.isLoading || 
                   dashboardQuery.isLoading;

  // Combined error state
  const hasError = optimalPricingQuery.isError || 
                  competitivePricingQuery.isError || 
                  surgePricingQuery.isError || 
                  revenueOptimizationQuery.isError || 
                  strategiesQuery.isError || 
                  trendsQuery.isError || 
                  dashboardQuery.isError;

  // Combined data
  const data = {
    optimalPricing: optimalPricingQuery.data,
    competitivePricing: competitivePricingQuery.data,
    surgePricing: surgePricingQuery.data,
    revenueOptimization: revenueOptimizationQuery.data,
    strategies: strategiesQuery.data,
    trends: trendsQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    errors: {
      optimalPricing: optimalPricingQuery.error,
      competitivePricing: competitivePricingQuery.error,
      surgePricing: surgePricingQuery.error,
      revenueOptimization: revenueOptimizationQuery.error,
      strategies: strategiesQuery.error,
      trends: trendsQuery.error,
      dashboard: dashboardQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    optimalPricingQuery,
    competitivePricingQuery,
    surgePricingQuery,
    revenueOptimizationQuery,
    strategiesQuery,
    trendsQuery,
    dashboardQuery,
  };
};

/**
 * Hook for dynamic pricing analytics
 */
export const useDynamicPricingAnalytics = (location, timeRange = '24h') => {
  const { data: dashboard, isLoading, error } = useDynamicPricingDashboard(location, timeRange);

  const analytics = {
    optimalRate: dashboard?.optimalPricing?.optimalRate || 0,
    pricingLevel: getPricingLevel(dashboard?.optimalPricing?.optimalRate || 0),
    competitiveAdvantage: dashboard?.competitivePricing?.competitiveAdvantage || 0,
    marketPosition: dashboard?.competitivePricing?.marketPosition || 'unknown',
    surgeMultiplier: dashboard?.surgePricing?.surgeMultiplier || 1.0,
    earningsIncrease: dashboard?.revenueOptimization?.earningsIncrease?.percentage || 0,
    totalStrategies: dashboard?.strategies?.totalStrategies || 0,
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
 * Hook for dynamic pricing performance
 */
export const useDynamicPricingPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const pricingQueries = cache.findAll({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });

    return {
      totalQueries: pricingQueries.length,
      staleQueries: pricingQueries.filter(q => q.isStale()).length,
      freshQueries: pricingQueries.filter(q => !q.isStale()).length,
      errorQueries: pricingQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const pricingQueries = cache.findAll({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });

    return pricingQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getPricingMetrics = () => {
    const cache = queryClient.getQueryCache();
    const pricingQueries = cache.findAll({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });

    const metrics = {
      totalQueries: pricingQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (pricingQueries.length > 0) {
      const staleTimes = pricingQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = pricingQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / pricingQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getPricingMetrics,
  };
};

/**
 * Hook for dynamic pricing actions
 */
export const useDynamicPricingActions = () => {
  const queryClient = useQueryClient();

  const updatePricingData = async (location, timeRange, newData) => {
    try {
      // This would typically update the dynamic pricing service
      console.log('💰 Updating pricing data:', { location, timeRange, newData });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: DYNAMIC_PRICING_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update pricing data:', error);
      return { success: false, error };
    }
  };

  const refreshPricingData = async (location, timeRange) => {
    try {
      // Force refresh of pricing data
      queryClient.invalidateQueries({
        queryKey: DYNAMIC_PRICING_KEYS.dashboard(location, timeRange)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to refresh pricing data:', error);
      return { success: false, error };
    }
  };

  const clearPricingCache = async () => {
    try {
      // Clear all dynamic pricing cache
      queryClient.removeQueries({
        queryKey: DYNAMIC_PRICING_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear pricing cache:', error);
      return { success: false, error };
    }
  };

  return {
    updatePricingData,
    refreshPricingData,
    clearPricingCache,
  };
};

/**
 * Hook for dynamic pricing cache management
 */
export const useDynamicPricingCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });
  };

  const clearOptimalPricingCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'optimalPricing']
    });
  };

  const clearCompetitivePricingCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'competitivePricing']
    });
  };

  const clearSurgePricingCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'surgePricing']
    });
  };

  const clearRevenueOptimizationCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'revenueOptimization']
    });
  };

  const clearStrategiesCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'pricingStrategies']
    });
  };

  const clearTrendsCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'pricingTrends']
    });
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({
      queryKey: [...DYNAMIC_PRICING_KEYS.all, 'dashboard']
    });
  };

  return {
    clearCache,
    clearOptimalPricingCache,
    clearCompetitivePricingCache,
    clearSurgePricingCache,
    clearRevenueOptimizationCache,
    clearStrategiesCache,
    clearTrendsCache,
    clearDashboardCache,
  };
};

/**
 * Hook for dynamic pricing refresh
 */
export const useDynamicPricingRefresh = () => {
  const queryClient = useQueryClient();

  const refreshOptimalPricing = (location, timeRange, context) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.optimalPricing(location, timeRange, context)
    });
  };

  const refreshCompetitivePricing = (location, timeRange, competitors) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.competitivePricing(location, timeRange, competitors)
    });
  };

  const refreshSurgePricing = (location, timeRange, demandLevel) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.surgePricing(location, timeRange, demandLevel)
    });
  };

  const refreshRevenueOptimization = (location, timeRange, driverProfile) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.revenueOptimization(location, timeRange, driverProfile)
    });
  };

  const refreshStrategies = (location, timeRange, context) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.pricingStrategies(location, timeRange, context)
    });
  };

  const refreshTrends = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.pricingTrends(timeframe)
    });
  };

  const refreshDashboard = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.dashboard(location, timeRange)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: DYNAMIC_PRICING_KEYS.all
    });
  };

  return {
    refreshOptimalPricing,
    refreshCompetitivePricing,
    refreshSurgePricing,
    refreshRevenueOptimization,
    refreshStrategies,
    refreshTrends,
    refreshDashboard,
    refreshAll,
  };
};

// Helper function
const getPricingLevel = (rate) => {
  if (rate >= 4.0) return 'Premium';
  if (rate >= 3.0) return 'High';
  if (rate >= 2.0) return 'Medium';
  return 'Low';
};

export default {
  useOptimalPricing,
  useCompetitivePricing,
  useSurgePricing,
  useRevenueOptimization,
  usePricingStrategyRecommendations,
  usePricingTrends,
  useDynamicPricingDashboard,
  useDynamicPricingInitialization,
  useComprehensiveDynamicPricing,
  useDynamicPricingAnalytics,
  useDynamicPricingPerformance,
  useDynamicPricingActions,
  useDynamicPricingCache,
  useDynamicPricingRefresh,
};
