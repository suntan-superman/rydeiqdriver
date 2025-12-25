import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';

// API service functions
const fetchWellnessData = async (driverId) => {
  console.warn('fetchWellnessData: Implement your API call');
  return {
    breaksTaken: 0,
    hoursWorked: 0,
    fatigueLevel: 0,
    wellnessScore: 0,
  };
};

const fetchWellnessTips = async () => {
  console.warn('fetchWellnessTips: Implement your API call');
  return [];
};

const logBreak = async (driverId, breakData) => {
  console.warn('logBreak: Implement your API call');
  return { ...breakData, id: Date.now() };
};

const updateWellnessPreferences = async (driverId, preferences) => {
  console.warn('updateWellnessPreferences: Implement your API call');
  return { ...preferences, driverId };
};

/**
 * Hook to fetch wellness data for driver
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with wellness data
 */
export const useWellnessData = (driverId) => {
  return useQuery({
    queryKey: ['wellness', 'data', driverId],
    queryFn: () => fetchWellnessData(driverId),
    enabled: !!driverId,
    ...queryConfig.wellness,
  });
};

/**
 * Hook to fetch wellness tips
 * @returns {Object} Query result with tips array
 */
export const useWellnessTips = () => {
  return useQuery({
    queryKey: ['wellness', 'tips'],
    queryFn: fetchWellnessTips,
    ...queryConfig.wellness,
  });
};

/**
 * Hook to log a break
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result
 */
export const useLogBreak = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (breakData) => logBreak(driverId, breakData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wellness', 'data', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to log break:', error);
    },
  });
};

/**
 * Hook to update wellness preferences
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result
 */
export const useUpdateWellnessPreferences = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences) => updateWellnessPreferences(driverId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wellness', 'data', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to update wellness preferences:', error);
    },
  });
};
