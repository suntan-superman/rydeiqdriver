import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Remove module-level Firebase import - make it lazy instead
// import { firebaseAuth } from '@/services/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Lazy Firebase getter
const getFirebaseAuth = () => {
  try {
    const { firebaseAuth } = require('@/services/firebase/config');
    return firebaseAuth;
  } catch (error) {
    // Firebase auth not available in authSlice
    return null;
  }
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  hasOnboarded: false,
  phoneVerified: false,
  documentsUploaded: false,
  backgroundCheck: 'pending', // 'pending', 'approved', 'rejected'
  accountStatus: 'inactive' // 'inactive', 'active', 'suspended'
};

// Async thunks
export const signInWithPhone = createAsyncThunk(
  'auth/signInWithPhone',
  async ({ phoneNumber }, { rejectWithValue }) => {
    try {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        return rejectWithValue('Firebase auth not available');
      }
      const confirmation = await firebaseAuth.signInWithPhoneNumber(phoneNumber);
      return { phoneNumber, confirmation };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyPhoneCode = createAsyncThunk(
  'auth/verifyPhoneCode',
  async ({ confirmation, code }, { rejectWithValue }) => {
    try {
      const userCredential = await confirmation.confirm(code);
      const user = userCredential.user;
      
      // Store user token
      const token = await user.getIdToken();
      await AsyncStorage.setItem('userToken', token);
      
      return {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      // Google Sign-In implementation will be added here
      // This is a placeholder for the Google authentication flow
      return rejectWithValue('Google Sign-In not implemented yet');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        return rejectWithValue('Firebase auth not available');
      }
      await firebaseAuth.signOut();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('biometricEnabled');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, { rejectWithValue }) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return rejectWithValue('Biometric authentication not available');
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use PIN'
      });
      
      if (result.success) {
        await AsyncStorage.setItem('biometricEnabled', 'true');
        return true;
      } else {
        return rejectWithValue('Biometric authentication failed');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const authenticateWithBiometric = createAsyncThunk(
  'auth/authenticateWithBiometric',
  async (_, { rejectWithValue }) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use PIN'
      });
      
      if (result.success) {
        // Get stored user token and validate
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          return { biometricSuccess: true };
        } else {
          return rejectWithValue('No stored authentication found');
        }
      } else {
        return rejectWithValue('Biometric authentication failed');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        return rejectWithValue('Firebase auth not available');
      }
      const user = firebaseAuth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        
        return {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setOnboarded: (state, action) => {
      state.hasOnboarded = action.payload;
    },
    setDocumentsUploaded: (state, action) => {
      state.documentsUploaded = action.payload;
    },
    setBackgroundCheck: (state, action) => {
      state.backgroundCheck = action.payload;
    },
    setAccountStatus: (state, action) => {
      state.accountStatus = action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Sign in with phone
      .addCase(signInWithPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        // Store confirmation for verification step
      })
      .addCase(signInWithPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Verify phone code
      .addCase(verifyPhoneCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPhoneCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.phoneVerified = true;
      })
      .addCase(verifyPhoneCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Google sign in
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Sign out
      .addCase(signOut.fulfilled, (state) => {
        return initialState; // Reset to initial state
      })
      
      // Enable biometric
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      })
      .addCase(enableBiometric.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Biometric authentication
      .addCase(authenticateWithBiometric.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(authenticateWithBiometric.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = true;
      })
      .addCase(authenticateWithBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Check auth state
      .addCase(checkAuthState.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      });
  }
});

// Export actions
export const {
  clearError,
  setOnboarded,
  setDocumentsUploaded,
  setBackgroundCheck,
  setAccountStatus,
  updateUserProfile
} = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectBiometricEnabled = (state) => state.auth.biometricEnabled;
export const selectHasOnboarded = (state) => state.auth.hasOnboarded;
export const selectAccountStatus = (state) => state.auth.accountStatus;

export default authSlice.reducer; 