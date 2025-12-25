import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import { db } from '@/services/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Fetch driver profile from Firebase
 * @param {string} driverId - Driver ID
 * @returns {Promise} Driver profile data
 */
const fetchDriverProfile = async (driverId) => {
  try {
    if (!driverId) {
      return { id: null, name: null, email: null, status: 'offline' };
    }

    let profileData = null;

    // Try driverApplications collection first (most likely to have onboarding data)
    try {
      const driverAppRef = doc(db, 'driverApplications', driverId);
      const driverAppSnap = await getDoc(driverAppRef);
      if (driverAppSnap.exists()) {
        profileData = driverAppSnap.data();
      }
    } catch (e) {
      console.log('driverApplications fetch skipped');
    }

    // If not found, try drivers collection
    if (!profileData) {
      try {
        const driverRef = doc(db, 'drivers', driverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          profileData = driverSnap.data();
        }
      } catch (e) {
        console.log('drivers fetch skipped');
      }
    }

    // If still not found, try users collection
    if (!profileData) {
      try {
        const userRef = doc(db, 'users', driverId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profileData = userSnap.data();
        }
      } catch (e) {
        console.log('users fetch skipped');
      }
    }

    // If we found profile data, format it properly
    if (profileData) {
      const firstName = profileData.firstName || profileData.displayName?.split(' ')[0] || '';
      const lastName = profileData.lastName || profileData.displayName?.split(' ')[1] || '';
      
      return { 
        id: driverId,
        firstName,
        lastName,
        displayName: profileData.displayName || `${firstName} ${lastName}`.trim(),
        email: profileData.email,
        phone: profileData.phoneNumber || profileData.phone,
        status: profileData.status || 'offline',
        profilePhoto: profileData.profilePhoto,
        ...profileData
      };
    }
    
    // Return empty profile if not found
    return { id: driverId, name: null, email: null, status: 'offline' };
  } catch (error) {
    console.error('Failed to fetch driver profile:', error);
    return { id: driverId, name: null, email: null, status: 'offline' };
  }
};

/**
 * Update driver profile via Firebase
 * @param {string} driverId - Driver ID
 * @param {Object} updates - Profile updates
 * @returns {Promise} Updated profile data
 */
const updateDriverProfile = async (driverId, updates) => {
  try {
    if (!driverId) {
      return { id: driverId, ...updates };
    }

    // Update in Firebase Firestore
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, updates);
    console.log('✅ Driver profile updated in Firebase:', updates);
    return { id: driverId, ...updates };
  } catch (error) {
    console.error('Failed to update driver profile:', error);
    return { id: driverId, ...updates };
  }
};

/**
 * Update driver status via Firebase
 * @param {string} driverId - Driver ID
 * @param {string} status - New status (online, offline, away, break)
 * @returns {Promise} Updated status
 */
const updateDriverStatus = async (driverId, status) => {
  try {
    if (!driverId) {
      return { status };
    }

    // Update status in Firebase Firestore
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, { status });
    console.log('✅ Driver status updated in Firebase:', status);
    return { status };
  } catch (error) {
    console.error('Failed to update driver status:', error);
    return { status };
  }
};

/**
 * Update driver location via Firebase
 * @param {string} driverId - Driver ID
 * @param {Object} location - Location with latitude, longitude, accuracy
 * @returns {Promise} Updated location
 */
const updateDriverLocation = async (driverId, location) => {
  try {
    if (!driverId) {
      return location;
    }

    // Update location in Firebase Firestore
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, { 
      location,
      lastLocationUpdate: new Date().toISOString()
    });
    console.log('✅ Driver location updated in Firebase:', location);
    return location;
  } catch (error) {
    console.error('Failed to update driver location:', error);
    return location;
  }
};

/**
 * Hook to fetch driver profile
 * Queries: GET /drivers/{id}/profile
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with data, isLoading, error, refetch
 */
export const useDriverProfile = (driverId) => {
  return useQuery({
    queryKey: ['driver', 'profile', driverId],
    queryFn: () => fetchDriverProfile(driverId),
    enabled: !!driverId,
    ...queryConfig.driver,
  });
};

/**
 * Hook to fetch driver status
 * Queries: GET /drivers/{id}/profile (extracts status)
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with status data
 */
export const useDriverStatus = (driverId) => {
  return useQuery({
    queryKey: ['driver', 'status', driverId],
    queryFn: async () => {
      const profile = await fetchDriverProfile(driverId);
      return { status: profile?.status };
    },
    enabled: !!driverId,
    ...queryConfig.driver,
  });
};

/**
 * Mutation hook to update driver profile
 * Mutates: PUT /drivers/{id}/profile
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate, isPending, error
 */
export const useUpdateDriverProfile = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => updateDriverProfile(driverId, updates),
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(['driver', 'profile', driverId], data);
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['driver', 'profile', driverId],
      });
      queryClient.invalidateQueries({
        queryKey: ['driver'],
      });
    },
    onError: (error) => {
      console.error('Failed to update driver profile:', error);
    },
  });
};

/**
 * Mutation hook to update driver status
 * Mutates: PATCH /drivers/{id}/status
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate, isPending, error
 */
export const useUpdateDriverStatus = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status) => updateDriverStatus(driverId, status),
    onSuccess: (data) => {
      // Update status in cache
      queryClient.setQueryData(['driver', 'status', driverId], data);
      // Invalidate profile cache to refetch with new status
      queryClient.invalidateQueries({
        queryKey: ['driver', 'profile', driverId],
      });
      queryClient.invalidateQueries({
        queryKey: ['driver'],
      });
    },
    onError: (error) => {
      console.error('Failed to update driver status:', error);
    },
  });
};

/**
 * Mutation hook to update driver location
 * Mutates: POST /drivers/{id}/location
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate, isPending, error
 */
export const useUpdateDriverLocation = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location) => updateDriverLocation(driverId, location),
    onSuccess: (data) => {
      // Update location in cache (don't invalidate, keep real-time)
      queryClient.setQueryData(['driver', 'location', driverId], data);
    },
    onError: (error) => {
      console.error('Failed to update driver location:', error);
    },
  });
};
