import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vehicleService } from '../../services/vehicleService';

export const fetchVehicleDashboard = createAsyncThunk(
  'vehicle/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await vehicleService.getVehicleDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addMaintenanceRecord = createAsyncThunk(
  'vehicle/addMaintenanceRecord',
  async (maintenanceData, { rejectWithValue }) => {
    try {
      return await vehicleService.addMaintenanceRecord(maintenanceData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addFuelRecord = createAsyncThunk(
  'vehicle/addFuelRecord',
  async (fuelData, { rejectWithValue }) => {
    try {
      return await vehicleService.addFuelRecord(fuelData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCostRecord = createAsyncThunk(
  'vehicle/addCostRecord',
  async (costData, { rejectWithValue }) => {
    try {
      return await vehicleService.addCostRecord(costData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMaintenanceStatus = createAsyncThunk(
  'vehicle/updateMaintenanceStatus',
  async ({ maintenanceId, status }, { rejectWithValue }) => {
    try {
      return await vehicleService.updateMaintenanceStatus(maintenanceId, status);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateVehicleLocation = createAsyncThunk(
  'vehicle/updateVehicleLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      return await vehicleService.updateVehicleLocation(locationData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  currentLocation: null,
  maintenanceAlerts: [],
  fuelAlerts: [],
  costAlerts: []
};

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    clearVehicleError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    addMaintenanceAlert: (state, action) => {
      state.maintenanceAlerts.unshift(action.payload);
    },
    addFuelAlert: (state, action) => {
      state.fuelAlerts.unshift(action.payload);
    },
    addCostAlert: (state, action) => {
      state.costAlerts.unshift(action.payload);
    },
    clearMaintenanceAlert: (state, action) => {
      state.maintenanceAlerts = state.maintenanceAlerts.filter(alert => alert.id !== action.payload);
    },
    clearFuelAlert: (state, action) => {
      state.fuelAlerts = state.fuelAlerts.filter(alert => alert.id !== action.payload);
    },
    clearCostAlert: (state, action) => {
      state.costAlerts = state.costAlerts.filter(alert => alert.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicleDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update current location from tracking data
        if (action.payload.vehicleTracking?.currentLocation) {
          state.currentLocation = action.payload.vehicleTracking.currentLocation;
        }
      })
      .addCase(fetchVehicleDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addMaintenanceRecord.fulfilled, (state, action) => {
        // Add the new maintenance record to the dashboard
        if (state.dashboard?.maintenance) {
          state.dashboard.maintenance.scheduledMaintenance.push(action.payload);
        }
      })
      .addCase(addFuelRecord.fulfilled, (state, action) => {
        // Add the new fuel record to the dashboard
        if (state.dashboard?.fuelManagement) {
          state.dashboard.fuelManagement.fuelRecords.unshift(action.payload);
          // Update totals
          state.dashboard.fuelManagement.totalFuelCost += action.payload.cost || 0;
          state.dashboard.fuelManagement.totalFuelUsed += action.payload.gallons || 0;
        }
      })
      .addCase(addCostRecord.fulfilled, (state, action) => {
        // Add the new cost record to the dashboard
        if (state.dashboard?.costTracking) {
          state.dashboard.costTracking.costRecords.unshift(action.payload);
          state.dashboard.costTracking.totalCosts += action.payload.amount || 0;
          // Update cost breakdown
          const category = action.payload.category;
          if (category && state.dashboard.costTracking.costBreakdown[category]) {
            state.dashboard.costTracking.costBreakdown[category] += action.payload.amount || 0;
          }
        }
      })
      .addCase(updateMaintenanceStatus.fulfilled, (state, action) => {
        // Update maintenance status in dashboard
        if (state.dashboard?.maintenance) {
          const maintenance = state.dashboard.maintenance.scheduledMaintenance.find(m => m.id === action.payload.maintenanceId);
          if (maintenance) {
            maintenance.status = action.payload.status;
            maintenance.updatedAt = action.payload.updatedAt;
          }
        }
      })
      .addCase(updateVehicleLocation.fulfilled, (state, action) => {
        // Update current location and tracking history
        state.currentLocation = action.payload;
        if (state.dashboard?.vehicleTracking) {
          state.dashboard.vehicleTracking.trackingHistory.unshift(action.payload);
          state.dashboard.vehicleTracking.currentLocation = action.payload;
        }
      });
  },
});

export const { 
  clearVehicleError, 
  setCurrentLocation,
  addMaintenanceAlert,
  addFuelAlert,
  addCostAlert,
  clearMaintenanceAlert,
  clearFuelAlert,
  clearCostAlert
} = vehicleSlice.actions;
export default vehicleSlice.reducer; 