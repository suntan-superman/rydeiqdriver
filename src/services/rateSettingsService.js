import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class RateSettingsService {
  constructor() {
    this.STORAGE_KEY = 'driverRateSettings';
    this.FIRESTORE_COLLECTION = 'driverRateSettings';
  }

  /**
   * Get rate settings for the current driver
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object>} Rate settings object
   */
  async getRateSettings(driverId = null) {
    try {
      // Get current user if no driverId provided
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userId = driverId || currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Try to get from Firestore first
      const firestoreSettings = await this.getFromFirestore(userId);
      if (firestoreSettings) {
        // Cache in local storage for offline access
        await this.saveToLocalStorage(firestoreSettings);
        return firestoreSettings;
      }

      // Fallback to local storage
      const localSettings = await this.getFromLocalStorage();
      if (localSettings) {
        return localSettings;
      }

      // Return default settings if nothing found
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting rate settings:', error);
      // Fallback to local storage or defaults
      const localSettings = await this.getFromLocalStorage();
      return localSettings || this.getDefaultSettings();
    }
  }

  /**
   * Save rate settings for the current driver
   * @param {Object} settings - Rate settings object
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async saveRateSettings(settings, driverId = null) {
    try {
      // Get current user if no driverId provided
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userId = driverId || currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Validate settings
      const validatedSettings = this.validateSettings(settings);
      if (!validatedSettings.isValid) {
        throw new Error(`Invalid settings: ${validatedSettings.errors.join(', ')}`);
      }

      // Save to Firestore
      await this.saveToFirestore(userId, validatedSettings.settings);

      // Save to local storage for offline access
      await this.saveToLocalStorage(validatedSettings.settings);

      return true;
    } catch (error) {
      console.error('Error saving rate settings:', error);
      
      // Fallback to local storage only
      try {
        await this.saveToLocalStorage(settings);
        return true;
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
        return false;
      }
    }
  }

  /**
   * Get settings from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Settings object or null
   */
  async getFromFirestore(userId) {
    try {
      const docRef = doc(db, this.FIRESTORE_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting from Firestore:', error);
      return null;
    }
  }

  /**
   * Save settings to Firestore
   * @param {string} userId - User ID
   * @param {Object} settings - Settings object
   * @returns {Promise<void>}
   */
  async saveToFirestore(userId, settings) {
    try {
      const docRef = doc(db, this.FIRESTORE_COLLECTION, userId);
      const settingsWithMetadata = {
        ...settings,
        lastUpdated: new Date(),
        userId: userId,
      };
      
      await setDoc(docRef, settingsWithMetadata, { merge: true });
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get settings from local storage
   * @returns {Promise<Object|null>} Settings object or null
   */
  async getFromLocalStorage() {
    try {
      const settingsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return null;
    } catch (error) {
      console.error('Error getting from local storage:', error);
      return null;
    }
  }

  /**
   * Save settings to local storage
   * @param {Object} settings - Settings object
   * @returns {Promise<void>}
   */
  async saveToLocalStorage(settings) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  }

  /**
   * Get default rate settings
   * @returns {Object} Default settings object
   */
  getDefaultSettings() {
    return {
      defaultRate: {
        pickup: 1.00,
        destination: 2.00,
      },
      timeBlocks: [
        {
          id: 'morning_rush',
          name: 'Morning Rush',
          start: '06:00',
          end: '09:00',
          pickup: 1.25,
          destination: 2.50,
          enabled: true,
        },
        {
          id: 'lunch_rush',
          name: 'Lunch Rush',
          start: '11:30',
          end: '13:00',
          pickup: 1.10,
          destination: 2.25,
          enabled: true,
        },
        {
          id: 'evening_rush',
          name: 'Evening Rush',
          start: '16:00',
          end: '18:00',
          pickup: 1.30,
          destination: 2.75,
          enabled: true,
        },
        {
          id: 'late_night',
          name: 'Late Night',
          start: '01:00',
          end: '03:00',
          pickup: 1.50,
          destination: 3.00,
          enabled: true,
        },
      ],
      autoBidEnabled: false,
      lastUpdated: new Date(),
    };
  }

  /**
   * Validate rate settings
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateSettings(settings) {
    const errors = [];

    // Validate default rates
    if (!settings.defaultRate || 
        typeof settings.defaultRate.pickup !== 'number' || 
        typeof settings.defaultRate.destination !== 'number' ||
        settings.defaultRate.pickup <= 0 || 
        settings.defaultRate.destination <= 0) {
      errors.push('Default rates must be positive numbers');
    }

    // Validate time blocks
    if (settings.timeBlocks && Array.isArray(settings.timeBlocks)) {
      settings.timeBlocks.forEach((block, index) => {
        if (block.enabled) {
          // Validate rates
          if (typeof block.pickup !== 'number' || 
              typeof block.destination !== 'number' ||
              block.pickup <= 0 || 
              block.destination <= 0) {
            errors.push(`Time block ${index + 1}: Rates must be positive numbers`);
          }

          // Validate time format
          if (!this.isValidTimeFormat(block.start) || !this.isValidTimeFormat(block.end)) {
            errors.push(`Time block ${index + 1}: Invalid time format. Use HH:MM format`);
          }

          // Validate time range
          if (this.timeToMinutes(block.start) === this.timeToMinutes(block.end)) {
            errors.push(`Time block ${index + 1}: Start and end times cannot be the same`);
          }
        }
      });
    }

    // Validate autoBidEnabled
    if (typeof settings.autoBidEnabled !== 'boolean') {
      errors.push('autoBidEnabled must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
      settings: errors.length === 0 ? settings : null,
    };
  }

  /**
   * Validate time format (HH:MM)
   * @param {string} timeString - Time string to validate
   * @returns {boolean} Is valid format
   */
  isValidTimeFormat(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Convert time string (HH:MM) to minutes
   * @param {string} timeString - Time string
   * @returns {number} Minutes from midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Reset settings to defaults
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async resetToDefaults(driverId = null) {
    try {
      const defaultSettings = this.getDefaultSettings();
      return await this.saveRateSettings(defaultSettings, driverId);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      return false;
    }
  }

  /**
   * Check if settings exist for driver
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Settings exist
   */
  async hasSettings(driverId = null) {
    try {
      const settings = await this.getRateSettings(driverId);
      return settings && settings.lastUpdated;
    } catch (error) {
      console.error('Error checking if settings exist:', error);
      return false;
    }
  }

  /**
   * Get settings metadata (last updated, etc.)
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<Object|null>} Metadata object
   */
  async getSettingsMetadata(driverId = null) {
    try {
      const settings = await this.getRateSettings(driverId);
      if (settings) {
        return {
          lastUpdated: settings.lastUpdated,
          hasCustomSettings: settings.lastUpdated && 
            settings.lastUpdated.getTime() !== this.getDefaultSettings().lastUpdated.getTime(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting settings metadata:', error);
      return null;
    }
  }

  /**
   * Sync settings between devices
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async syncSettings(driverId = null) {
    try {
      // Get current settings from local storage
      const localSettings = await this.getFromLocalStorage();
      
      if (localSettings) {
        // Save to Firestore to sync with other devices
        await this.saveToFirestore(driverId || getAuth().currentUser?.uid, localSettings);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new RateSettingsService();
