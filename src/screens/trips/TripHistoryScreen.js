import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Temporary constants
const COLORS = {
  primary: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857'
  },
  secondary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000'
};

const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

const DIMENSIONS = {
  paddingXS: 4,
  paddingS: 8,
  paddingM: 16,
  paddingL: 24,
  paddingXL: 32,
  radiusS: 6,
  radiusM: 12,
  radiusL: 16
};

const TripHistoryScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock trip data
  const trips = [
    {
      id: 1,
      date: '2024-01-15',
      time: '2:30 PM',
      from: 'Downtown Financial District',
      to: 'International Airport',
      distance: '12.4 miles',
      duration: '28 min',
      fare: 28.50,
      tip: 5.00,
      total: 33.50,
      status: 'completed',
      customerName: 'Sarah M.',
      rating: 5,
      bidAmount: 30.00
    },
    {
      id: 2,
      date: '2024-01-15',
      time: '1:45 PM',
      from: 'Shopping Mall',
      to: 'University Campus',
      distance: '6.2 miles',
      duration: '18 min',
      fare: 15.75,
      tip: 2.50,
      total: 18.25,
      status: 'completed',
      customerName: 'Mike K.',
      rating: 4,
      bidAmount: 16.00
    },
    {
      id: 3,
      date: '2024-01-15',
      time: '12:15 PM',
      from: 'General Hospital',
      to: 'Residential Area',
      distance: '8.1 miles',
      duration: '22 min',
      fare: 22.00,
      tip: 4.00,
      total: 26.00,
      status: 'completed',
      customerName: 'Emma W.',
      rating: 5,
      bidAmount: 24.00
    },
    {
      id: 4,
      date: '2024-01-14',
      time: '6:20 PM',
      from: 'Office Complex',
      to: 'Restaurant District',
      distance: '4.3 miles',
      duration: '15 min',
      fare: 12.25,
      tip: 1.75,
      total: 14.00,
      status: 'completed',
      customerName: 'John D.',
      rating: 3,
      bidAmount: 13.00
    },
    {
      id: 5,
      date: '2024-01-14',
      time: '3:45 PM',
      from: 'Train Station',
      to: 'Hotel Downtown',
      distance: '3.8 miles',
      duration: '12 min',
      fare: 18.50,
      tip: 0,
      total: 18.50,
      status: 'cancelled',
      customerName: 'Lisa R.',
      rating: null,
      bidAmount: 19.00
    }
  ];

  const filters = [
    { key: 'all', label: 'All Trips' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  const filteredTrips = selectedFilter === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === selectedFilter);

  const stats = {
    totalTrips: trips.filter(t => t.status === 'completed').length,
    totalEarnings: trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.total, 0),
    averageRating: trips.filter(t => t.rating).reduce((sum, t, _, arr) => sum + t.rating / arr.length, 0),
    totalDistance: trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.distance), 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'cancelled': return COLORS.error;
      default: return COLORS.secondary[500];
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={12}
            color={star <= rating ? COLORS.warning : COLORS.secondary[300]}
          />
        ))}
      </View>
    );
  };

  const TripCard = ({ trip }) => (
    <TouchableOpacity style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.tripTimeInfo}>
          <Text style={styles.tripDate}>{trip.date}</Text>
          <Text style={styles.tripTime}>{trip.time}</Text>
        </View>
        <View style={styles.tripStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.tripRoute}>
        <View style={styles.routePoints}>
          <View style={styles.fromPoint}>
            <View style={styles.fromDot} />
            <Text style={styles.locationText}>{trip.from}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.toPoint}>
            <View style={styles.toDot} />
            <Text style={styles.locationText}>{trip.to}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.tripMetrics}>
          <View style={styles.metric}>
            <Ionicons name="speedometer-outline" size={16} color={COLORS.secondary[500]} />
            <Text style={styles.metricText}>{trip.distance}</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons name="time-outline" size={16} color={COLORS.secondary[500]} />
            <Text style={styles.metricText}>{trip.duration}</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons name="person-outline" size={16} color={COLORS.secondary[500]} />
            <Text style={styles.metricText}>{trip.customerName}</Text>
          </View>
        </View>
        
        {trip.rating && (
          <View style={styles.ratingContainer}>
            {renderStars(trip.rating)}
          </View>
        )}
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.bidInfo}>
          <Text style={styles.bidLabel}>Your Bid: </Text>
          <Text style={styles.bidAmount}>${trip.bidAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.earningsInfo}>
          <Text style={styles.fareAmount}>${trip.total.toFixed(2)}</Text>
          {trip.tip > 0 && (
            <Text style={styles.tipAmount}>+${trip.tip.toFixed(2)} tip</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={COLORS.secondary[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalTrips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averageRating.toFixed(1)} ⭐</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalDistance.toFixed(0)} mi</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.filterTabTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trip List */}
        <View style={styles.tripsContainer}>
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color={COLORS.secondary[300]} />
              <Text style={styles.emptyStateTitle}>No trips found</Text>
              <Text style={styles.emptyStateText}>
                {selectedFilter === 'all' 
                  ? "You haven't completed any trips yet"
                  : `No ${selectedFilter} trips found`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  backButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
  },
  searchButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingTop: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingL,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusM,
    padding: DIMENSIONS.paddingM,
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.paddingXS,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary[500],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingL,
  },
  filterTab: {
    flex: 1,
    paddingVertical: DIMENSIONS.paddingM,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusM,
    marginHorizontal: DIMENSIONS.paddingXS,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary[500],
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[700],
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  tripsContainer: {
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingM,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingM,
  },
  tripTimeInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
  },
  tripTime: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginTop: 2,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DIMENSIONS.paddingS,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  tripRoute: {
    marginBottom: DIMENSIONS.paddingM,
  },
  routePoints: {
    position: 'relative',
  },
  fromPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingS,
  },
  toPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DIMENSIONS.paddingS,
  },
  fromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary[500],
    marginRight: DIMENSIONS.paddingM,
  },
  toDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    marginRight: DIMENSIONS.paddingM,
  },
  routeLine: {
    position: 'absolute',
    left: 6,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: COLORS.secondary[300],
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[700],
    flex: 1,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingM,
  },
  tripMetrics: {
    flexDirection: 'row',
    flex: 1,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: DIMENSIONS.paddingL,
  },
  metricText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[600],
    marginLeft: DIMENSIONS.paddingXS,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DIMENSIONS.paddingM,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[100],
  },
  bidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  bidAmount: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
  },
  earningsInfo: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary[500],
  },
  tipAmount: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.paddingXL * 2,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[700],
    marginTop: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingS,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
});

export default TripHistoryScreen; 