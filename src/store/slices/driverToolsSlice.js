import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { driverToolsService } from '../../services/driverToolsService';

export const fetchDriverToolsDashboard = createAsyncThunk(
  'driverTools/fetchDashboard',
  async ({ driverId, timeRange = '7d' }, { rejectWithValue }) => {
    try {
      return await driverToolsService.getDriverToolsDashboard(driverId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
};

const driverToolsSlice = createSlice({
  name: 'driverTools',
  initialState,
  reducers: {
    clearDriverToolsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriverToolsDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDriverToolsDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDriverToolsDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDriverToolsError } = driverToolsSlice.actions;
export default driverToolsSlice.reducer; 