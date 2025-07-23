import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dynamicPricingService } from '../../services/dynamicPricingService';

export const fetchDynamicPricingDashboard = createAsyncThunk(
  'dynamicPricing/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await dynamicPricingService.getDynamicPricingDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getRealTimePricing = createAsyncThunk(
  'dynamicPricing/getRealTimePricing',
  async ({ userId, location }, { rejectWithValue }) => {
    try {
      return await dynamicPricingService.getRealTimePricing(userId, location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePricingStrategy = createAsyncThunk(
  'dynamicPricing/updateStrategy',
  async ({ userId, strategy }, { rejectWithValue }) => {
    try {
      return await dynamicPricingService.updatePricingStrategy(userId, strategy);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToPricingUpdates = createAsyncThunk(
  'dynamicPricing/subscribeToUpdates',
  async ({ userId, callback }, { rejectWithValue }) => {
    try {
      return await dynamicPricingService.subscribeToPricingUpdates(userId, callback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  realTimePricing: null,
  pricingAlerts: [],
  activeStrategies: [],
  pricingHistory: [],
  marketInsights: null
};

const dynamicPricingSlice = createSlice({
  name: 'dynamicPricing',
  initialState,
  reducers: {
    clearDynamicPricingError: (state) => {
      state.error = null;
    },
    updateRealTimePricing: (state, action) => {
      state.realTimePricing = action.payload;
    },
    addPricingAlert: (state, action) => {
      state.pricingAlerts.unshift(action.payload);
    },
    clearPricingAlert: (state, action) => {
      state.pricingAlerts = state.pricingAlerts.filter(alert => alert.id !== action.payload);
    },
    updateMarketInsights: (state, action) => {
      state.marketInsights = action.payload;
    },
    addPricingHistory: (state, action) => {
      state.pricingHistory.unshift(action.payload);
    },
    updateActiveStrategies: (state, action) => {
      state.activeStrategies = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDynamicPricingDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDynamicPricingDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update market insights from dashboard
        if (action.payload.marketOptimization) {
          state.marketInsights = action.payload.marketOptimization;
        }
        // Update pricing history
        if (action.payload.historicalPricing?.pricingHistory) {
          state.pricingHistory = action.payload.historicalPricing.pricingHistory;
        }
      })
      .addCase(fetchDynamicPricingDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getRealTimePricing.fulfilled, (state, action) => {
        state.realTimePricing = action.payload;
        // Add to pricing history
        state.pricingHistory.unshift({
          ...action.payload,
          timestamp: Date.now()
        });
      })
      .addCase(updatePricingStrategy.fulfilled, (state, action) => {
        // Add new strategy to active strategies
        state.activeStrategies.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.pricingRecommendations) {
          // This would typically update the pricing recommendations
          state.dashboard.pricingRecommendations.lastUpdate = action.payload.timestamp;
        }
      })
      .addCase(subscribeToPricingUpdates.fulfilled, (state, action) => {
        // Store the subscription for cleanup
        state.pricingSubscription = action.payload;
      });
  },
});

export const { 
  clearDynamicPricingError, 
  updateRealTimePricing,
  addPricingAlert,
  clearPricingAlert,
  updateMarketInsights,
  addPricingHistory,
  updateActiveStrategies
} = dynamicPricingSlice.actions;
export default dynamicPricingSlice.reducer; 