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
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import communicationHubService from '../../services/communicationHubService';
import * as Haptics from 'expo-haptics';

const QuickResponsesManager = ({ driverId, onClose, visible = false }) => {
  const [quickResponses, setQuickResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddResponse, setShowAddResponse] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    message: '',
    priority: 1,
    isDefault: false
  });

  const categories = [
    { value: 'arrival', label: 'Arrival', icon: 'location' },
    { value: 'delay', label: 'Delay', icon: 'time' },
    { value: 'pickup', label: 'Pickup', icon: 'person' },
    { value: 'support', label: 'Support', icon: 'help-circle' },
    { value: 'general', label: 'General', icon: 'chatbubble' },
    { value: 'custom', label: 'Custom', icon: 'add-circle' }
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadQuickResponses();
    }
  }, [visible, driverId]);

  const loadQuickResponses = async () => {
    try {
      setIsLoading(true);
      await communicationHubService.initialize(driverId);
      setQuickResponses(communicationHubService.quickResponses);
    } catch (error) {
      console.error('Error loading quick responses:', error);
      Alert.alert('Error', 'Failed to load quick responses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResponse = () => {
    setFormData({
      category: '',
      message: '',
      priority: 1,
      isDefault: false
    });
    setEditingResponse(null);
    setShowAddResponse(true);
  };

  const handleEditResponse = (response) => {
    setFormData({
      category: response.category,
      message: response.message,
      priority: response.priority,
      isDefault: response.isDefault || false
    });
    setEditingResponse(response);
    setShowAddResponse(true);
  };

  const handleSaveResponse = async () => {
    try {
      if (!formData.category || !formData.message.trim()) {
        Alert.alert('Validation Error', 'Category and message are required');
        return;
      }

      setIsSaving(true);
      
      const responseData = {
        category: formData.category,
        message: formData.message.trim(),
        priority: formData.priority,
        isDefault: formData.isDefault
      };

      if (editingResponse) {
        // Update existing response
        await communicationHubService.updateQuickResponse(editingResponse.id, responseData);
      } else {
        // Add new response
        await communicationHubService.addQuickResponse(responseData);
      }

      setShowAddResponse(false);
      setEditingResponse(null);
      await loadQuickResponses();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', editingResponse ? 'Quick response updated successfully' : 'Quick response added successfully');
    } catch (error) {
      console.error('Error saving quick response:', error);
      Alert.alert('Error', 'Failed to save quick response');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResponse = (response) => {
    if (response.isDefault) {
      Alert.alert('Cannot Delete', 'Default quick responses cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Quick Response',
      `Are you sure you want to delete this quick response?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteResponse(response.id)
        }
      ]
    );
  };

  const deleteResponse = async (responseId) => {
    try {
      await communicationHubService.deleteQuickResponse(responseId);
      await loadQuickResponses();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', 'Quick response deleted successfully');
    } catch (error) {
      console.error('Error deleting quick response:', error);
      Alert.alert('Error', 'Failed to delete quick response');
    }
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.icon || 'chatbubble';
  };

  const getCategoryColor = (category) => {
    const colors = {
      arrival: COLORS.success[600],
      delay: COLORS.warning[600],
      pickup: COLORS.primary[600],
      support: COLORS.info[600],
      general: COLORS.gray[600],
      custom: COLORS.purple[600]
    };
    return colors[category] || COLORS.gray[600];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return COLORS.error[600];
      case 2: return COLORS.warning[600];
      case 3: return COLORS.success[600];
      default: return COLORS.gray[600];
    }
  };

  const groupedResponses = quickResponses.reduce((groups, response) => {
    const category = response.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(response);
    return groups;
  }, {});

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Quick Responses</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Response Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddResponse}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Quick Response</Text>
        </TouchableOpacity>

        {/* Quick Responses by Category */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading quick responses...</Text>
          </View>
        ) : Object.keys(groupedResponses).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flash-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Quick Responses</Text>
            <Text style={styles.emptyText}>
              Create quick response templates for common messages
            </Text>
          </View>
        ) : (
          <View style={styles.responsesContainer}>
            {Object.entries(groupedResponses).map(([category, responses]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Ionicons 
                      name={getCategoryIcon(category)} 
                      size={20} 
                      color={getCategoryColor(category)} 
                    />
                    <Text style={styles.categoryTitle}>
                      {categories.find(c => c.value === category)?.label || category}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {responses.length} response{responses.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.responsesList}>
                  {responses
                    .sort((a, b) => a.priority - b.priority)
                    .map((response) => (
                      <View key={response.id} style={styles.responseCard}>
                        <View style={styles.responseHeader}>
                          <View style={styles.responseInfo}>
                            <View style={styles.responseMeta}>
                              <View style={[
                                styles.priorityBadge,
                                { backgroundColor: getPriorityColor(response.priority) }
                              ]}>
                                <Text style={styles.priorityText}>{response.priority}</Text>
                              </View>
                              {response.isDefault && (
                                <View style={styles.defaultBadge}>
                                  <Text style={styles.defaultText}>Default</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.responseActions}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => handleEditResponse(response)}
                            >
                              <Ionicons name="pencil" size={16} color={COLORS.primary[600]} />
                            </TouchableOpacity>

                            {!response.isDefault && (
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteResponse(response)}
                              >
                                <Ionicons name="trash" size={16} color={COLORS.error[600]} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        <Text style={styles.responseMessage}>
                          {response.message}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add/Edit Response Modal */}
      <Modal
        visible={showAddResponse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddResponse(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddResponse(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingResponse ? 'Edit Quick Response' : 'Add Quick Response'}
            </Text>
            <TouchableOpacity onPress={handleSaveResponse} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category *</Text>
              <View style={styles.categoryButtons}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryButton,
                      formData.category === category.value && styles.categoryButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category: category.value }))}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={16} 
                      color={formData.category === category.value ? 'white' : COLORS.gray[600]} 
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category.value && styles.categoryButtonTextActive
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.message}
                onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                placeholder="Enter your quick response message..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {formData.message.length} characters
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {[1, 2, 3].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      formData.priority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.priorityHelpText}>
                1 = Highest priority (appears first)
              </Text>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Default Response</Text>
                  <Text style={styles.switchDescription}>
                    Mark as a default response (cannot be deleted)
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                  thumbColor={formData.isDefault ? COLORS.primary[600] : COLORS.gray[500]}
                  ios_backgroundColor={COLORS.gray[300]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isDefault: value }))}
                  value={formData.isDefault}
                />
              </View>
            </View>

            {/* Preview */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons 
                    name={getCategoryIcon(formData.category)} 
                    size={16} 
                    color={getCategoryColor(formData.category)} 
                  />
                  <Text style={styles.previewCategory}>
                    {categories.find(c => c.value === formData.category)?.label || 'Category'}
                  </Text>
                  <View style={[
                    styles.previewPriority,
                    { backgroundColor: getPriorityColor(formData.priority) }
                  ]}>
                    <Text style={styles.previewPriorityText}>{formData.priority}</Text>
                  </View>
                </View>
                <Text style={styles.previewMessage}>
                  {formData.message || 'Your message will appear here...'}
                </Text>
              </View>
            </View>
          </ScrollView>
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
  content: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  responsesContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  categorySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginLeft: 'auto',
  },
  responsesList: {
    padding: 16,
    gap: 12,
  },
  responseCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseInfo: {
    flex: 1,
  },
  responseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  defaultBadge: {
    backgroundColor: COLORS.success[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success[700],
  },
  responseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  responseMessage: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  modalHeader: {
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  categoryButtonText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'right',
    marginTop: 4,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  priorityButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  priorityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  priorityHelpText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  previewCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  previewPriority: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  previewPriorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  previewMessage: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default QuickResponsesManager;
