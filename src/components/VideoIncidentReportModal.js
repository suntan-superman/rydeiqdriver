import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INCIDENT_TYPES = [
  {
    id: 'safety_concern',
    label: 'Safety Concern',
    description: 'Potential safety issue or dangerous behavior',
    icon: 'warning-outline',
    color: COLORS.warning[600],
  },
  {
    id: 'dispute',
    label: 'Dispute',
    description: 'Disagreement or conflict during ride',
    icon: 'chatbubbles-outline',
    color: COLORS.error[600],
  },
  {
    id: 'property_damage',
    label: 'Property Damage',
    description: 'Damage to vehicle or property',
    icon: 'car-outline',
    color: COLORS.error[600],
  },
  {
    id: 'inappropriate_behavior',
    label: 'Inappropriate Behavior',
    description: 'Unacceptable conduct or harassment',
    icon: 'person-outline',
    color: COLORS.error[600],
  },
  {
    id: 'payment_issue',
    label: 'Payment Issue',
    description: 'Problems with payment or fare',
    icon: 'card-outline',
    color: COLORS.warning[600],
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other incident not listed above',
    icon: 'ellipsis-horizontal-outline',
    color: COLORS.gray[600],
  },
];

const VideoIncidentReportModal = ({
  visible,
  onClose,
  onSubmit,
  rideData,
  recordingDuration = 0,
}) => {
  const [selectedIncidentType, setSelectedIncidentType] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIncidentTypeSelect = (type) => {
    setSelectedIncidentType(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSeveritySelect = (level) => {
    setSeverity(level);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (!selectedIncidentType) {
      Alert.alert('Incident Type Required', 'Please select the type of incident that occurred.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a description of the incident.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const incidentData = {
        incidentType: selectedIncidentType.id,
        incidentTypeLabel: selectedIncidentType.label,
        description: description.trim(),
        severity,
        rideId: rideData?.rideId || 'unknown',
        riderId: rideData?.riderId || 'unknown',
        driverId: rideData?.driverId || 'unknown',
        timestamp: new Date().toISOString(),
        recordingDuration,
        location: rideData?.currentLocation || null,
        status: 'reported',
      };

      await onSubmit(incidentData);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted. Support will review the video recording and contact you if needed.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error submitting incident report:', error);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your incident report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case 'low': return COLORS.success[600];
      case 'medium': return COLORS.warning[600];
      case 'high': return COLORS.error[600];
      default: return COLORS.warning[600];
    }
  };

  const getSeverityIcon = (level) => {
    switch (level) {
      case 'low': return 'checkmark-circle-outline';
      case 'medium': return 'warning-outline';
      case 'high': return 'alert-circle-outline';
      default: return 'warning-outline';
    }
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
            <Ionicons name="flag" size={32} color={COLORS.error[600]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Flag Incident</Text>
            <Text style={styles.headerSubtitle}>
              Report an incident that occurred during the ride
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recording Info */}
          <View style={styles.recordingInfoCard}>
            <View style={styles.recordingInfoHeader}>
              <Ionicons name="videocam" size={20} color={COLORS.primary[600]} />
              <Text style={styles.recordingInfoTitle}>Recording Information</Text>
            </View>
            <View style={styles.recordingInfoList}>
              <View style={styles.recordingInfoItem}>
                <Text style={styles.recordingInfoLabel}>Recording Duration:</Text>
                <Text style={styles.recordingInfoValue}>{formatTime(recordingDuration)}</Text>
              </View>
              <View style={styles.recordingInfoItem}>
                <Text style={styles.recordingInfoLabel}>Ride ID:</Text>
                <Text style={styles.recordingInfoValue}>{rideData?.rideId || 'Unknown'}</Text>
              </View>
              <View style={styles.recordingInfoItem}>
                <Text style={styles.recordingInfoLabel}>Rider:</Text>
                <Text style={styles.recordingInfoValue}>{rideData?.riderName || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Incident Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Type *</Text>
            <Text style={styles.sectionSubtitle}>
              Select the type of incident that occurred
            </Text>
            <View style={styles.incidentTypesList}>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.incidentTypeCard,
                    selectedIncidentType?.id === type.id && styles.incidentTypeSelected,
                  ]}
                  onPress={() => handleIncidentTypeSelect(type)}
                  activeOpacity={0.7}
                >
                  <View style={styles.incidentTypeIcon}>
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={selectedIncidentType?.id === type.id ? 'white' : type.color}
                    />
                  </View>
                  <View style={styles.incidentTypeText}>
                    <Text
                      style={[
                        styles.incidentTypeLabel,
                        selectedIncidentType?.id === type.id && styles.incidentTypeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.incidentTypeDescription,
                        selectedIncidentType?.id === type.id && styles.incidentTypeDescriptionSelected,
                      ]}
                    >
                      {type.description}
                    </Text>
                  </View>
                  {selectedIncidentType?.id === type.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={20} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level</Text>
            <Text style={styles.sectionSubtitle}>
              How serious is this incident?
            </Text>
            <View style={styles.severityButtons}>
              {[
                { level: 'low', label: 'Low', description: 'Minor issue' },
                { level: 'medium', label: 'Medium', description: 'Moderate concern' },
                { level: 'high', label: 'High', description: 'Serious incident' },
              ].map((sev) => (
                <TouchableOpacity
                  key={sev.level}
                  style={[
                    styles.severityButton,
                    severity === sev.level && styles.severityButtonSelected,
                    { borderColor: getSeverityColor(sev.level) },
                    severity === sev.level && { backgroundColor: getSeverityColor(sev.level) },
                  ]}
                  onPress={() => handleSeveritySelect(sev.level)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={getSeverityIcon(sev.level)}
                    size={20}
                    color={severity === sev.level ? 'white' : getSeverityColor(sev.level)}
                  />
                  <Text
                    style={[
                      styles.severityLabel,
                      { color: severity === sev.level ? 'white' : getSeverityColor(sev.level) },
                    ]}
                  >
                    {sev.label}
                  </Text>
                  <Text
                    style={[
                      styles.severityDescription,
                      { color: severity === sev.level ? 'rgba(255,255,255,0.8)' : COLORS.gray[600] },
                    ]}
                  >
                    {sev.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Description *</Text>
            <Text style={styles.sectionSubtitle}>
              Provide details about what happened
            </Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened during the incident..."
              placeholderTextColor={COLORS.gray[400]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Important Notice */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.info[600]} />
              <Text style={styles.noticeTitle}>Important Notice</Text>
            </View>
            <Text style={styles.noticeText}>
              By flagging this incident, the video recording will be preserved for review by our support team. 
              This may take up to 24 hours to process. You will be contacted if additional information is needed.
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (!selectedIncidentType || !description.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedIncidentType || !description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="flag" size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Flag Incident'}
            </Text>
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
    backgroundColor: COLORS.error[50],
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: COLORS.error[600],
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
  recordingInfoCard: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  recordingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[800],
    marginLeft: 8,
  },
  recordingInfoList: {
    gap: 8,
  },
  recordingInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordingInfoLabel: {
    fontSize: 14,
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  recordingInfoValue: {
    fontSize: 14,
    color: COLORS.primary[800],
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  incidentTypesList: {
    gap: 12,
  },
  incidentTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: 'white',
  },
  incidentTypeSelected: {
    borderColor: COLORS.primary[600],
    backgroundColor: COLORS.primary[50],
  },
  incidentTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  incidentTypeText: {
    flex: 1,
  },
  incidentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  incidentTypeLabelSelected: {
    color: COLORS.primary[800],
  },
  incidentTypeDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  incidentTypeDescriptionSelected: {
    color: COLORS.primary[700],
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  severityButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  severityDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'right',
    marginTop: 8,
  },
  noticeCard: {
    backgroundColor: COLORS.info[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.info[200],
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.info[800],
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 14,
    color: COLORS.info[700],
    lineHeight: 20,
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
  cancelButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  submitButton: {
    backgroundColor: COLORS.error[600],
    shadowColor: COLORS.error[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default VideoIncidentReportModal;
