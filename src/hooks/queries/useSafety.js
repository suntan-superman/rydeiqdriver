import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch safety features from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Safety features settings
 */
const fetchSafetyFeatures = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/safety-features`);
    return response;
  } catch (error) {
    console.error('Failed to fetch safety features:', error);
    throw error;
  }
};

/**
 * Fetch emergency contacts from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of emergency contacts
 */
const fetchEmergencyContacts = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/emergency-contacts`);
    return response;
  } catch (error) {
    console.error('Failed to fetch emergency contacts:', error);
    throw error;
  }
};

/**
 * Add emergency contact via backend API
 * @param {string} driverId - Driver ID
 * @param {Object} contactData - Contact information (name, phone, relationship)
 * @returns {Promise} Added contact
 */
const addEmergencyContact = async (driverId, contactData) => {
  try {
    const response = await apiClient.post(
      `/drivers/${driverId}/emergency-contacts`,
      contactData
    );
    return response;
  } catch (error) {
    console.error('Failed to add emergency contact:', error);
    throw error;
  }
};

/**
 * Update emergency contact via backend API
 * @param {string} contactId - Contact ID
 * @param {Object} contactData - Updated contact information
 * @returns {Promise} Updated contact
 */
const updateEmergencyContact = async (contactId, contactData) => {
  try {
    const response = await apiClient.put(
      `/emergency-contacts/${contactId}`,
      contactData
    );
    return response;
  } catch (error) {
    console.error('Failed to update emergency contact:', error);
    throw error;
  }
};

/**
 * Remove emergency contact via backend API
 * @param {string} contactId - Contact ID
 * @returns {Promise} Result
 */
const removeEmergencyContact = async (contactId) => {
  try {
    const response = await apiClient.delete(`/emergency-contacts/${contactId}`);
    return response;
  } catch (error) {
    console.error('Failed to remove emergency contact:', error);
    throw error;
  }
};

/**
 * Update safety features via backend API
 * @param {string} driverId - Driver ID
 * @param {Object} features - Safety feature settings
 * @returns {Promise} Updated features
 */
const updateSafetyFeatures = async (driverId, features) => {
  try {
    const response = await apiClient.patch(
      `/drivers/${driverId}/safety-features`,
      features
    );
    return response;
  } catch (error) {
    console.error('Failed to update safety features:', error);
    throw error;
  }
};

/**
 * Hook to fetch driver's safety features settings
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with safety settings
 */
export const useSafetyFeatures = (driverId) => {
  return useQuery({
    queryKey: ['safety', 'features', driverId],
    queryFn: () => fetchSafetyFeatures(driverId),
    enabled: !!driverId,
    ...queryConfig.safety,
  });
};

/**
 * Hook to fetch driver's emergency contacts
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with contacts array
 */
export const useEmergencyContacts = (driverId) => {
  return useQuery({
    queryKey: ['safety', 'emergency-contacts', driverId],
    queryFn: () => fetchEmergencyContacts(driverId),
    enabled: !!driverId,
    ...queryConfig.safety,
  });
};

/**
 * Mutation hook to add emergency contact
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useAddEmergencyContact = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactData) => addEmergencyContact(driverId, contactData),
    onSuccess: () => {
      // Refresh emergency contacts list
      queryClient.invalidateQueries({
        queryKey: ['safety', 'emergency-contacts', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to add emergency contact:', error);
    },
  });
};

/**
 * Mutation hook to update emergency contact
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUpdateEmergencyContact = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, contactData }) =>
      updateEmergencyContact(contactId, contactData),
    onSuccess: () => {
      // Refresh emergency contacts list
      queryClient.invalidateQueries({
        queryKey: ['safety', 'emergency-contacts', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to update emergency contact:', error);
    },
  });
};

/**
 * Mutation hook to remove emergency contact
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useRemoveEmergencyContact = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId) => removeEmergencyContact(contactId),
    onSuccess: () => {
      // Refresh emergency contacts list
      queryClient.invalidateQueries({
        queryKey: ['safety', 'emergency-contacts', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to remove emergency contact:', error);
    },
  });
};

/**
 * Mutation hook to update safety features
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUpdateSafetyFeatures = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (features) => updateSafetyFeatures(driverId, features),
    onSuccess: (data) => {
      // Update cache with new features
      queryClient.setQueryData(['safety', 'features', driverId], data);
    },
    onError: (error) => {
      console.error('Failed to update safety features:', error);
    },
  });
};
