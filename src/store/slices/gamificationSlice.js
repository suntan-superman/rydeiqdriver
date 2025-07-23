import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gamificationService } from '../../services/gamificationService';

export const fetchGamificationDashboard = createAsyncThunk(
  'gamification/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await gamificationService.getGamificationDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const unlockAchievement = createAsyncThunk(
  'gamification/unlockAchievement',
  async ({ userId, achievementId }, { rejectWithValue }) => {
    try {
      return await gamificationService.unlockAchievement(userId, achievementId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLeaderboardScore = createAsyncThunk(
  'gamification/updateLeaderboardScore',
  async ({ userId, score, category }, { rejectWithValue }) => {
    try {
      return await gamificationService.updateLeaderboardScore(userId, score, category);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRewardPoints = createAsyncThunk(
  'gamification/addRewardPoints',
  async ({ userId, points, reason }, { rejectWithValue }) => {
    try {
      return await gamificationService.addRewardPoints(userId, points, reason);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinChallenge = createAsyncThunk(
  'gamification/joinChallenge',
  async ({ userId, challengeId }, { rejectWithValue }) => {
    try {
      return await gamificationService.joinChallenge(userId, challengeId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateChallengeProgress = createAsyncThunk(
  'gamification/updateChallengeProgress',
  async ({ userId, challengeId, progress }, { rejectWithValue }) => {
    try {
      return await gamificationService.updateChallengeProgress(userId, challengeId, progress);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSocialPost = createAsyncThunk(
  'gamification/createSocialPost',
  async ({ userId, content, type }, { rejectWithValue }) => {
    try {
      return await gamificationService.createSocialPost(userId, content, type);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLoyaltyPoints = createAsyncThunk(
  'gamification/updateLoyaltyPoints',
  async ({ userId, points, reason }, { rejectWithValue }) => {
    try {
      return await gamificationService.updateLoyaltyPoints(userId, points, reason);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackProgress = createAsyncThunk(
  'gamification/trackProgress',
  async ({ userId, progressData }, { rejectWithValue }) => {
    try {
      return await gamificationService.trackProgress(userId, progressData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToGamificationUpdates = createAsyncThunk(
  'gamification/subscribeToUpdates',
  async ({ userId, callback }, { rejectWithValue }) => {
    try {
      return await gamificationService.subscribeToGamificationUpdates(userId, callback);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  currentPoints: 0,
  currentTier: 'Bronze',
  achievements: [],
  activeChallenges: [],
  recentUnlocks: [],
  gamificationAlerts: [],
  leaderboardPosition: null,
  streakCount: 0
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    clearGamificationError: (state) => {
      state.error = null;
    },
    updateCurrentPoints: (state, action) => {
      state.currentPoints = action.payload;
    },
    updateCurrentTier: (state, action) => {
      state.currentTier = action.payload;
    },
    addGamificationAlert: (state, action) => {
      state.gamificationAlerts.unshift(action.payload);
    },
    clearGamificationAlert: (state, action) => {
      state.gamificationAlerts = state.gamificationAlerts.filter(alert => alert.id !== action.payload);
    },
    addAchievement: (state, action) => {
      state.achievements.unshift(action.payload);
      state.recentUnlocks.unshift(action.payload);
    },
    addActiveChallenge: (state, action) => {
      state.activeChallenges.unshift(action.payload);
    },
    updateChallenge: (state, action) => {
      const index = state.activeChallenges.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.activeChallenges[index] = action.payload;
      }
    },
    updateStreakCount: (state, action) => {
      state.streakCount = action.payload;
    },
    updateLeaderboardPosition: (state, action) => {
      state.leaderboardPosition = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGamificationDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        // Update current points from rewards program
        if (action.payload.rewardsProgram?.currentPoints) {
          state.currentPoints = action.payload.rewardsProgram.currentPoints;
        }
        // Update current tier from loyalty program
        if (action.payload.loyaltyProgram?.currentTier) {
          state.currentTier = action.payload.loyaltyProgram.currentTier;
        }
        // Update achievements
        if (action.payload.achievementSystem?.unlockedAchievements) {
          state.achievements = action.payload.achievementSystem.unlockedAchievements;
        }
        // Update recent unlocks
        if (action.payload.achievementSystem?.recentUnlocks) {
          state.recentUnlocks = action.payload.achievementSystem.recentUnlocks;
        }
        // Update active challenges
        if (action.payload.challenges?.activeChallenges) {
          state.activeChallenges = action.payload.challenges.activeChallenges;
        }
        // Update leaderboard position
        if (action.payload.leaderboards?.userRanking) {
          state.leaderboardPosition = action.payload.leaderboards.userRanking;
        }
        // Update streak count
        if (action.payload.progressTracking?.streakTracking?.current) {
          state.streakCount = action.payload.progressTracking.streakTracking.current;
        }
      })
      .addCase(fetchGamificationDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(unlockAchievement.fulfilled, (state, action) => {
        // Add the new achievement to achievements list
        state.achievements.unshift(action.payload);
        state.recentUnlocks.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.achievementSystem) {
          state.dashboard.achievementSystem.unlockedAchievements.unshift(action.payload);
          state.dashboard.achievementSystem.recentUnlocks.unshift(action.payload);
        }
        // Add points to current points
        const achievementPoints = action.payload.points || 0;
        state.currentPoints += achievementPoints;
      })
      .addCase(updateLeaderboardScore.fulfilled, (state, action) => {
        // Update leaderboard position
        if (action.payload) {
          state.leaderboardPosition = {
            ...state.leaderboardPosition,
            score: action.payload.score
          };
        }
        // Update dashboard if available
        if (state.dashboard?.leaderboards) {
          // This would typically update the leaderboard data
          state.dashboard.leaderboards.lastUpdate = new Date();
        }
      })
      .addCase(addRewardPoints.fulfilled, (state, action) => {
        // Add points to current points
        const points = action.payload.points || 0;
        state.currentPoints += points;
        // Update dashboard if available
        if (state.dashboard?.rewardsProgram) {
          state.dashboard.rewardsProgram.currentPoints += points;
        }
      })
      .addCase(joinChallenge.fulfilled, (state, action) => {
        // Add the new challenge to active challenges
        state.activeChallenges.unshift(action.payload);
        // Update dashboard if available
        if (state.dashboard?.challenges) {
          state.dashboard.challenges.activeChallenges.unshift(action.payload);
        }
      })
      .addCase(updateChallengeProgress.fulfilled, (state, action) => {
        // Update challenge progress in active challenges
        const index = state.activeChallenges.findIndex(c => c.challengeId === action.payload.challengeId);
        if (index !== -1) {
          state.activeChallenges[index] = {
            ...state.activeChallenges[index],
            progress: action.payload.progress
          };
        }
        // Update dashboard if available
        if (state.dashboard?.challenges) {
          const dashboardIndex = state.dashboard.challenges.activeChallenges.findIndex(c => c.challengeId === action.payload.challengeId);
          if (dashboardIndex !== -1) {
            state.dashboard.challenges.activeChallenges[dashboardIndex].progress = action.payload.progress;
          }
        }
      })
      .addCase(createSocialPost.fulfilled, (state, action) => {
        // Add the new social post to dashboard
        if (state.dashboard?.socialFeatures) {
          state.dashboard.socialFeatures.socialPosts.unshift(action.payload);
        }
      })
      .addCase(updateLoyaltyPoints.fulfilled, (state, action) => {
        // Update loyalty points and potentially tier
        const points = action.payload.points || 0;
        // This would typically trigger a tier calculation
        if (state.dashboard?.loyaltyProgram) {
          state.dashboard.loyaltyProgram.loyaltyPoints += points;
        }
      })
      .addCase(trackProgress.fulfilled, (state, action) => {
        // Update progress tracking data
        if (state.dashboard?.progressTracking) {
          // This would typically update the progress tracking data
          state.dashboard.progressTracking.lastUpdate = new Date();
        }
      })
      .addCase(subscribeToGamificationUpdates.fulfilled, (state, action) => {
        // Store the subscription for cleanup
        state.gamificationSubscription = action.payload;
      });
  },
});

export const { 
  clearGamificationError, 
  updateCurrentPoints,
  updateCurrentTier,
  addGamificationAlert,
  clearGamificationAlert,
  addAchievement,
  addActiveChallenge,
  updateChallenge,
  updateStreakCount,
  updateLeaderboardPosition
} = gamificationSlice.actions;
export default gamificationSlice.reducer; 