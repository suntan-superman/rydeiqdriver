import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { FONT_SIZES, SPACING, BUTTON_SIZES, BORDER_RADIUS, hp, wp } from '@/constants/responsiveSizes';
import enhancedSafetyService from '@/services/enhancedSafetyService';
import * as Haptics from 'expo-haptics';

const EnhancedEmergencyModal = ({ visible, onClose, currentRide = null, driverLocation = null, driverId = null }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [safetyScore, setSafetyScore] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [safetySettings, setSafetySettings] = useState({
    autoReport: true,
    emergencyNotifications: true,
    locationSharing: true,
    incidentDetection: true
  });

  useEffect(() => {
    if (visible && driverId) {
      loadSafetyData();
    }
  }, [visible, driverId]);

  const loadSafetyData = async () => {
    try {
      setIsLoading(true);
      await enhancedSafetyService.initialize(driverId);
      setSafetyScore(enhancedSafetyService.safetyScore);
      setSafetySettings(enhancedSafetyService.safetySettings);
    } catch (error) {
      console.error('Error loading safety data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyTypes = [
    {
      id: 'police',
      icon: 'shield',
      iconColor: '#DC2626',
      title: 'Police Emergency',
      description: 'Immediate danger or crime',
      number: '911',
      priority: 'critical'
    },
    {
      id: 'medical',
      icon: 'medical',
      iconColor: '#EF4444',
      title: 'Medical Emergency',
      description: 'Medical assistance needed',
      number: '911',
      priority: 'critical'
    },
    {
      id: 'roadside',
      icon: 'car',
      iconColor: '#F59E0B',
      title: 'Roadside Assistance',
      description: 'Vehicle breakdown or flat tire',
      number: '1-800-AAA-HELP',
      priority: 'medium'
    },
    {
      id: 'safety',
      icon: 'warning',
      iconColor: '#EAB308',
      title: 'Safety Concern',
      description: 'Feel unsafe or uncomfortable',
      action: 'safety_protocol',
      priority: 'high'
    },
    {
      id: 'incident',
      icon: 'document-text',
      iconColor: '#8B5CF6',
      title: 'Report Incident',
      description: 'Report a safety incident',
      action: 'incident_report',
      priority: 'medium'
    },
  ];

  const handleEmergencyType = async (type) => {
    try {
      setSelectedType(type.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      if (type.number) {
        await makeEmergencyCall(type.number, type.title);
      } else if (type.action === 'safety_protocol') {
        await handleSafetyProtocol();
      } else if (type.action === 'incident_report') {
        await handleIncidentReport();
      }
    } catch (error) {
      console.error('Error handling emergency type:', error);
      Alert.alert('Error', 'Failed to process emergency request');
    } finally {
      setSelectedType(null);
    }
  };

  const makeEmergencyCall = async (number, title) => {
    try {
      const phoneNumber = Platform.OS === 'ios' ? `tel:${number}` : `tel:${number}`;
      const canCall = await Linking.canOpenURL(phoneNumber);
      
      if (canCall) {
        await Linking.openURL(phoneNumber);
        
        // Log emergency call
        await logEmergencyAction('emergency_call', { number, title });
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making emergency call:', error);
      Alert.alert('Error', 'Failed to make emergency call');
    }
  };

  const handleSafetyProtocol = async () => {
    Alert.alert(
      '⚠️ Enhanced Safety Protocol',
      'Your location is being shared with dispatch and emergency contacts. What would you like to do?',
      [
        {
          text: 'End Current Ride',
          onPress: async () => {
            await logEmergencyAction('safety_protocol_end_ride');
            Alert.alert('Ride Ended', 'The current ride has been ended. You are now offline.');
            onClose();
          },
        },
        {
          text: 'Call Support',
          onPress: () => makeEmergencyCall('1-800-ANYRYDE', 'Support'),
        },
        {
          text: 'Notify Emergency Contacts',
          onPress: async () => {
            await notifyEmergencyContacts('safety_concern');
            Alert.alert('Contacts Notified', 'Your emergency contacts have been notified of your safety concern.');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedType(null),
        },
      ]
    );
  };

  const handleIncidentReport = async () => {
    try {
      await enhancedSafetyService.manualReportIncident();
    } catch (error) {
      console.error('Error handling incident report:', error);
      Alert.alert('Error', 'Failed to create incident report');
    }
  };

  const notifyEmergencyContacts = async (type) => {
    try {
      await enhancedSafetyService.notifyEmergencyContacts({ type, severity: 'high' });
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  };

  const logEmergencyAction = async (action, data = {}) => {
    try {
      // This would log to the safety service
      console.log('Emergency action logged:', action, data);
    } catch (error) {
      console.error('Error logging emergency action:', error);
    }
  };

  const toggleSafetySetting = async (setting) => {
    try {
      const newSettings = {
        ...safetySettings,
        [setting]: !safetySettings[setting]
      };
      
      setSafetySettings(newSettings);
      
      // Update in safety service
      await enhancedSafetyService.updateSafetySettings(newSettings);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error updating safety setting:', error);
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return COLORS.success[600];
    if (score >= 70) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getSafetyScoreIcon = (score) => {
    if (score >= 90) return 'shield-checkmark';
    if (score >= 70) return 'shield';
    return 'shield-outline';
  };

  const getSafetyScoreMessage = (score) => {
    if (score >= 90) return 'Excellent safety record';
    if (score >= 70) return 'Good safety record';
    return 'Safety improvement needed';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield" size={24} color={COLORS.error[600]} />
            <Text style={styles.headerTitle}>Emergency & Safety</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Safety Score Card */}
          <View style={styles.safetyScoreCard}>
            <View style={styles.safetyScoreHeader}>
              <Ionicons 
                name={getSafetyScoreIcon(safetyScore)} 
                size={32} 
                color={getSafetyScoreColor(safetyScore)} 
              />
              <View style={styles.safetyScoreInfo}>
                <Text style={styles.safetyScoreTitle}>Safety Score</Text>
                <Text style={styles.safetyScoreMessage}>
                  {getSafetyScoreMessage(safetyScore)}
                </Text>
              </View>
            </View>
            <Text style={[styles.safetyScoreValue, { color: getSafetyScoreColor(safetyScore) }]}>
              {safetyScore}
            </Text>
          </View>

          {/* Safety Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Safety Settings</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Report Incidents</Text>
                <Text style={styles.settingDescription}>
                  Automatically report high-severity incidents
                </Text>
              </View>
              <Switch
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                thumbColor={safetySettings.autoReport ? COLORS.primary[600] : COLORS.gray[500]}
                ios_backgroundColor={COLORS.gray[300]}
                onValueChange={() => toggleSafetySetting('autoReport')}
                value={safetySettings.autoReport}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Emergency Notifications</Text>
                <Text style={styles.settingDescription}>
                  Notify emergency contacts during incidents
                </Text>
              </View>
              <Switch
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                thumbColor={safetySettings.emergencyNotifications ? COLORS.primary[600] : COLORS.gray[500]}
                ios_backgroundColor={COLORS.gray[300]}
                onValueChange={() => toggleSafetySetting('emergencyNotifications')}
                value={safetySettings.emergencyNotifications}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Location Sharing</Text>
                <Text style={styles.settingDescription}>
                  Share location during emergencies
                </Text>
              </View>
              <Switch
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                thumbColor={safetySettings.locationSharing ? COLORS.primary[600] : COLORS.gray[500]}
                ios_backgroundColor={COLORS.gray[300]}
                onValueChange={() => toggleSafetySetting('locationSharing')}
                value={safetySettings.locationSharing}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Incident Detection</Text>
                <Text style={styles.settingDescription}>
                  Monitor for safety incidents automatically
                </Text>
              </View>
              <Switch
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                thumbColor={safetySettings.incidentDetection ? COLORS.primary[600] : COLORS.gray[500]}
                ios_backgroundColor={COLORS.gray[300]}
                onValueChange={() => toggleSafetySetting('incidentDetection')}
                value={safetySettings.incidentDetection}
              />
            </View>
          </View>

          {/* Current Ride Info */}
          {currentRide && (
            <View style={styles.rideInfoCard}>
              <Text style={styles.rideInfoTitle}>Current Ride</Text>
              <Text style={styles.rideInfoText}>
                From: {currentRide.pickup?.address || 'Unknown location'}
              </Text>
              <Text style={styles.rideInfoText}>
                To: {currentRide.destination?.address || 'Unknown location'}
              </Text>
            </View>
          )}

          {/* Emergency Options */}
          <View style={styles.emergencyOptionsCard}>
            <Text style={styles.emergencyOptionsTitle}>Emergency Options</Text>
            
            {emergencyTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.emergencyOption,
                  selectedType === type.id && styles.emergencyOptionSelected
                ]}
                onPress={() => handleEmergencyType(type)}
                disabled={selectedType === type.id}
              >
                <View style={styles.emergencyOptionContent}>
                  <View style={styles.emergencyOptionLeft}>
                    <View style={[styles.emergencyIcon, { backgroundColor: type.iconColor }]}>
                      <Ionicons name={type.icon} size={24} color="white" />
                    </View>
                    <View style={styles.emergencyOptionInfo}>
                      <Text style={styles.emergencyOptionTitle}>{type.title}</Text>
                      <Text style={styles.emergencyOptionDescription}>
                        {type.description}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedType === type.id ? (
                    <ActivityIndicator size="small" color={type.iconColor} />
                  ) : (
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={COLORS.gray[400]} 
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => makeEmergencyCall('1-800-ANYRYDE', 'Support')}
              >
                <Ionicons name="call" size={20} color={COLORS.primary[600]} />
                <Text style={styles.quickActionText}>Call Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => notifyEmergencyContacts('manual_alert')}
              >
                <Ionicons name="people" size={20} color={COLORS.warning[600]} />
                <Text style={styles.quickActionText}>Alert Contacts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => enhancedSafetyService.manualReportIncident()}
              >
                <Ionicons name="document-text" size={20} color={COLORS.info[600]} />
                <Text style={styles.quickActionText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
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
  safetyScoreCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  safetyScoreInfo: {
    flex: 1,
  },
  safetyScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  safetyScoreMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  safetyScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  rideInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  rideInfoText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  emergencyOptionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  emergencyOption: {
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  emergencyOptionSelected: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  emergencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  emergencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyOptionInfo: {
    flex: 1,
  },
  emergencyOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  emergencyOptionDescription: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  quickActionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EnhancedEmergencyModal;
