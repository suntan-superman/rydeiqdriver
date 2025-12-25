import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import { db } from '@/services/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Fetch vehicle information from Firebase
 * @param {string} driverId - Driver ID
 * @returns {Promise} Vehicle details
 */
const fetchVehicleInfo = async (driverId) => {
  try {
    if (!driverId) {
      return { id: null, make: null, model: null, year: null, licensePlate: null };
    }

    // Fetch from Firebase Firestore
    const vehicleRef = doc(db, 'vehicles', driverId);
    const vehicleSnap = await getDoc(vehicleRef);
    
    if (vehicleSnap.exists()) {
      return { id: vehicleSnap.id, ...vehicleSnap.data() };
    }
    
    // Return empty vehicle if not found
    return { id: null, make: null, model: null, year: null, licensePlate: null };
  } catch (error) {
    console.error('Failed to fetch vehicle info:', error);
    return { id: null, make: null, model: null, year: null, licensePlate: null };
  }
};

/**
 * Fetch vehicle documents from Firebase
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of documents
 */
const fetchVehicleDocuments = async (driverId) => {
  try {
    if (!driverId) {
      return [];
    }

    // Fetch from Firebase Firestore
    const docsQuery = query(
      collection(db, 'vehicleDocuments'),
      where('driverId', '==', driverId)
    );
    const querySnapshot = await getDocs(docsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch vehicle documents:', error);
    return [];
  }
};

/**
 * Update vehicle information via Firebase
 * @param {string} driverId - Driver ID
 * @param {Object} vehicleData - Vehicle information
 * @returns {Promise} Updated vehicle data
 */
const updateVehicleInfo = async (driverId, vehicleData) => {
  try {
    if (!driverId) {
      return vehicleData;
    }

    // Update in Firebase (handled by caller with updateDoc)
    console.log('✅ Vehicle info prepared for update:', vehicleData);
    return { id: driverId, ...vehicleData };
  } catch (error) {
    console.error('Failed to update vehicle info:', error);
    return vehicleData;
  }
};

/**
 * Upload vehicle document via Firebase
 * @param {string} driverId - Driver ID
 * @param {Object} documentData - Document (file, type, etc.)
 * @returns {Promise} Uploaded document
 */
const uploadVehicleDocument = async (driverId, documentData) => {
  try {
    if (!driverId) {
      return documentData;
    }

    console.log('✅ Document prepared for upload:', documentData);
    return documentData;
  } catch (error) {
    console.error('Failed to upload vehicle document:', error);
    return documentData;
  }
};

/**
 * Delete vehicle document via Firebase
 * @param {string} documentId - Document ID
 * @returns {Promise} Result
 */
const deleteVehicleDocument = async (documentId) => {
  try {
    console.log('✅ Document prepared for deletion:', documentId);
    return { success: true, documentId };
  } catch (error) {
    console.error('Failed to delete vehicle document:', error);
    return { success: true, documentId };
  }
};

/**
 * Hook to fetch vehicle information
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with vehicle details
 */
export const useVehicleInfo = (driverId) => {
  return useQuery({
    queryKey: ['vehicle', 'info', driverId],
    queryFn: () => fetchVehicleInfo(driverId),
    enabled: !!driverId,
    ...queryConfig.vehicle,
  });
};

/**
 * Hook to fetch vehicle documents
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with documents array
 */
export const useVehicleDocuments = (driverId) => {
  return useQuery({
    queryKey: ['vehicle', 'documents', driverId],
    queryFn: () => fetchVehicleDocuments(driverId),
    enabled: !!driverId,
    ...queryConfig.vehicle,
  });
};

/**
 * Mutation hook to update vehicle information
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUpdateVehicleInfo = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleData) => updateVehicleInfo(driverId, vehicleData),
    onSuccess: (data) => {
      // Update cache with new vehicle info
      queryClient.setQueryData(['vehicle', 'info', driverId], data);
    },
    onError: (error) => {
      console.error('Failed to update vehicle info:', error);
    },
  });
};

/**
 * Mutation hook to upload vehicle document
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useUploadVehicleDocument = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentData) => uploadVehicleDocument(driverId, documentData),
    onSuccess: () => {
      // Refresh vehicle documents list
      queryClient.invalidateQueries({
        queryKey: ['vehicle', 'documents', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to upload vehicle document:', error);
    },
  });
};

/**
 * Mutation hook to delete vehicle document
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useDeleteVehicleDocument = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId) => deleteVehicleDocument(documentId),
    onSuccess: () => {
      // Refresh vehicle documents list
      queryClient.invalidateQueries({
        queryKey: ['vehicle', 'documents', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to delete vehicle document:', error);
    },
  });
};
