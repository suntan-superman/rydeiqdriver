import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

// Temporary constants
const PLATFORM = {
  ios: 'ios',
  android: 'android',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android'
};

// Minimal initial state for testing
const initialState = {
  isConnected: true,
  appState: 'active',
  theme: 'light',
  language: 'en',
  firstLaunch: true,
  onboardingCompleted: false,
  tutorialCompleted: false,
  activeScreen: 'home',
  modalVisible: false,
  alertVisible: false,
  loadingOverlay: false,
  tabBarVisible: true,
  settings: {
    sound: true,
    vibration: true,
    keepScreenOn: true,
    darkMode: false,
    language: 'en',
    units: 'imperial',
    autoLock: false,
    emergencyContact: null,
    privacyMode: false
  },
  performance: {
    appLaunchTime: null,
    renderTimes: [],
    memoryUsage: null,
    debugMode: __DEV__
  },
  errorBoundary: {
    hasError: false,
    errorInfo: null,
    errorCount: 0
  },
  version: {
    current: '1.0.0',
    latest: '1.0.0',
    updateAvailable: false,
    criticalUpdate: false
  },
  features: {
    biometricAuth: true,
    carPlay: PLATFORM.isIOS,
    androidAuto: PLATFORM.isAndroid,
    voiceCommands: true,
    backgroundLocation: true,
    instantPayouts: true
  }
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setAppState: (state, action) => {
      state.appState = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.settings.darkMode = action.payload === 'dark';
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      state.settings.language = action.payload;
    },
    setFirstLaunch: (state, action) => {
      state.firstLaunch = action.payload;
    },
    setOnboardingCompleted: (state, action) => {
      state.onboardingCompleted = action.payload;
    },
    setTutorialCompleted: (state, action) => {
      state.tutorialCompleted = action.payload;
    },
    setActiveScreen: (state, action) => {
      state.activeScreen = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    recordError: (state, action) => {
      state.errorBoundary.hasError = true;
      state.errorBoundary.errorInfo = action.payload;
      state.errorBoundary.errorCount += 1;
    },
    clearError: (state) => {
      state.errorBoundary.hasError = false;
      state.errorBoundary.errorInfo = null;
    },
    resetApp: (state) => {
      return {
        ...initialState,
        settings: state.settings,
        onboardingCompleted: state.onboardingCompleted,
        tutorialCompleted: state.tutorialCompleted
      };
    }
  }
});

// Export actions
export const {
  setConnectionStatus,
  setAppState,
  setTheme,
  setLanguage,
  setFirstLaunch,
  setOnboardingCompleted,
  setTutorialCompleted,
  setActiveScreen,
  updateSettings,
  recordError,
  clearError,
  resetApp
} = appSlice.actions;

// Selectors
export const selectIsConnected = (state) => state.app.isConnected;
export const selectAppState = (state) => state.app.appState;
export const selectTheme = (state) => state.app.theme;
export const selectLanguage = (state) => state.app.language;
export const selectFirstLaunch = (state) => state.app.firstLaunch;
export const selectOnboardingCompleted = (state) => state.app.onboardingCompleted;
export const selectTutorialCompleted = (state) => state.app.tutorialCompleted;
export const selectActiveScreen = (state) => state.app.activeScreen;
export const selectSettings = (state) => state.app.settings;
export const selectErrorBoundary = (state) => state.app.errorBoundary;
export const selectVersion = (state) => state.app.version;
export const selectFeatures = (state) => state.app.features;

export default appSlice.reducer; 