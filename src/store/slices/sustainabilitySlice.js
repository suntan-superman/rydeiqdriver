import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sustainabilityService } from '../../services/sustainabilityService';

export const fetchSustainabilityDashboard = createAsyncThunk(
  'sustainability/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await sustainabilityService.getSustainabilityDashboard(userId, timeRange);
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

const sustainabilitySlice = createSlice({
  name: 'sustainability',
  initialState,
  reducers: {
    clearSustainabilityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSustainabilityDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSustainabilityDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchSustainabilityDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSustainabilityError } = sustainabilitySlice.actions;
export default sustainabilitySlice.reducer; 