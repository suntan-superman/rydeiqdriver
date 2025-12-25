/**
 * 🧠 BEHAVIORAL LEARNING HOOKS
 * 
 * React Query hooks for AI-powered behavioral learning
 * Provides deep learning, personalization, and adaptive recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import behavioralLearningService from '../../services/ai/behavioralLearningService';

// Query Keys
export const BEHAVIORAL_LEARNING_KEYS = {
  all: ['behavioralLearning'],
  insights: (timeframe) => [...BEHAVIORAL_LEARNING_KEYS.all, 'insights', timeframe],
  uiPreferences: (driverId) => [...BEHAVIORAL_LEARNING_KEYS.all, 'uiPreferences', driverId],
  adaptiveRecommendations: (context) => [...BEHAVIORAL_LEARNING_KEYS.all, 'adaptiveRecommendations', context],
  successPrediction: (recommendation, context) => [...BEHAVIORAL_LEARNING_KEYS.all, 'successPrediction', recommendation, context],
  learningProgress: (driverId) => [...BEHAVIORAL_LEARNING_KEYS.all, 'learningProgress', driverId],
  behavioralPatterns: (timeframe) => [...BEHAVIORAL_LEARNING_KEYS.all, 'patterns', timeframe],
};

/**
 * Hook for behavioral insights
 */
export const useBehavioralInsights = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.insights(timeframe),
    queryFn: () => behavioralLearningService.getBehavioralInsights(timeframe),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Behavioral insights query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for UI preferences
 */
export const useUIPreferences = (driverId, options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.uiPreferences(driverId),
    queryFn: () => behavioralLearningService.getPersonalizedUIPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!driverId,
    onError: (error) => {
      console.error('❌ UI preferences query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for adaptive recommendations
 */
export const useAdaptiveRecommendations = (context = {}, options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.adaptiveRecommendations(context),
    queryFn: () => behavioralLearningService.getAdaptiveRecommendations(context),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Adaptive recommendations query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for success prediction
 */
export const useSuccessPrediction = (recommendation, context = {}, options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.successPrediction(recommendation, context),
    queryFn: () => behavioralLearningService.predictRecommendationSuccess(recommendation, context),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!recommendation,
    onError: (error) => {
      console.error('❌ Success prediction query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for learning progress
 */
export const useLearningProgress = (driverId, options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.learningProgress(driverId),
    queryFn: () => behavioralLearningService.getLearningProgress(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    enabled: !!driverId,
    onError: (error) => {
      console.error('❌ Learning progress query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for behavioral patterns
 */
export const useBehavioralPatterns = (timeframe = '30d', options = {}) => {
  return useQuery({
    queryKey: BEHAVIORAL_LEARNING_KEYS.behavioralPatterns(timeframe),
    queryFn: () => behavioralLearningService.getBehavioralInsights(timeframe),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('❌ Behavioral patterns query failed:', error);
    },
    ...options
  });
};

/**
 * Hook for learning from actions
 */
export const useLearnFromAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, outcome, context }) => 
      behavioralLearningService.learnFromAction(action, outcome, context),
    onSuccess: (data, variables) => {
      console.log('✅ Learned from action:', variables.action);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: BEHAVIORAL_LEARNING_KEYS.all
      });
    },
    onError: (error, variables) => {
      console.error('❌ Failed to learn from action:', error);
    }
  });
};

/**
 * Hook for behavioral learning initialization
 */
export const useBehavioralLearningInitialization = () => {
  return useMutation({
    mutationFn: (driverId) => behavioralLearningService.initialize(driverId),
    onSuccess: () => {
      console.log('✅ Behavioral learning service initialized');
    },
    onError: (error) => {
      console.error('❌ Behavioral learning initialization failed:', error);
    }
  });
};

/**
 * Hook for comprehensive behavioral learning
 */
export const useComprehensiveBehavioralLearning = (driverId, context = {}) => {
  const queryClient = useQueryClient();

  // Individual queries
  const insightsQuery = useBehavioralInsights('30d');
  const uiPreferencesQuery = useUIPreferences(driverId);
  const adaptiveRecommendationsQuery = useAdaptiveRecommendations(context);
  const learningProgressQuery = useLearningProgress(driverId);
  const patternsQuery = useBehavioralPatterns('30d');

  // Combined loading state
  const isLoading = insightsQuery.isLoading || 
                   uiPreferencesQuery.isLoading || 
                   adaptiveRecommendationsQuery.isLoading || 
                   learningProgressQuery.isLoading || 
                   patternsQuery.isLoading;

  // Combined error state
  const hasError = insightsQuery.isError || 
                  uiPreferencesQuery.isError || 
                  adaptiveRecommendationsQuery.isError || 
                  learningProgressQuery.isError || 
                  patternsQuery.isError;

  // Combined data
  const data = {
    insights: insightsQuery.data,
    uiPreferences: uiPreferencesQuery.data,
    adaptiveRecommendations: adaptiveRecommendationsQuery.data,
    learningProgress: learningProgressQuery.data,
    patterns: patternsQuery.data,
    isLoading,
    hasError,
    errors: {
      insights: insightsQuery.error,
      uiPreferences: uiPreferencesQuery.error,
      adaptiveRecommendations: adaptiveRecommendationsQuery.error,
      learningProgress: learningProgressQuery.error,
      patterns: patternsQuery.error,
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });
  };

  return {
    ...data,
    refreshAll,
    // Individual query states
    insightsQuery,
    uiPreferencesQuery,
    adaptiveRecommendationsQuery,
    learningProgressQuery,
    patternsQuery,
  };
};

/**
 * Hook for behavioral learning analytics
 */
export const useBehavioralLearningAnalytics = (driverId) => {
  const { data: insights, isLoading, error } = useBehavioralInsights('30d');
  const { data: progress } = useLearningProgress(driverId);

  const analytics = {
    learningConfidence: insights?.confidence || 0,
    personalizationScore: progress?.personalizationScore || 0,
    adaptationLevel: progress?.adaptationLevel || 'Beginner',
    totalActions: progress?.totalActions || 0,
    patternsIdentified: insights?.patterns ? Object.keys(insights.patterns).length : 0,
    strengths: insights?.strengths || [],
    improvements: insights?.improvements || [],
    trends: insights?.trends || {},
    recommendations: insights?.recommendations || [],
  };

  return {
    analytics,
    isLoading,
    error,
    insights,
    progress
  };
};

/**
 * Hook for behavioral learning performance
 */
export const useBehavioralLearningPerformance = () => {
  const queryClient = useQueryClient();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const learningQueries = cache.findAll({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });

    return {
      totalQueries: learningQueries.length,
      staleQueries: learningQueries.filter(q => q.isStale()).length,
      freshQueries: learningQueries.filter(q => !q.isStale()).length,
      errorQueries: learningQueries.filter(q => q.state.status === 'error').length,
    };
  };

  const getQueryTimes = () => {
    const cache = queryClient.getQueryCache();
    const learningQueries = cache.findAll({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });

    return learningQueries.map(query => ({
      queryKey: query.queryKey,
      fetchTime: query.state.dataUpdatedAt - query.state.dataUpdatedAt,
      staleTime: query.state.dataUpdatedAt + (query.options.staleTime || 0),
      isStale: query.isStale(),
    }));
  };

  const getLearningMetrics = () => {
    const cache = queryClient.getQueryCache();
    const learningQueries = cache.findAll({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });

    const metrics = {
      totalQueries: learningQueries.length,
      averageStaleTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    if (learningQueries.length > 0) {
      const staleTimes = learningQueries.map(q => q.options.staleTime || 0);
      metrics.averageStaleTime = staleTimes.reduce((sum, time) => sum + time, 0) / staleTimes.length;
      
      const errorQueries = learningQueries.filter(q => q.state.status === 'error');
      metrics.errorRate = errorQueries.length / learningQueries.length;
    }

    return metrics;
  };

  return {
    getCacheStats,
    getQueryTimes,
    getLearningMetrics,
  };
};

/**
 * Hook for behavioral learning actions
 */
export const useBehavioralLearningActions = () => {
  const queryClient = useQueryClient();
  const learnFromAction = useLearnFromAction();

  const executeLearningAction = async (action, outcome, context) => {
    try {
      const result = await learnFromAction.mutateAsync({
        action,
        outcome,
        context
      });

      if (result.success) {
        // Refresh related queries
        queryClient.invalidateQueries({
          queryKey: BEHAVIORAL_LEARNING_KEYS.all
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to execute learning action:', error);
      return { success: false, error };
    }
  };

  const updateLearningPreferences = async (preferences) => {
    try {
      // This would typically update the learning service preferences
      console.log('📝 Updating learning preferences:', preferences);
      
      // Invalidate UI preferences query
      queryClient.invalidateQueries({
        queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'uiPreferences']
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update learning preferences:', error);
      return { success: false, error };
    }
  };

  const resetLearningData = async () => {
    try {
      // Clear all behavioral learning cache
      queryClient.removeQueries({
        queryKey: BEHAVIORAL_LEARNING_KEYS.all
      });

      // Reinitialize the service
      // This would typically call a reset method on the service
      console.log('🔄 Resetting behavioral learning data');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to reset learning data:', error);
      return { success: false, error };
    }
  };

  return {
    executeLearningAction,
    updateLearningPreferences,
    resetLearningData,
    isLearning: learnFromAction.isPending,
  };
};

/**
 * Hook for behavioral learning cache management
 */
export const useBehavioralLearningCache = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });
  };

  const clearInsightsCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'insights']
    });
  };

  const clearUIPreferencesCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'uiPreferences']
    });
  };

  const clearAdaptiveRecommendationsCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'adaptiveRecommendations']
    });
  };

  const clearSuccessPredictionCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'successPrediction']
    });
  };

  const clearLearningProgressCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'learningProgress']
    });
  };

  const clearPatternsCache = () => {
    queryClient.removeQueries({
      queryKey: [...BEHAVIORAL_LEARNING_KEYS.all, 'patterns']
    });
  };

  return {
    clearCache,
    clearInsightsCache,
    clearUIPreferencesCache,
    clearAdaptiveRecommendationsCache,
    clearSuccessPredictionCache,
    clearLearningProgressCache,
    clearPatternsCache,
  };
};

/**
 * Hook for behavioral learning refresh
 */
export const useBehavioralLearningRefresh = () => {
  const queryClient = useQueryClient();

  const refreshInsights = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.insights(timeframe)
    });
  };

  const refreshUIPreferences = (driverId) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.uiPreferences(driverId)
    });
  };

  const refreshAdaptiveRecommendations = (context) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.adaptiveRecommendations(context)
    });
  };

  const refreshSuccessPrediction = (recommendation, context) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.successPrediction(recommendation, context)
    });
  };

  const refreshLearningProgress = (driverId) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.learningProgress(driverId)
    });
  };

  const refreshPatterns = (timeframe) => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.behavioralPatterns(timeframe)
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: BEHAVIORAL_LEARNING_KEYS.all
    });
  };

  return {
    refreshInsights,
    refreshUIPreferences,
    refreshAdaptiveRecommendations,
    refreshSuccessPrediction,
    refreshLearningProgress,
    refreshPatterns,
    refreshAll,
  };
};

export default {
  useBehavioralInsights,
  useUIPreferences,
  useAdaptiveRecommendations,
  useSuccessPrediction,
  useLearningProgress,
  useBehavioralPatterns,
  useLearnFromAction,
  useBehavioralLearningInitialization,
  useComprehensiveBehavioralLearning,
  useBehavioralLearningAnalytics,
  useBehavioralLearningPerformance,
  useBehavioralLearningActions,
  useBehavioralLearningCache,
  useBehavioralLearningRefresh,
};
