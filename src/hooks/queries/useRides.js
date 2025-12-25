import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch available rides from backend API
 * @param {string} driverId - Driver ID
 * @param {Object} filters - Filter options (maxDistance, minFare, rideType, etc.)
 * @returns {Promise} Array of available rides
 */
const fetchAvailableRides = async (driverId, filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const url = `/drivers/${driverId}/rides/available${params ? `?${params}` : ''}`;
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch available rides:', error);
    throw error;
  }
};

/**
 * Fetch specific ride details from backend API
 * @param {string} rideId - Ride ID
 * @returns {Promise} Ride details
 */
const fetchRideDetails = async (rideId) => {
  try {
    const response = await apiClient.get(`/rides/${rideId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch ride details:', error);
    throw error;
  }
};

/**
 * Fetch driver's rides from backend API
 * @param {string} driverId - Driver ID
 * @param {string} status - Filter by status (all, active, completed, cancelled)
 * @returns {Promise} Array of driver's rides
 */
const fetchDriverRides = async (driverId, status = 'all') => {
  try {
    const url = `/drivers/${driverId}/rides${status !== 'all' ? `?status=${status}` : ''}`;
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch driver rides:', error);
    throw error;
  }
};

/**
 * Accept a ride via backend API
 * @param {string} rideId - Ride ID
 * @param {string} driverId - Driver ID
 * @returns {Promise} Updated ride data
 */
const acceptRide = async (rideId, driverId) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/accept`, { driverId });
    return response;
  } catch (error) {
    console.error('Failed to accept ride:', error);
    throw error;
  }
};

/**
 * Decline a ride via backend API
 * @param {string} rideId - Ride ID
 * @param {string} driverId - Driver ID
 * @returns {Promise} Updated ride data
 */
const declineRide = async (rideId, driverId) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/decline`, { driverId });
    return response;
  } catch (error) {
    console.error('Failed to decline ride:', error);
    throw error;
  }
};

/**
 * Complete a ride via backend API
 * @param {string} rideId - Ride ID
 * @param {Object} data - Completion data (rating, tip, comments, etc.)
 * @returns {Promise} Completed ride data
 */
const completeRide = async (rideId, data) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/complete`, data);
    return response;
  } catch (error) {
    console.error('Failed to complete ride:', error);
    throw error;
  }
};

/**
 * Hook to fetch available rides for driver
 * Real-time ride matching
 * @param {string} driverId - Driver ID
 * @param {Object} filters - Filter options (maxDistance, minFare, rideType, etc.)
 * @returns {Object} Query result with rides array
 */
export const useAvailableRides = (driverId, filters = {}) => {
  return useQuery({
    queryKey: ['rides', 'available', driverId, filters],
    queryFn: () => fetchAvailableRides(driverId, filters),
    enabled: !!driverId,
    ...queryConfig.rides,
  });
};

/**
 * Hook to fetch specific ride details
 * @param {string} rideId - Ride ID
 * @returns {Object} Query result with ride details
 */
export const useRideDetails = (rideId) => {
  return useQuery({
    queryKey: ['rides', 'details', rideId],
    queryFn: () => fetchRideDetails(rideId),
    enabled: !!rideId,
    ...queryConfig.rides,
  });
};

/**
 * Hook to fetch driver's rides
 * @param {string} driverId - Driver ID
 * @param {string} status - Filter by status (all, active, completed, cancelled)
 * @returns {Object} Query result with rides array
 */
export const useDriverRides = (driverId, status = 'all') => {
  return useQuery({
    queryKey: ['rides', 'driver', driverId, status],
    queryFn: () => fetchDriverRides(driverId, status),
    enabled: !!driverId,
    ...queryConfig.rides,
  });
};

/**
 * Mutation hook to accept a ride
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useAcceptRide = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId) => acceptRide(rideId, driverId),
    onSuccess: (data) => {
      // Update ride details cache
      queryClient.setQueryData(['rides', 'details', data.rideId], data);
      // Invalidate available rides - ride no longer available
      queryClient.invalidateQueries({
        queryKey: ['rides', 'available'],
      });
      // Invalidate driver's rides to reflect accepted ride
      queryClient.invalidateQueries({
        queryKey: ['rides', 'driver', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to accept ride:', error);
    },
  });
};

/**
 * Mutation hook to decline a ride
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useDeclineRide = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId) => declineRide(rideId, driverId),
    onSuccess: () => {
      // Invalidate available rides list since ride options changed
      queryClient.invalidateQueries({
        queryKey: ['rides', 'available'],
      });
    },
    onError: (error) => {
      console.error('Failed to decline ride:', error);
    },
  });
};

/**
 * Mutation hook to complete a ride
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useCompleteRide = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rideId, ...data }) => completeRide(rideId, data),
    onSuccess: (data) => {
      // Update ride details
      queryClient.setQueryData(['rides', 'details', data.rideId], data);
      // Invalidate driver's rides - status changed
      queryClient.invalidateQueries({
        queryKey: ['rides', 'driver', driverId],
      });
      // Invalidate earnings - new ride completed
      queryClient.invalidateQueries({
        queryKey: ['earnings'],
      });
    },
    onError: (error) => {
      console.error('Failed to complete ride:', error);
    },
  });
};
