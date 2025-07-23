import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wellnessService } from '../../services/wellnessService';

export const fetchWellnessDashboard = createAsyncThunk(
  'wellness/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await wellnessService.getWellnessDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWellnessSettings = createAsyncThunk(
  'wellness/updateSettings',
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      return await wellnessService.updateWellnessSettings(userId, settings);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackWellnessActivity = createAsyncThunk(
  'wellness/trackActivity',
  async ({ userId, activity }, { rejectWithValue }) => {
    try {
      return await wellnessService.trackWellnessActivity(userId, activity);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logHealthData = createAsyncThunk(
  'wellness/logHealthData',
  async ({ userId, healthData }, { rejectWithValue }) => {
    try {
      return await wellnessService.logHealthData(userId, healthData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const reportFatigue = createAsyncThunk(
  'wellness/reportFatigue',
  async ({ userId, fatigueData }, { rejectWithValue }) => {
    try {
      return await wellnessService.reportFatigue(userId, fatigueData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSafetyAlert = createAsyncThunk(
  'wellness/createSafetyAlert',
  async ({ userId, alertData }, { rejectWithValue }) => {
    try {
      return await wellnessService.createSafetyAlert(userId, alertData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logSleepData = createAsyncThunk(
  'wellness/logSleepData',
  async ({ userId, sleepData }, { rejectWithValue }) => {
    try {
      return await wellnessService.logSleepData(userId, sleepData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackNutrition = createAsyncThunk(
  'wellness/trackNutrition',
  async ({ userId, nutritionData }, { rejectWithValue }) => {
    try {
      return await wellnessService.trackNutrition(userId, nutritionData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logMentalHealthData = createAsyncThunk(
  'wellness/logMentalHealthData',
  async ({ userId, mentalHealthData }, { rejectWithValue }) => {
    try {
      return await wellnessService.logMentalHealthData(userId, mentalHealthData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitWellnessFeedback = createAsyncThunk(
  'wellness/submitFeedback',
  async ({ userId, feedback }, { rejectWithValue }) => {
    try {
      return await wellnessService.submitWellnessFeedback(userId, feedback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const triggerEmergencyAlert = createAsyncThunk(
  'wellness/triggerEmergencyAlert',
  async ({ userId, emergencyData }, { rejectWithValue }) => {
    try {
      return await wellnessService.triggerEmergencyAlert(userId, emergencyData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const requestWellnessCheck = createAsyncThunk(
  'wellness/requestWellnessCheck',
  async ({ userId, checkData }, { rejectWithValue }) => {
    try {
      return await wellnessService.requestWellnessCheck(userId, checkData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const scheduleCounseling = createAsyncThunk(
  'wellness/scheduleCounseling',
  async ({ userId, counselingData }, { rejectWithValue }) => {
    try {
      return await wellnessService.scheduleCounseling(userId, counselingData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToWellnessUpdates = createAsyncThunk(
  'wellness/subscribeToUpdates',
  async ({ userId, callback }, { rejectWithValue }) => {
    try {
      return await wellnessService.subscribeToWellnessUpdates(userId, callback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  currentWellnessScore: 0,
  currentFatigueLevel: 0,
  currentHealthScore: 0,
  currentSleepScore: 0,
  currentStressLevel: 0,
  wellnessAlerts: [],
  safetyAlerts: [],
  emergencyAlerts: [],
  wellnessGoals: [],
  recentActivities: []
};

const wellnessSlice = createSlice({
  name: 'wellness',
  initialState,
  reducers: {
    clearWellnessError: (state) => {
      state.error = null;
    },
    updateWellnessScore: (state, action) => {
      state.currentWellnessScore = action.payload;
    },
    updateFatigueLevel: (state, action) => {
      state.currentFatigueLevel = action.payload;
    },
    updateHealthScore: (state, action) => {
      state.currentHealthScore = action.payload;
    },
    updateSleepScore: (state, action) => {
      state.currentSleepScore = action.payload;
    },
    updateStressLevel: (state, action) => {
      state.currentStressLevel = action.payload;
    },
    addWellnessAlert: (state, action) => {
      state.wellnessAlerts.unshift(action.payload);
    },
    clearWellnessAlert: (state, action) => {
      state.wellnessAlerts = state.wellnessAlerts.filter(alert => alert.id !== action.payload);
    },
    addSafetyAlert: (state, action) => {
      state.safetyAlerts.unshift(action.payload);
    },
    clearSafetyAlert: (state, action) => {
      state.safetyAlerts = state.safetyAlerts.filter(alert => alert.id !== action.payload);
    },
    addEmergencyAlert: (state, action) => {
      state.emergencyAlerts.unshift(action.payload);
    },
    clearEmergencyAlert: (state, action) => {
      state.emergencyAlerts = state.emergencyAlerts.filter(alert => alert.id !== action.payload);
    },
    addWellnessGoal: (state, action) => {
      state.wellnessGoals.unshift(action.payload);
    },
    updateWellnessGoal: (state, action) => {
      const index = state.wellnessGoals.findIndex(goal => goal.id === action.payload.id);
      if (index !== -1) {
        state.wellnessGoals[index] = action.payload;
      }
    },
    addRecentActivity: (state, action) => {
      state.recentActivities.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWellnessDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWellnessDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update wellness scores from dashboard
        if (action.payload.wellnessTracking?.wellnessScore) {
          state.currentWellnessScore = action.payload.wellnessTracking.wellnessScore;
        }
        if (action.payload.fatigueDetection?.fatigueLevel) {
          state.currentFatigueLevel = action.payload.fatigueDetection.fatigueLevel;
        }
        if (action.payload.healthMonitoring?.healthScore) {
          state.currentHealthScore = action.payload.healthMonitoring.healthScore;
        }
        if (action.payload.sleepTracking?.sleepScore) {
          state.currentSleepScore = action.payload.sleepTracking.sleepScore;
        }
        if (action.payload.stressManagement?.stressLevel) {
          state.currentStressLevel = action.payload.stressManagement.stressLevel;
        }
        // Update wellness goals
        if (action.payload.wellnessTracking?.wellnessGoals) {
          state.wellnessGoals = action.payload.wellnessTracking.wellnessGoals;
        }
        // Update alerts
        if (action.payload.safetyAlerts?.activeAlerts) {
          state.safetyAlerts = action.payload.safetyAlerts.activeAlerts;
        }
      })
      .addCase(fetchWellnessDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateWellnessSettings.fulfilled, (state, action) => {
        // Update wellness settings
        if (state.dashboard?.wellnessSettings) {
          state.dashboard.wellnessSettings = action.payload;
        }
      })
      .addCase(trackWellnessActivity.fulfilled, (state, action) => {
        // Add activity to recent activities
        state.recentActivities.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.wellnessTracking) {
          state.dashboard.wellnessTracking.wellnessActivities.unshift(action.payload);
        }
      })
      .addCase(logHealthData.fulfilled, (state, action) => {
        // Update health monitoring data
        if (state.dashboard?.healthMonitoring) {
          state.dashboard.healthMonitoring.lastUpdate = new Date();
        }
        // Update health score if provided
        if (action.payload.healthScore) {
          state.currentHealthScore = action.payload.healthScore;
        }
      })
      .addCase(reportFatigue.fulfilled, (state, action) => {
        // Update fatigue detection data
        if (state.dashboard?.fatigueDetection) {
          state.dashboard.fatigueDetection.lastUpdate = new Date();
        }
        // Update fatigue level if provided
        if (action.payload.fatigueLevel) {
          state.currentFatigueLevel = action.payload.fatigueLevel;
        }
        // Add fatigue alert if level is high
        if (action.payload.fatigueLevel >= 60) {
          state.wellnessAlerts.unshift({
            id: action.payload.id,
            type: 'fatigue',
            severity: action.payload.fatigueLevel >= 80 ? 'high' : 'medium',
            message: `Fatigue level: ${action.payload.fatigueLevel}%`,
            timestamp: action.payload.timestamp
          });
        }
      })
      .addCase(createSafetyAlert.fulfilled, (state, action) => {
        // Add safety alert
        state.safetyAlerts.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.safetyAlerts) {
          state.dashboard.safetyAlerts.activeAlerts.unshift(action.payload);
        }
      })
      .addCase(logSleepData.fulfilled, (state, action) => {
        // Update sleep tracking data
        if (state.dashboard?.sleepTracking) {
          state.dashboard.sleepTracking.lastUpdate = new Date();
        }
        // Update sleep score if provided
        if (action.payload.sleepScore) {
          state.currentSleepScore = action.payload.sleepScore;
        }
      })
      .addCase(trackNutrition.fulfilled, (state, action) => {
        // Update nutrition guidance data
        if (state.dashboard?.nutritionGuidance) {
          state.dashboard.nutritionGuidance.lastUpdate = new Date();
        }
      })
      .addCase(logMentalHealthData.fulfilled, (state, action) => {
        // Update mental health support data
        if (state.dashboard?.mentalHealthSupport) {
          state.dashboard.mentalHealthSupport.lastUpdate = new Date();
        }
        // Add mental health alert if score is low
        if (action.payload.mentalHealthScore < 50) {
          state.wellnessAlerts.unshift({
            id: action.payload.id,
            type: 'mental_health',
            severity: 'medium',
            message: 'Mental health score is low. Consider seeking support.',
            timestamp: action.payload.timestamp
          });
        }
      })
      .addCase(submitWellnessFeedback.fulfilled, (state, action) => {
        // Add feedback to analytics
        if (state.dashboard?.wellnessAnalytics) {
          state.dashboard.wellnessAnalytics.lastFeedback = action.payload;
        }
      })
      .addCase(triggerEmergencyAlert.fulfilled, (state, action) => {
        // Add emergency alert
        state.emergencyAlerts.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.safetyAlerts) {
          state.dashboard.safetyAlerts.activeAlerts.unshift(action.payload);
        }
      })
      .addCase(requestWellnessCheck.fulfilled, (state, action) => {
        // Add wellness check request
        state.wellnessAlerts.unshift({
          id: action.payload.id,
          type: 'wellness_check',
          severity: 'low',
          message: 'Wellness check requested',
          timestamp: action.payload.timestamp
        });
      })
      .addCase(scheduleCounseling.fulfilled, (state, action) => {
        // Add counseling session
        state.recentActivities.unshift({
          id: action.payload.id,
          type: 'counseling',
          title: 'Counseling Session Scheduled',
          timestamp: action.payload.scheduledAt
        });
      })
      .addCase(subscribeToWellnessUpdates.fulfilled, (state, action) => {
        // Store the subscription for cleanup
        state.wellnessSubscription = action.payload;
      });
  },
});

export const { 
  clearWellnessError, 
  updateWellnessScore,
  updateFatigueLevel,
  updateHealthScore,
  updateSleepScore,
  updateStressLevel,
  addWellnessAlert,
  clearWellnessAlert,
  addSafetyAlert,
  clearSafetyAlert,
  addEmergencyAlert,
  clearEmergencyAlert,
  addWellnessGoal,
  updateWellnessGoal,
  addRecentActivity
} = wellnessSlice.actions;
export default wellnessSlice.reducer; 