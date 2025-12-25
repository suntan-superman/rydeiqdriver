import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit, onSnapshot } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class CommunicationService {
  async getCommunicationDashboard(userId = null, timeRange = '30d') {
    // In-app messaging
    const messaging = await this.getInAppMessaging(userId, timeRange);
    // Voice calls
    const voiceCalls = await this.getVoiceCalls(userId, timeRange);
    // Chat rooms
    const chatRooms = await this.getChatRooms(userId);
    // Notifications
    const notifications = await this.getNotifications(userId, timeRange);
    // Message history
    const messageHistory = await this.getMessageHistory(userId, timeRange);
    // Communication analytics
    const analytics = await this.getCommunicationAnalytics(userId, timeRange);
    // Communication tools
    const tools = await this.getCommunicationTools();
    // Communication preferences
    const preferences = await this.getCommunicationPreferences(userId);
    
    return {
      messaging,
      voiceCalls,
      chatRooms,
      notifications,
      messageHistory,
      analytics,
      tools,
      preferences,
      timestamp: Date.now()
    };
  }

  async getInAppMessaging(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const messagesRef = collection(db, 'messages');
    let messagesQuery;
    
    if (userId) {
      messagesQuery = query(
        messagesRef,
        where('participants', 'array-contains', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      messagesQuery = query(
        messagesRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      conversations: this.groupMessagesByConversation(messages),
      totalMessages: messages.length,
      unreadCount: messages.filter(m => !m.readBy?.includes(userId)).length,
      messageTypes: ['Text', 'Voice', 'Image', 'Location', 'System']
    };
  }

  async getVoiceCalls(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const callsRef = collection(db, 'voiceCalls');
    let callsQuery;
    
    if (userId) {
      callsQuery = query(
        callsRef,
        where('participants', 'array-contains', userId),
        where('startTime', '>=', timeFilter),
        orderBy('startTime', 'desc')
      );
    } else {
      callsQuery = query(
        callsRef,
        where('startTime', '>=', timeFilter),
        orderBy('startTime', 'desc'),
        limit(10)
      );
    }
    
    const callsSnapshot = await getDocs(callsQuery);
    const calls = callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      recentCalls: calls,
      totalCalls: calls.length,
      callStats: {
        totalDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0),
        averageDuration: calls.length > 0 ? calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length : 0,
        missedCalls: calls.filter(call => call.status === 'missed').length
      },
      callTypes: ['Incoming', 'Outgoing', 'Missed', 'Conference']
    };
  }

  async getChatRooms(userId) {
    const roomsRef = collection(db, 'chatRooms');
    let roomsQuery;
    
    if (userId) {
      roomsQuery = query(
        roomsRef,
        where('members', 'array-contains', userId)
      );
    } else {
      roomsQuery = query(roomsRef, limit(10));
    }
    
    const roomsSnapshot = await getDocs(roomsQuery);
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      userRooms: rooms,
      totalRooms: rooms.length,
      roomTypes: ['Support', 'Driver Community', 'Safety Alerts', 'Platform Updates'],
      activeRooms: rooms.filter(room => room.isActive).length
    };
  }

  async getNotifications(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const notificationsRef = collection(db, 'notifications');
    let notificationsQuery;
    
    if (userId) {
      notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      notificationsQuery = query(
        notificationsRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      notifications,
      totalNotifications: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      notificationTypes: ['Message', 'Call', 'Alert', 'Update', 'Reminder']
    };
  }

  async getMessageHistory(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const historyRef = collection(db, 'messageHistory');
    let historyQuery;
    
    if (userId) {
      historyQuery = query(
        historyRef,
        where('userId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    } else {
      historyQuery = query(
        historyRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
    }
    
    const historySnapshot = await getDocs(historyQuery);
    const history = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      history,
      totalMessages: history.length,
      messageStats: {
        sent: history.filter(h => h.type === 'sent').length,
        received: history.filter(h => h.type === 'received').length,
        system: history.filter(h => h.type === 'system').length
      }
    };
  }

  async getCommunicationAnalytics(userId, timeRange) {
    // Mock analytics data
    return {
      responseTime: '2.3 minutes',
      messageVolume: 156,
      callVolume: 23,
      satisfactionScore: 4.7,
      communicationEfficiency: '85%',
      peakHours: ['8-10 AM', '5-7 PM'],
      preferredChannels: ['In-app Chat', 'Voice Calls', 'Push Notifications']
    };
  }

  async getCommunicationTools() {
    // Mock communication tools data
    return {
      availableTools: [
        { name: 'In-app Chat', status: 'Active', features: ['Text', 'Voice', 'Image'] },
        { name: 'Voice Calls', status: 'Active', features: ['HD Audio', 'Conference'] },
        { name: 'Push Notifications', status: 'Active', features: ['Instant', 'Scheduled'] },
        { name: 'Email Integration', status: 'Available', features: ['Auto-sync', 'Templates'] },
        { name: 'SMS Integration', status: 'Available', features: ['Emergency', 'Updates'] }
      ],
      communicationFeatures: {
        realTimeMessaging: true,
        voiceCalls: true,
        fileSharing: true,
        readReceipts: true,
        typingIndicators: true,
        messageSearch: true
      }
    };
  }

  async getCommunicationPreferences(userId) {
    // Mock communication preferences
    return {
      notificationSettings: {
        pushNotifications: true,
        emailNotifications: false,
        smsNotifications: true,
        soundAlerts: true,
        vibrationAlerts: true
      },
      privacySettings: {
        showOnlineStatus: true,
        showTypingIndicator: true,
        allowVoiceCalls: true,
        allowFileSharing: true
      },
      autoReplySettings: {
        enabled: false,
        message: 'I am currently driving and will respond when safe.',
        schedule: {
          startTime: '22:00',
          endTime: '06:00',
          timezone: 'local'
        }
      }
    };
  }

  groupMessagesByConversation(messages) {
    const conversations = {};
    messages.forEach(message => {
      const conversationId = message.conversationId || message.id;
      if (!conversations[conversationId]) {
        conversations[conversationId] = [];
      }
      conversations[conversationId].push(message);
    });
    return Object.values(conversations);
  }

  // Additional methods for real-time communication
  async sendMessage(messageData) {
    const messagesRef = collection(db, 'messages');
    return await addDoc(messagesRef, {
      ...messageData,
      createdAt: new Date(),
      readBy: [messageData.senderId],
      status: 'sent'
    });
  }

  async initiateVoiceCall(callData) {
    const callsRef = collection(db, 'voiceCalls');
    return await addDoc(callsRef, {
      ...callData,
      startTime: new Date(),
      status: 'initiating',
      duration: 0
    });
  }

  async updateMessageStatus(messageId, status) {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      status,
      updatedAt: new Date()
    });
  }

  async markNotificationAsRead(notificationId) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date()
    });
  }

  // Real-time listeners
  subscribeToMessages(userId, callback) {
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    }, (error) => {
      console.error('Error in messages subscription:', error);
      callback([], error);
    });
  }

  subscribeToNotifications(userId, callback) {
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
      callback([], error);
    });
  }
}

export const communicationService = new CommunicationService();
export default communicationService; 