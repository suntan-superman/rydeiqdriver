/**
 * 🧠 RISK ASSESSMENT HOOKS
 * 
 * React Query hooks for AI-powered risk assessment
 * Provides safety scoring, reliability analysis, risk mitigation, and incident analysis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import riskAssessmentService from '../../services/ai/riskAssessmentService';

// Query Keys
export const RISK_ASSESSMENT_KEYS = {
  all: ['riskAssessment'],
  safetyScore: (context) => [...RISK_ASSESSMENT_KEYS.all, 'safetyScore', context],
  reliability: (timeframe) => [...RISK_ASSESSMENT_KEYS.all, 'reliability', timeframe],
  mitigation: (context) => [...RISK_ASSESSMENT_KEYS.all, 'mitigation', context],
  safetyRecommendations: (context) => [...RISK_ASSESSMENT_KEYS.all, 'safetyRecommendations', context],
  riskTrends: (timeframe) => [...RISK_ASSESSMENT_KEYS.all, 'riskTrends', timeframe],
  incidents: (timeframe) => [...RISK_ASSESSMENT_KEYS.all, 'incidents', timeframe],
  dashboard: (context) => [...RISK_ASSESSMENT_KEYS.all, 'dashboard', context],
};

/**
 * Hook for safety score
 */
export const useSafetyScore = (context = {}, options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.safetyScore(context),
    queryFn: () => riskAssessmentService.getSafetyScore(context),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Safety score query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for reliability analysis
 */
export const useReliabilityAnalysis = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.reliability(timeframe),
    queryFn: () => riskAssessmentService.getReliabilityAnalysis(timeframe),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Reliability analysis query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for risk mitigation strategies
 */
export const useRiskMitigationStrategies = (context = {}, options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.mitigation(context),
    queryFn: () => riskAssessmentService.getRiskMitigationStrategies(context),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 60 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Risk mitigation strategies query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for safety recommendations
 */
export const useSafetyRecommendations = (context = {}, options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.safetyRecommendations(context),
    queryFn: () => riskAssessmentService.getSafetyRecommendations(context),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Safety recommendations query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for risk trends
 */
export const useRiskTrends = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.riskTrends(timeframe),
    queryFn: () => riskAssessmentService.getRiskTrends(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Risk trends query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for incident analysis
 */
export const useIncidentAnalysis = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.incidents(timeframe),
    queryFn: () => riskAssessmentService.getIncidentAnalysis(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Incident analysis query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for comprehensive risk assessment dashboard
 */
export const useRiskAssessmentDashboard = (context = {}, options = {}) => {
  return useQuery({
    queryKey: RISK_ASSESSMENT_KEYS.dashboard(context),
    queryFn: () => riskAssessmentService.getRiskAssessmentDashboard(context),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Risk assessment dashboard query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for risk assessment initialization
 */
export const useRiskAssessmentInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => riskAssessmentService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Risk assessment service initialized');
    },
    onError: (error) => {
      console.error('❌ Risk assessment initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive risk assessment
 */
export const useComprehensiveRiskAssessment = (context = {}) => {
  const queryClient = useQueryClient();

  // Individual queries
  const safetyScoreQuery = useSafetyScore(context);
  const reliabilityQuery = useReliabilityAnalysis('30d');
  const mitigationQuery = useRiskMitigationStrategies(context);
  const recommendationsQuery = useSafetyRecommendations(context);
  const trendsQuery = useRiskTrends('30d');
  const incidentsQuery = useIncidentAnalysis('30d');
  const dashboardQuery = useRiskAssessmentDashboard(context);

  // Combined loading state
  const isLoading = safetyScoreQuery.isLoading || 
                   reliabilityQuery.isLoading || 
                   mitigationQuery.isLoading || 
                   recommendationsQuery.isLoading || 
                   trendsQuery.isLoading || 
                   incidentsQuery.isLoading || 
                   dashboardQuery.isLoading;

  // Combined error state
  const hasError = safetyScoreQuery.isError || 
                  reliabilityQuery.isError || 
                  mitigationQuery.isError || 
                  recommendationsQuery.isError || 
                  trendsQuery.isError || 
                  incidentsQuery.isError || 
                  dashboardQuery.isError;

  // Combined data
  const data = {
    safetyScore: safetyScoreQuery.data,
    reliability: reliabilityQuery.data,
    mitigation: mitigationQuery.data,
    recommendations: recommendationsQuery.data,
    trends: trendsQuery.data,
    incidents: incidentsQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    errors: {
      safetyScore: safetyScoreQuery.error,
      reliability: reliabilityQuery.error,
      mitigation: mitigationQuery.error,
      recommendations: recommendationsQuery.error,
      trends: trendsQuery.error,
      incidents: incidentsQuery.error,
      dashboard: dashboardQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    safetyScoreQuery,
    reliabilityQuery,
    mitigationQuery,
    recommendationsQuery,
    trendsQuery,
    incidentsQuery,
    dashboardQuery,
  };
};

/**
 * Hook for risk assessment analytics
 */
export const useRiskAssessmentAnalytics = (context = {}) => {
  const { data: dashboard, isLoading, error } = useRiskAssessmentDashboard(context);

  const analytics = {
    safetyScore: dashboard?.safetyScore?.overallScore || 0,
    riskLevel: dashboard?.safetyScore?.riskLevel || 'Unknown',
    reliabilityScore: dashboard?.reliability?.overallReliability || 0,
    reliabilityLevel: dashboard?.reliability?.reliabilityLevel || 'Unknown',
    totalIncidents: dashboard?.incidentAnalysis?.analysis?.totalIncidents || 0,
    highImpactStrategies: dashboard?.mitigationStrategies?.highImpactStrategies || 0,
    totalRecommendations: dashboard?.safetyRecommendations?.totalRecommendations || 0,
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
 * Hook for risk assessment performance
 */
export const useRiskAssessmentPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const riskQueries = cache.findAll({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });

    return {
      totalQueries: riskQueries.length,
      staleQueries: riskQueries.filter(q => q.isStale()).length,
      freshQueries: riskQueries.filter(q => !q.isStale()).length,
      errorQueries: riskQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const riskQueries = cache.findAll({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });

    return riskQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getRiskMetrics = () => {
    const cache = queryClient.getQueryCache();
    const riskQueries = cache.findAll({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });

    const metrics = {
      totalQueries: riskQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (riskQueries.length > 0) {
      const staleTimes = riskQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = riskQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / riskQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getRiskMetrics,
  };
};

/**
 * Hook for risk assessment actions
 */
export const useRiskAssessmentActions = () => {
  const queryClient = useQueryClient();

  const updateRiskData = async (context, newData) => {
    try {
      // This would typically update the risk assessment service
      console.log('📊 Updating risk data:', { context, newData });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: RISK_ASSESSMENT_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update risk data:', error);
      return { success: false, error };
    }
  };

  const refreshRiskData = async (context) => {
    try {
      // Force refresh of risk data
      queryClient.invalidateQueries({
        queryKey: RISK_ASSESSMENT_KEYS.dashboard(context)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to refresh risk data:', error);
      return { success: false, error };
    }
  };

  const clearRiskCache = async () => {
    try {
      // Clear all risk assessment cache
      queryClient.removeQueries({
        queryKey: RISK_ASSESSMENT_KEYS.all
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear risk cache:', error);
      return { success: false, error };
    }
  };

  return {
    updateRiskData,
    refreshRiskData,
    clearRiskCache,
  };
};

/**
 * Hook for risk assessment cache management
 */
export const useRiskAssessmentCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });
  };

  const clearSafetyScoreCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'safetyScore']
    });
  };

  const clearReliabilityCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'reliability']
    });
  };

  const clearMitigationCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'mitigation']
    });
  };

  const clearRecommendationsCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'safetyRecommendations']
    });
  };

  const clearTrendsCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'riskTrends']
    });
  };

  const clearIncidentsCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'incidents']
    });
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({
      queryKey: [...RISK_ASSESSMENT_KEYS.all, 'dashboard']
    });
  };

  return {
    clearCache,
    clearSafetyScoreCache,
    clearReliabilityCache,
    clearMitigationCache,
    clearRecommendationsCache,
    clearTrendsCache,
    clearIncidentsCache,
    clearDashboardCache,
  };
};

/**
 * Hook for risk assessment refresh
 */
export const useRiskAssessmentRefresh = () => {
  const queryClient = useQueryClient();

  const refreshSafetyScore = (context) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.safetyScore(context)
    });
  };

  const refreshReliability = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.reliability(timeframe)
    });
  };

  const refreshMitigation = (context) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.mitigation(context)
    });
  };

  const refreshRecommendations = (context) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.safetyRecommendations(context)
    });
  };

  const refreshTrends = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.riskTrends(timeframe)
    });
  };

  const refreshIncidents = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.incidents(timeframe)
    });
  };

  const refreshDashboard = (context) => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.dashboard(context)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: RISK_ASSESSMENT_KEYS.all
    });
  };

  return {
    refreshSafetyScore,
    refreshReliability,
    refreshMitigation,
    refreshRecommendations,
    refreshTrends,
    refreshIncidents,
    refreshDashboard,
    refreshAll,
  };
};

export default {
  useSafetyScore,
  useReliabilityAnalysis,
  useRiskMitigationStrategies,
  useSafetyRecommendations,
  useRiskTrends,
  useIncidentAnalysis,
  useRiskAssessmentDashboard,
  useRiskAssessmentInitialization,
  useComprehensiveRiskAssessment,
  useRiskAssessmentAnalytics,
  useRiskAssessmentPerformance,
  useRiskAssessmentActions,
  useRiskAssessmentCache,
  useRiskAssessmentRefresh,
};
