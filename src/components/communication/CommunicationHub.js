import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import communicationHubService from '../../services/communicationHubService';
import * as Haptics from 'expo-haptics';

const CommunicationHub = ({ driverId, onClose, visible = false }) => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [quickResponses, setQuickResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showQuickResponses, setShowQuickResponses] = useState(false);

  const tabs = [
    { id: 'conversations', title: 'Messages', icon: 'chatbubbles' },
    { id: 'quick', title: 'Quick Responses', icon: 'flash' },
    { id: 'analytics', title: 'Analytics', icon: 'analytics' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      initializeHub();
    }
  }, [visible, driverId]);

  const initializeHub = async () => {
    try {
      setIsLoading(true);
      await communicationHubService.initialize(driverId);
      await loadData();
    } catch (error) {
      console.error('Error initializing communication hub:', error);
      Alert.alert('Error', 'Failed to initialize communication hub');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'conversations':
          await loadConversations();
          break;
        case 'quick':
          await loadQuickResponses();
          break;
        case 'analytics':
          await loadAnalytics();
          break;
        case 'settings':
          // Settings don't need loading
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadConversations = async () => {
    try {
      // This would load conversations from the service
      // For now, we'll use mock data
      const mockConversations = [
        {
          id: '1',
          participantName: 'John Smith',
          participantType: 'rider',
          lastMessage: 'I\'m at the main entrance',
          lastMessageAt: new Date(),
          unreadCount: 2,
          status: 'active'
        },
        {
          id: '2',
          participantName: 'Support Team',
          participantType: 'support',
          lastMessage: 'Your issue has been resolved',
          lastMessageAt: new Date(Date.now() - 3600000),
          unreadCount: 0,
          status: 'active'
        },
        {
          id: '3',
          participantName: 'Sarah Johnson',
          participantType: 'rider',
          lastMessage: 'Thank you for the ride!',
          lastMessageAt: new Date(Date.now() - 7200000),
          unreadCount: 0,
          status: 'completed'
        }
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadQuickResponses = async () => {
    try {
      const responses = communicationHubService.quickResponses;
      setQuickResponses(responses);
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await communicationHubService.getCommunicationAnalytics('30d');
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData();
  };

  const handleConversationPress = (conversation) => {
    setSelectedConversation(conversation);
    setShowMessageModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSendMessage = async () => {
    try {
      if (!newMessage.trim()) return;

      await communicationHubService.sendMessage(
        selectedConversation.id,
        newMessage.trim(),
        'text'
      );

      setNewMessage('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleQuickResponsePress = (response) => {
    if (selectedConversation) {
      communicationHubService.sendQuickResponse(selectedConversation.id, response.id);
      setShowQuickResponses(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleVoiceCall = async (conversation) => {
    try {
      await communicationHubService.initiateVoiceCall(
        conversation.participantId,
        conversation.id
      );
      
      Alert.alert('Voice Call', 'Initiating voice call...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Error initiating voice call:', error);
      Alert.alert('Error', 'Failed to initiate voice call');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getParticipantIcon = (type) => {
    switch (type) {
      case 'rider': return 'person';
      case 'support': return 'headset';
      case 'driver': return 'car';
      default: return 'chatbubble';
    }
  };

  const getParticipantColor = (type) => {
    switch (type) {
      case 'rider': return COLORS.primary[600];
      case 'support': return COLORS.success[600];
      case 'driver': return COLORS.warning[600];
      default: return COLORS.gray[600];
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Communication Hub</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? 'white' : COLORS.gray[600]} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary[600]]}
            tintColor={COLORS.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading communication data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'conversations' && (
              <View style={styles.conversationsContainer}>
                {conversations.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>No Conversations</Text>
                    <Text style={styles.emptyText}>
                      Start a conversation with riders or contact support
                    </Text>
                  </View>
                ) : (
                  conversations.map((conversation) => (
                    <TouchableOpacity
                      key={conversation.id}
                      style={styles.conversationCard}
                      onPress={() => handleConversationPress(conversation)}
                    >
                      <View style={styles.conversationHeader}>
                        <View style={styles.conversationInfo}>
                          <View style={styles.conversationNameRow}>
                            <Ionicons 
                              name={getParticipantIcon(conversation.participantType)} 
                              size={20} 
                              color={getParticipantColor(conversation.participantType)} 
                            />
                            <Text style={styles.conversationName}>
                              {conversation.participantName}
                            </Text>
                            <View style={[
                              styles.participantBadge,
                              { backgroundColor: getParticipantColor(conversation.participantType) }
                            ]}>
                              <Text style={styles.participantBadgeText}>
                                {conversation.participantType}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.conversationLastMessage}>
                            {conversation.lastMessage}
                          </Text>
                        </View>
                        
                        <View style={styles.conversationMeta}>
                          <Text style={styles.conversationTime}>
                            {formatTime(conversation.lastMessageAt)}
                          </Text>
                          {conversation.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadCount}>
                                {conversation.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.conversationActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleVoiceCall(conversation)}
                        >
                          <Ionicons name="call" size={16} color={COLORS.primary[600]} />
                          <Text style={styles.actionButtonText}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleConversationPress(conversation)}
                        >
                          <Ionicons name="chatbubble" size={16} color={COLORS.success[600]} />
                          <Text style={styles.actionButtonText}>Message</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {activeTab === 'quick' && (
              <View style={styles.quickResponsesContainer}>
                <Text style={styles.sectionTitle}>Quick Responses</Text>
                
                {quickResponses.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="flash-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>No Quick Responses</Text>
                    <Text style={styles.emptyText}>
                      Create quick response templates for common messages
                    </Text>
                  </View>
                ) : (
                  <View style={styles.quickResponsesList}>
                    {quickResponses.map((response) => (
                      <View key={response.id} style={styles.quickResponseCard}>
                        <View style={styles.quickResponseHeader}>
                          <Text style={styles.quickResponseCategory}>
                            {response.category}
                          </Text>
                          <Text style={styles.quickResponsePriority}>
                            Priority: {response.priority}
                          </Text>
                        </View>
                        <Text style={styles.quickResponseMessage}>
                          {response.message}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'analytics' && (
              <View style={styles.analyticsContainer}>
                <Text style={styles.sectionTitle}>Communication Analytics</Text>
                
                {analytics ? (
                  <View style={styles.analyticsContent}>
                    <View style={styles.analyticsRow}>
                      <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{analytics.totalMessages}</Text>
                        <Text style={styles.analyticsLabel}>Messages Sent</Text>
                      </View>
                      <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{analytics.totalConversations}</Text>
                        <Text style={styles.analyticsLabel}>Conversations</Text>
                      </View>
                    </View>

                    <View style={styles.analyticsRow}>
                      <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{analytics.totalCalls}</Text>
                        <Text style={styles.analyticsLabel}>Voice Calls</Text>
                      </View>
                      <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>
                          {Math.round(analytics.responseTime)}s
                        </Text>
                        <Text style={styles.analyticsLabel}>Avg Response</Text>
                      </View>
                    </View>

                    {analytics.insights && analytics.insights.length > 0 && (
                      <View style={styles.insightsContainer}>
                        <Text style={styles.insightsTitle}>Insights</Text>
                        {analytics.insights.map((insight, index) => (
                          <View key={index} style={styles.insightItem}>
                            <Ionicons 
                              name={insight.type === 'success' ? 'checkmark-circle' : 'information-circle'} 
                              size={16} 
                              color={insight.type === 'success' ? COLORS.success[600] : COLORS.info[600]} 
                            />
                            <View style={styles.insightContent}>
                              <Text style={styles.insightTitle}>{insight.title}</Text>
                              <Text style={styles.insightMessage}>{insight.message}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="analytics-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.emptyTitle}>No Analytics Data</Text>
                    <Text style={styles.emptyText}>
                      Communication analytics will appear here
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'settings' && (
              <View style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>Communication Settings</Text>
                
                <View style={styles.settingsList}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Voice Calls</Text>
                    <Text style={styles.settingDescription}>
                      Enable voice calls with riders and support
                    </Text>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Auto-Translate</Text>
                    <Text style={styles.settingDescription}>
                      Automatically translate messages
                    </Text>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Sound Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Play sound for new messages
                    </Text>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Vibration Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Vibrate for new messages
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.messageModalContainer}>
          <View style={styles.messageModalHeader}>
            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedConversation?.participantName}
            </Text>
            <TouchableOpacity onPress={() => setShowQuickResponses(true)}>
              <Text style={styles.modalSaveText}>Quick</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.messageList}>
            {/* Messages would be rendered here */}
            <View style={styles.messagePlaceholder}>
              <Text style={styles.messagePlaceholderText}>
                Messages will appear here
              </Text>
            </View>
          </ScrollView>

          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Responses Modal */}
      <Modal
        visible={showQuickResponses}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickResponses(false)}
      >
        <View style={styles.quickResponsesModalContainer}>
          <View style={styles.quickResponsesModalHeader}>
            <TouchableOpacity onPress={() => setShowQuickResponses(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Responses</Text>
            <View style={styles.headerRight} />
          </View>

          <FlatList
            data={quickResponses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickResponseModalItem}
                onPress={() => handleQuickResponsePress(item)}
              >
                <Text style={styles.quickResponseModalText}>
                  {item.message}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.quickResponsesModalList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary[600],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  conversationsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  conversationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  participantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  participantBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  conversationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  quickResponsesContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  quickResponsesList: {
    gap: 12,
  },
  quickResponseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickResponseCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
    textTransform: 'uppercase',
  },
  quickResponsePriority: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  quickResponseMessage: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  analyticsContent: {
    gap: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 20,
  },
  messageModalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  messageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  modalSaveText: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagePlaceholderText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary[600],
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickResponsesModalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  quickResponsesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  quickResponsesModalList: {
    flex: 1,
    padding: 16,
  },
  quickResponseModalItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickResponseModalText: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
});

export default CommunicationHub;
