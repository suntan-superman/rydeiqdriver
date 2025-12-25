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
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import enhancedSafetyService from '../../services/enhancedSafetyService';
import * as Haptics from 'expo-haptics';

const EmergencyContactsManager = ({ driverId, onClose, visible = false }) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 1,
    notificationsEnabled: true
  });

  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadContacts();
    }
  }, [visible, driverId]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      await enhancedSafetyService.initialize(driverId);
      setContacts(enhancedSafetyService.emergencyContacts);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      priority: contacts.length + 1,
      notificationsEnabled: true
    });
    setEditingContact(null);
    setShowAddContact(true);
  };

  const handleEditContact = (contact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship || '',
      priority: contact.priority,
      notificationsEnabled: contact.notificationsEnabled
    });
    setEditingContact(contact);
    setShowAddContact(true);
  };

  const handleSaveContact = async () => {
    try {
      if (!formData.name.trim() || !formData.phone.trim()) {
        Alert.alert('Validation Error', 'Name and phone number are required');
        return;
      }

      setIsSaving(true);
      
      const contactData = {
        driverId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        relationship: formData.relationship,
        priority: formData.priority,
        notificationsEnabled: formData.notificationsEnabled,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingContact) {
        // Update existing contact
        await updateContact(editingContact.id, contactData);
      } else {
        // Add new contact
        await addContact(contactData);
      }

      setShowAddContact(false);
      setEditingContact(null);
      await loadContacts();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', editingContact ? 'Contact updated successfully' : 'Contact added successfully');
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const addContact = async (contactData) => {
    try {
      // This would integrate with the enhanced safety service
      // For now, we'll simulate adding to the local array
      const newContact = {
        id: Date.now().toString(),
        ...contactData
      };
      
      setContacts(prev => [...prev, newContact]);
    } catch (error) {
      throw error;
    }
  };

  const updateContact = async (contactId, contactData) => {
    try {
      // This would integrate with the enhanced safety service
      // For now, we'll simulate updating the local array
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, ...contactData } : contact
      ));
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContact(contact.id)
        }
      ]
    );
  };

  const deleteContact = async (contactId) => {
    try {
      // This would integrate with the enhanced safety service
      // For now, we'll simulate deleting from the local array
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', 'Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const handleToggleNotifications = async (contactId) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const updatedContact = {
        ...contact,
        notificationsEnabled: !contact.notificationsEnabled
      };

      await updateContact(contactId, updatedContact);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'spouse': return 'heart';
      case 'parent': return 'people';
      case 'child': return 'person';
      case 'sibling': return 'people-outline';
      case 'friend': return 'happy';
      case 'colleague': return 'briefcase';
      default: return 'person-outline';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return COLORS.error[600];
      case 2: return COLORS.warning[600];
      case 3: return COLORS.primary[600];
      default: return COLORS.gray[600];
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Contact Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>

        {/* Contacts List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyText}>
              Add emergency contacts to be notified during safety incidents
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts
              .sort((a, b) => a.priority - b.priority)
              .map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactInfo}>
                      <View style={styles.contactNameRow}>
                        <Ionicons 
                          name={getRelationshipIcon(contact.relationship)} 
                          size={20} 
                          color={getPriorityColor(contact.priority)} 
                        />
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(contact.priority) }]}>
                          <Text style={styles.priorityText}>{contact.priority}</Text>
                        </View>
                      </View>
                      <Text style={styles.contactRelationship}>
                        {relationshipOptions.find(r => r.value === contact.relationship)?.label || 'Contact'}
                      </Text>
                    </View>
                    
                    <View style={styles.contactActions}>
                      <Switch
                        trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                        thumbColor={contact.notificationsEnabled ? COLORS.primary[600] : COLORS.gray[500]}
                        ios_backgroundColor={COLORS.gray[300]}
                        onValueChange={() => handleToggleNotifications(contact.id)}
                        value={contact.notificationsEnabled}
                      />
                    </View>
                  </View>

                  <View style={styles.contactDetails}>
                    <View style={styles.contactDetailRow}>
                      <Ionicons name="call" size={16} color={COLORS.gray[600]} />
                      <Text style={styles.contactDetailText}>{contact.phone}</Text>
                    </View>
                    
                    {contact.email && (
                      <View style={styles.contactDetailRow}>
                        <Ionicons name="mail" size={16} color={COLORS.gray[600]} />
                        <Text style={styles.contactDetailText}>{contact.email}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.contactFooter}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditContact(contact)}
                    >
                      <Ionicons name="pencil" size={16} color={COLORS.primary[600]} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteContact(contact)}
                    >
                      <Ionicons name="trash" size={16} color={COLORS.error[600]} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={showAddContact}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddContact(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddContact(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </Text>
            <TouchableOpacity onPress={handleSaveContact} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter contact name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Relationship</Text>
              <View style={styles.relationshipButtons}>
                {relationshipOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.relationshipButton,
                      formData.relationship === option.value && styles.relationshipButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, relationship: option.value }))}
                  >
                    <Text style={[
                      styles.relationshipButtonText,
                      formData.relationship === option.value && styles.relationshipButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                1 = Highest priority (first to be contacted)
              </Text>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Enable Notifications</Text>
                  <Text style={styles.switchDescription}>
                    Notify this contact during safety incidents
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                  thumbColor={formData.notificationsEnabled ? COLORS.primary[600] : COLORS.gray[500]}
                  ios_backgroundColor={COLORS.gray[300]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, notificationsEnabled: value }))}
                  value={formData.notificationsEnabled}
                />
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
  contactsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
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
  contactRelationship: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  contactActions: {
    marginLeft: 12,
  },
  contactDetails: {
    marginBottom: 12,
    gap: 8,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactDetailText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: COLORS.error[600],
    fontWeight: '500',
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
  formInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  relationshipButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  relationshipButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  relationshipButtonText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  relationshipButtonTextActive: {
    color: 'white',
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
});

export default EmergencyContactsManager;
