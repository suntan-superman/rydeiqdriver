import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, TYPOGRAPHY } from '@/constants';
import ScheduledRideRequests from '@/components/ScheduledRideRequests';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Scheduled Ride Dashboard for React Native Driver App
 * Main dashboard showing pending scheduled ride requests and driver statistics
 * Mobile-optimized with touch-friendly interface
 */
const ScheduledRideDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [driverStats, setDriverStats] = useState({
    pendingRequests: 0,
    todaysRides: 0,
    completedRides: 0,
    rating: 0
  });

  useEffect(() => {
    if (user?.uid) {
      loadDriverStats();
    }
  }, [user?.uid]);

  const loadDriverStats = async () => {
    // This would load actual driver statistics from Firestore
    // For now, we'll use mock data that will be updated by the component
    setDriverStats({
      pendingRequests: 0, // Will be updated by ScheduledRideRequests component
      todaysRides: 3,
      completedRides: 45,
      rating: 4.8
    });
  };

  const handleRideAccepted = (request) => {
    // console.log('Ride accepted:', request);
    // Update stats
    setDriverStats(prev => ({
      ...prev,
      pendingRequests: Math.max(0, prev.pendingRequests - 1),
      todaysRides: prev.todaysRides + 1
    }));
    
    Alert.alert(
      'Ride Accepted!',
      'You have successfully accepted the scheduled ride. Check your schedule for details.',
      [
        { text: 'OK' }
      ]
    );
  };

  const handleRideDeclined = (request) => {
    console.log('Ride declined:', request);
    // Update stats
    setDriverStats(prev => ({
      ...prev,
      pendingRequests: Math.max(0, prev.pendingRequests - 1)
    }));
  };

  const handlePendingRequestsChange = (count) => {
    setDriverStats(prev => ({
      ...prev,
      pendingRequests: count
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white || '#FFFFFF'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scheduled Rides</Text>
          <Text style={styles.headerSubtitle}>
            {user?.displayName || user?.email || 'Driver'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primary + '10' }]}>
              <View style={styles.statIcon}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statNumber}>{driverStats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Pending Requests</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.success + '10' }]}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.statNumber}>{driverStats.todaysRides}</Text>
              <Text style={styles.statLabel}>Today's Rides</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.warning + '10' }]}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.statNumber}>{driverStats.completedRides}</Text>
              <Text style={styles.statLabel}>Completed Rides</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: (COLORS.info?.[500] || '#3B82F6') + '10' }]}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={20} color={COLORS.info?.[500] || '#3B82F6'} />
              </View>
              <Text style={styles.statNumber}>{driverStats.rating}</Text>
              <Text style={styles.statLabel}>Driver Rating</Text>
            </View>
          </View>
        </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.goBack()}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="home-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Earnings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.quickActionText}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="list-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionText}>Trip History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: (COLORS.info?.[500] || '#3B82F6') + '20' }]}>
                <Ionicons name="person-outline" size={20} color={COLORS.info?.[500] || '#3B82F6'} />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Scheduled Ride Requests */}
      <View style={styles.requestsContainer}>
        <ScheduledRideRequests
          driverId={user?.uid}
          onRideAccepted={handleRideAccepted}
          onRideDeclined={handleRideDeclined}
          onPendingRequestsChange={handlePendingRequestsChange}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (screenWidth - 42) / 2,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    textAlign: 'center',
  },
  requestsContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});

export default ScheduledRideDashboard;
