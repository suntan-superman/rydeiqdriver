import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from '../../services/analyticsService';

// Async thunks
export const fetchDriverAnalytics = createAsyncThunk(
  'analytics/fetchDriverAnalytics',
  async (timeRange = '24h', { rejectWithValue }) => {
    try {
      return await analyticsService.getDriverAnalytics(timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPlatformAnalytics = createAsyncThunk(
  'analytics/fetchPlatformAnalytics',
  async (timeRange = '24h', { rejectWithValue }) => {
    try {
      return await analyticsService.getPlatformAnalytics(timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  'analytics/fetchRevenueAnalytics',
  async (timeRange = '24h', { rejectWithValue }) => {
    try {
      return await analyticsService.getRevenueAnalytics(timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  driver: null,
  platform: null,
  revenue: null,
  isLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Driver analytics
      .addCase(fetchDriverAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDriverAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.driver = action.payload;
      })
      .addCase(fetchDriverAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Platform analytics
      .addCase(fetchPlatformAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlatformAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platform = action.payload;
      })
      .addCase(fetchPlatformAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Revenue analytics
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.revenue = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer; 