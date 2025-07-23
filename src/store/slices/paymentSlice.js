import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentService } from '../../services/paymentService';

export const fetchPaymentDashboard = createAsyncThunk(
  'payment/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await paymentService.getPaymentDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      return await paymentService.processPayment(paymentData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'payment/addTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      return await paymentService.addTransaction(transactionData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'payment/updatePaymentStatus',
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      return await paymentService.updatePaymentStatus(paymentId, status);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addPaymentMethod = createAsyncThunk(
  'payment/addPaymentMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      return await paymentService.addPaymentMethod(methodData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBankingInfo = createAsyncThunk(
  'payment/updateBankingInfo',
  async (bankingData, { rejectWithValue }) => {
    try {
      return await paymentService.updateBankingInfo(bankingData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  pendingPayments: [],
  recentTransactions: [],
  accountBalance: 0,
  paymentAlerts: []
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    updateAccountBalance: (state, action) => {
      state.accountBalance = action.payload;
    },
    addPaymentAlert: (state, action) => {
      state.paymentAlerts.unshift(action.payload);
    },
    clearPaymentAlert: (state, action) => {
      state.paymentAlerts = state.paymentAlerts.filter(alert => alert.id !== action.payload);
    },
    addPendingPayment: (state, action) => {
      state.pendingPayments.unshift(action.payload);
    },
    updatePendingPayment: (state, action) => {
      const index = state.pendingPayments.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.pendingPayments[index] = action.payload;
      }
    },
    addRecentTransaction: (state, action) => {
      state.recentTransactions.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update account balance from banking integration
        if (action.payload.bankingIntegration?.totalBalance) {
          state.accountBalance = action.payload.bankingIntegration.totalBalance;
        }
        // Update pending payments
        if (action.payload.paymentProcessing?.recentPayments) {
          state.pendingPayments = action.payload.paymentProcessing.recentPayments.filter(p => p.status === 'pending');
        }
      })
      .addCase(fetchPaymentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        // Add the new payment to pending payments
        state.pendingPayments.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.paymentProcessing) {
          state.dashboard.paymentProcessing.recentPayments.unshift(action.payload);
          state.dashboard.paymentProcessing.totalPayments += 1;
          state.dashboard.paymentProcessing.paymentStats.pendingPayments += 1;
        }
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        // Add the new transaction to recent transactions
        state.recentTransactions.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.transactionManagement) {
          state.dashboard.transactionManagement.transactions.unshift(action.payload);
          state.dashboard.transactionManagement.totalTransactions += 1;
          if (action.payload.status === 'pending') {
            state.dashboard.transactionManagement.pendingTransactions += 1;
          }
        }
        // Update financial analytics
        if (state.dashboard?.financialAnalytics) {
          if (action.payload.type === 'income') {
            state.dashboard.financialAnalytics.totalRevenue += action.payload.amount || 0;
          } else {
            state.dashboard.financialAnalytics.totalExpenses += action.payload.amount || 0;
          }
          state.dashboard.financialAnalytics.netIncome = 
            state.dashboard.financialAnalytics.totalRevenue - state.dashboard.financialAnalytics.totalExpenses;
        }
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        // Update payment status in pending payments
        const payment = state.pendingPayments.find(p => p.id === action.payload.paymentId);
        if (payment) {
          payment.status = action.payload.status;
          payment.updatedAt = action.payload.updatedAt;
        }
        // Update dashboard if available
        if (state.dashboard?.paymentProcessing) {
          const dashboardPayment = state.dashboard.paymentProcessing.recentPayments.find(p => p.id === action.payload.paymentId);
          if (dashboardPayment) {
            dashboardPayment.status = action.payload.status;
            dashboardPayment.updatedAt = action.payload.updatedAt;
          }
        }
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        // Add the new payment method to dashboard
        if (state.dashboard?.paymentMethods) {
          state.dashboard.paymentMethods.savedMethods.push(action.payload);
          state.dashboard.paymentMethods.totalMethods += 1;
        }
      })
      .addCase(updateBankingInfo.fulfilled, (state, action) => {
        // Update banking information in dashboard
        if (state.dashboard?.bankingIntegration) {
          // This would typically update the connected accounts
          state.dashboard.bankingIntegration.lastUpdate = action.payload.updatedAt;
        }
      });
  },
});

export const { 
  clearPaymentError, 
  updateAccountBalance,
  addPaymentAlert,
  clearPaymentAlert,
  addPendingPayment,
  updatePendingPayment,
  addRecentTransaction
} = paymentSlice.actions;
export default paymentSlice.reducer; 