import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accessibilityService } from '../../services/accessibilityService';

export const fetchAccessibilityDashboard = createAsyncThunk(
  'accessibility/fetchDashboard',
  async ({ userId }, { rejectWithValue }) => {
    try {
      return await accessibilityService.getAccessibilityDashboard(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAccessibilitySettings = createAsyncThunk(
  'accessibility/updateSettings',
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      return await accessibilityService.updateAccessibilitySettings(userId, settings);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveAccessibilityProfile = createAsyncThunk(
  'accessibility/saveProfile',
  async ({ userId, profileName, settings }, { rejectWithValue }) => {
    try {
      return await accessibilityService.saveAccessibilityProfile(userId, profileName, settings);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadAccessibilityProfile = createAsyncThunk(
  'accessibility/loadProfile',
  async ({ userId, profileId }, { rejectWithValue }) => {
    try {
      return await accessibilityService.loadAccessibilityProfile(userId, profileId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackAccessibilityUsage = createAsyncThunk(
  'accessibility/trackUsage',
  async ({ userId, feature, duration }, { rejectWithValue }) => {
    try {
      return await accessibilityService.trackAccessibilityUsage(userId, feature, duration);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitAccessibilityFeedback = createAsyncThunk(
  'accessibility/submitFeedback',
  async ({ userId, feedback }, { rejectWithValue }) => {
    try {
      return await accessibilityService.submitAccessibilityFeedback(userId, feedback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const runAccessibilityAudit = createAsyncThunk(
  'accessibility/runAudit',
  async ({ userId }, { rejectWithValue }) => {
    try {
      return await accessibilityService.runAccessibilityAudit(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const startVoiceNavigation = createAsyncThunk(
  'accessibility/startVoiceNavigation',
  async ({ userId }, { rejectWithValue }) => {
    try {
      return await accessibilityService.startVoiceNavigation(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const processVoiceCommand = createAsyncThunk(
  'accessibility/processVoiceCommand',
  async ({ userId, command }, { rejectWithValue }) => {
    try {
      return await accessibilityService.processVoiceCommand(userId, command);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const announceToScreenReader = createAsyncThunk(
  'accessibility/announceToScreenReader',
  async ({ userId, message }, { rejectWithValue }) => {
    try {
      return await accessibilityService.announceToScreenReader(userId, message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToAccessibilityUpdates = createAsyncThunk(
  'accessibility/subscribeToUpdates',
  async ({ userId, callback }, { rejectWithValue }) => {
    try {
      return await accessibilityService.subscribeToAccessibilityUpdates(userId, callback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  currentSettings: null,
  savedProfiles: [],
  voiceNavigationActive: false,
  accessibilityAlerts: [],
  complianceStatus: null,
  recentAudit: null
};

const accessibilitySlice = createSlice({
  name: 'accessibility',
  initialState,
  reducers: {
    clearAccessibilityError: (state) => {
      state.error = null;
    },
    updateCurrentSettings: (state, action) => {
      state.currentSettings = action.payload;
    },
    addAccessibilityAlert: (state, action) => {
      state.accessibilityAlerts.unshift(action.payload);
    },
    clearAccessibilityAlert: (state, action) => {
      state.accessibilityAlerts = state.accessibilityAlerts.filter(alert => alert.id !== action.payload);
    },
    toggleVoiceNavigation: (state, action) => {
      state.voiceNavigationActive = action.payload;
    },
    updateComplianceStatus: (state, action) => {
      state.complianceStatus = action.payload;
    },
    updateRecentAudit: (state, action) => {
      state.recentAudit = action.payload;
    },
    addSavedProfile: (state, action) => {
      state.savedProfiles.unshift(action.payload);
    },
    removeSavedProfile: (state, action) => {
      state.savedProfiles = state.savedProfiles.filter(profile => profile.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessibilityDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccessibilityDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update current settings from dashboard
        if (action.payload.accessibilitySettings?.currentSettings) {
          state.currentSettings = action.payload.accessibilitySettings.currentSettings;
        }
        // Update saved profiles
        if (action.payload.accessibilitySettings?.savedProfiles) {
          state.savedProfiles = action.payload.accessibilitySettings.savedProfiles;
        }
        // Update compliance status
        if (action.payload.accessibilityAnalytics?.accessibilityCompliance) {
          state.complianceStatus = action.payload.accessibilityAnalytics.accessibilityCompliance;
        }
      })
      .addCase(fetchAccessibilityDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateAccessibilitySettings.fulfilled, (state, action) => {
        // Update current settings
        state.currentSettings = action.payload;
        // Update dashboard if available
        if (state.dashboard?.accessibilitySettings) {
          state.dashboard.accessibilitySettings.currentSettings = action.payload;
        }
      })
      .addCase(saveAccessibilityProfile.fulfilled, (state, action) => {
        // Add the new profile to saved profiles
        state.savedProfiles.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.accessibilitySettings) {
          state.dashboard.accessibilitySettings.savedProfiles.unshift(action.payload);
        }
      })
      .addCase(loadAccessibilityProfile.fulfilled, (state, action) => {
        // Load the profile settings
        if (action.payload) {
          state.currentSettings = action.payload.settings;
        }
      })
      .addCase(trackAccessibilityUsage.fulfilled, (state, action) => {
        // Track usage in analytics
        if (state.dashboard?.accessibilityAnalytics) {
          // This would typically update the analytics data
          state.dashboard.accessibilityAnalytics.lastUpdate = new Date();
        }
      })
      .addCase(submitAccessibilityFeedback.fulfilled, (state, action) => {
        // Add feedback to analytics
        if (state.dashboard?.accessibilityAnalytics) {
          // This would typically add the feedback to the analytics
          state.dashboard.accessibilityAnalytics.lastFeedback = action.payload;
        }
      })
      .addCase(runAccessibilityAudit.fulfilled, (state, action) => {
        // Update recent audit
        state.recentAudit = action.payload;
        // Update compliance status
        if (action.payload) {
          state.complianceStatus = {
            wcag2_1: action.payload.wcag2_1,
            section508: action.payload.section508,
            ada: action.payload.ada,
            lastAudit: action.payload.auditDate
          };
        }
      })
      .addCase(startVoiceNavigation.fulfilled, (state, action) => {
        // Activate voice navigation
        state.voiceNavigationActive = true;
        // Update dashboard if available
        if (state.dashboard?.voiceNavigation) {
          state.dashboard.voiceNavigation.status = 'active';
        }
      })
      .addCase(processVoiceCommand.fulfilled, (state, action) => {
        // Process voice command
        if (state.dashboard?.voiceNavigation) {
          // This would typically update the voice navigation data
          state.dashboard.voiceNavigation.lastCommand = action.payload;
        }
      })
      .addCase(announceToScreenReader.fulfilled, (state, action) => {
        // Announce to screen reader
        if (state.dashboard?.screenReader) {
          // This would typically update the screen reader data
          state.dashboard.screenReader.lastAnnouncement = action.payload;
        }
      })
      .addCase(subscribeToAccessibilityUpdates.fulfilled, (state, action) => {
        // Store the subscription for cleanup
        state.accessibilitySubscription = action.payload;
      });
  },
});

export const { 
  clearAccessibilityError, 
  updateCurrentSettings,
  addAccessibilityAlert,
  clearAccessibilityAlert,
  toggleVoiceNavigation,
  updateComplianceStatus,
  updateRecentAudit,
  addSavedProfile,
  removeSavedProfile
} = accessibilitySlice.actions;
export default accessibilitySlice.reducer; 