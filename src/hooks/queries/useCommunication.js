import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';
import apiClient from '@/services/api';

/**
 * Fetch conversations from backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise} Array of conversations
 */
const fetchConversations = async (driverId) => {
  try {
    const response = await apiClient.get(`/drivers/${driverId}/conversations`);
    return response;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
};

/**
 * Fetch chat messages from backend API
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch (default 50)
 * @returns {Promise} Array of messages
 */
const fetchChatMessages = async (conversationId, limit = 50) => {
  try {
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages?limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
};

/**
 * Send message via backend API
 * @param {string} conversationId - Conversation ID
 * @param {Object} messageData - Message content and metadata
 * @returns {Promise} Sent message
 */
const sendMessage = async (conversationId, messageData) => {
  try {
    const response = await apiClient.post(
      `/conversations/${conversationId}/messages`,
      messageData
    );
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

/**
 * Mark conversation as read via backend API
 * @param {string} conversationId - Conversation ID
 * @returns {Promise} Updated conversation
 */
const markConversationRead = async (conversationId) => {
  try {
    const response = await apiClient.patch(
      `/conversations/${conversationId}/read`
    );
    return response;
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
    throw error;
  }
};

/**
 * Hook to fetch all conversations for driver
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with conversations array
 */
export const useConversations = (driverId) => {
  return useQuery({
    queryKey: ['communication', 'conversations', driverId],
    queryFn: () => fetchConversations(driverId),
    enabled: !!driverId,
    ...queryConfig.communication,
  });
};

/**
 * Hook to fetch chat messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch (default 50)
 * @returns {Object} Query result with messages array
 */
export const useChatMessages = (conversationId, limit = 50) => {
  return useQuery({
    queryKey: ['communication', 'messages', conversationId, limit],
    queryFn: () => fetchChatMessages(conversationId, limit),
    enabled: !!conversationId,
    ...queryConfig.communication,
  });
};

/**
 * Mutation hook to send message
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Mutation result with mutate function
 */
export const useSendMessage = (conversationId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageData) => sendMessage(conversationId, messageData),
    onSuccess: (newMessage) => {
      // Add message to cache optimistically
      queryClient.setQueryData(
        ['communication', 'messages', conversationId, 50],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );

      // Update conversation's last message
      queryClient.invalidateQueries({
        queryKey: ['communication', 'conversations'],
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
};

/**
 * Mutation hook to mark conversation as read
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result with mutate function
 */
export const useMarkConversationRead = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId) => markConversationRead(conversationId),
    onSuccess: () => {
      // Refresh conversations to update read status
      queryClient.invalidateQueries({
        queryKey: ['communication', 'conversations', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to mark conversation as read:', error);
    },
  });
};
