import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoRecordingConsentModal = ({
  visible,
  onClose,
  onConsent,
  onDecline,
  rideData,
  riderName = 'Customer',
}) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [privacyUnderstood, setPrivacyUnderstood] = useState(false);

  const handleConsent = () => {
    if (!consentGiven || !privacyUnderstood) {
      Alert.alert(
        'Consent Required',
        'Please acknowledge both the recording consent and privacy notice before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConsent({
      recordingConsent: true,
      privacyAcknowledged: true,
      consentTimestamp: new Date().toISOString(),
    });
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Recording',
      'Are you sure you want to decline video recording? This may affect the rider\'s safety preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecline();
          },
        },
      ]
    );
  };

  const toggleConsent = () => {
    setConsentGiven(!consentGiven);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const togglePrivacy = () => {
    setPrivacyUnderstood(!privacyUnderstood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="videocam" size={32} color={COLORS.primary[600]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Video Recording Request</Text>
            <Text style={styles.headerSubtitle}>
              {riderName} has requested this ride be recorded
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recording Information */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={COLORS.info[600]} />
              <Text style={styles.infoTitle}>Recording Details</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.gray[600]} />
                <Text style={styles.infoText}>Recording duration: Entire ride</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.gray[600]} />
                <Text style={styles.infoText}>Automatic deletion after 72 hours</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.gray[600]} />
                <Text style={styles.infoText}>Secure storage with encryption</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.gray[600]} />
                <Text style={styles.infoText}>Both driver and rider consent required</Text>
              </View>
            </View>
          </View>

          {/* Legal Requirements */}
          <View style={styles.legalCard}>
            <View style={styles.legalHeader}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.warning[600]} />
              <Text style={styles.legalTitle}>Legal Requirements</Text>
            </View>
            <Text style={styles.legalText}>
              By consenting to video recording, you acknowledge that:
            </Text>
            <View style={styles.legalList}>
              <Text style={styles.legalItem}>
                • You have the legal right to record in your vehicle
              </Text>
              <Text style={styles.legalItem}>
                • All parties have been informed about recording
              </Text>
              <Text style={styles.legalItem}>
                • Recording complies with local privacy laws
              </Text>
              <Text style={styles.legalItem}>
                • You understand data retention policies
              </Text>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <Ionicons name="eye-outline" size={24} color={COLORS.success[600]} />
              <Text style={styles.privacyTitle}>Privacy & Data Protection</Text>
            </View>
            <Text style={styles.privacyText}>
              Your privacy and the rider's privacy are protected by:
            </Text>
            <View style={styles.privacyList}>
              <Text style={styles.privacyItem}>
                • Automatic deletion after 72 hours (unless incident reported)
              </Text>
              <Text style={styles.privacyItem}>
                • Secure encryption during storage and transmission
              </Text>
              <Text style={styles.privacyItem}>
                • Limited access to authorized personnel only
              </Text>
              <Text style={styles.privacyItem}>
                • No sharing with third parties without consent
              </Text>
            </View>
          </View>

          {/* Consent Checkboxes */}
          <View style={styles.consentSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={toggleConsent}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
                {consentGiven && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <View style={styles.checkboxText}>
                <Text style={styles.checkboxLabel}>
                  I consent to video recording this ride
                </Text>
                <Text style={styles.checkboxSubtext}>
                  I understand this will record the entire trip for safety purposes
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={togglePrivacy}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, privacyUnderstood && styles.checkboxChecked]}>
                {privacyUnderstood && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <View style={styles.checkboxText}>
                <Text style={styles.checkboxLabel}>
                  I understand the privacy notice
                </Text>
                <Text style={styles.checkboxSubtext}>
                  I acknowledge the data protection and retention policies
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsCard}>
            <View style={styles.benefitsHeader}>
              <Ionicons name="star-outline" size={24} color={COLORS.primary[600]} />
              <Text style={styles.benefitsTitle}>Benefits of Video Recording</Text>
            </View>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success[500]} />
                <Text style={styles.benefitText}>Enhanced safety for all parties</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="document-text" size={20} color={COLORS.success[500]} />
                <Text style={styles.benefitText}>Clear evidence in case of disputes</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="thumbs-up" size={20} color={COLORS.success[500]} />
                <Text style={styles.benefitText}>Improved rider confidence</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="medal" size={20} color={COLORS.success[500]} />
                <Text style={styles.benefitText}>Higher driver ratings and trust</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.declineButtonText}>Decline Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.consentButton,
              (!consentGiven || !privacyUnderstood) && styles.consentButtonDisabled
            ]}
            onPress={handleConsent}
            disabled={!consentGiven || !privacyUnderstood}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={20} color="white" />
            <Text style={styles.consentButtonText}>Start Recording</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.primary[50],
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: COLORS.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: COLORS.info[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.info[200],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.info[800],
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.info[700],
    marginLeft: 8,
    flex: 1,
  },
  legalCard: {
    backgroundColor: COLORS.warning[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.warning[200],
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning[800],
    marginLeft: 8,
  },
  legalText: {
    fontSize: 14,
    color: COLORS.warning[700],
    marginBottom: 12,
    lineHeight: 20,
  },
  legalList: {
    gap: 6,
  },
  legalItem: {
    fontSize: 14,
    color: COLORS.warning[700],
    lineHeight: 20,
  },
  privacyCard: {
    backgroundColor: COLORS.success[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.success[200],
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success[800],
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 14,
    color: COLORS.success[700],
    marginBottom: 12,
    lineHeight: 20,
  },
  privacyList: {
    gap: 6,
  },
  privacyItem: {
    fontSize: 14,
    color: COLORS.success[700],
    lineHeight: 20,
  },
  consentSection: {
    marginTop: 24,
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  checkboxText: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  checkboxSubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  benefitsCard: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[800],
    marginLeft: 8,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.primary[700],
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  consentButton: {
    backgroundColor: COLORS.primary[600],
    shadowColor: COLORS.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  consentButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  },
  consentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default VideoRecordingConsentModal;
