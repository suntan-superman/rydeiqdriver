import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { communityService } from '../../services/communityService';

export const fetchCommunityDashboard = createAsyncThunk(
  'community/fetchDashboard',
  async ({ userId, timeRange = '30d' }, { rejectWithValue }) => {
    try {
      return await communityService.getCommunityDashboard(userId, timeRange);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createForumPost = createAsyncThunk(
  'community/createForumPost',
  async (postData, { rejectWithValue }) => {
    try {
      return await communityService.createForumPost(postData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinDriverGroup = createAsyncThunk(
  'community/joinGroup',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      return await communityService.joinGroup(groupId, userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSupportRequest = createAsyncThunk(
  'community/createSupportRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      return await communityService.createSupportRequest(requestData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  dashboard: null,
  isLoading: false,
  error: null,
  userGroups: [],
  userPosts: [],
  supportRequests: []
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearCommunityError: (state) => {
      state.error = null;
    },
    addUserGroup: (state, action) => {
      state.userGroups.push(action.payload);
    },
    addUserPost: (state, action) => {
      state.userPosts.unshift(action.payload);
    },
    addSupportRequest: (state, action) => {
      state.supportRequests.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunityDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommunityDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchCommunityDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createForumPost.fulfilled, (state, action) => {
        // Add the new post to the dashboard forums
        if (state.dashboard?.forums?.topics) {
          state.dashboard.forums.topics.unshift(action.payload);
          state.dashboard.forums.totalTopics += 1;
        }
      })
      .addCase(joinDriverGroup.fulfilled, (state, action) => {
        // Update user groups in dashboard
        if (state.dashboard?.groups) {
          // Refresh groups data
          state.dashboard.groups.totalGroups += 1;
        }
      })
      .addCase(createSupportRequest.fulfilled, (state, action) => {
        // Add the new support request to the dashboard
        if (state.dashboard?.peerSupport?.requests) {
          state.dashboard.peerSupport.requests.unshift(action.payload);
          state.dashboard.peerSupport.totalRequests += 1;
        }
      });
  },
});

export const { clearCommunityError, addUserGroup, addUserPost, addSupportRequest } = communitySlice.actions;
export default communitySlice.reducer; 