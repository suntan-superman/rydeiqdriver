import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { firebaseFirestore } from '@/services/firebase/config';

// Initial state
const initialState = {
  todayEarnings: 0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
  totalEarnings: 0,
  pendingPayouts: 0,
  availableBalance: 0,
  earningsHistory: [],
  payoutHistory: [],
  earningsBreakdown: {
    rides: 0,
    tips: 0,
    bonuses: 0,
    incentives: 0
  },
  goals: {
    daily: 100,
    weekly: 700,
    monthly: 3000
  },
  analytics: {
    averagePerRide: 0,
    averagePerHour: 0,
    bestEarningHour: null,
    bestEarningDay: null,
    ridesCompleted: 0
  },
  isLoading: false,
  error: null
};

// Async thunks
export const loadEarnings = createAsyncThunk(
  'earnings/loadEarnings',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      const driverDoc = await driverRef.get();
      
      if (!driverDoc.exists) {
        return rejectWithValue('Driver not found');
      }
      
      const data = driverDoc.data();
      return {
        todayEarnings: data.earnings?.today || 0,
        weeklyEarnings: data.earnings?.week || 0,
        monthlyEarnings: data.earnings?.month || 0,
        totalEarnings: data.earnings?.total || 0,
        pendingPayouts: data.earnings?.pending || 0,
        availableBalance: data.earnings?.available || 0,
        earningsBreakdown: data.earnings?.breakdown || initialState.earningsBreakdown,
        analytics: data.earnings?.analytics || initialState.analytics
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addEarning = createAsyncThunk(
  'earnings/addEarning',
  async ({ driverId, rideId, amount, type, breakdown }, { rejectWithValue }) => {
    try {
      const earningRef = firebaseFirestore.collection('earnings').doc();
      const earningData = {
        id: earningRef.id,
        driverId,
        rideId,
        amount: parseFloat(amount),
        type, // 'ride', 'tip', 'bonus', 'incentive'
        breakdown: breakdown || {},
        timestamp: firebaseFirestore.FieldValue.serverTimestamp(),
        date: new Date().toDateString()
      };
      
      await earningRef.set(earningData);
      
      // Update driver's total earnings
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        'earnings.total': firebaseFirestore.FieldValue.increment(parseFloat(amount)),
        'earnings.available': firebaseFirestore.FieldValue.increment(parseFloat(amount)),
        'earnings.today': firebaseFirestore.FieldValue.increment(parseFloat(amount)),
        'earnings.week': firebaseFirestore.FieldValue.increment(parseFloat(amount)),
        'earnings.month': firebaseFirestore.FieldValue.increment(parseFloat(amount)),
        [`earnings.breakdown.${type}`]: firebaseFirestore.FieldValue.increment(parseFloat(amount))
      });
      
      return { id: earningRef.id, ...earningData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const requestPayout = createAsyncThunk(
  'earnings/requestPayout',
  async ({ driverId, amount, payoutMethod }, { rejectWithValue }) => {
    try {
      const payoutRef = firebaseFirestore.collection('payouts').doc();
      const payoutData = {
        id: payoutRef.id,
        driverId,
        amount: parseFloat(amount),
        payoutMethod, // 'instant', 'daily', 'weekly'
        status: 'pending',
        requestedAt: firebaseFirestore.FieldValue.serverTimestamp(),
        fees: payoutMethod === 'instant' ? 1.50 : payoutMethod === 'daily' ? 0.50 : 0
      };
      
      await payoutRef.set(payoutData);
      
      // Update driver's available balance
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        'earnings.available': firebaseFirestore.FieldValue.increment(-parseFloat(amount)),
        'earnings.pending': firebaseFirestore.FieldValue.increment(parseFloat(amount))
      });
      
      return { id: payoutRef.id, ...payoutData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadEarningsHistory = createAsyncThunk(
  'earnings/loadHistory',
  async ({ driverId, limit = 50 }, { rejectWithValue }) => {
    try {
      const earningsQuery = firebaseFirestore
        .collection('earnings')
        .where('driverId', '==', driverId)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      const snapshot = await earningsQuery.get();
      const earnings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return earnings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadPayoutHistory = createAsyncThunk(
  'earnings/loadPayoutHistory',
  async ({ driverId, limit = 20 }, { rejectWithValue }) => {
    try {
      const payoutsQuery = firebaseFirestore
        .collection('payouts')
        .where('driverId', '==', driverId)
        .orderBy('requestedAt', 'desc')
        .limit(limit);
      
      const snapshot = await payoutsQuery.get();
      const payouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return payouts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGoals = createAsyncThunk(
  'earnings/updateGoals',
  async ({ driverId, goals }, { rejectWithValue }) => {
    try {
      const driverRef = firebaseFirestore.collection('drivers').doc(driverId);
      await driverRef.update({
        'earnings.goals': goals
      });
      
      return goals;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Earnings slice
const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocalEarnings: (state, action) => {
      const { amount, type } = action.payload;
      state.todayEarnings += amount;
      state.weeklyEarnings += amount;
      state.monthlyEarnings += amount;
      state.totalEarnings += amount;
      state.availableBalance += amount;
      state.earningsBreakdown[type] += amount;
    },
    setGoals: (state, action) => {
      state.goals = { ...state.goals, ...action.payload };
    },
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
    addEarningToHistory: (state, action) => {
      state.earningsHistory.unshift(action.payload);
      // Keep only last 100 items
      if (state.earningsHistory.length > 100) {
        state.earningsHistory = state.earningsHistory.slice(0, 100);
      }
    },
    resetDailyEarnings: (state) => {
      state.todayEarnings = 0;
      state.earningsBreakdown.rides = 0;
      state.earningsBreakdown.tips = 0;
      state.earningsBreakdown.bonuses = 0;
      state.earningsBreakdown.incentives = 0;
    },
    resetWeeklyEarnings: (state) => {
      state.weeklyEarnings = 0;
    },
    resetMonthlyEarnings: (state) => {
      state.monthlyEarnings = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load earnings
      .addCase(loadEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadEarnings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayEarnings = action.payload.todayEarnings;
        state.weeklyEarnings = action.payload.weeklyEarnings;
        state.monthlyEarnings = action.payload.monthlyEarnings;
        state.totalEarnings = action.payload.totalEarnings;
        state.pendingPayouts = action.payload.pendingPayouts;
        state.availableBalance = action.payload.availableBalance;
        state.earningsBreakdown = action.payload.earningsBreakdown;
        state.analytics = action.payload.analytics;
      })
      .addCase(loadEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add earning
      .addCase(addEarning.fulfilled, (state, action) => {
        const earning = action.payload;
        state.earningsHistory.unshift(earning);
        state.todayEarnings += earning.amount;
        state.weeklyEarnings += earning.amount;
        state.monthlyEarnings += earning.amount;
        state.totalEarnings += earning.amount;
        state.availableBalance += earning.amount;
        state.earningsBreakdown[earning.type] += earning.amount;
      })
      
      // Request payout
      .addCase(requestPayout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.isLoading = false;
        const payout = action.payload;
        state.payoutHistory.unshift(payout);
        state.availableBalance -= payout.amount;
        state.pendingPayouts += payout.amount;
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load earnings history
      .addCase(loadEarningsHistory.fulfilled, (state, action) => {
        state.earningsHistory = action.payload;
      })
      
      // Load payout history
      .addCase(loadPayoutHistory.fulfilled, (state, action) => {
        state.payoutHistory = action.payload;
      })
      
      // Update goals
      .addCase(updateGoals.fulfilled, (state, action) => {
        state.goals = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  updateLocalEarnings,
  setGoals,
  updateAnalytics,
  addEarningToHistory,
  resetDailyEarnings,
  resetWeeklyEarnings,
  resetMonthlyEarnings
} = earningsSlice.actions;

// Selectors
export const selectTodayEarnings = (state) => state.earnings.todayEarnings;
export const selectWeeklyEarnings = (state) => state.earnings.weeklyEarnings;
export const selectMonthlyEarnings = (state) => state.earnings.monthlyEarnings;
export const selectTotalEarnings = (state) => state.earnings.totalEarnings;
export const selectAvailableBalance = (state) => state.earnings.availableBalance;
export const selectPendingPayouts = (state) => state.earnings.pendingPayouts;
export const selectEarningsHistory = (state) => state.earnings.earningsHistory;
export const selectPayoutHistory = (state) => state.earnings.payoutHistory;
export const selectEarningsBreakdown = (state) => state.earnings.earningsBreakdown;
export const selectEarningsGoals = (state) => state.earnings.goals;
export const selectEarningsAnalytics = (state) => state.earnings.analytics;
export const selectEarningsLoading = (state) => state.earnings.isLoading;
export const selectEarningsError = (state) => state.earnings.error;

// Helper selectors
export const selectDailyGoalProgress = (state) => {
  const { todayEarnings, goals } = state.earnings;
  return goals.daily > 0 ? (todayEarnings / goals.daily * 100) : 0;
};

export const selectWeeklyGoalProgress = (state) => {
  const { weeklyEarnings, goals } = state.earnings;
  return goals.weekly > 0 ? (weeklyEarnings / goals.weekly * 100) : 0;
};

export const selectMonthlyGoalProgress = (state) => {
  const { monthlyEarnings, goals } = state.earnings;
  return goals.monthly > 0 ? (monthlyEarnings / goals.monthly * 100) : 0;
};

export const selectEarningsStats = (state) => {
  const { earningsHistory, analytics } = state.earnings;
  const totalRides = earningsHistory.filter(e => e.type === 'ride').length;
  const totalTips = earningsHistory.filter(e => e.type === 'tip').length;
  
  return {
    totalRides,
    totalTips,
    averagePerRide: analytics.averagePerRide,
    averagePerHour: analytics.averagePerHour,
    bestEarningHour: analytics.bestEarningHour,
    bestEarningDay: analytics.bestEarningDay
  };
};

export default earningsSlice.reducer; 