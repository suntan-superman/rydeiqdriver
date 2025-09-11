import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { auth, AuthService } from '../services/firebase/config';
import { playSignInOutSound } from '../utils/soundEffects';

const AuthContext = createContext({});

const STORAGE_KEYS = {
  CREDENTIALS: 'driver_credentials',
  USER_DATA: 'driver_user_data',
  USER_PROFILE: 'driver_profile_data', // For larger profile data in AsyncStorage
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    try {
      if (!AuthService.isAuthAvailable()) {
        setLoading(false);
        return;
      }

      const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch driver data from Firestore
          try {
            const result = await AuthService.fetchDriverData(firebaseUser.uid);
            
            if (result.success && result.driverData) {
              const userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || result.driverData?.displayName || 'Driver',
                emailVerified: firebaseUser.emailVerified,
                // Include all driver data from Firestore (safely)
                ...(result.driverData || {}),
              };
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // Fallback to basic user data if Firestore fetch fails
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                emailVerified: firebaseUser.emailVerified,
              });
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Failed to fetch driver data:', error);
            // Fallback to basic user data
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
            });
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      setLoading(false);
    }
  }, []);

  // Test SecureStore functionality
  const testSecureStore = async () => {
    try {
      const testKey = 'test_key';
      const testValue = 'test_value';
      
      await SecureStore.setItemAsync(testKey, testValue);
      const retrievedValue = await SecureStore.getItemAsync(testKey);
      await SecureStore.deleteItemAsync(testKey);
      
      return retrievedValue === testValue;
    } catch (error) {
      console.error('SecureStore test failed:', error);
      return false;
    }
  };

  // Save credentials securely
  const saveCredentials = async (email, password) => {
    try {
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(STORAGE_KEYS.CREDENTIALS, credentials);
      return { success: true };
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return { success: false, error };
    }
  };

  // Load saved credentials
  const loadSavedCredentials = async () => {
    try {
      const credentialsString = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
      if (credentialsString) {
        const credentials = JSON.parse(credentialsString);
        return { success: true, credentials };
      }
      return { success: false, message: 'No saved credentials found' };
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return { success: false, error };
    }
  };

  // Load full user profile from AsyncStorage
  const loadUserProfile = async () => {
    try {
      const profileString = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (profileString) {
        const profile = JSON.parse(profileString);
        return { success: true, profile };
      }
      return { success: false, message: 'No saved profile found' };
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return { success: false, error };
    }
  };

  // Clear saved credentials
  const clearSavedCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.CREDENTIALS);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      return { success: false, error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        // Save essential user data to SecureStore (keep under 2048 bytes)
        const essentialUserData = {
          uid: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
          lastSignIn: new Date().toISOString(),
        };
        
        // Save larger profile data to AsyncStorage
        const fullUserData = {
          ...essentialUserData,
          photoURL: result.user.photoURL || null,
          // Include all driver data from Firestore
          ...result.user,
        };
        
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(essentialUserData));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fullUserData));
        
        return { success: true, user: fullUserData };
      } else {
        return result; // Return the error from AuthService
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: { 
          message: 'An unexpected error occurred during sign in'
        } 
      };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName) => {
    try {
      const result = await AuthService.signUp(email, password, { name: displayName });
      
      if (result.success) {
        // Save essential user data to SecureStore (keep under 2048 bytes)
        const essentialUserData = {
          uid: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
          createdAt: new Date().toISOString(),
        };
        
        // Save larger profile data to AsyncStorage
        const fullUserData = {
          ...essentialUserData,
          photoURL: result.user.photoURL || null,
          // Include all driver data from Firestore
          ...result.user,
        };
        
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(essentialUserData));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fullUserData));
        
        return { success: true, user: fullUserData };
      } else {
        return result; // Return the error from AuthService
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: { 
          message: 'An unexpected error occurred during account creation'
        } 
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const result = await AuthService.signOut();
      if (result.success) {
        // Don't clear saved credentials on sign out - let user decide with "Remember Me"
        // await clearSavedCredentials();
        // Play sign out sound
        playSignInOutSound();
      }
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: { message: 'An unexpected error occurred during sign out' } };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const result = await AuthService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: { 
          message: 'An unexpected error occurred while sending password reset email'
        } 
      };
    }
  };

  // Resend email verification
  const resendEmailVerification = async () => {
    try {
      if (!AuthService.isAuthAvailable()) {
        return { success: false, error: { message: 'Firebase auth not available' } };
      }
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(currentUser);
        return { success: true };
      }
      return { success: false, error: { message: 'No user is currently signed in' } };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: { message: 'Failed to send email verification' } };
    }
  };

  // Check if email is verified
  const checkEmailVerification = async () => {
    try {
      if (!AuthService.isAuthAvailable()) {
        return { success: false, error: { message: 'Firebase auth not available' } };
      }
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        await currentUser.reload();
        return { success: true, emailVerified: currentUser.emailVerified };
      }
      return { success: false, error: { message: 'No user is currently signed in' } };
    } catch (error) {
      console.error('Email verification check error:', error);
      return { success: false, error: { message: 'Failed to check email verification status' } };
    }
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendEmailVerification,
    checkEmailVerification,
    
    // Credential management
    saveCredentials,
    loadSavedCredentials,
    loadUserProfile,
    clearSavedCredentials,
    testSecureStore,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext }; 