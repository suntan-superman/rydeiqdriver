import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch pricing rules from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of pricing rules
 */
const fetchPricingRules = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/pricing-rules`);
    return response;
  } catch (error) {
    console.error('Failed to fetch pricing rules:', error);
    throw error;
  }
};

/**
 * Fetch current rates from backend API
 * @param {Object} location - Location object with lat/lng
 * @returns {Promise} Current rates data
 */
const fetchCurrentRates = async (location) => {
  try {
    const response = await apiClient.get(
      `/pricing/rates?latitude=${location.lat}&longitude=${location.lng}`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch current rates:', error);
    throw error;
  }
};

/**
 * Update pricing rules via backend API
 * @param {string} driverId - Driver ID
 * @param {Object} rules - Pricing rules
 * @returns {Promise} Updated rules
 */
const updatePricingRules = async (driverId, rules) => {
  try {
    const response = await apiClient.put(
      `/drivers/${driverId}/pricing-rules`,
      rules
    );
    return response;
  } catch (error) {
    console.error('Failed to update pricing rules:', error);
    throw error;
  }
};

/**
 * Hook to fetch pricing rules for driver
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with pricing rules
 */
export const usePricingRules = (driverId) => {
  return useQuery({
    queryKey: ['pricing', 'rules', driverId],
    queryFn: () => fetchPricingRules(driverId),
    enabled: !!driverId,
    ...queryConfig.dynamicPricing,
  });
};

/**
 * Hook to fetch current rates for a location
 * @param {Object} location - Location object with lat/lng
 * @returns {Object} Query result with current rates
 */
export const useCurrentRates = (location) => {
  return useQuery({
    queryKey: ['pricing', 'rates', location?.lat, location?.lng],
    queryFn: () => fetchCurrentRates(location),
    enabled: !!(location?.lat && location?.lng),
    ...queryConfig.dynamicPricing,
  });
};

/**
 * Mutation hook to update pricing rules
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUpdatePricingRules = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rules) => updatePricingRules(driverId, rules),
    onSuccess: (data) => {
      // Update cache with new rules
      queryClient.setQueryData(['pricing', 'rules', driverId], data);
    },
    onError: (error) => {
      console.error('Failed to update pricing rules:', error);
    },
  });
};
