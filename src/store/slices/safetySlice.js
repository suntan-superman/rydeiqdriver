import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { safetyService } from '../../services/safetyService';

export const fetchSafetyDashboard = createAsyncThunk(
  'safety/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await safetyService.getSafetyDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const reportIncident = createAsyncThunk(
  'safety/reportIncident',
  async (incidentData, { rejectWithValue }) => {
    try {
      return await safetyService.reportIncident(incidentData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const triggerPanicAlert = createAsyncThunk(
  'safety/triggerPanicAlert',
  async ({ userId, location }, { rejectWithValue }) => {
    try {
      return await safetyService.triggerPanicAlert(userId, location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateEmergencyContacts = createAsyncThunk(
  'safety/updateEmergencyContacts',
  async ({ userId, contacts }, { rejectWithValue }) => {
    try {
      return await safetyService.updateEmergencyContacts(contacts);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  panicAlertActive: false,
  recentIncidents: [],
  emergencyContacts: []
};

const safetySlice = createSlice({
  name: 'safety',
  initialState,
  reducers: {
    clearSafetyError: (state) => {
      state.error = null;
    },
    setPanicAlertActive: (state, action) => {
      state.panicAlertActive = action.payload;
    },
    addRecentIncident: (state, action) => {
      state.recentIncidents.unshift(action.payload);
    },
    updateEmergencyContactsLocal: (state, action) => {
      state.emergencyContacts = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSafetyDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSafetyDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchSafetyDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(reportIncident.fulfilled, (state, action) => {
        // Add the new incident to the dashboard
        if (state.dashboard?.incidentReporting?.reports) {
          state.dashboard.incidentReporting.reports.unshift(action.payload);
          state.dashboard.incidentReporting.totalReports += 1;
        }
        // Add to recent incidents
        state.recentIncidents.unshift(action.payload);
      })
      .addCase(triggerPanicAlert.fulfilled, (state, action) => {
        state.panicAlertActive = true;
        // Add to recent incidents
        state.recentIncidents.unshift({
          ...action.payload,
          type: 'panic_alert',
          severity: 'critical'
        });
      })
      .addCase(updateEmergencyContacts.fulfilled, (state, action) => {
        // Update emergency contacts in dashboard
        if (state.dashboard?.emergencyProtocols) {
          state.dashboard.emergencyProtocols.emergencyContacts = action.payload;
        }
        state.emergencyContacts = action.payload;
      });
  },
});

export const { 
  clearSafetyError, 
  setPanicAlertActive, 
  addRecentIncident, 
  updateEmergencyContactsLocal 
} = safetySlice.actions;
export default safetySlice.reducer; 