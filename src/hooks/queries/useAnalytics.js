import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch analytics dashboard data from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Dashboard metrics
 */
const fetchAnalyticsDashboard = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/analytics/dashboard`);
    return response;
  } catch (error) {
    console.error('Failed to fetch analytics dashboard:', error);
    throw error;
  }
};

/**
 * Fetch performance metrics from backend API
 * @param {string} driverId - Driver ID
 * @param {Object} dateRange - Date range filter { startDate, endDate }
 * @returns {Promise} Array of performance metrics
 */
const fetchPerformanceMetrics = async (driverId, dateRange = {}) => {
  try {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);

    const url = `/drivers/${driverId}/analytics/performance${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    throw error;
  }
};

/**
 * Fetch trend data from backend API
 * @param {string} driverId - Driver ID
 * @param {string} metric - Metric type (earnings, rides, rating, etc.)
 * @param {number} days - Number of days to fetch (default 30)
 * @returns {Promise} Array of trend data points
 */
const fetchTrendData = async (driverId, metric, days = 30) => {
  try {
    const response = await apiClient.get(
      `/drivers/${driverId}/analytics/trends/${metric}?days=${days}`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch trend data:', error);
    throw error;
  }
};

/**
 * Hook to fetch analytics dashboard data
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with dashboard metrics
 */
export const useAnalyticsDashboard = (driverId) => {
  return useQuery({
    queryKey: ['analytics', 'dashboard', driverId],
    queryFn: () => fetchAnalyticsDashboard(driverId),
    enabled: !!driverId,
    ...queryConfig.analytics,
  });
};

/**
 * Hook to fetch performance metrics
 * @param {string} driverId - Driver ID
 * @param {Object} dateRange - Date range filter { startDate, endDate }
 * @returns {Object} Query result with performance array
 */
export const usePerformanceMetrics = (driverId, dateRange = {}) => {
  return useQuery({
    queryKey: ['analytics', 'performance', driverId, dateRange],
    queryFn: () => fetchPerformanceMetrics(driverId, dateRange),
    enabled: !!driverId,
    ...queryConfig.analytics,
  });
};

/**
 * Hook to fetch trend data
 * @param {string} driverId - Driver ID
 * @param {string} metric - Metric type (earnings, rides, rating, etc.)
 * @param {number} days - Number of days to fetch (default 30)
 * @returns {Object} Query result with trend data array
 */
export const useTrendData = (driverId, metric, days = 30) => {
  return useQuery({
    queryKey: ['analytics', 'trends', driverId, metric, days],
    queryFn: () => fetchTrendData(driverId, metric, days),
    enabled: !!driverId && !!metric,
    ...queryConfig.analytics,
  });
};
