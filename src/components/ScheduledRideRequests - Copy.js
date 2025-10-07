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
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { COLORS, TYPOGRAPHY, DIMENSIONS as DIMS } from '@/constants';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Scheduled Ride Requests Component for React Native
 * Shows pending scheduled ride requests that drivers can accept or decline
 * Mobile-optimized with touch-friendly interface
 */
const ScheduledRideRequests = ({ driverId, onRideAccepted, onRideDeclined }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);

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
          // Fetch all ride details in parallel for better performance
          const ridePromises = snapshot.docs.map(async (docSnapshot) => {
            const notification = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // Get the ride details from the notification data
            if (!notification.data?.rideId) return null;
            
            try {
              const rideId = notification.data.rideId;
              
              // Try medical ride first, then regular ride
              const medicalRideRef = doc(db, 'medicalRideSchedule', rideId);
              const medicalRideSnap = await getDoc(medicalRideRef);
              
              if (medicalRideSnap.exists()) {
                const rideData = { id: medicalRideSnap.id, ...medicalRideSnap.data() };
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
                return {
                  ...rideData,
                  notificationId: notification.id,
                  requestType: 'regular',
                  notification: notification
                };
              }
              
              return null;
            } catch (error) {
              console.error('Error loading ride details:', error);
              return null;
            }
          });
          
          // Wait for all rides to load in parallel, then filter out nulls
          const requests = (await Promise.all(ridePromises)).filter(Boolean);
          
          setPendingRequests(requests);
          setLoading(false);
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
  }, [driverId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simply toggle loading to trigger a refresh
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Handle accept ride request
  const handleAcceptRequest = async (request) => {
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

      Alert.alert(
        'Success!',
        'Ride request accepted successfully!',
        [{ text: 'OK' }]
      );

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
            <Text style={styles.requestTitle}>{typeInfo.label}</Text>
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary?.[500] || '#3B82F6'} />
        <Text style={styles.loadingText}>Loading ride requests...</Text>
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
            <Text style={styles.headerTitle}>Scheduled Ride Requests</Text>
            <Text style={styles.headerSubtitle}>
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

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
      />
    </View>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, visible, onClose, onAccept, onDecline, respondingTo }) => {
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
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
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
            style={[styles.modalButton, styles.acceptModalButton, respondingTo === request.id && styles.disabledButton]}
            onPress={onAccept}
            disabled={respondingTo === request.id}
          >
            {respondingTo === request.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.acceptModalButtonText}>Accept Ride</Text>
            )}
          </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary || '#6B7280',
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
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
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
});

export default ScheduledRideRequests;
