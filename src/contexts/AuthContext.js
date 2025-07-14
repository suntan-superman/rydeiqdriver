import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const AuthContext = createContext({});

const STORAGE_KEYS = {
  CREDENTIALS: 'driver_credentials',
  USER_DATA: 'driver_user_data',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return unsubscribe;
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

  // Clear saved credentials
  const clearSavedCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.CREDENTIALS);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      return { success: false, error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Save user data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastSignIn: new Date().toISOString(),
      };
      
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'An error occurred during sign in';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Sign in failed';
      }
      
      return { 
        success: false, 
        error: { 
          code: error.code, 
          message: errorMessage 
        } 
      };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update user profile
      if (displayName) {
        await user.updateProfile({ displayName });
      }
      
      // Send email verification
      await user.sendEmailVerification();
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
      };
      
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'An error occurred during account creation';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Account creation failed';
      }
      
      return { 
        success: false, 
        error: { 
          code: error.code, 
          message: errorMessage 
        } 
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await auth().signOut();
      await clearSavedCredentials();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Password reset failed';
      }
      
      return { 
        success: false, 
        error: { 
          code: error.code, 
          message: errorMessage 
        } 
      };
    }
  };

  // Resend email verification
  const resendEmailVerification = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
        return { success: true };
      }
      return { success: false, error: { message: 'No user is currently signed in' } };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error };
    }
  };

  // Check if email is verified
  const checkEmailVerification = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.reload();
        return { success: true, emailVerified: currentUser.emailVerified };
      }
      return { success: false, error: { message: 'No user is currently signed in' } };
    } catch (error) {
      console.error('Email verification check error:', error);
      return { success: false, error };
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