import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch bidding opportunities from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of bidding opportunities
 */
const fetchBiddingOpportunities = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/bidding/opportunities`);
    return response;
  } catch (error) {
    console.error('Failed to fetch bidding opportunities:', error);
    throw error;
  }
};

/**
 * Fetch bid history from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of bids
 */
const fetchBidHistory = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/bidding/history`);
    return response;
  } catch (error) {
    console.error('Failed to fetch bid history:', error);
    throw error;
  }
};

/**
 * Place a bid via backend API
 * @param {string} driverId - Driver ID
 * @param {string} rideId - Ride ID
 * @param {number} bidAmount - Bid amount
 * @returns {Promise} Bid data
 */
const placeBid = async (driverId, rideId, bidAmount) => {
  try {
    const response = await apiClient.post(`/drivers/${driverId}/bidding/place`, {
      rideId,
      bidAmount,
    });
    return response;
  } catch (error) {
    console.error('Failed to place bid:', error);
    throw error;
  }
};

/**
 * Withdraw a bid via backend API
 * @param {string} bidId - Bid ID
 * @returns {Promise} Updated bid data
 */
const withdrawBid = async (bidId) => {
  try {
    const response = await apiClient.post(`/bidding/${bidId}/withdraw`);
    return response;
  } catch (error) {
    console.error('Failed to withdraw bid:', error);
    throw error;
  }
};

/**
 * Fetch bid details from backend API
 * @param {string} bidId - Bid ID
 * @returns {Promise} Bid details
 */
const fetchBidDetails = async (bidId) => {
  try {
    const response = await apiClient.get(`/bidding/${bidId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch bid details:', error);
    throw error;
  }
};

/**
 * Hook to fetch current bidding opportunities
 * Real-time auction-style rides
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with opportunities array
 */
export const useBiddingOpportunities = (driverId) => {
  return useQuery({
    queryKey: ['bidding', 'opportunities', driverId],
    queryFn: () => fetchBiddingOpportunities(driverId),
    enabled: !!driverId,
    ...queryConfig.bids,
  });
};

/**
 * Hook to fetch driver's bid history
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with bids array
 */
export const useBidHistory = (driverId) => {
  return useQuery({
    queryKey: ['bidding', 'history', driverId],
    queryFn: () => fetchBidHistory(driverId),
    enabled: !!driverId,
    ...queryConfig.bids,
  });
};

/**
 * Hook to fetch specific bid details
 * @param {string} bidId - Bid ID
 * @returns {Object} Query result with bid details
 */
export const useBidDetails = (bidId) => {
  return useQuery({
    queryKey: ['bidding', 'details', bidId],
    queryFn: () => fetchBidDetails(bidId),
    enabled: !!bidId,
    ...queryConfig.bids,
  });
};

/**
 * Mutation hook to place a bid
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const usePlaceBid = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, bidAmount }) => placeBid(driverId, rideId, bidAmount),
    onSuccess: (data) => {
      // Update bid history with new bid
      queryClient.invalidateQueries({
        queryKey: ['bidding', 'history', driverId],
      });
      // Opportunities have changed
      queryClient.invalidateQueries({
        queryKey: ['bidding', 'opportunities', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to place bid:', error);
    },
  });
};

/**
 * Mutation hook to withdraw a bid
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useWithdrawBid = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidId) => withdrawBid(bidId),
    onSuccess: (data) => {
      // Update bid details
      queryClient.setQueryData(['bidding', 'details', data.bidId], data);
      // Invalidate history
      queryClient.invalidateQueries({
        queryKey: ['bidding', 'history', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to withdraw bid:', error);
    },
  });
};

/**
 * Derived hook to get active bids
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with active bids only
 */
export const useActiveBids = (driverId) => {
  const { data: bidHistory, ...queryInfo } = useBidHistory(driverId);

  return {
    ...queryInfo,
    data: bidHistory?.filter(
      (bid) => bid.status === 'pending' || bid.status === 'accepted'
    ) || [],
  };
};
