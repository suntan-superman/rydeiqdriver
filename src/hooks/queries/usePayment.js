import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch payment methods from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of payment methods
 */
const fetchPaymentMethods = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/payment-methods`);
    return response;
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    throw error;
  }
};

/**
 * Add payment method via backend API
 * @param {string} driverId - Driver ID
 * @param {Object} paymentData - Payment data (cardToken, bankAccount, etc.)
 * @returns {Promise} Added payment method
 */
const addPaymentMethod = async (driverId, paymentData) => {
  try {
    const response = await apiClient.post(`/drivers/${driverId}/payment-methods`, paymentData);
    return response;
  } catch (error) {
    console.error('Failed to add payment method:', error);
    throw error;
  }
};

/**
 * Remove payment method via backend API
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise} Result
 */
const removePaymentMethod = async (paymentMethodId) => {
  try {
    const response = await apiClient.delete(`/payment-methods/${paymentMethodId}`);
    return response;
  } catch (error) {
    console.error('Failed to remove payment method:', error);
    throw error;
  }
};

/**
 * Set default payment method via backend API
 * @param {string} driverId - Driver ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise} Updated payment method
 */
const setDefaultPaymentMethod = async (driverId, paymentMethodId) => {
  try {
    const response = await apiClient.patch(
      `/drivers/${driverId}/payment-methods/${paymentMethodId}/default`
    );
    return response;
  } catch (error) {
    console.error('Failed to set default payment method:', error);
    throw error;
  }
};

/**
 * Hook to fetch driver's payment methods
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with payment methods
 */
export const usePaymentMethods = (driverId) => {
  return useQuery({
    queryKey: ['payment', 'methods', driverId],
    queryFn: () => fetchPaymentMethods(driverId),
    enabled: !!driverId,
    ...queryConfig.payment,
  });
};

/**
 * Mutation hook to add payment method
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useAddPaymentMethod = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData) => addPaymentMethod(driverId, paymentData),
    onSuccess: () => {
      // Refresh payment methods list
      queryClient.invalidateQueries({
        queryKey: ['payment', 'methods', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to add payment method:', error);
    },
  });
};

/**
 * Mutation hook to remove payment method
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useRemovePaymentMethod = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId) => removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      // Refresh payment methods list
      queryClient.invalidateQueries({
        queryKey: ['payment', 'methods', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to remove payment method:', error);
    },
  });
};

/**
 * Mutation hook to set default payment method
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useSetDefaultPaymentMethod = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId) => setDefaultPaymentMethod(driverId, paymentMethodId),
    onSuccess: () => {
      // Refresh payment methods to reflect new default
      queryClient.invalidateQueries({
        queryKey: ['payment', 'methods', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to set default payment method:', error);
    },
  });
};
