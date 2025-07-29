import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDriverToolsDashboard, clearDriverToolsError } from '../../store/slices/driverToolsSlice';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '../../components/common/DashboardHeader';
import EmptyState from '../../components/common/EmptyState';

const DriverToolsDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error } = useSelector(state => state.driverTools);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchDriverToolsDashboard({ userId: user.uid }));
    }
    return () => dispatch(clearDriverToolsError());
  }, [dispatch, user?.uid]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (user?.uid) {
      dispatch(fetchDriverToolsDashboard({ userId: user.uid }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Driver Tools" 
        onBack={handleBack}
      />
      
      <View style={styles.content}>
        {isLoading ? (
          <EmptyState
            title="Loading Driver Tools"
            message="Setting up your driver tools and utilities..."
            icon="construct-outline"
          />
        ) : error ? (
          <EmptyState
            title="Unable to Load Tools"
            message="There was an issue loading the driver tools. Please try again."
            icon="alert-circle-outline"
            actionText="Try Again"
            onAction={handleRetry}
            showAction={true}
          />
        ) : !dashboard ? (
          <EmptyState
            title="Driver Tools Coming Soon"
            message="We're working hard to bring you powerful driver tools including route optimization, earnings calculators, and productivity features. This section will be available in the next update!"
            icon="construct-outline"
            actionText="Check Back Later"
            onAction={handleRetry}
            showAction={true}
          />
        ) : (
          <EmptyState
            title="No Tools Available"
            message="Driver tools will appear here once they become available. Check back soon for updates!"
            icon="construct-outline"
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

export default DriverToolsDashboard; 