import { db } from '@/services/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

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

      // Try to get user's custom profile picture
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profilePicture) {
          this.cache.set(userId, userData.profilePicture);
          return userData.profilePicture;
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
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.defaultPictures = null;
  }
}

export const profilePictureService = new ProfilePictureService();
