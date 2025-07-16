import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Remove module-level Firebase import - make it lazy instead
// import { firebaseFirestore } from '@/services/firebase/config';

// Lazy Firebase firestore getter
const getFirebaseFirestore = () => {
  try {
    const { firebaseFirestore } = require('@/services/firebase/config');
    return firebaseFirestore;
  } catch (error) {
    // Firebase firestore not available in biddingSlice
    return null;
  }
};

// import { BID_STATUS } from '@/constants';

// Temporary constants
const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

// Initial state
const initialState = {
  activeBids: [],
  bidHistory: [],
  currentBid: null,
  biddingWindow: null,
  quickBidOptions: [
    { label: '+$2', value: 2 },
    { label: '+$5', value: 5 },
    { label: '+$10', value: 10 },
    { label: 'Custom', value: 'custom' }
  ],
  isLoading: false,
  error: null
};

// Async thunks
export const submitBid = createAsyncThunk(
  'bidding/submitBid',
  async ({ rideId, driverId, bidAmount, message, estimatedArrival }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidRef = firebaseFirestore.collection('activeBids').doc();
      const bidData = {
        bidId: bidRef.id,
        requestId: rideId,
        driverId: driverId,
        bidAmount: parseFloat(bidAmount),
        message: message || '',
        estimatedArrival: estimatedArrival,
        status: BID_STATUS.PENDING,
        submittedAt: firebaseFirestore.FieldValue.serverTimestamp(),
        expiresAt: firebaseFirestore.Timestamp.fromDate(
          new Date(Date.now() + 45 * 1000) // 45 seconds from now
        )
      };

      await bidRef.set(bidData);

      // Also add to the ride request's bids array
      const rideRef = firebaseFirestore.collection('rideRequests').doc(rideId);
      await rideRef.update({
        driverBids: firebaseFirestore.FieldValue.arrayUnion({
          driverId: driverId,
          bidAmount: parseFloat(bidAmount),
          submittedAt: firebaseFirestore.FieldValue.serverTimestamp()
        })
      });

      return { id: bidRef.id, ...bidData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptCompanyBid = createAsyncThunk(
  'bidding/acceptCompanyBid',
  async ({ rideId, driverId, companyBid }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidRef = firebaseFirestore.collection('activeBids').doc();
      const bidData = {
        bidId: bidRef.id,
        requestId: rideId,
        driverId: driverId,
        bidAmount: parseFloat(companyBid),
        message: 'Accepted company bid',
        isCompanyBid: true,
        status: BID_STATUS.PENDING,
        submittedAt: firebaseFirestore.FieldValue.serverTimestamp(),
        expiresAt: firebaseFirestore.Timestamp.fromDate(
          new Date(Date.now() + 45 * 1000)
        )
      };

      await bidRef.set(bidData);

      // Update ride request
      const rideRef = firebaseFirestore.collection('rideRequests').doc(rideId);
      await rideRef.update({
        driverBids: firebaseFirestore.FieldValue.arrayUnion({
          driverId: driverId,
          bidAmount: parseFloat(companyBid),
          isCompanyBid: true,
          submittedAt: firebaseFirestore.FieldValue.serverTimestamp()
        })
      });

      return { id: bidRef.id, ...bidData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBid = createAsyncThunk(
  'bidding/updateBid',
  async ({ bidId, bidAmount, message }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidRef = firebaseFirestore.collection('activeBids').doc(bidId);
      const updateData = {
        bidAmount: parseFloat(bidAmount),
        message: message || '',
        updatedAt: firebaseFirestore.FieldValue.serverTimestamp()
      };

      await bidRef.update(updateData);
      return { bidId, ...updateData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelBid = createAsyncThunk(
  'bidding/cancelBid',
  async ({ bidId }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidRef = firebaseFirestore.collection('activeBids').doc(bidId);
      await bidRef.update({
        status: BID_STATUS.EXPIRED,
        cancelledAt: firebaseFirestore.FieldValue.serverTimestamp()
      });

      return { bidId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadActiveBids = createAsyncThunk(
  'bidding/loadActiveBids',
  async ({ driverId }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidsQuery = firebaseFirestore
        .collection('activeBids')
        .where('driverId', '==', driverId)
        .where('status', '==', BID_STATUS.PENDING)
        .orderBy('submittedAt', 'desc');

      const snapshot = await bidsQuery.get();
      const bids = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return bids;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadBidHistory = createAsyncThunk(
  'bidding/loadBidHistory',
  async ({ driverId, limit = 50 }, { rejectWithValue }) => {
    try {
      const firebaseFirestore = getFirebaseFirestore();
      if (!firebaseFirestore) {
        return rejectWithValue('Firebase firestore not available');
      }
      
      const bidsQuery = firebaseFirestore
        .collection('activeBids')
        .where('driverId', '==', driverId)
        .where('status', 'in', [BID_STATUS.ACCEPTED, BID_STATUS.DECLINED, BID_STATUS.EXPIRED])
        .orderBy('submittedAt', 'desc')
        .limit(limit);

      const snapshot = await bidsQuery.get();
      const bids = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return bids;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateOptimalBid = createAsyncThunk(
  'bidding/calculateOptimalBid',
  async ({ 
    companyBid, 
    distance, 
    duration, 
    driverRating, 
    demandMultiplier = 1,
    vehicle = null,
    trafficFactor = 1.0,
    targetProfit = 10
  }, { rejectWithValue, getState }) => {
    try {
      const baseBid = parseFloat(companyBid);
      
      // Import fuel estimation utility
      const { suggestOptimalBid, calculateProfitEstimate } = require('../../utils/fuelEstimation');
      
      let suggestedBid;
      let profitAnalysis = null;
      let fuelCostEstimate = null;
      
      if (vehicle && distance) {
        // Use advanced fuel-based calculation
        const fuelOptimization = await suggestOptimalBid({
          companyBid: baseBid,
          distance,
          vehicle,
          targetProfit,
          trafficFactor
        });
        
        suggestedBid = fuelOptimization.suggestedBid;
        profitAnalysis = fuelOptimization.profitAnalysis;
        fuelCostEstimate = profitAnalysis.fuelDetails;
        
        // Apply additional factors on top of fuel-optimized bid
        let adjustmentMultiplier = 1;
        
        // Driver rating factor (higher rated drivers can bid higher)
        if (driverRating >= 4.8) adjustmentMultiplier += 0.05;
        else if (driverRating >= 4.5) adjustmentMultiplier += 0.025;
        
        // Demand factor
        adjustmentMultiplier *= demandMultiplier;
        
        // Duration factor (time is money) - for very long trips
        if (duration > 60) adjustmentMultiplier += 0.05;
        if (duration > 90) adjustmentMultiplier += 0.05;
        
        suggestedBid *= adjustmentMultiplier;
        
      } else {
        // Fall back to simple algorithm if no vehicle data
        let multiplier = 1;
        
        // Distance factor (longer trips can justify higher bids)
        if (distance > 10) multiplier += 0.1;
        if (distance > 20) multiplier += 0.1;
        
        // Duration factor (time is money)
        if (duration > 30) multiplier += 0.05;
        if (duration > 60) multiplier += 0.1;
        
        // Driver rating factor (higher rated drivers can bid higher)
        if (driverRating >= 4.8) multiplier += 0.1;
        else if (driverRating >= 4.5) multiplier += 0.05;
        
        // Demand factor (external parameter based on area demand)
        multiplier *= demandMultiplier;
        
        suggestedBid = baseBid * multiplier;
      }
      
      // Ensure bid is within reasonable bounds
      const minBid = baseBid * 0.9; // 10% below company bid
      const maxBid = baseBid * 1.5; // 50% above company bid
      
      const optimalBid = Math.max(minBid, Math.min(maxBid, suggestedBid));
      
      // Calculate profit for final bid if we have vehicle data
      if (vehicle && distance && !profitAnalysis) {
        profitAnalysis = await calculateProfitEstimate({
          bidAmount: optimalBid,
          distance,
          vehicle,
          trafficFactor
        });
        fuelCostEstimate = profitAnalysis.fuelDetails;
      }
      
      return {
        originalBid: baseBid,
        suggestedBid: Math.round(optimalBid * 100) / 100,
        profitAnalysis,
        fuelCostEstimate,
        factors: {
          distance,
          duration,
          driverRating,
          demandMultiplier,
          trafficFactor,
          hasFuelData: !!vehicle
        },
        recommendations: profitAnalysis?.recommendations || []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Bidding slice
const biddingSlice = createSlice({
  name: 'bidding',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBid: (state, action) => {
      state.currentBid = action.payload;
    },
    clearCurrentBid: (state) => {
      state.currentBid = null;
    },
    setBiddingWindow: (state, action) => {
      state.biddingWindow = action.payload;
    },
    clearBiddingWindow: (state) => {
      state.biddingWindow = null;
    },
    addActiveBid: (state, action) => {
      const existingIndex = state.activeBids.findIndex(
        bid => bid.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.activeBids[existingIndex] = action.payload;
      } else {
        state.activeBids.unshift(action.payload);
      }
    },
    removeActiveBid: (state, action) => {
      state.activeBids = state.activeBids.filter(
        bid => bid.id !== action.payload
      );
    },
    updateBidStatus: (state, action) => {
      const { bidId, status } = action.payload;
      const bidIndex = state.activeBids.findIndex(bid => bid.id === bidId);
      
      if (bidIndex >= 0) {
        state.activeBids[bidIndex].status = status;
        
        // Move to history if completed
        if (status !== BID_STATUS.PENDING) {
          const completedBid = state.activeBids[bidIndex];
          state.bidHistory.unshift(completedBid);
          state.activeBids.splice(bidIndex, 1);
        }
      }
      
      if (state.currentBid && state.currentBid.id === bidId) {
        state.currentBid.status = status;
      }
    },
    updateQuickBidOptions: (state, action) => {
      state.quickBidOptions = action.payload;
    },
    clearActiveBids: (state) => {
      state.activeBids = [];
    },
    expireBid: (state, action) => {
      const bidId = action.payload;
      const bidIndex = state.activeBids.findIndex(bid => bid.id === bidId);
      
      if (bidIndex >= 0) {
        state.activeBids[bidIndex].status = BID_STATUS.EXPIRED;
        const expiredBid = state.activeBids[bidIndex];
        state.bidHistory.unshift(expiredBid);
        state.activeBids.splice(bidIndex, 1);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit bid
      .addCase(submitBid.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitBid.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBid = action.payload;
        state.activeBids.unshift(action.payload);
      })
      .addCase(submitBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Accept company bid
      .addCase(acceptCompanyBid.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptCompanyBid.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBid = action.payload;
        state.activeBids.unshift(action.payload);
      })
      .addCase(acceptCompanyBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update bid
      .addCase(updateBid.fulfilled, (state, action) => {
        const { bidId } = action.payload;
        const bidIndex = state.activeBids.findIndex(bid => bid.id === bidId);
        
        if (bidIndex >= 0) {
          state.activeBids[bidIndex] = {
            ...state.activeBids[bidIndex],
            ...action.payload
          };
        }
        
        if (state.currentBid && state.currentBid.id === bidId) {
          state.currentBid = {
            ...state.currentBid,
            ...action.payload
          };
        }
      })
      
      // Cancel bid
      .addCase(cancelBid.fulfilled, (state, action) => {
        const { bidId } = action.payload;
        state.activeBids = state.activeBids.filter(bid => bid.id !== bidId);
        
        if (state.currentBid && state.currentBid.id === bidId) {
          state.currentBid = null;
        }
      })
      
      // Load active bids
      .addCase(loadActiveBids.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadActiveBids.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeBids = action.payload;
      })
      .addCase(loadActiveBids.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load bid history
      .addCase(loadBidHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadBidHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bidHistory = action.payload;
      })
      .addCase(loadBidHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Calculate optimal bid
      .addCase(calculateOptimalBid.fulfilled, (state, action) => {
        // Store the calculation result for UI display
        state.lastOptimalBidCalculation = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  setCurrentBid,
  clearCurrentBid,
  setBiddingWindow,
  clearBiddingWindow,
  addActiveBid,
  removeActiveBid,
  updateBidStatus,
  updateQuickBidOptions,
  clearActiveBids,
  expireBid
} = biddingSlice.actions;

// Selectors
export const selectActiveBids = (state) => state.bidding.activeBids;
export const selectBidHistory = (state) => state.bidding.bidHistory;
export const selectCurrentBid = (state) => state.bidding.currentBid;
export const selectBiddingWindow = (state) => state.bidding.biddingWindow;
export const selectQuickBidOptions = (state) => state.bidding.quickBidOptions;
export const selectBiddingLoading = (state) => state.bidding.isLoading;
export const selectBiddingError = (state) => state.bidding.error;
export const selectLastOptimalBidCalculation = (state) => state.bidding.lastOptimalBidCalculation;
export const selectHasActiveBids = (state) => state.bidding.activeBids.length > 0;

// Helper selectors
export const selectBidForRide = (rideId) => (state) => 
  state.bidding.activeBids.find(bid => bid.requestId === rideId);

export const selectBidStats = (state) => {
  const { activeBids, bidHistory } = state.bidding;
  const totalBids = activeBids.length + bidHistory.length;
  const acceptedBids = bidHistory.filter(bid => bid.status === BID_STATUS.ACCEPTED).length;
  const declinedBids = bidHistory.filter(bid => bid.status === BID_STATUS.DECLINED).length;
  const expiredBids = bidHistory.filter(bid => bid.status === BID_STATUS.EXPIRED).length;
  
  return {
    totalBids,
    activeBids: activeBids.length,
    acceptedBids,
    declinedBids,
    expiredBids,
    acceptanceRate: totalBids > 0 ? (acceptedBids / totalBids * 100).toFixed(1) : 0
  };
};

export default biddingSlice.reducer; 