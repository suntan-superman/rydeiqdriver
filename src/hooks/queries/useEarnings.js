import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
// import apiClient from '@/services/api'; // Commented out - no backend yet

/**
 * Fetch earnings summary from backend API
 * @param {string} driverId - Driver ID
 * @param {Object} dateRange - Date range filter { startDate, endDate }
 * @returns {Promise} Earnings data with total and breakdown
 */
const fetchEarnings = async (driverId, dateRange = {}) => {
  try {
    // TODO: Replace with actual API call when backend is ready
    // For now, return empty data to handle gracefully
    console.log('📊 Fetching earnings for driver:', driverId, 'dateRange:', dateRange);
    
    // When backend is ready, uncomment this:
    // const params = new URLSearchParams();
    // if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    // if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    // const url = `/drivers/${driverId}/earnings${params.toString() ? `?${params}` : ''}`;
    // const response = await apiClient.get(url);
    // return response;
    
    // Return empty earnings data for now - UI will handle empty state gracefully
    console.log('📊 No earnings data available yet');
    return {
      totalEarnings: 0,
      totalRides: 0,
      averagePerRide: 0,
      totalTips: 0,
      totalHours: 0,
      period: dateRange
    };
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
    // Return empty data instead of throwing to prevent crashes
    return {
      totalEarnings: 0,
      totalRides: 0,
      averagePerRide: 0,
      totalTips: 0,
      totalHours: 0,
      period: dateRange
    };
  }
};

/**
 * Fetch earnings history from backend API
 * @param {string} driverId - Driver ID
 * @param {Object} filters - Filter options (dateRange, status, etc.)
 * @returns {Promise} Array of earnings records
 */
const fetchEarningsHistory = async (driverId, filters = {}) => {
  try {
    // TODO: Replace with actual API call when backend is ready
    // For now, return empty array to handle gracefully
    console.log('📊 Fetching earnings history for driver:', driverId);
    
    // When backend is ready, uncomment this:
    // const params = new URLSearchParams();
    // if (filters.dateRange?.startDate) params.append('startDate', filters.dateRange.startDate);
    // if (filters.dateRange?.endDate) params.append('endDate', filters.dateRange.endDate);
    // const url = `/drivers/${driverId}/earnings/history${params.toString() ? `?${params}` : ''}`;
    // const response = await apiClient.get(url);
    // return response;
    
    // Return empty array for now - UI will handle empty state gracefully
    console.log('📊 No earnings data available yet');
    return [];
  } catch (error) {
    console.error('Failed to fetch earnings history:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

/**
 * Fetch payouts from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of payout records
 */
const fetchPayouts = async (driverId) => {
  try {
    // TODO: Replace with actual API call when backend is ready
    // For now, return empty array to handle gracefully
    console.log('💰 Fetching payouts for driver:', driverId);
    
    // When backend is ready, uncomment this:
    // const response = await apiClient.get(`/drivers/${driverId}/payouts`);
    // return response;
    
    // Return empty array for now - UI will handle empty state gracefully
    console.log('💰 No payout data available yet');
    return [];
  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    return [];
  }
};

/**
 * Fetch specific payout details from backend API
 * @param {string} payoutId - Payout ID
 * @returns {Promise} Payout details
 */
const fetchPayoutDetails = async (payoutId) => {
  try {
    // TODO: Replace with actual API call when backend is ready
    // For now, return null to handle gracefully
    console.log('💰 Fetching payout details for:', payoutId);
    
    // When backend is ready, uncomment this:
    // const response = await apiClient.get(`/payouts/${payoutId}`);
    // return response;
    
    // Return null for now - UI will handle empty state gracefully
    console.log('💰 No payout details available yet');
    return null;
  } catch (error) {
    console.error('Failed to fetch payout details:', error);
    return null;
  }
};

/**
 * Request a payout via backend API
 * @param {string} driverId - Driver ID
 * @param {number} amount - Payout amount
 * @returns {Promise} Payout request data
 */
const requestPayout = async (driverId, amount) => {
  try {
    // TODO: Replace with actual API call when backend is ready
    console.log('💰 Requesting payout for driver:', driverId, 'amount:', amount);
    
    // When backend is ready, uncomment this:
    // const response = await apiClient.post(`/drivers/${driverId}/payouts/request`, {
    //   amount,
    // });
    // return response;
    
    // For now, throw an error to indicate feature not available
    throw new Error('Payout requests are not available yet. Please contact support.');
  } catch (error) {
    console.error('Failed to request payout:', error);
    throw error;
  }
};

/**
 * Hook to fetch driver's earnings summary
 * @param {string} driverId - Driver ID
 * @param {Object} dateRange - Filter by date range { startDate, endDate }
 * @returns {Object} Query result with earnings data
 */
export const useEarnings = (driverId, dateRange = {}) => {
  return useQuery({
    queryKey: ['earnings', driverId, dateRange],
    queryFn: () => fetchEarnings(driverId, dateRange),
    enabled: !!driverId,
    ...queryConfig.earnings,
  });
};

/**
 * Hook to fetch driver's earnings history
 * @param {string} driverId - Driver ID
 * @param {Object} filters - Filter options
 * @returns {Object} Query result with earnings array
 */
export const useEarningsHistory = (driverId, filters = {}) => {
  return useQuery({
    queryKey: ['earnings', 'history', driverId, filters],
    queryFn: () => fetchEarningsHistory(driverId, filters),
    enabled: !!driverId,
    ...queryConfig.earnings,
  });
};

/**
 * Hook to fetch driver's payouts
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with payouts array
 */
export const usePayouts = (driverId) => {
  return useQuery({
    queryKey: ['payouts', driverId],
    queryFn: () => fetchPayouts(driverId),
    enabled: !!driverId,
    ...queryConfig.earnings,
  });
};

/**
 * Hook to fetch specific payout details
 * @param {string} payoutId - Payout ID
 * @returns {Object} Query result with payout details
 */
export const usePayoutDetails = (payoutId) => {
  return useQuery({
    queryKey: ['payouts', 'details', payoutId],
    queryFn: () => fetchPayoutDetails(payoutId),
    enabled: !!payoutId,
    ...queryConfig.earnings,
  });
};

/**
 * Mutation hook to request a payout
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useRequestPayout = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount) => requestPayout(driverId, amount),
    onSuccess: () => {
      // Refresh payouts list
      queryClient.invalidateQueries({
        queryKey: ['payouts', driverId],
      });
      // Refresh earnings
      queryClient.invalidateQueries({
        queryKey: ['earnings', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to request payout:', error);
    },
  });
};

/**
 * Derived hook to calculate total earnings
 * @param {string} driverId - Driver ID
 * @param {Object} dateRange - Date range filter
 * @returns {Object} Query result with total earnings
 */
export const useTotalEarnings = (driverId, dateRange = {}) => {
  const { data: earnings, ...queryInfo } = useEarnings(driverId, dateRange);

  return {
    ...queryInfo,
    data: {
      total: earnings?.total || 0,
      breakdown: earnings?.breakdown || {},
    },
  };
};

/**
 * Derived hook to calculate earnings statistics
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with earnings stats
 */
export const useEarningsStats = (driverId) => {
  const { data: history, ...queryInfo } = useEarningsHistory(driverId);

  const stats = history?.reduce(
    (acc, ride) => ({
      totalRides: acc.totalRides + 1,
      totalEarnings: acc.totalEarnings + (ride.earnings || 0),
      averagePerRide:
        (acc.totalEarnings + (ride.earnings || 0)) / (acc.totalRides + 1),
      maxRideEarning: Math.max(acc.maxRideEarning, ride.earnings || 0),
      minRideEarning: Math.min(acc.minRideEarning, ride.earnings || 0),
      totalTips: acc.totalTips + (ride.tip || 0),
      totalHours: acc.totalHours + (ride.hours || 0),
    }),
    {
      totalRides: 0,
      totalEarnings: 0,
      averagePerRide: 0,
      maxRideEarning: 0,
      minRideEarning: Infinity,
      totalTips: 0,
      totalHours: 0,
    }
  ) || {
    totalRides: 0,
    totalEarnings: 0,
    averagePerRide: 0,
    maxRideEarning: 0,
    minRideEarning: 0,
    totalTips: 0,
    totalHours: 0,
  };

  return {
    ...queryInfo,
    data: {
      ...stats,
      minRideEarning:
        stats?.minRideEarning === Infinity ? 0 : (stats?.minRideEarning || 0),
    },
  };
};
