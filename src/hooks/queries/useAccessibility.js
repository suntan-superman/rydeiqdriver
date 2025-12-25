import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import { db } from '@/services/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Fetch accessibility settings from Firebase
 * @param {string} driverId - Driver ID
 * @returns {Promise} Accessibility settings
 */
const fetchAccessibilitySettings = async (driverId) => {
  try {
    if (!driverId) {
      return { sound: true, vibration: true };
    }

    const settingsRef = doc(db, 'accessibilitySettings', driverId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data();
    }
    
    // Return default settings if not found
    return { sound: true, vibration: true };
  } catch (error) {
    console.error('Failed to fetch accessibility settings:', error);
    // Return defaults on error
    return { sound: true, vibration: true };
  }
};

/**
 * Update accessibility settings via Firebase
 * @param {string} driverId - Driver ID
 * @param {Object} settings - Accessibility settings
 * @returns {Promise} Updated settings
 */
const updateAccessibilitySettings = async (driverId, settings) => {
  try {
    if (!driverId) {
      return settings;
    }

    const settingsRef = doc(db, 'accessibilitySettings', driverId);
    
    // Use setDoc with merge to create or update
    await setDoc(settingsRef, settings, { merge: true });
    
    return settings;
  } catch (error) {
    console.error('Failed to update accessibility settings:', error);
    // Return the settings anyway for optimistic updates
    return settings;
  }
};

/**
 * Hook to fetch accessibility settings
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with accessibility settings
 */
export const useAccessibilitySettings = (driverId) => {
  return useQuery({
    queryKey: ['accessibility', 'settings', driverId],
    queryFn: () => fetchAccessibilitySettings(driverId),
    enabled: !!driverId,
    ...queryConfig.accessibility,
  });
};

/**
 * Mutation hook to update accessibility settings
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUpdateAccessibilitySettings = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => updateAccessibilitySettings(driverId, settings),
    onSuccess: (data) => {
      // Update cache with new settings
      queryClient.setQueryData(
        ['accessibility', 'settings', driverId],
        data
      );
    },
    onError: (error) => {
      console.error('Failed to update accessibility settings:', error);
    },
  });
};
