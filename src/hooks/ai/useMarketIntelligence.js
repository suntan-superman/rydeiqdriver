/**
 * 🧠 MARKET INTELLIGENCE HOOKS
 * 
 * React Query hooks for AI-powered market intelligence
 * Provides competitor analysis, opportunity detection, trend analysis, and growth recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketIntelligenceService from '../../services/ai/marketIntelligenceService';

// Query Keys
export const MARKET_INTELLIGENCE_KEYS = {
  all: ['marketIntelligence'],
  competitors: (location, timeRange) => [...MARKET_INTELLIGENCE_KEYS.all, 'competitors', location, timeRange],
  opportunities: (location, timeRange) => [...MARKET_INTELLIGENCE_KEYS.all, 'opportunities', location, timeRange],
  trends: (timeframe) => [...MARKET_INTELLIGENCE_KEYS.all, 'trends', timeframe],
  growth: (context) => [...MARKET_INTELLIGENCE_KEYS.all, 'growth', context],
  positioning: (location, timeRange) => [...MARKET_INTELLIGENCE_KEYS.all, 'positioning', location, timeRange],
  advantages: (location, timeRange) => [...MARKET_INTELLIGENCE_KEYS.all, 'advantages', location, timeRange],
  dashboard: (location, timeRange) => [...MARKET_INTELLIGENCE_KEYS.all, 'dashboard', location, timeRange],
};

/**
 * Hook for competitor analysis
 */
export const useCompetitorAnalysis = (location, timeRange = '1h', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.competitors(location, timeRange),
    queryFn: () => marketIntelligenceService.getCompetitorAnalysis(location, timeRange),
    staleTime: 1 * 60 * 1000, // 1 minute for real-time data
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && location.lat && location.lng),
    onError: (error) => {
      console.error('❌ Competitor analysis query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for market opportunities
 */
export const useMarketOpportunities = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.opportunities(location, timeRange),
    queryFn: () => marketIntelligenceService.getMarketOpportunities(location, timeRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && location.lat && location.lng),
    onError: (error) => {
      console.error('❌ Market opportunities query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for market trends
 */
export const useMarketTrends = (timeframe = '7d', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.trends(timeframe),
    queryFn: () => marketIntelligenceService.getMarketTrends(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Market trends query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for growth recommendations
 */
export const useGrowthRecommendations = (context = {}, options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.growth(context),
    queryFn: () => marketIntelligenceService.getGrowthRecommendations(context),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Growth recommendations query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for market positioning
 */
export const useMarketPositioning = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.positioning(location, timeRange),
    queryFn: () => marketIntelligenceService.getMarketPositioning(location, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && location.lat && location.lng),
    onError: (error) => {
      console.error('❌ Market positioning query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for competitive advantages
 */
export const useCompetitiveAdvantages = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.advantages(location, timeRange),
    queryFn: () => marketIntelligenceService.getCompetitiveAdvantages(location, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && location.lat && location.lng),
    onError: (error) => {
      console.error('❌ Competitive advantages query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for comprehensive market intelligence dashboard
 */
export const useMarketIntelligenceDashboard = (location, timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: MARKET_INTELLIGENCE_KEYS.dashboard(location, timeRange),
    queryFn: () => marketIntelligenceService.getMarketIntelligenceDashboard(location, timeRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!(location && location.lat && location.lng),
    onError: (error) => {
      console.error('❌ Market intelligence dashboard query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for market intelligence initialization
 */
export const useMarketIntelligenceInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => marketIntelligenceService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Market intelligence service initialized');
    },
    onError: (error) => {
      console.error('❌ Market intelligence initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive market intelligence
 */
export const useComprehensiveMarketIntelligence = (location, timeRange = '24h') => {
  const queryClient = useQueryClient();

  // Individual queries
  const competitorQuery = useCompetitorAnalysis(location, timeRange);
  const opportunitiesQuery = useMarketOpportunities(location, timeRange);
  const trendsQuery = useMarketTrends('7d');
  const growthQuery = useGrowthRecommendations();
  const positioningQuery = useMarketPositioning(location, timeRange);
  const advantagesQuery = useCompetitiveAdvantages(location, timeRange);
  const dashboardQuery = useMarketIntelligenceDashboard(location, timeRange);

  // Combined loading state
  const isLoading = competitorQuery.isLoading || 
                   opportunitiesQuery.isLoading || 
                   trendsQuery.isLoading || 
                   growthQuery.isLoading || 
                   positioningQuery.isLoading || 
                   advantagesQuery.isLoading || 
                   dashboardQuery.isLoading;

  // Combined error state
  const hasError = competitorQuery.isError || 
                  opportunitiesQuery.isError || 
                  trendsQuery.isError || 
                  growthQuery.isError || 
                  positioningQuery.isError || 
                  advantagesQuery.isError || 
                  dashboardQuery.isError;

  // Combined data
  const data = {
    competitors: competitorQuery.data,
    opportunities: opportunitiesQuery.data,
    trends: trendsQuery.data,
    growth: growthQuery.data,
    positioning: positioningQuery.data,
    advantages: advantagesQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    errors: {
      competitors: competitorQuery.error,
      opportunities: opportunitiesQuery.error,
      trends: trendsQuery.error,
      growth: growthQuery.error,
      positioning: positioningQuery.error,
      advantages: advantagesQuery.error,
      dashboard: dashboardQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    competitorQuery,
    opportunitiesQuery,
    trendsQuery,
    growthQuery,
    positioningQuery,
    advantagesQuery,
    dashboardQuery,
  };
};

/**
 * Hook for market intelligence analytics
 */
export const useMarketIntelligenceAnalytics = (location, timeRange = '24h') => {
  const { data: dashboard, isLoading, error } = useMarketIntelligenceDashboard(location, timeRange);

  const analytics = {
    dataQuality: dashboard?.dataQuality || 0,
    totalOpportunities: dashboard?.opportunities?.totalOpportunities || 0,
    highValueOpportunities: dashboard?.opportunities?.highValueOpportunities || 0,
    marketSaturation: dashboard?.competitorAnalysis?.marketSaturation || 0,
    competitiveIntensity: dashboard?.competitorAnalysis?.competitiveIntensity || 0,
    marketPosition: dashboard?.positioning?.marketPosition || 'Unknown',
    marketShare: dashboard?.positioning?.marketShare || 0,
    totalAdvantages: dashboard?.advantages?.totalAdvantages || 0,
    sustainableAdvantages: dashboard?.advantages?.sustainableAdvantages || 0,
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
 * Hook for market intelligence performance
 */
export const useMarketIntelligencePerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const intelligenceQueries = cache.findAll({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });

    return {
      totalQueries: intelligenceQueries.length,
      staleQueries: intelligenceQueries.filter(q => q.isStale()).length,
      freshQueries: intelligenceQueries.filter(q => !q.isStale()).length,
      errorQueries: intelligenceQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const intelligenceQueries = cache.findAll({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });

    return intelligenceQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getIntelligenceMetrics = () => {
    const cache = queryClient.getQueryCache();
    const intelligenceQueries = cache.findAll({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });

    const metrics = {
      totalQueries: intelligenceQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (intelligenceQueries.length > 0) {
      const staleTimes = intelligenceQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = intelligenceQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / intelligenceQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getIntelligenceMetrics,
  };
};

/**
 * Hook for market intelligence actions
 */
export const useMarketIntelligenceActions = () => {
  const queryClient = useQueryClient();

  const updateMarketData = async (location, timeRange, newData) => {
    try {
      // This would typically update the market intelligence service
      console.log('📊 Updating market data:', { location, timeRange, newData });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: MARKET_INTELLIGENCE_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update market data:', error);
      return { success: false, error };
    }
  };

  const refreshMarketData = async (location, timeRange) => {
    try {
      // Force refresh of market data
      queryClient.invalidateQueries({
        queryKey: MARKET_INTELLIGENCE_KEYS.dashboard(location, timeRange)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to refresh market data:', error);
      return { success: false, error };
    }
  };

  const clearMarketCache = async () => {
    try {
      // Clear all market intelligence cache
      queryClient.removeQueries({
        queryKey: MARKET_INTELLIGENCE_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear market cache:', error);
      return { success: false, error };
    }
  };

  return {
    updateMarketData,
    refreshMarketData,
    clearMarketCache,
  };
};

/**
 * Hook for market intelligence cache management
 */
export const useMarketIntelligenceCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });
  };

  const clearCompetitorCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'competitors']
    });
  };

  const clearOpportunitiesCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'opportunities']
    });
  };

  const clearTrendsCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'trends']
    });
  };

  const clearGrowthCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'growth']
    });
  };

  const clearPositioningCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'positioning']
    });
  };

  const clearAdvantagesCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'advantages']
    });
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({
      queryKey: [...MARKET_INTELLIGENCE_KEYS.all, 'dashboard']
    });
  };

  return {
    clearCache,
    clearCompetitorCache,
    clearOpportunitiesCache,
    clearTrendsCache,
    clearGrowthCache,
    clearPositioningCache,
    clearAdvantagesCache,
    clearDashboardCache,
  };
};

/**
 * Hook for market intelligence refresh
 */
export const useMarketIntelligenceRefresh = () => {
  const queryClient = useQueryClient();

  const refreshCompetitors = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.competitors(location, timeRange)
    });
  };

  const refreshOpportunities = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.opportunities(location, timeRange)
    });
  };

  const refreshTrends = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.trends(timeframe)
    });
  };

  const refreshGrowth = (context) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.growth(context)
    });
  };

  const refreshPositioning = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.positioning(location, timeRange)
    });
  };

  const refreshAdvantages = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.advantages(location, timeRange)
    });
  };

  const refreshDashboard = (location, timeRange) => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.dashboard(location, timeRange)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: MARKET_INTELLIGENCE_KEYS.all
    });
  };

  return {
    refreshCompetitors,
    refreshOpportunities,
    refreshTrends,
    refreshGrowth,
    refreshPositioning,
    refreshAdvantages,
    refreshDashboard,
    refreshAll,
  };
};

export default {
  useCompetitorAnalysis,
  useMarketOpportunities,
  useMarketTrends,
  useGrowthRecommendations,
  useMarketPositioning,
  useCompetitiveAdvantages,
  useMarketIntelligenceDashboard,
  useMarketIntelligenceInitialization,
  useComprehensiveMarketIntelligence,
  useMarketIntelligenceAnalytics,
  useMarketIntelligencePerformance,
  useMarketIntelligenceActions,
  useMarketIntelligenceCache,
  useMarketIntelligenceRefresh,
};
