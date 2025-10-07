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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { COLORS, TYPOGRAPHY, DIMENSIONS as DIMS } from '@/constants';
import ConflictChecker from './ConflictChecker';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Scheduled Ride Requests Component for React Native
 * Shows pending scheduled ride requests that drivers can accept or decline
 * Mobile-optimized with touch-friendly interface
 */
const ScheduledRideRequests = ({ driverId, isOnline = true, onRideAccepted, onRideDeclined }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [wasOffline, setWasOffline] = useState(false);
  
  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useState(new Animated.Value(0))[0];
  
  // Conflict detection state
  const [acceptedScheduledRides, setAcceptedScheduledRides] = useState([]);
  
  // Driver capabilities state
  const [driverCapabilities, setDriverCapabilities] = useState(null);
  
  // Loading progress state
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // Load driver's profile and capabilities (cached)
  useEffect(() => {
    if (!driverId) return;
    
    // Skip if already loaded
    if (driverCapabilities) return;

    const loadDriverProfile = async () => {
      try {
        const driverRef = doc(db, 'driverApplications', driverId);
        const driverSnap = await getDoc(driverRef);
        
        if (driverSnap.exists()) {
          const driverData = driverSnap.data();
          setDriverCapabilities(driverData);
        }
      } catch (error) {
        console.error('Error loading driver profile:', error);
      }
    };

    loadDriverProfile();
  }, [driverId]);

  // Load pending scheduled ride requests for this driver
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Query for scheduled ride requests where this driver was notified
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', driverId),
        where('type', 'in', ['scheduled_ride_request', 'medical_ride_request']),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        async (snapshot) => {
          const totalNotifications = snapshot.docs.length;
          setLoadingProgress({ current: 0, total: totalNotifications });
          
          // Fetch all ride details in parallel with progress tracking
          let completedCount = 0;
          const ridePromises = snapshot.docs.map(async (docSnapshot) => {
            const notification = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // Get the ride details from the notification data
            if (!notification.data?.rideId) {
              completedCount++;
              setLoadingProgress({ current: completedCount, total: totalNotifications });
              return null;
            }
            
            try {
              const rideId = notification.data.rideId;
              
              // Try medical ride first, then regular ride
              const medicalRideRef = doc(db, 'medicalRideSchedule', rideId);
              const medicalRideSnap = await getDoc(medicalRideRef);
              
              if (medicalRideSnap.exists()) {
                const rideData = { id: medicalRideSnap.id, ...medicalRideSnap.data() };
                completedCount++;
                setLoadingProgress({ current: completedCount, total: totalNotifications });
                return {
                  ...rideData,
                  notificationId: notification.id,
                  requestType: 'medical',
                  notification: notification
                };
              }
              
              // If not medical, try regular scheduled ride
              const scheduledRideRef = doc(db, 'scheduledRides', rideId);
              const scheduledRideSnap = await getDoc(scheduledRideRef);
              
              if (scheduledRideSnap.exists()) {
                const rideData = { id: scheduledRideSnap.id, ...scheduledRideSnap.data() };
                completedCount++;
                setLoadingProgress({ current: completedCount, total: totalNotifications });
                return {
                  ...rideData,
                  notificationId: notification.id,
                  requestType: 'regular',
                  notification: notification
                };
              }
              
              completedCount++;
              setLoadingProgress({ current: completedCount, total: totalNotifications });
              return null;
            } catch (error) {
              console.error('Error loading ride details:', error);
              completedCount++;
              setLoadingProgress({ current: completedCount, total: totalNotifications });
              return null;
            }
          });
          
          // Wait for all rides to load in parallel, then filter out nulls
          let requests = (await Promise.all(ridePromises)).filter(Boolean);
          
          // Filter medical rides based on driver capabilities
          if (driverCapabilities) {
            const hasMedicalCertifications = driverCapabilities.medicalCertifications && 
              Object.keys(driverCapabilities.medicalCertifications).length > 0;
            
            requests = requests.filter(request => {
              // Always show regular rides
              if (request.requestType === 'regular') return true;
              
              // Only show medical rides if driver has medical certifications
              if (request.requestType === 'medical') {
                return hasMedicalCertifications;
              }
              
              return true;
            });
          }
          
          // Current time for filtering
          const now = new Date();
          const GRACE_PERIOD_MINUTES = 10; // Grace period after pickup time
          
          // Filter out expired rides and prepare for background cleanup
          const activeRequests = [];
          const expiredRequests = [];
          
          requests.forEach(request => {
            const rideTime = request.pickupDateTime || request.scheduledDateTime;
            const rideDate = rideTime?.toDate ? rideTime.toDate() : new Date(rideTime);
            
            // Add grace period to ride time
            const rideWithGrace = new Date(rideDate.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000);
            
            if (rideWithGrace > now) {
              // Ride is still valid (future or within grace period)
              activeRequests.push(request);
            } else {
              // Ride has expired (past pickup time + grace period)
              expiredRequests.push(request);
            }
          });
          
          // Sort active requests by pickup/scheduled time (soonest first)
          activeRequests.sort((a, b) => {
            const timeA = a.pickupDateTime || a.scheduledDateTime;
            const timeB = b.pickupDateTime || b.scheduledDateTime;
            
            // Handle Firestore Timestamps
            const dateA = timeA?.toDate ? timeA.toDate() : new Date(timeA);
            const dateB = timeB?.toDate ? timeB.toDate() : new Date(timeB);
            
            return dateA - dateB; // Ascending order (soonest first)
          });
          
          // Set active requests immediately (fast UX)
          setPendingRequests(activeRequests);
          setLoading(false);
          
          // Background cleanup: Auto-decline expired rides (non-blocking)
          if (expiredRequests.length > 0) {
            expiredRequests.forEach(async (request) => {
              try {
                await updateDoc(doc(db, 'notifications', request.notificationId), {
                  status: 'expired',
                  respondedAt: serverTimestamp(),
                  response: 'auto_declined_expired'
                });
              } catch (error) {
                console.error('Error auto-declining expired ride:', error);
              }
            });
          }
        },
        (error) => {
          console.error('Error in notifications listener:', error);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up pending requests listener:', error);
      setLoading(false);
    }
  }, [driverId, driverCapabilities]);

  // Load driver's accepted scheduled rides for conflict detection
  useEffect(() => {
    if (!driverId) return;

    const loadAcceptedRides = async () => {
      try {
        const now = new Date();
        
        // Get medical rides
        const medicalQuery = query(
          collection(db, 'medicalRideSchedule'),
          where('assignedDriverId', '==', driverId),
          where('status', 'in', ['assigned', 'confirmed']),
          where('pickupDateTime', '>=', now)
        );
        
        // Get regular scheduled rides
        const regularQuery = query(
          collection(db, 'scheduledRides'),
          where('assignedDriverId', '==', driverId),
          where('status', 'in', ['assigned', 'confirmed']),
          where('scheduledDateTime', '>=', now)
        );
        
        const [medicalSnapshot, regularSnapshot] = await Promise.all([
          getDocs(medicalQuery),
          getDocs(regularQuery)
        ]);
        
        const allAcceptedRides = [
          ...medicalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), requestType: 'medical' })),
          ...regularSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), requestType: 'regular' }))
        ];
        
        setAcceptedScheduledRides(allAcceptedRides);
      } catch (error) {
        console.error('Error loading accepted rides for conflict check:', error);
      }
    };
    
    loadAcceptedRides();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAcceptedRides, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  // Auto-refresh when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      // Driver just came back online - refresh the list
      console.log('📶 Driver back online - refreshing ride requests');
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 500);
    }
    setWasOffline(!isOnline);
  }, [isOnline, wasOffline]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simply toggle loading to trigger a refresh
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Show toast notification
  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    
    // Animate in
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastVisible(false);
      });
    }, 3000);
  };

  // Handle accept ride request
  const handleAcceptRequest = async (request) => {
    // Check if driver is online
    if (!isOnline) {
      showToast('⚠️ You must be online to accept rides');
      return;
    }

    try {
      setRespondingTo(request.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', request.notificationId), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        response: 'accepted'
      });

      // Update ride status
      const rideCollection = request.requestType === 'medical' ? 'medicalRideSchedule' : 'scheduledRides';
      await updateDoc(doc(db, rideCollection, request.id), {
        assignedDriverId: driverId,
        status: 'assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Show toast instead of alert
      showToast('✅ Ride request accepted successfully!');

      onRideAccepted?.(request);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setShowDetailsModal(false);
      
    } catch (error) {
      console.error('Error accepting ride request:', error);
      Alert.alert(
        'Error',
        'Failed to accept ride request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRespondingTo(null);
    }
  };

  // Handle decline ride request
  const handleDeclineRequest = async (request) => {
    try {
      setRespondingTo(request.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', request.notificationId), {
        status: 'declined',
        respondedAt: serverTimestamp(),
        response: 'declined'
      });

      Alert.alert(
        'Request Declined',
        'You have declined this ride request.',
        [{ text: 'OK' }]
      );

      onRideDeclined?.(request);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setShowDetailsModal(false);
      
    } catch (error) {
      console.error('Error declining ride request:', error);
      Alert.alert(
        'Error',
        'Failed to decline ride request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRespondingTo(null);
    }
  };

  // Format date for display
  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    // Handle Firestore Timestamp
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
    // Handle Firestore Timestamp
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get ride type info
  const getRideTypeInfo = (request) => {
    if (request.requestType === 'medical') {
      return {
        icon: 'medical',
        color: COLORS.error?.[500] || '#EF4444',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        label: 'Medical Transport'
      };
    }
    return {
      icon: 'car',
      color: COLORS.primary?.[500] || '#3B82F6',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      label: 'Scheduled Ride'
    };
  };

  // Render request item
  const renderRequestItem = ({ item: request }) => {
    const typeInfo = getRideTypeInfo(request);
    
    // Check for conflicts
    const conflict = require('@/utils/scheduleAnalyzer').checkRideConflict(request, acceptedScheduledRides);
    const hasWarning = conflict.hasConflict;
    const isCritical = conflict.riskLevel === 'critical';
    
    return (
      <View style={[styles.requestCard, { borderLeftColor: typeInfo.color }]}>
        <View style={styles.requestHeader}>
          <View style={[styles.iconContainer, { backgroundColor: typeInfo.bgColor }]}>
            <Ionicons 
              name={typeInfo.icon} 
              size={20} 
              color={typeInfo.color} 
            />
          </View>
          <View style={styles.requestInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.requestTitle}>{typeInfo.label}</Text>
              {hasWarning && (
                <View style={[styles.warningBadge, isCritical && styles.criticalBadge]}>
                  <Ionicons 
                    name={isCritical ? "close-circle" : "warning"} 
                    size={12} 
                    color={COLORS.white} 
                  />
                </View>
              )}
            </View>
            <Text style={styles.requestDateTime}>
              {formatDate(request.pickupDateTime || request.scheduledDateTime)} • {formatTime(request.pickupDateTime || request.scheduledDateTime)}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {request.pickupLocation?.address || request.pickup?.address || request.pickup}
            </Text>
          </View>
          
          {request.dropoffLocation && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {request.dropoffLocation?.address || request.dropoff?.address || request.dropoff}
              </Text>
            </View>
          )}

          {request.requestType === 'medical' && request.medicalRequirements && (
            <View style={styles.medicalRequirements}>
              <Text style={styles.medicalTitle}>Medical Requirements:</Text>
              <View style={styles.requirementsList}>
                {request.medicalRequirements.wheelchairAccessible && (
                  <Text style={styles.requirementText}>♿ Wheelchair</Text>
                )}
                {request.medicalRequirements.oxygenSupport && (
                  <Text style={styles.requirementText}>🫁 Oxygen Support</Text>
                )}
                {request.medicalRequirements.stretcherRequired && (
                  <Text style={styles.requirementText}>🏥 Stretcher</Text>
                )}
                {request.medicalRequirements.assistanceLevel && request.medicalRequirements.assistanceLevel !== 'none' && (
                  <Text style={styles.requirementText}>🤝 {request.medicalRequirements.assistanceLevel} Assistance</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedRequest(request);
              setShowDetailsModal(true);
            }}
          >
            <Ionicons name="eye" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.declineButton, respondingTo === request.id && styles.disabledButton]}
            onPress={() => handleDeclineRequest(request)}
            disabled={respondingTo === request.id}
          >
            {respondingTo === request.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="close-circle" size={14} color={COLORS.white} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.acceptButton, respondingTo === request.id && styles.disabledButton]}
            onPress={() => handleAcceptRequest(request)}
            disabled={respondingTo === request.id}
          >
            {respondingTo === request.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    const progress = loadingProgress.total > 0 
      ? (loadingProgress.current / loadingProgress.total) * 100 
      : 0;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary?.[500] || '#3B82F6'} />
        <Text style={styles.loadingText}>Loading ride requests...</Text>
        
        {loadingProgress.total > 0 && (
          <>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {loadingProgress.current} of {loadingProgress.total} rides loaded
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="notifications" size={24} color={COLORS.primary?.[500] || '#3B82F6'} />
          </View>
          <View>
            {/* <Text style={styles.headerTitle}>Scheduled Ride Requests</Text> */}
            {/* <Text style={styles.headerSubtitle}> */}
            <Text style={styles.headerTitle}>
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color={COLORS.white} />
          <Text style={styles.offlineBannerText}>
            You're offline - Go online to accept rides
          </Text>
        </View>
      )}

      {pendingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any scheduled ride requests at this time.
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={pendingRequests}
          renderItem={renderRequestItem}
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

      {/* Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onAccept={() => handleAcceptRequest(selectedRequest)}
        onDecline={() => handleDeclineRequest(selectedRequest)}
        respondingTo={respondingTo}
        acceptedScheduledRides={acceptedScheduledRides}
        isOnline={isOnline}
      />

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, visible, onClose, onAccept, onDecline, respondingTo, acceptedScheduledRides = [], isOnline = true }) => {
  if (!request) return null;

  const typeInfo = request.requestType === 'medical' 
    ? { icon: 'medical', color: COLORS.error?.[500] || '#EF4444', label: 'Medical Transport' }
    : { icon: 'car', color: COLORS.primary?.[500] || '#3B82F6', label: 'Scheduled Ride' };

  // Format date/time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    // Handle Firestore Timestamp
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.detailsModalOverlay}>
        <TouchableOpacity 
          style={styles.detailsModalBackdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.detailsModalContainer}>
          <View style={styles.detailsModalHandle} />
          <View style={styles.detailsModalHeader}>
            <View style={styles.modalTitleContainer}>
              <View style={[styles.modalIcon, { backgroundColor: typeInfo.color + '20' }]}>
                <Ionicons name={typeInfo.icon} size={24} color={typeInfo.color} />
              </View>
              <Text style={styles.modalTitle}>{typeInfo.label} Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Conflict Checker */}
          <ConflictChecker 
            rideRequest={request}
            scheduledRides={acceptedScheduledRides}
          />

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
              <Text style={styles.detailValue}>
                {formatDateTime(request.pickupDateTime || request.scheduledDateTime)}
              </Text>
            </View>
            {request.patientId && (
              <View style={styles.detailItem}>
                <Ionicons name="person" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
                <Text style={styles.detailValue}>Patient: {request.patientId}</Text>
              </View>
            )}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
              <Text style={styles.detailValue}>
                {request.pickupLocation?.address || request.pickup?.address || request.pickup}
              </Text>
            </View>
          </View>

          {request.dropoffLocation && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Drop-off Location</Text>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary?.[500] || '#3B82F6'} />
                <Text style={styles.detailValue}>
                  {request.dropoffLocation?.address || request.dropoff?.address || request.dropoff}
                </Text>
              </View>
            </View>
          )}

          {request.requestType === 'medical' && request.medicalRequirements && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Medical Requirements</Text>
              <View style={styles.medicalRequirementsContainer}>
                {request.medicalRequirements.wheelchairAccessible && (
                  <Text style={styles.medicalRequirement}>♿ Wheelchair accessible vehicle required</Text>
                )}
                {request.medicalRequirements.oxygenSupport && (
                  <Text style={styles.medicalRequirement}>🫁 Oxygen support equipment required</Text>
                )}
                {request.medicalRequirements.stretcherRequired && (
                  <Text style={styles.medicalRequirement}>🏥 Stretcher transport capability required</Text>
                )}
                {request.medicalRequirements.assistanceLevel && request.medicalRequirements.assistanceLevel !== 'none' && (
                  <Text style={styles.medicalRequirement}>
                    🤝 {request.medicalRequirements.assistanceLevel} level assistance required
                  </Text>
                )}
                {request.medicalRequirements.specialInstructions && (
                  <View style={styles.specialInstructions}>
                    <Text style={styles.specialInstructionsTitle}>Special Instructions:</Text>
                    <Text style={styles.specialInstructionsText}>
                      {request.medicalRequirements.specialInstructions}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {request.specialInstructions && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
              <Text style={styles.instructionText}>{request.specialInstructions}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalButton, styles.declineModalButton, respondingTo === request.id && styles.disabledButton]}
            onPress={onDecline}
            disabled={respondingTo === request.id}
          >
            {respondingTo === request.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.declineModalButtonText}>Decline</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modalButton, 
              styles.acceptModalButton, 
              (respondingTo === request.id || !isOnline) && styles.disabledButton
            ]}
            onPress={onAccept}
            disabled={respondingTo === request.id || !isOnline}
          >
            {respondingTo === request.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.acceptModalButtonText}>
                {!isOnline ? 'Offline - Cannot Accept' : 'Accept Ride'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#F9FAFB',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary || '#6B7280',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.secondary?.[200] || '#E5E7EB',
    borderRadius: 4,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary || '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: (COLORS.primary?.[500] || '#3B82F6') + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    marginTop: 2,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning?.[500] || '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white || '#FFFFFF',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  requestInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  warningBadge: {
    backgroundColor: COLORS.warning?.[500] || '#F59E0B',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalBadge: {
    backgroundColor: COLORS.error?.[500] || '#EF4444',
  },
  requestDateTime: {
    fontSize: 12,
    color: COLORS.textPrimary || '#111827',
    marginTop: 2,
    fontWeight: '500',
  },
  requestDetails: {
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
  medicalRequirements: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  medicalTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementText: {
    fontSize: 10,
    color: '#92400E',
    marginRight: 10,
    marginBottom: 2,
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
  },
  detailsButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary || '#6B7280',
    marginLeft: 3,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.success?.[500] || '#10B981',
    marginLeft: 6,
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white || '#FFFFFF',
    marginLeft: 3,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.error?.[500] || '#EF4444',
    marginLeft: 6,
  },
  declineButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white || '#FFFFFF',
    marginLeft: 3,
  },
  disabledButton: {
    opacity: 0.6,
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
    height: '60%',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white || '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary || '#111827',
    marginLeft: 12,
    flex: 1,
  },
  medicalRequirementsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  medicalRequirement: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  specialInstructions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  specialInstructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  specialInstructionsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textPrimary || '#111827',
    lineHeight: 20,
    backgroundColor: COLORS.background || '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.background || '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
  },
  declineModalButton: {
    backgroundColor: COLORS.error?.[500] || '#EF4444',
  },
  declineModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white || '#FFFFFF',
  },
  acceptModalButton: {
    backgroundColor: COLORS.success?.[500] || '#10B981',
  },
  acceptModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white || '#FFFFFF',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.success?.[600] || '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  toastText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ScheduledRideRequests;
