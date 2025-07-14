import { createSlice } from '@reduxjs/toolkit';
import { PLATFORM } from '@/constants';

// Initial state
const initialState = {
  isConnected: true,
  appState: 'active', // 'active', 'background', 'inactive'
  theme: 'light',
  language: 'en',
  firstLaunch: true,
  onboardingCompleted: false,
  tutorialCompleted: false,
  
  // UI State
  activeScreen: 'home',
  modalVisible: false,
  alertVisible: false,
  loadingOverlay: false,
  tabBarVisible: true,
  
  // App Settings
  settings: {
    sound: true,
    vibration: true,
    keepScreenOn: true,
    darkMode: false,
    language: 'en',
    units: 'imperial', // 'imperial' or 'metric'
    autoLock: false,
    emergencyContact: null,
    privacyMode: false
  },
  
  // Performance & Debug
  performance: {
    appLaunchTime: null,
    renderTimes: [],
    memoryUsage: null,
    debugMode: __DEV__
  },
  
  // Error handling
  errorBoundary: {
    hasError: false,
    errorInfo: null,
    errorCount: 0
  },
  
  // App version and updates
  version: {
    current: '1.0.0',
    latest: '1.0.0',
    updateAvailable: false,
    criticalUpdate: false
  },
  
  // Feature flags
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
    // Network state
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    
    // App lifecycle
    setAppState: (state, action) => {
      state.appState = action.payload;
    },
    
    // Theme and appearance
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.settings.darkMode = action.payload === 'dark';
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload;
      state.settings.language = action.payload;
    },
    
    // Onboarding and tutorials
    setFirstLaunch: (state, action) => {
      state.firstLaunch = action.payload;
    },
    
    setOnboardingCompleted: (state, action) => {
      state.onboardingCompleted = action.payload;
    },
    
    setTutorialCompleted: (state, action) => {
      state.tutorialCompleted = action.payload;
    },
    
    // UI State management
    setActiveScreen: (state, action) => {
      state.activeScreen = action.payload;
    },
    
    setModalVisible: (state, action) => {
      state.modalVisible = action.payload;
    },
    
    setAlertVisible: (state, action) => {
      state.alertVisible = action.payload;
    },
    
    setLoadingOverlay: (state, action) => {
      state.loadingOverlay = action.payload;
    },
    
    setTabBarVisible: (state, action) => {
      state.tabBarVisible = action.payload;
    },
    
    // Settings management
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setSetting: (state, action) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
    },
    
    resetSettings: (state) => {
      state.settings = initialState.settings;
    },
    
    // Performance tracking
    recordAppLaunchTime: (state, action) => {
      state.performance.appLaunchTime = action.payload;
    },
    
    recordRenderTime: (state, action) => {
      const { screen, time } = action.payload;
      state.performance.renderTimes.push({
        screen,
        time,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 render times
      if (state.performance.renderTimes.length > 50) {
        state.performance.renderTimes = state.performance.renderTimes.slice(-50);
      }
    },
    
    updateMemoryUsage: (state, action) => {
      state.performance.memoryUsage = action.payload;
    },
    
    setDebugMode: (state, action) => {
      state.performance.debugMode = action.payload;
    },
    
    // Error boundary
    setError: (state, action) => {
      state.errorBoundary.hasError = true;
      state.errorBoundary.errorInfo = action.payload;
      state.errorBoundary.errorCount += 1;
    },
    
    clearError: (state) => {
      state.errorBoundary.hasError = false;
      state.errorBoundary.errorInfo = null;
    },
    
    // Version and updates
    setVersion: (state, action) => {
      state.version.current = action.payload;
    },
    
    setLatestVersion: (state, action) => {
      state.version.latest = action.payload;
      state.version.updateAvailable = action.payload !== state.version.current;
    },
    
    setCriticalUpdate: (state, action) => {
      state.version.criticalUpdate = action.payload;
    },
    
    // Feature flags
    setFeature: (state, action) => {
      const { feature, enabled } = action.payload;
      state.features[feature] = enabled;
    },
    
    updateFeatures: (state, action) => {
      state.features = { ...state.features, ...action.payload };
    },
    
    // Bulk state updates
    hydrateApp: (state, action) => {
      // Used when restoring app state from storage
      const { settings, onboardingCompleted, tutorialCompleted, language, theme } = action.payload;
      
      if (settings) state.settings = { ...state.settings, ...settings };
      if (onboardingCompleted !== undefined) state.onboardingCompleted = onboardingCompleted;
      if (tutorialCompleted !== undefined) state.tutorialCompleted = tutorialCompleted;
      if (language) state.language = language;
      if (theme) state.theme = theme;
    },
    
    resetApp: (state) => {
      // Reset app to initial state (useful for debugging or logout)
      return {
        ...initialState,
        isConnected: state.isConnected,
        appState: state.appState,
        version: state.version,
        features: state.features,
        performance: {
          ...initialState.performance,
          debugMode: state.performance.debugMode
        }
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
  setModalVisible,
  setAlertVisible,
  setLoadingOverlay,
  setTabBarVisible,
  updateSettings,
  setSetting,
  resetSettings,
  recordAppLaunchTime,
  recordRenderTime,
  updateMemoryUsage,
  setDebugMode,
  setError,
  clearError,
  setVersion,
  setLatestVersion,
  setCriticalUpdate,
  setFeature,
  updateFeatures,
  hydrateApp,
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
export const selectModalVisible = (state) => state.app.modalVisible;
export const selectAlertVisible = (state) => state.app.alertVisible;
export const selectLoadingOverlay = (state) => state.app.loadingOverlay;
export const selectTabBarVisible = (state) => state.app.tabBarVisible;
export const selectAppSettings = (state) => state.app.settings;
export const selectAppPerformance = (state) => state.app.performance;
export const selectErrorBoundary = (state) => state.app.errorBoundary;
export const selectAppVersion = (state) => state.app.version;
export const selectAppFeatures = (state) => state.app.features;

// Helper selectors
export const selectIsDarkMode = (state) => state.app.theme === 'dark';
export const selectIsOnline = (state) => state.app.isConnected;
export const selectNeedsOnboarding = (state) => !state.app.onboardingCompleted;
export const selectNeedsTutorial = (state) => !state.app.tutorialCompleted;
export const selectHasError = (state) => state.app.errorBoundary.hasError;
export const selectUpdateAvailable = (state) => state.app.version.updateAvailable;
export const selectCriticalUpdate = (state) => state.app.version.criticalUpdate;

export const selectFeatureEnabled = (feature) => (state) => 
  state.app.features[feature] === true;

export const selectAppSetting = (setting) => (state) => 
  state.app.settings[setting];

export const selectAverageRenderTime = (state) => {
  const renderTimes = state.app.performance.renderTimes;
  if (renderTimes.length === 0) return 0;
  
  const total = renderTimes.reduce((sum, item) => sum + item.time, 0);
  return total / renderTimes.length;
};

export const selectAppHealth = (state) => {
  const { errorCount } = state.app.errorBoundary;
  const { memoryUsage } = state.app.performance;
  const averageRenderTime = selectAverageRenderTime(state);
  
  let health = 'good';
  
  if (errorCount > 5 || memoryUsage > 80 || averageRenderTime > 1000) {
    health = 'poor';
  } else if (errorCount > 2 || memoryUsage > 60 || averageRenderTime > 500) {
    health = 'fair';
  }
  
  return {
    status: health,
    errorCount,
    memoryUsage,
    averageRenderTime
  };
};

export default appSlice.reducer; 