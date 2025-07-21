import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { playSuccessSound, playErrorSound } from '@/utils/soundEffects';

const EmergencyContactScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isVerified: false,
    userVerified: false,
    contactVerified: false,
    verificationSent: false
  });

  // Load existing emergency contact data
  useEffect(() => {
    loadEmergencyContact();
  }, []);

  const loadEmergencyContact = async () => {
    try {
      // TODO: Load from Firestore when implemented
      // For now, use placeholder data
      const savedContact = {
        name: 'Jane Smith',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543',
        email: 'jane.smith@example.com',
        isVerified: false,
        userVerified: false,
        contactVerified: false,
        verificationSent: false
      };
      setEmergencyContact(savedContact);
    } catch (error) {
      console.log('No saved emergency contact found');
    }
  };

  const handleInputChange = (field, value) => {
    setEmergencyContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, relationship, phone, email } = emergencyContact;
    
    if (!name.trim()) {
      playErrorSound();
      Alert.alert('Missing Information', 'Please enter the contact name');
      return false;
    }

    if (!relationship.trim()) {
      playErrorSound();
      Alert.alert('Missing Information', 'Please enter the relationship');
      return false;
    }

    if (!phone.trim()) {
      playErrorSound();
      Alert.alert('Missing Information', 'Please enter the phone number');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      playErrorSound();
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // TODO: Save to Firestore when implemented
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIsEditing(false);
      playSuccessSound();
      Alert.alert('Success', 'Emergency contact information saved successfully');
    } catch (error) {
      playErrorSound();
      Alert.alert('Error', 'Failed to save emergency contact information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!emergencyContact.email) {
      playErrorSound();
      Alert.alert('Missing Email', 'Please enter an email address first');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement email verification with Firebase
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setEmergencyContact(prev => ({
        ...prev,
        verificationSent: true
      }));
      
      playSuccessSound();
      Alert.alert(
        'Verification Sent',
        'Verification emails have been sent to both you and your emergency contact. Please check your emails and click the verification links.'
      );
    } catch (error) {
      playErrorSound();
      Alert.alert('Error', 'Failed to send verification emails. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyContact = () => {
    Alert.alert(
      'Verify Contact',
      'Please check your email for the verification link and click it to verify your emergency contact.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I\'ve Verified', 
          onPress: () => {
            setEmergencyContact(prev => ({
              ...prev,
              userVerified: true,
              isVerified: prev.contactVerified
            }));
            playSuccessSound();
          }
        }
      ]
    );
  };

  const VerificationStatus = ({ type, isVerified, onPress }) => (
    <TouchableOpacity 
      style={[
        styles.verificationStatus,
        { 
          backgroundColor: isVerified ? theme.COLORS.success + '20' : theme.COLORS.warning + '20',
          borderColor: isVerified ? theme.COLORS.success : theme.COLORS.warning
        }
      ]}
      onPress={onPress}
      disabled={isVerified}
    >
      <Ionicons 
        name={isVerified ? 'checkmark-circle' : 'alert-circle'} 
        size={20} 
        color={isVerified ? theme.COLORS.success : theme.COLORS.warning} 
      />
      <Text style={[
        styles.verificationText,
        { color: isVerified ? theme.COLORS.success : theme.COLORS.warning }
      ]}>
        {type} {isVerified ? 'Verified' : 'Pending'}
      </Text>
      {!isVerified && (
        <Ionicons name="chevron-forward" size={16} color={theme.COLORS.warning} />
      )}
    </TouchableOpacity>
  );

  const ContactField = ({ label, value, field, placeholder, keyboardType = 'default', editable = true }) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.COLORS.text }]}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[
            styles.textInput,
            { 
              backgroundColor: theme.COLORS.card,
              borderColor: theme.COLORS.border,
              color: theme.COLORS.text
            }
          ]}
          value={value}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={theme.COLORS.textSecondary}
          keyboardType={keyboardType}
          editable={editable}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: theme.COLORS.textSecondary }]}>
          {value || 'Not set'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <StatusBar 
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.COLORS.background} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>
          Emergency Contact
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? 'close' : 'create'} 
            size={24} 
            color={theme.COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: theme.COLORS.card, borderColor: theme.COLORS.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={24} color={theme.COLORS.primary} />
            <Text style={[styles.cardTitle, { color: theme.COLORS.text }]}>
              Contact Information
            </Text>
          </View>

          <ContactField
            label="Full Name"
            value={emergencyContact.name}
            field="name"
            placeholder="Enter full name"
          />

          <ContactField
            label="Relationship"
            value={emergencyContact.relationship}
            field="relationship"
            placeholder="e.g., Spouse, Parent, Friend"
          />

          <ContactField
            label="Phone Number"
            value={emergencyContact.phone}
            field="phone"
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <ContactField
            label="Email Address"
            value={emergencyContact.email}
            field="email"
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.COLORS.primary }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Contact'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verification Card */}
        <View style={[styles.card, { backgroundColor: theme.COLORS.card, borderColor: theme.COLORS.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={theme.COLORS.primary} />
            <Text style={[styles.cardTitle, { color: theme.COLORS.text }]}>
              Verification Status
            </Text>
          </View>

          <Text style={[styles.verificationDescription, { color: theme.COLORS.textSecondary }]}>
            Both you and your emergency contact need to verify your email addresses for security purposes.
          </Text>

          <VerificationStatus
            type="Your Email"
            isVerified={emergencyContact.userVerified}
            onPress={handleVerifyContact}
          />

          <VerificationStatus
            type="Contact's Email"
            isVerified={emergencyContact.contactVerified}
            onPress={() => {}}
          />

          {!emergencyContact.verificationSent ? (
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: theme.COLORS.primary }]}
              onPress={handleSendVerification}
              disabled={isLoading || !emergencyContact.email}
            >
              <Ionicons name="mail" size={20} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Sending...' : 'Send Verification Emails'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.verificationSent, { backgroundColor: theme.COLORS.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.COLORS.success} />
              <Text style={[styles.verificationSentText, { color: theme.COLORS.success }]}>
                Verification emails sent
              </Text>
            </View>
          )}
        </View>

        {/* Safety Info */}
        <View style={[styles.card, { backgroundColor: theme.COLORS.card, borderColor: theme.COLORS.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={theme.COLORS.info} />
            <Text style={[styles.cardTitle, { color: theme.COLORS.text }]}>
              Safety Information
            </Text>
          </View>

          <Text style={[styles.safetyText, { color: theme.COLORS.textSecondary }]}>
            Your emergency contact will be notified in case of:
          </Text>

          <View style={styles.safetyList}>
            <View style={styles.safetyItem}>
              <Ionicons name="warning" size={16} color={theme.COLORS.warning} />
              <Text style={[styles.safetyItemText, { color: theme.COLORS.textSecondary }]}>
                Emergency situations during rides
              </Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="medical" size={16} color={theme.COLORS.error} />
              <Text style={[styles.safetyItemText, { color: theme.COLORS.textSecondary }]}>
                Medical emergencies
              </Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="location" size={16} color={theme.COLORS.info} />
              <Text style={[styles.safetyItemText, { color: theme.COLORS.textSecondary }]}>
                Location sharing when needed
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  editButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  content: {
    flex: 1,
    padding: DIMENSIONS.paddingM,
  },
  card: {
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingM,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingM,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginLeft: DIMENSIONS.paddingS,
  },
  fieldContainer: {
    marginBottom: DIMENSIONS.paddingM,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginBottom: DIMENSIONS.paddingXS,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: DIMENSIONS.radiusM,
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingS,
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    paddingVertical: DIMENSIONS.paddingS,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    marginTop: DIMENSIONS.paddingM,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  verificationDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginBottom: DIMENSIONS.paddingM,
    lineHeight: 20,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    borderWidth: 1,
    marginBottom: DIMENSIONS.paddingS,
  },
  verificationText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginLeft: DIMENSIONS.paddingS,
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    marginTop: DIMENSIONS.paddingM,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginLeft: DIMENSIONS.paddingS,
  },
  verificationSent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    marginTop: DIMENSIONS.paddingM,
  },
  verificationSentText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginLeft: DIMENSIONS.paddingS,
  },
  safetyText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginBottom: DIMENSIONS.paddingM,
    lineHeight: 20,
  },
  safetyList: {
    gap: DIMENSIONS.paddingS,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyItemText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginLeft: DIMENSIONS.paddingS,
    flex: 1,
  },
});

export default EmergencyContactScreen; 