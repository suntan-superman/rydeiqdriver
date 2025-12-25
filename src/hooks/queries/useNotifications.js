import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch notifications from backend API (real-time)
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of notifications
 */
const fetchNotifications = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/notifications`);
    return response;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

/**
 * Fetch unread notification count from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Unread count
 */
const fetchUnreadCount = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/notifications/unread-count`);
    return response;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    throw error;
  }
};

/**
 * Mark single notification as read via backend API
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Updated notification
 */
const markNotificationRead = async (notificationId) => {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read via backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Result
 */
const markAllNotificationsRead = async (driverId) => {
  try {
    const response = await apiClient.post(`/drivers/${driverId}/notifications/mark-all-read`);
    return response;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Hook to fetch driver's notifications (real-time)
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with notifications array
 */
export const useNotifications = (driverId) => {
  return useQuery({
    queryKey: ['notifications', driverId],
    queryFn: () => fetchNotifications(driverId),
    enabled: !!driverId,
    ...queryConfig.notifications,
  });
};

/**
 * Hook to fetch unread notification count
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with unread count
 */
export const useUnreadCount = (driverId) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count', driverId],
    queryFn: () => fetchUnreadCount(driverId),
    enabled: !!driverId,
    ...queryConfig.notifications,
  });
};

/**
 * Mutation hook to mark single notification as read
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useMarkNotificationRead = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId) => markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications list
      queryClient.invalidateQueries({
        queryKey: ['notifications', driverId],
      });
      // Update unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};

/**
 * Mutation hook to mark all notifications as read
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useMarkAllNotificationsRead = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(driverId),
    onSuccess: () => {
      // Invalidate all notifications
      queryClient.invalidateQueries({
        queryKey: ['notifications', driverId],
      });
      // Reset unread count
      queryClient.setQueryData(['notifications', 'unread-count', driverId], {
        count: 0,
        driverId,
      });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
    },
  });
};
