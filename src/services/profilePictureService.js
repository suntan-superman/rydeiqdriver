import { db, storage } from '@/services/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

class ProfilePictureService {
  constructor() {
    this.defaultPictures = null;
    this.cache = new Map();
  }

  /**
   * Get default profile pictures from Firestore
   */
  async getDefaultProfilePictures() {
    try {
      if (this.defaultPictures) {
        return this.defaultPictures;
      }

      const docRef = doc(db, 'appConfig', 'defaultProfilePictures');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.defaultPictures = data.pictures || {};
        return this.defaultPictures;
      } else {
        // Return fallback placeholder URLs using a React Native-friendly service
        this.defaultPictures = {
          'male-1.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=MALE-1&backgroundColor=4F46E5&size=200',
          'male-2.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=MALE-2&backgroundColor=4F46E5&size=200',
          'female-1.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=FEMALE-1&backgroundColor=EC4899&size=200',
          'female-2.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=FEMALE-2&backgroundColor=EC4899&size=200'
        };
        return this.defaultPictures;
      }
    } catch (error) {
      // Return fallback placeholder URLs on error using a React Native-friendly service
      this.defaultPictures = {
        'male-1.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=MALE-1&backgroundColor=4F46E5&size=200',
        'male-2.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=MALE-2&backgroundColor=4F46E5&size=200',
        'female-1.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=FEMALE-1&backgroundColor=EC4899&size=200',
        'female-2.jpg': 'https://api.dicebear.com/7.x/avataaars/png?seed=FEMALE-2&backgroundColor=EC4899&size=200'
      };
      return this.defaultPictures;
    }
  }

  /**
   * Get a random profile picture based on gender
   */
  async getRandomProfilePicture(gender = 'male') {
    try {
      const pictures = await this.getDefaultProfilePictures();
      const genderPictures = Object.entries(pictures).filter(([filename]) => 
        filename.startsWith(gender)
      );
      
      if (genderPictures.length > 0) {
        const randomIndex = Math.floor(Math.random() * genderPictures.length);
        const [filename, url] = genderPictures[randomIndex];
        return { filename, url };
      }
      
      // Fallback to any picture
      const allPictures = Object.entries(pictures);
      if (allPictures.length > 0) {
        const randomIndex = Math.floor(Math.random() * allPictures.length);
        const [filename, url] = allPictures[randomIndex];
        return { filename, url };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting random profile picture:', error);
      return null;
    }
  }

  /**
   * Get profile picture for a specific user
   */
  async getUserProfilePicture(userId, gender = 'male') {
    try {
      // Check cache first
      if (this.cache.has(userId)) {
        return this.cache.get(userId);
      }

      // Try to get user's custom profile picture from Firestore (matching web app structure)
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.photoURL || userData.profilePicture) {
          const photoUrl = userData.photoURL || userData.profilePicture;
          this.cache.set(userId, photoUrl);
          return photoUrl;
        }
      }

      // Try to get driver's profile picture from driverApplications collection
      const driverApplicationDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driverApplicationDoc.exists()) {
        const driverData = driverApplicationDoc.data();
        if (driverData.photoURL || driverData.profilePicture) {
          const photoUrl = driverData.photoURL || driverData.profilePicture;
          this.cache.set(userId, photoUrl);
          return photoUrl;
        }
      }

      // Try to get driver's profile picture from drivers collection (web app structure)
      const driversDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driversDoc.exists()) {
        const driverData = driversDoc.data();
        if (driverData.photoURL || driverData.profilePicture) {
          const photoUrl = driverData.photoURL || driverData.profilePicture;
          this.cache.set(userId, photoUrl);
          return photoUrl;
        }
        
        // Check if profile photo is in documents structure (web app format)
        if (driverData.documents?.profile_photo?.url) {
          const photoUrl = driverData.documents.profile_photo.url;
          this.cache.set(userId, photoUrl);
          return photoUrl;
        }
      }

      // Fallback to random default picture
      const randomPicture = await this.getRandomProfilePicture(gender);
      if (randomPicture) {
        this.cache.set(userId, randomPicture.url);
        return randomPicture.url;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting user profile picture:', error);
      return null;
    }
  }

  /**
   * Get profile picture for driver (with car icon fallback)
   */
  async getDriverProfilePicture(driverId, gender = 'male') {
    try {
      const pictureUrl = await this.getUserProfilePicture(driverId, gender);
      return pictureUrl;
    } catch (error) {
      console.error('❌ Error getting driver profile picture:', error);
      return null;
    }
  }

  /**
   * Get profile picture for rider
   */
  async getRiderProfilePicture(riderId, gender = 'male') {
    try {
      const pictureUrl = await this.getUserProfilePicture(riderId, gender);
      return pictureUrl;
    } catch (error) {
      console.error('❌ Error getting rider profile picture:', error);
      return null;
    }
  }

  /**
   * Upload profile picture to Firebase Storage
   */
  async uploadProfilePicture(userId, imageUri) {
    try {
      console.log('📸 Uploading profile picture for user:', userId);
      
      if (!imageUri) {
        throw new Error('No image provided');
      }

      // Convert URI to blob for React Native
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create storage reference (matching web app structure)
      const fileName = `profile_photo.jpg`;
      const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);
      
      // Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('📸 Upload completed:', snapshot);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📸 Download URL:', downloadURL);
      
      // Update Firebase Auth photoURL
      const { auth } = await import('@/services/firebase/config');
      if (auth && auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        console.log('📸 Firebase Auth photoURL updated');
      }
      
      // Update Firestore documents (matching web app structure)
      const updates = [
        updateDoc(doc(db, 'users', userId), {
          photoURL: downloadURL,
          profilePicture: downloadURL,
          updatedAt: new Date().toISOString()
        })
      ];
      
      // Also update driverApplications and drivers collections if they exist
      const driverApplicationDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driverApplicationDoc.exists()) {
        updates.push(
          updateDoc(doc(db, 'driverApplications', userId), {
            photoURL: downloadURL,
            profilePicture: downloadURL,
            updatedAt: new Date().toISOString()
          })
        );
      }
      
      // Update drivers collection (matching web app driver document structure)
      const driversDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driversDoc.exists()) {
        updates.push(
          updateDoc(doc(db, 'driverApplications', userId), {
            photoURL: downloadURL,
            profilePicture: downloadURL,
            'documents.profile_photo': {
              url: downloadURL,
              fileName: fileName,
              uploadedAt: new Date().toISOString(),
              verified: false
            },
            updatedAt: new Date().toISOString()
          })
        );
      }
      
      await Promise.all(updates);
      console.log('📸 Firestore updated with profile photo');
      
      // Update cache
      this.cache.set(userId, downloadURL);
      
      return {
        success: true,
        photoURL: downloadURL,
        fileName: fileName
      };
      
    } catch (error) {
      console.error('❌ Profile picture upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete profile picture from Firebase Storage
   */
  async deleteProfilePicture(userId, fileName = 'profile_photo.jpg') {
    try {
      const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);
      await deleteObject(storageRef);
      
      // Update Firebase Auth
      const { auth } = await import('@/services/firebase/config');
      if (auth && auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: null });
      }
      
      // Update Firestore documents (matching web app structure)
      const updates = [
        updateDoc(doc(db, 'users', userId), {
          photoURL: null,
          profilePicture: null,
          updatedAt: new Date().toISOString()
        })
      ];
      
      // Also update driverApplications and drivers collections if they exist
      const driverApplicationDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driverApplicationDoc.exists()) {
        updates.push(
          updateDoc(doc(db, 'driverApplications', userId), {
            photoURL: null,
            profilePicture: null,
            updatedAt: new Date().toISOString()
          })
        );
      }
      
      // Update drivers collection (remove profile_photo document)
      const driversDoc = await getDoc(doc(db, 'driverApplications', userId));
      if (driversDoc.exists()) {
        const driverData = driversDoc.data();
        const updatedDocuments = { ...driverData.documents };
        delete updatedDocuments.profile_photo;
        
        updates.push(
          updateDoc(doc(db, 'driverApplications', userId), {
            photoURL: null,
            profilePicture: null,
            documents: updatedDocuments,
            updatedAt: new Date().toISOString()
          })
        );
      }
      
      await Promise.all(updates);
      
      // Clear cache
      this.cache.delete(userId);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Profile picture deletion error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.defaultPictures = null;
  }
}

export const profilePictureService = new ProfilePictureService();
