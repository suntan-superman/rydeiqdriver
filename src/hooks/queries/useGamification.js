import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch leaderboard from backend API
 * @param {number} limit - Number of top drivers to fetch
 * @returns {Promise} Leaderboard data with rankings
 */
const fetchLeaderboard = async (limit = 100) => {
  try {
    const response = await apiClient.get(`/gamification/leaderboard?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw error;
  }
};

/**
 * Fetch achievements from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of achievements
 */
const fetchAchievements = async (driverId) => {
  try {
    const response = await apiClient.get(
      `/drivers/${driverId}/gamification/achievements`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    throw error;
  }
};

/**
 * Fetch rewards from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Rewards data with points and badges
 */
const fetchRewards = async (driverId) => {
  try {
    const response = await apiClient.get(
      `/drivers/${driverId}/gamification/rewards`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
    throw error;
  }
};

/**
 * Claim reward via backend API
 * @param {string} driverId - Driver ID
 * @param {string} rewardId - Reward ID
 * @returns {Promise} Claimed reward data
 */
const claimReward = async (driverId, rewardId) => {
  try {
    const response = await apiClient.post(
      `/drivers/${driverId}/gamification/rewards/${rewardId}/claim`
    );
    return response;
  } catch (error) {
    console.error('Failed to claim reward:', error);
    throw error;
  }
};

/**
 * Hook to fetch leaderboard
 * @param {number} limit - Number of top drivers to fetch
 * @returns {Object} Query result with leaderboard data
 */
export const useLeaderboard = (limit = 100) => {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
    ...queryConfig.gamification,
  });
};

/**
 * Hook to fetch achievements for driver
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with achievements
 */
export const useAchievements = (driverId) => {
  return useQuery({
    queryKey: ['gamification', 'achievements', driverId],
    queryFn: () => fetchAchievements(driverId),
    enabled: !!driverId,
    ...queryConfig.gamification,
  });
};

/**
 * Hook to fetch driver's rewards and points
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with rewards data
 */
export const useRewards = (driverId) => {
  return useQuery({
    queryKey: ['gamification', 'rewards', driverId],
    queryFn: () => fetchRewards(driverId),
    enabled: !!driverId,
    ...queryConfig.gamification,
  });
};

/**
 * Mutation hook to claim a reward
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useClaimReward = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId) => claimReward(driverId, rewardId),
    onSuccess: () => {
      // Refresh rewards and leaderboard after claiming
      queryClient.invalidateQueries({
        queryKey: ['gamification', 'rewards', driverId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gamification', 'leaderboard'],
      });
    },
    onError: (error) => {
      console.error('Failed to claim reward:', error);
    },
  });
};
