import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { COLORS } from '@/constants';
import { FONT_SIZES, SPACING, CARD_SIZES, BORDER_RADIUS, hp, wp, rf } from '@/constants/responsiveSizes';
import ScheduleTimeline from './ScheduleTimeline';
import ScheduleWeekView from './ScheduleWeekView';
import ScheduleMonthView from './ScheduleMonthView';
import MultiDayOptimizer from './MultiDayOptimizer';
import { calculateDailySchedule, generateDailyInsights, analyzeWeekSchedule } from '@/utils/scheduleAnalyzer';

const { width: screenWidth } = Dimensions.get('window');

/**
 * My Scheduled Rides Component
 * Shows rides that the driver has already accepted/been assigned
 */
const MyScheduledRides = ({ driverId }) => {
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'all'
  const [viewMode, setViewMode] = useState('list'); // 'list', 'timeline', 'week', 'month', 'optimizer'
  const [dailyAnalysis, setDailyAnalysis] = useState(null);
  const [weekAnalysis, setWeekAnalysis] = useState(null);
  const [selectedDayForTimeline, setSelectedDayForTimeline] = useState(null);
  const [showViewMenu, setShowViewMenu] = useState(false);

  // Load accepted/assigned rides for this driver
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const unsubscribes = [];
      
      // Query medical rides
      const medicalRidesQuery = query(
        collection(db, 'medicalRideSchedule'),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['assigned', 'confirmed'])
      );

      const medicalUnsubscribe = onSnapshot(
        medicalRidesQuery,
        (snapshot) => {
          const medicalRides = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestType: 'medical',
            collection: 'medicalRideSchedule'
          }));
          
          console.log(`📅 Found ${medicalRides.length} medical rides for driver ${driverId}`);
          updateAcceptedRides(medicalRides, 'medical');
        },
        (error) => {
          console.error('Error in medical rides listener:', error);
        }
      );
      unsubscribes.push(medicalUnsubscribe);

      // Query regular scheduled rides
      const scheduledRidesQuery = query(
        collection(db, 'scheduledRides'),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['assigned', 'confirmed'])
      );

      const scheduledUnsubscribe = onSnapshot(
        scheduledRidesQuery,
        (snapshot) => {
          const regularRides = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestType: 'regular',
            collection: 'scheduledRides'
          }));
          
          console.log(`📅 Found ${regularRides.length} regular scheduled rides for driver ${driverId}`);
          updateAcceptedRides(regularRides, 'regular');
        },
        (error) => {
          console.error('Error in scheduled rides listener:', error);
        }
      );
      unsubscribes.push(scheduledUnsubscribe);

      setLoading(false);

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Error setting up rides listeners:', error);
      setLoading(false);
    }
  }, [driverId]);

  const [medicalRides, setMedicalRides] = useState([]);
  const [regularRides, setRegularRides] = useState([]);

  const updateAcceptedRides = (rides, type) => {
    if (type === 'medical') {
      setMedicalRides(rides);
    } else {
      setRegularRides(rides);
    }
  };

  // Combine and sort rides whenever either list changes
  useEffect(() => {
    const allRides = [...medicalRides, ...regularRides];
    console.log(`📅 Total rides before filtering: ${allRides.length} (${medicalRides.length} medical, ${regularRides.length} regular)`);
    
    // Filter out expired rides
    const now = new Date();
    const activeRides = allRides.filter(ride => {
      const rideTime = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
      const rideDate = rideTime?.toDate ? rideTime.toDate() : new Date(rideTime);
      const isActive = rideDate > now;
      
      if (!isActive) {
        console.log(`⏰ Filtered out expired ride: ${ride.id} (pickup was ${rideDate})`);
      }
      
      return isActive;
    });

    // Sort by pickup time (soonest first)
    activeRides.sort((a, b) => {
      const timeA = a.pickupDateTime || a.scheduledDateTime || a.appointmentDateTime;
      const timeB = b.pickupDateTime || b.scheduledDateTime || b.appointmentDateTime;
      
      const dateA = timeA?.toDate ? timeA.toDate() : new Date(timeA);
      const dateB = timeB?.toDate ? timeB.toDate() : new Date(timeB);
      
      return dateA - dateB;
    });

    console.log(`✅ Displaying ${activeRides.length} active scheduled rides`);
    setAcceptedRides(activeRides);
    
    // Calculate daily analysis for timeline view
    if (activeRides.length > 0) {
      const today = new Date();
      const analysis = calculateDailySchedule(activeRides, today);
      setDailyAnalysis(analysis);
      console.log(`📊 Daily analysis - ${analysis.statistics.gapCount} gaps, ${analysis.statistics.suggestedAdditionalRides} suggested rides`);
      
      // Calculate week analysis for week view
      const weekData = analyzeWeekSchedule(activeRides);
      setWeekAnalysis(weekData);
      console.log(`📅 Week analysis - ${weekData.length} days analyzed`);
    }
  }, [medicalRides, regularRides]);

  // Set filtered rides to all accepted rides (no date filtering needed - views handle it)
  useEffect(() => {
    setFilteredRides(acceptedRides);
  }, [acceptedRides]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Format date for display
  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get ride type info
  const getRideTypeInfo = (ride) => {
    if (ride.requestType === 'medical') {
      return {
        icon: 'medical',
        color: COLORS.error?.[500] || '#EF4444',
        bgColor: '#FEF2F2',
        label: 'Medical Transport'
      };
    }
    return {
      icon: 'car',
      color: COLORS.primary?.[500] || '#3B82F6',
      bgColor: '#EFF6FF',
      label: 'Scheduled Ride'
    };
  };

  // Render ride item
  const renderRideItem = ({ item: ride }) => {
    const typeInfo = getRideTypeInfo(ride);
    const rideTime = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
    
    return (
      <View style={[styles.rideCard, { borderLeftColor: typeInfo.color }]}>
        <View style={styles.rideHeader}>
          <View style={[styles.iconContainer, { backgroundColor: typeInfo.bgColor }]}>
            <Ionicons 
              name={typeInfo.icon} 
              size={20} 
              color={typeInfo.color} 
            />
          </View>
          <View style={styles.rideInfo}>
            <Text style={styles.rideTitle}>{typeInfo.label}</Text>
            <Text style={styles.rideDateTime}>
              {formatDate(rideTime)} • {formatTime(rideTime)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: typeInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: typeInfo.color }]}>
              {ride.status === 'confirmed' ? 'Confirmed' : 'Assigned'}
            </Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {ride.pickupLocation?.address || ride.pickup?.address || ride.pickup || 'Pickup location'}
            </Text>
          </View>
          
          {ride.dropoffLocation && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {ride.dropoffLocation?.address || ride.dropoff?.address || ride.dropoff || 'Drop-off location'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedRide(ride);
              setShowDetailsModal(true);
            }}
          >
            <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRide(ride)}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.error?.[500] || '#EF4444'} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleCancelRide = (ride) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this scheduled ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, ride.collection, ride.id), {
                status: 'cancelled',
                cancelledBy: 'driver',
                cancelledAt: serverTimestamp()
              });
              Alert.alert('Success', 'Ride cancelled successfully');
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary?.[500] || '#3B82F6'} />
        <Text style={styles.loadingText}>Loading your scheduled rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle & Date Filter */}
      {acceptedRides.length > 0 && (
        <>
          {/* View Mode Toggle */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list" 
                size={14} 
                color={viewMode === 'list' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
                List
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'timeline' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('timeline')}
            >
              <Ionicons 
                name="time" 
                size={14} 
                color={viewMode === 'timeline' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.viewModeText, viewMode === 'timeline' && styles.viewModeTextActive]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('week')}
            >
              <Ionicons 
                name="calendar" 
                size={14} 
                color={viewMode === 'week' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
                Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('month')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={viewMode === 'month' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>
                Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'optimizer' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('optimizer')}
            >
              <Ionicons 
                name="bulb" 
                size={14} 
                color={viewMode === 'optimizer' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.viewModeText, viewMode === 'optimizer' && styles.viewModeTextActive]}>
                Optimizer
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {filteredRides.length === 0 && acceptedRides.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No rides in this period</Text>
          <Text style={styles.emptySubtitle}>
            Try selecting a different time range.
          </Text>
        </View>
      ) : acceptedRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No scheduled rides</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any accepted rides scheduled at this time.
          </Text>
        </View>
      ) : viewMode === 'month' ? (
        <ScheduleMonthView
          allRides={acceptedRides}
          onDayTap={(date, rides) => {
            // Calculate analysis for selected day and switch to timeline
            const dayAnalysis = calculateDailySchedule(acceptedRides, date);
            setSelectedDayForTimeline(dayAnalysis);
            setViewMode('timeline');
          }}
        />
      ) : viewMode === 'optimizer' ? (
        <MultiDayOptimizer
          allRides={acceptedRides}
          onApplySuggestion={(suggestion) => {
            Alert.alert(
              suggestion.title,
              suggestion.description + '\n\n' + suggestion.action,
              [{ text: 'Got it!' }]
            );
          }}
        />
      ) : viewMode === 'week' ? (
        <ScheduleWeekView
          weekAnalysis={weekAnalysis || []}
          onDayTap={(dayAnalysis) => {
            // Switch to timeline view for the selected day
            setSelectedDayForTimeline(dayAnalysis);
            setViewMode('timeline');
          }}
        />
      ) : viewMode === 'timeline' ? (
        <ScheduleTimeline
          dailyAnalysis={selectedDayForTimeline || dailyAnalysis || { scheduledRides: filteredRides, gaps: [], statistics: {} }}
          onRideTap={(ride) => {
            setSelectedRide(ride);
            setShowDetailsModal(true);
          }}
          onGapTap={(gap) => {
            Alert.alert(
              '⏰ Available Time',
              `${gap.usableTime.toFixed(0)} minutes available\n\n💡 Could fit ${gap.suggestedRideCount} ride${gap.suggestedRideCount !== 1 ? 's' : ''}`,
              [{ text: 'OK' }]
            );
          }}
        />
      ) : (
        <FlatList
          style={styles.list}
          data={filteredRides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary?.[500] || '#3B82F6']}
              tintColor={COLORS.primary?.[500] || '#3B82F6'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Details Modal - Simple view-only modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.detailsModalOverlay}>
          <TouchableOpacity 
            style={styles.detailsModalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowDetailsModal(false)}
          />
          <View style={styles.detailsModalContainer}>
            <View style={styles.detailsModalHandle} />
            <View style={styles.detailsModalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {selectedRide && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Pickup Time</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedRide.pickupDateTime || selectedRide.scheduledDateTime || selectedRide.appointmentDateTime)} at {formatTime(selectedRide.pickupDateTime || selectedRide.scheduledDateTime || selectedRide.appointmentDateTime)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Pickup Location</Text>
                  <Text style={styles.detailValue}>
                    {selectedRide.pickupLocation?.address || selectedRide.pickup?.address || selectedRide.pickup || 'Not specified'}
                  </Text>
                </View>

                {selectedRide.dropoffLocation && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Drop-off Location</Text>
                    <Text style={styles.detailValue}>
                      {selectedRide.dropoffLocation?.address || selectedRide.dropoff?.address || selectedRide.dropoff}
                    </Text>
                  </View>
                )}

                {selectedRide.requestType === 'medical' && selectedRide.medicalRequirements && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Medical Requirements</Text>
                    {selectedRide.medicalRequirements.wheelchairAccessible && (
                      <Text style={styles.requirementText}>♿ Wheelchair accessible</Text>
                    )}
                    {selectedRide.medicalRequirements.oxygenSupport && (
                      <Text style={styles.requirementText}>🫁 Oxygen support</Text>
                    )}
                    {selectedRide.medicalRequirements.stretcherRequired && (
                      <Text style={styles.requirementText}>🏥 Stretcher required</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background || '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
  },
  filterTextActive: {
    color: COLORS.white || '#FFFFFF',
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: COLORS.white || '#FFFFFF',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: COLORS.background || '#F3F4F6',
    gap: 3,
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
  },
  viewModeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
  },
  viewModeTextActive: {
    color: COLORS.white || '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary || '#6B7280',
  },
  list: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  rideCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: CARD_SIZES.BORDER_RADIUS,
    padding: CARD_SIZES.PADDING,
    marginBottom: SPACING.SMALL,
    borderLeftWidth: wp('1%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: CARD_SIZES.SHADOW_RADIUS,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: hp('4%'),
    height: hp('4%'),
    borderRadius: hp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SMALL,
  },
  rideInfo: {
    flex: 1,
  },
  rideTitle: {
    fontSize: FONT_SIZES.SMALL,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  rideDateTime: {
    fontSize: FONT_SIZES.CAPTION,
    color: COLORS.textPrimary || '#111827',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rideDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textPrimary || '#111827',
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background || '#F3F4F6',
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    marginLeft: 3,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    flex: 1,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    color: COLORS.error?.[500] || '#EF4444',
    marginLeft: 3,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  detailsModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailsModalBackdrop: {
    flex: 1,
  },
  detailsModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  detailsModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray300 || '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.textPrimary || '#111827',
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.textPrimary || '#111827',
    marginBottom: 4,
  },
  closeModalButton: {
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyScheduledRides;

