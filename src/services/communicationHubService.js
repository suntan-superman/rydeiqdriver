import { db } from './firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { Alert, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

class CommunicationHubService {
  constructor() {
    this.db = db;
    this.activeConversations = new Map();
    this.messageListeners = new Map();
    this.quickResponses = [];
    this.translationEnabled = false;
    this.voiceCallEnabled = false;
    this.communicationSettings = {
      autoTranslate: false,
      voiceCalls: true,
      quickResponses: true,
      readReceipts: true,
      typingIndicators: true,
      soundNotifications: true,
      vibrationNotifications: true
    };
  }

  /**
   * Initialize communication hub service
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      
      // Load communication settings
      await this.loadCommunicationSettings();
      
      // Load quick responses
      await this.loadQuickResponses();
      
      // Initialize message listeners
      await this.initializeMessageListeners();
      
      console.log('✅ Communication Hub Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Communication Hub Service:', error);
      return false;
    }
  }

  /**
   * Load communication settings
   */
  async loadCommunicationSettings() {
    try {
      const settingsDoc = await getDoc(doc(this.db, 'driverCommunicationSettings', this.driverId));
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        this.communicationSettings = { ...this.communicationSettings, ...settings };
      } else {
        // Create default settings
        await this.createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading communication settings:', error);
    }
  }

  /**
   * Load quick response templates
   */
  async loadQuickResponses() {
    try {
      const responsesQuery = query(
        collection(this.db, 'driverQuickResponses'),
        where('driverId', '==', this.driverId),
        orderBy('category', 'asc'),
        orderBy('priority', 'asc')
      );
      
      const snapshot = await getDocs(responsesQuery);
      this.quickResponses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Add default quick responses if none exist
      if (this.quickResponses.length === 0) {
        await this.createDefaultQuickResponses();
      }
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  }

  /**
   * Initialize message listeners for active conversations
   */
  async initializeMessageListeners() {
    try {
      // Get active conversations
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', this.driverId),
        where('status', 'in', ['active', 'pending']),
        orderBy('lastMessageAt', 'desc'),
        limit(10)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      conversationsSnapshot.docs.forEach(conversationDoc => {
        const conversation = { id: conversationDoc.id, ...conversationDoc.data() };
        this.setupMessageListener(conversation.id);
      });
    } catch (error) {
      console.error('Error initializing message listeners:', error);
    }
  }

  /**
   * Setup real-time message listener for a conversation
   * @param {string} conversationId - Conversation ID
   */
  setupMessageListener(conversationId) {
    try {
      // Remove existing listener if any
      if (this.messageListeners.has(conversationId)) {
        this.messageListeners.get(conversationId)();
      }

      const messagesQuery = query(
        collection(this.db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.handleNewMessages(conversationId, messages);
      }, (error) => {
        console.error('Error in conversation messages subscription:', error);
      });

      this.messageListeners.set(conversationId, unsubscribe);
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  /**
   * Handle new messages
   * @param {string} conversationId - Conversation ID
   * @param {Array} messages - New messages
   */
  handleNewMessages(conversationId, messages) {
    try {
      // Update conversation in active conversations
      this.activeConversations.set(conversationId, { messages });
      
      // Check for new unread messages
      const unreadMessages = messages.filter(msg => 
        !msg.readBy?.includes(this.driverId) && msg.senderId !== this.driverId
      );

      if (unreadMessages.length > 0) {
        this.handleUnreadMessages(conversationId, unreadMessages);
      }
    } catch (error) {
      console.error('Error handling new messages:', error);
    }
  }

  /**
   * Handle unread messages
   * @param {string} conversationId - Conversation ID
   * @param {Array} unreadMessages - Unread messages
   */
  handleUnreadMessages(conversationId, unreadMessages) {
    try {
      // Send notifications for unread messages
      if (this.communicationSettings.soundNotifications) {
        // Play notification sound
        this.playNotificationSound();
      }

      if (this.communicationSettings.vibrationNotifications) {
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Update conversation status
      this.updateConversationStatus(conversationId, 'unread');
    } catch (error) {
      console.error('Error handling unread messages:', error);
    }
  }

  /**
   * Send message to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} messageText - Message text
   * @param {string} messageType - Message type (text, image, voice, etc.)
   * @param {Object} metadata - Additional message metadata
   * @returns {Promise<Object>} Sent message
   */
  async sendMessage(conversationId, messageText, messageType = 'text', metadata = {}) {
    try {
      const message = {
        conversationId,
        senderId: this.driverId,
        messageText,
        messageType,
        timestamp: serverTimestamp(),
        readBy: [this.driverId],
        metadata: {
          ...metadata,
          translated: false,
          originalLanguage: 'en'
        }
      };

      // Add message to database
      const messageRef = await addDoc(collection(this.db, 'messages'), message);

      // Update conversation last message
      await updateDoc(doc(this.db, 'conversations', conversationId), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: this.driverId
      });

      // Log communication activity
      await this.logCommunicationActivity('message_sent', {
        conversationId,
        messageType,
        messageLength: messageText.length
      });

      return { id: messageRef.id, ...message };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Create new conversation
   * @param {string} participantId - Other participant ID (rider, support, etc.)
   * @param {string} conversationType - Type of conversation (rider, support, driver)
   * @param {Object} metadata - Additional conversation metadata
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(participantId, conversationType, metadata = {}) {
    try {
      const conversation = {
        participants: [this.driverId, participantId],
        conversationType,
        status: 'active',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        metadata: {
          ...metadata,
          driverId: this.driverId,
          participantId
        }
      };

      // Check if conversation already exists
      const existingConversation = await this.findExistingConversation(participantId, conversationType);
      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const conversationRef = await addDoc(collection(this.db, 'conversations'), conversation);
      
      // Setup message listener for new conversation
      this.setupMessageListener(conversationRef.id);

      // Log communication activity
      await this.logCommunicationActivity('conversation_created', {
        conversationId: conversationRef.id,
        conversationType,
        participantId
      });

      return { id: conversationRef.id, ...conversation };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation
   * @param {string} participantId - Other participant ID
   * @param {string} conversationType - Type of conversation
   * @returns {Promise<Object|null>} Existing conversation or null
   */
  async findExistingConversation(participantId, conversationType) {
    try {
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', this.driverId),
        where('conversationType', '==', conversationType),
        where('status', 'in', ['active', 'pending'])
      );

      const snapshot = await getDocs(conversationsQuery);
      
      for (const doc of snapshot.docs) {
        const conversation = { id: doc.id, ...doc.data() };
        if (conversation.participants.includes(participantId)) {
          return conversation;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  }

  /**
   * Get conversation messages
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Array>} Conversation messages
   */
  async getConversationMessages(conversationId, limit = 50) {
    try {
      const messagesQuery = query(
        collection(this.db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {Array} messageIds - Message IDs to mark as read
   */
  async markMessagesAsRead(conversationId, messageIds) {
    try {
      const batch = [];
      
      messageIds.forEach(messageId => {
        const messageRef = doc(this.db, 'messages', messageId);
        batch.push(updateDoc(messageRef, {
          readBy: [this.driverId],
          readAt: serverTimestamp()
        }));
      });

      await Promise.all(batch);

      // Update conversation status
      await this.updateConversationStatus(conversationId, 'read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Update conversation status
   * @param {string} conversationId - Conversation ID
   * @param {string} status - New status
   */
  async updateConversationStatus(conversationId, status) {
    try {
      await updateDoc(doc(this.db, 'conversations', conversationId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation status:', error);
    }
  }

  /**
   * Send quick response
   * @param {string} conversationId - Conversation ID
   * @param {string} responseId - Quick response ID
   * @returns {Promise<Object>} Sent message
   */
  async sendQuickResponse(conversationId, responseId) {
    try {
      const quickResponse = this.quickResponses.find(r => r.id === responseId);
      if (!quickResponse) {
        throw new Error('Quick response not found');
      }

      return await this.sendMessage(
        conversationId, 
        quickResponse.message, 
        'text', 
        { quickResponseId: responseId }
      );
    } catch (error) {
      console.error('Error sending quick response:', error);
      throw error;
    }
  }

  /**
   * Translate message
   * @param {string} messageText - Message text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string>} Translated message
   */
  async translateMessage(messageText, targetLanguage = 'en') {
    try {
      // This would integrate with a translation service like Google Translate
      // For now, we'll simulate translation
      const translatedMessage = await this.simulateTranslation(messageText, targetLanguage);
      
      // Log translation activity
      await this.logCommunicationActivity('message_translated', {
        originalLength: messageText.length,
        targetLanguage
      });

      return translatedMessage;
    } catch (error) {
      console.error('Error translating message:', error);
      return messageText; // Return original if translation fails
    }
  }

  /**
   * Simulate translation (placeholder for real translation service)
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @returns {Promise<string>} Translated text
   */
  async simulateTranslation(text, targetLanguage) {
    // This is a placeholder - in production, integrate with Google Translate API
    const translations = {
      'es': `[ES] ${text}`,
      'fr': `[FR] ${text}`,
      'de': `[DE] ${text}`,
      'zh': `[ZH] ${text}`,
      'ja': `[JA] ${text}`,
      'ko': `[KO] ${text}`,
      'ar': `[AR] ${text}`,
      'hi': `[HI] ${text}`,
      'pt': `[PT] ${text}`,
      'ru': `[RU] ${text}`
    };

    return translations[targetLanguage] || text;
  }

  /**
   * Initiate voice call
   * @param {string} participantId - Participant to call
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Call session
   */
  async initiateVoiceCall(participantId, conversationId) {
    try {
      if (!this.communicationSettings.voiceCalls) {
        throw new Error('Voice calls are disabled');
      }

      const callSession = {
        conversationId,
        callerId: this.driverId,
        participantId,
        status: 'initiating',
        startTime: serverTimestamp(),
        callType: 'voice'
      };

      // Create call session in database
      const callRef = await addDoc(collection(this.db, 'callSessions'), callSession);

      // Log communication activity
      await this.logCommunicationActivity('voice_call_initiated', {
        conversationId,
        participantId,
        callSessionId: callRef.id
      });

      return { id: callRef.id, ...callSession };
    } catch (error) {
      console.error('Error initiating voice call:', error);
      throw error;
    }
  }

  /**
   * End voice call
   * @param {string} callSessionId - Call session ID
   * @param {string} endReason - Reason for ending call
   */
  async endVoiceCall(callSessionId, endReason = 'completed') {
    try {
      await updateDoc(doc(this.db, 'callSessions', callSessionId), {
        status: 'ended',
        endTime: serverTimestamp(),
        endReason
      });

      // Log communication activity
      await this.logCommunicationActivity('voice_call_ended', {
        callSessionId,
        endReason
      });
    } catch (error) {
      console.error('Error ending voice call:', error);
    }
  }

  /**
   * Get communication analytics
   * @param {string} timeRange - Time range for analytics
   * @returns {Promise<Object>} Communication analytics
   */
  async getCommunicationAnalytics(timeRange = '30d') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      // Get messages
      const messagesQuery = query(
        collection(this.db, 'messages'),
        where('senderId', '==', this.driverId),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get conversations
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', this.driverId),
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end),
        orderBy('createdAt', 'desc')
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversations = conversationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get call sessions
      const callsQuery = query(
        collection(this.db, 'callSessions'),
        where('callerId', '==', this.driverId),
        where('startTime', '>=', dateRange.start),
        where('startTime', '<=', dateRange.end),
        orderBy('startTime', 'desc')
      );

      const callsSnapshot = await getDocs(callsQuery);
      const calls = callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate analytics
      return this.calculateCommunicationAnalytics(messages, conversations, calls);
    } catch (error) {
      console.error('Error getting communication analytics:', error);
      return this.getDefaultCommunicationAnalytics();
    }
  }

  /**
   * Calculate communication analytics
   * @param {Array} messages - Messages data
   * @param {Array} conversations - Conversations data
   * @param {Array} calls - Call sessions data
   * @returns {Object} Calculated analytics
   */
  calculateCommunicationAnalytics(messages, conversations, calls) {
    const analytics = {
      totalMessages: messages.length,
      totalConversations: conversations.length,
      totalCalls: calls.length,
      messageTypes: {},
      conversationTypes: {},
      responseTime: 0,
      satisfactionScore: 0,
      trends: {},
      insights: []
    };

    // Analyze message types
    messages.forEach(message => {
      analytics.messageTypes[message.messageType] = (analytics.messageTypes[message.messageType] || 0) + 1;
    });

    // Analyze conversation types
    conversations.forEach(conversation => {
      analytics.conversationTypes[conversation.conversationType] = (analytics.conversationTypes[conversation.conversationType] || 0) + 1;
    });

    // Calculate average response time
    const responseTimes = messages
      .filter(msg => msg.responseTime)
      .map(msg => msg.responseTime);
    
    if (responseTimes.length > 0) {
      analytics.responseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Generate insights
    analytics.insights = this.generateCommunicationInsights(analytics);

    return analytics;
  }

  /**
   * Generate communication insights
   * @param {Object} analytics - Analytics data
   * @returns {Array} Insights
   */
  generateCommunicationInsights(analytics) {
    const insights = [];

    if (analytics.totalMessages > 100) {
      insights.push({
        type: 'success',
        title: 'Active Communicator',
        message: 'You\'re maintaining excellent communication with riders and support'
      });
    }

    if (analytics.responseTime < 60) {
      insights.push({
        type: 'success',
        title: 'Quick Responder',
        message: 'Your average response time is excellent'
      });
    }

    if (analytics.totalCalls > 20) {
      insights.push({
        type: 'info',
        title: 'Voice Communication',
        message: 'You prefer voice calls for complex discussions'
      });
    }

    return insights;
  }

  /**
   * Update communication settings
   * @param {Object} newSettings - New settings to update
   */
  async updateCommunicationSettings(newSettings) {
    try {
      this.communicationSettings = { ...this.communicationSettings, ...newSettings };
      
      await setDoc(doc(this.db, 'driverCommunicationSettings', this.driverId), {
        ...this.communicationSettings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating communication settings:', error);
    }
  }

  /**
   * Add quick response
   * @param {Object} quickResponse - Quick response data
   */
  async addQuickResponse(quickResponse) {
    try {
      const responseData = {
        driverId: this.driverId,
        ...quickResponse,
        createdAt: serverTimestamp()
      };

      const responseRef = await addDoc(collection(this.db, 'driverQuickResponses'), responseData);
      
      // Add to local array
      this.quickResponses.push({ id: responseRef.id, ...responseData });
      
      return { id: responseRef.id, ...responseData };
    } catch (error) {
      console.error('Error adding quick response:', error);
      throw error;
    }
  }

  /**
   * Update quick response
   * @param {string} responseId - Quick response ID
   * @param {Object} updates - Updates to apply
   */
  async updateQuickResponse(responseId, updates) {
    try {
      await updateDoc(doc(this.db, 'driverQuickResponses', responseId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update local array
      const index = this.quickResponses.findIndex(r => r.id === responseId);
      if (index !== -1) {
        this.quickResponses[index] = { ...this.quickResponses[index], ...updates };
      }
    } catch (error) {
      console.error('Error updating quick response:', error);
      throw error;
    }
  }

  /**
   * Delete quick response
   * @param {string} responseId - Quick response ID
   */
  async deleteQuickResponse(responseId) {
    try {
      await deleteDoc(doc(this.db, 'driverQuickResponses', responseId));
      
      // Remove from local array
      this.quickResponses = this.quickResponses.filter(r => r.id !== responseId);
    } catch (error) {
      console.error('Error deleting quick response:', error);
      throw error;
    }
  }

  /**
   * Log communication activity
   * @param {string} activity - Activity type
   * @param {Object} data - Activity data
   */
  async logCommunicationActivity(activity, data) {
    try {
      await addDoc(collection(this.db, 'communicationActivity'), {
        driverId: this.driverId,
        activity,
        data,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging communication activity:', error);
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    // This would integrate with a sound library
    // For now, we'll use haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Create default communication settings
   */
  async createDefaultSettings() {
    try {
      await setDoc(doc(this.db, 'driverCommunicationSettings', this.driverId), {
        ...this.communicationSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  }

  /**
   * Create default quick responses
   */
  async createDefaultQuickResponses() {
    try {
      const defaultResponses = [
        {
          category: 'arrival',
          priority: 1,
          message: 'I\'m on my way and will arrive in 5 minutes.',
          isDefault: true
        },
        {
          category: 'arrival',
          priority: 2,
          message: 'I\'ve arrived at the pickup location.',
          isDefault: true
        },
        {
          category: 'delay',
          priority: 1,
          message: 'I\'m running a few minutes behind due to traffic.',
          isDefault: true
        },
        {
          category: 'pickup',
          priority: 1,
          message: 'I\'m here for your pickup. Please come to the vehicle.',
          isDefault: true
        },
        {
          category: 'support',
          priority: 1,
          message: 'I\'m contacting support to help resolve this issue.',
          isDefault: true
        }
      ];

      const batch = [];
      defaultResponses.forEach(response => {
        const responseData = {
          driverId: this.driverId,
          ...response,
          createdAt: serverTimestamp()
        };
        batch.push(addDoc(collection(this.db, 'driverQuickResponses'), responseData));
      });

      await Promise.all(batch);
      
      // Reload quick responses
      await this.loadQuickResponses();
    } catch (error) {
      console.error('Error creating default quick responses:', error);
    }
  }

  /**
   * Get date range for analytics
   * @param {string} timeRange - Time range
   * @returns {Object} Date range
   */
  getDateRange(timeRange) {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
  }

  /**
   * Get default communication analytics
   * @returns {Object} Default analytics
   */
  getDefaultCommunicationAnalytics() {
    return {
      totalMessages: 0,
      totalConversations: 0,
      totalCalls: 0,
      messageTypes: {},
      conversationTypes: {},
      responseTime: 0,
      satisfactionScore: 0,
      trends: {},
      insights: []
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      // Remove all message listeners
      this.messageListeners.forEach(unsubscribe => unsubscribe());
      this.messageListeners.clear();
      
      // Clear active conversations
      this.activeConversations.clear();
      
      console.log('✅ Communication Hub Service cleaned up');
    } catch (error) {
      console.error('Error cleaning up communication hub service:', error);
    }
  }
}

// Export singleton instance
export default new CommunicationHubService();
