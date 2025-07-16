// Firebase Authentication Service - Web Firebase SDK (matching working mobile app)
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../../constants/firebase';

// Initialize Firebase app only if it hasn't been initialized
let app;
let auth;
let db;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(FIREBASE_CONFIG);
  } else {
    app = getApps()[0];
  }

  // Initialize Auth with AsyncStorage persistence for React Native
  try {
    // For React Native, we need to use initializeAuth with AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      // Try fallback to basic getAuth
      try {
        auth = getAuth(app);
      } catch (fallbackError) {
        auth = null;
      }
    }
  }

  // Initialize Firestore
  if (auth) {
    db = getFirestore(app);
  } else {
    db = null;
  }

} catch (error) {
  // Fallback to basic initialization
  auth = null;
  db = null;
}

// Export Firebase instances
export { auth, db };

// Lazy getters for backward compatibility
export const getFirebaseAuth = () => {
  return auth;
};

export const getFirebaseFirestore = () => {
  return db;
};

// Legacy exports for backward compatibility with existing code
export const firebaseAuth = auth;
export const firebaseFirestore = db;
export const firebaseStorage = null; // Not implemented yet
export const firebaseMessaging = null; // Not implemented yet
export const firebaseFunctions = null; // Not implemented yet

// Authentication Services (matching working mobile app)
export class AuthService {
  // Check if Firebase Auth is available
  static isAuthAvailable() {
    return auth !== null && auth !== undefined;
  }

  // Sign up with email and password
  static async signUp(email, password, userData = {}) {
    try {
      if (!this.isAuthAvailable()) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name,
        });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        pushToken: userData.pushToken || null,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        ...userData,
      });
      
      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || userData.name,
          emailVerified: user.emailVerified,
        },
        needsEmailVerification: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  }
  
  // Sign in with email and password
  static async signIn(email, password) {
    try {
      if (!this.isAuthAvailable()) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || userData.name,
          emailVerified: user.emailVerified,
          ...userData,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  }
  
  // Sign out
  static async signOut() {
    try {
      if (!this.isAuthAvailable()) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  }
  
  // Reset password
  static async resetPassword(email) {
    try {
      if (!this.isAuthAvailable()) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  }
  
  // Get current user
  static getCurrentUser() {
    if (!this.isAuthAvailable()) {
      return null;
    }
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    if (!this.isAuthAvailable()) {
      // Firebase Auth not available, callback will not be registered
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  }
  
  // Convert Firebase error codes to user-friendly messages
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'The email or password you entered is incorrect.',
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }
}

// Default export for convenience
export default {
  auth: getFirebaseAuth,
  firestore: getFirebaseFirestore,
  AuthService
}; 