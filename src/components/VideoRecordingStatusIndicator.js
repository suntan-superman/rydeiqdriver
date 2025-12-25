import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import * as Haptics from 'expo-haptics';

const VideoRecordingStatusIndicator = ({
  isRecording = false,
  recordingDuration = 0,
  onToggleRecording,
  onFlagIncident,
  showControls = true,
  compact = false,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [recordingTime, setRecordingTime] = useState(recordingDuration);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Update recording time
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(recordingDuration);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingDuration]);

  const handleToggleRecording = () => {
    if (onToggleRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggleRecording();
    }
  };

  const handleFlagIncident = () => {
    Alert.alert(
      'Flag Incident',
      'Are you sure you want to flag this as an incident? This will preserve the video recording and notify support.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag Incident',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onFlagIncident();
          },
        },
      ]
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          isRecording && styles.compactRecording,
        ]}
        onPress={showControls ? handleToggleRecording : undefined}
        disabled={!showControls}
      >
        <Animated.View
          style={[
            styles.compactIcon,
            isRecording && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons
            name={isRecording ? 'videocam' : 'videocam-outline'}
            size={20}
            color={isRecording ? 'white' : COLORS.gray[600]}
          />
        </Animated.View>
        {isRecording && (
          <Text style={styles.compactTime}>{formatTime(recordingTime)}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recording Status */}
      <View style={[styles.statusCard, isRecording && styles.statusRecording]}>
        <View style={styles.statusHeader}>
          <Animated.View
            style={[
              styles.recordingIcon,
              isRecording && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons
              name={isRecording ? 'videocam' : 'videocam-outline'}
              size={24}
              color={isRecording ? 'white' : COLORS.gray[600]}
            />
          </Animated.View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isRecording ? 'Recording Active' : 'Recording Inactive'}
            </Text>
            {isRecording && (
              <Text style={styles.statusTime}>
                Duration: {formatTime(recordingTime)}
              </Text>
            )}
          </View>
          {isRecording && (
            <View style={styles.recordingDot}>
              <Animated.View
                style={[
                  styles.recordingPulse,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </View>
          )}
        </View>

        {/* Recording Info */}
        <View style={styles.recordingInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success[600]} />
            <Text style={styles.infoText}>Auto-delete after 72 hours</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.success[600]} />
            <Text style={styles.infoText}>Encrypted storage</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color={COLORS.success[600]} />
            <Text style={styles.infoText}>Both parties consented</Text>
          </View>
        </View>

        {/* Controls */}
        {showControls && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isRecording ? styles.stopButton : styles.startButton,
              ]}
              onPress={handleToggleRecording}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'play'}
                size={20}
                color="white"
              />
              <Text style={styles.controlButtonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            {isRecording && (
              <TouchableOpacity
                style={[styles.controlButton, styles.flagButton]}
                onPress={handleFlagIncident}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={20} color="white" />
                <Text style={styles.controlButtonText}>Flag Incident</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Recording Tips */}
      {!isRecording && (
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.warning[600]} />
            <Text style={styles.tipsTitle}>Recording Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>
              • Ensure dashcam is properly positioned and functional
            </Text>
            <Text style={styles.tipItem}>
              • Recording starts automatically when rider boards
            </Text>
            <Text style={styles.tipItem}>
              • Use "Flag Incident" for any safety concerns
            </Text>
            <Text style={styles.tipItem}>
              • Videos are automatically deleted after 72 hours
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRecording: {
    borderColor: COLORS.error[500],
    backgroundColor: COLORS.error[50],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  statusTime: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  recordingDot: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error[500],
  },
  recordingInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 8,
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  startButton: {
    backgroundColor: COLORS.success[600],
  },
  stopButton: {
    backgroundColor: COLORS.error[600],
  },
  flagButton: {
    backgroundColor: COLORS.warning[600],
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  tipsCard: {
    backgroundColor: COLORS.warning[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning[200],
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning[800],
    marginLeft: 8,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    color: COLORS.warning[700],
    lineHeight: 18,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  compactRecording: {
    backgroundColor: COLORS.error[500],
    borderColor: COLORS.error[600],
  },
  compactIcon: {
    marginRight: 8,
  },
  compactTime: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default VideoRecordingStatusIndicator;
