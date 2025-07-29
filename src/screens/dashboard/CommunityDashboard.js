import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommunityDashboard, clearCommunityError } from '../../store/slices/communitySlice';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '../../components/common/DashboardHeader';
import EmptyState from '../../components/common/EmptyState';

const CommunityDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.community);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchCommunityDashboard({ userId: user.uid }));
    }
    return () => dispatch(clearCommunityError());
  }, [dispatch, user?.uid]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (user?.uid) {
      dispatch(fetchCommunityDashboard({ userId: user.uid }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Community" 
        onBack={handleBack}
      />
      
      <View style={styles.content}>
        {isLoading ? (
          <EmptyState
            title="Loading Community"
            message="Connecting you with the driver community..."
            icon="people-outline"
          />
        ) : error ? (
          <EmptyState
            title="Unable to Load Community"
            message="There was an issue loading the community features. Please try again."
            icon="alert-circle-outline"
            actionText="Try Again"
            onAction={handleRetry}
            showAction={true}
          />
        ) : !dashboard ? (
          <EmptyState
            title="Community Features Coming Soon"
            message="Connect with fellow drivers, share experiences, and build your network. Community features including forums, events, and driver groups will be available soon!"
            icon="people-outline"
            actionText="Check Back Later"
            onAction={handleRetry}
            showAction={true}
          />
        ) : (
          <EmptyState
            title="No Community Data"
            message="Community features will appear here once they become available. Check back soon for updates!"
            icon="people-outline"
            actionText="Refresh"
            onAction={handleRetry}
            showAction={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});

export default CommunityDashboard; 