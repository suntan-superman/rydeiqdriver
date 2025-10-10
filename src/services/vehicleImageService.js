import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, storage } from './firebase/config';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Vehicle Image Service - Driver App
 * Handles vehicle photo uploads, management, and retrieval
 */

// Vehicle image types
export const VEHICLE_IMAGE_TYPES = {
  FRONT: 'front',
  SIDE: 'side',
  BACK: 'back',
  INTERIOR: 'interior'
};

// Image constraints
const IMAGE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_SIZE: 50 * 1024, // 50KB
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  COMPRESS_WIDTH: 1200,
  COMPRESS_QUALITY: 0.85
};

/**
 * Optimize image for upload
 */
export const optimizeVehicleImage = async (imageUri) => {
  try {
    console.log('🖼️ Optimizing vehicle image...');

    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: IMAGE_CONSTRAINTS.COMPRESS_WIDTH } }
      ],
      {
        compress: IMAGE_CONSTRAINTS.COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG
      }
    );

    console.log('✅ Image optimized:', {
      originalUri: imageUri,
      optimizedUri: manipResult.uri
    });

    return manipResult.uri;
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    return imageUri; // Return original if optimization fails
  }
};

/**
 * Upload vehicle photo
 */
export const uploadVehiclePhoto = async (userId, imageUri, imageType = VEHICLE_IMAGE_TYPES.FRONT) => {
  try {
    console.log('🚗 Uploading vehicle photo:', { userId, imageType });

    // Optimize image first
    const optimizedUri = await optimizeVehicleImage(imageUri);

    // Convert to blob
    const response = await fetch(optimizedUri);
    const blob = await response.blob();

    console.log('📦 Image blob created:', {
      size: blob.size,
      type: blob.type
    });

    // Create storage reference
    const timestamp = Date.now();
    const fileName = `${imageType}_${timestamp}.jpg`;
    const storageRef = ref(storage, `drivers/${userId}/vehicle/${fileName}`);

    // Upload file
    console.log('📤 Uploading to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        imageType,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Upload complete:', downloadURL);

    // Update Firestore
    const driverRef = doc(db, 'driverApplications', userId);
    await updateDoc(driverRef, {
      [`vehicleInfo.photos.${imageType}`]: {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: serverTimestamp(),
        imageType: imageType
      },
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      url: downloadURL,
      imageType,
      fileName
    };
  } catch (error) {
    console.error('❌ Error uploading vehicle photo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete vehicle photo
 */
export const deleteVehiclePhoto = async (userId, imageType) => {
  try {
    console.log('🗑️ Deleting vehicle photo:', { userId, imageType });

    // Get current photo info
    const driverRef = doc(db, 'driverApplications', userId);
    const driverDoc = await getDoc(driverRef);
    const driverData = driverDoc.data();

    if (driverData?.vehicleInfo?.photos?.[imageType]) {
      const fileName = driverData.vehicleInfo.photos[imageType].fileName;
      const storageRef = ref(storage, `drivers/${userId}/vehicle/${fileName}`);

      // Delete from storage
      try {
        await deleteObject(storageRef);
        console.log('✅ Deleted from storage');
      } catch (storageError) {
        console.warn('⚠️ File may not exist in storage:', storageError);
      }

      // Remove from Firestore
      const updatedPhotos = { ...driverData.vehicleInfo.photos };
      delete updatedPhotos[imageType];

      await updateDoc(driverRef, {
        'vehicleInfo.photos': updatedPhotos,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting vehicle photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get vehicle photos for current driver
 */
export const getVehiclePhotos = async (userId) => {
  try {
    const driverRef = doc(db, 'driverApplications', userId);
    const driverDoc = await getDoc(driverRef);
    const driverData = driverDoc.data();

    return driverData?.vehicleInfo?.photos || {};
  } catch (error) {
    console.error('❌ Error getting vehicle photos:', error);
    return {};
  }
};

/**
 * Bulk upload vehicle photos
 */
export const bulkUploadVehiclePhotos = async (userId, photos) => {
  const results = [];

  for (const { uri, type } of photos) {
    const result = await uploadVehiclePhoto(userId, uri, type);
    results.push({ type, ...result });
  }

  return {
    success: results.every(r => r.success),
    results,
    uploadedCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length
  };
};

export default {
  VEHICLE_IMAGE_TYPES,
  optimizeVehicleImage,
  uploadVehiclePhoto,
  deleteVehiclePhoto,
  getVehiclePhotos,
  bulkUploadVehiclePhotos
};

