import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Safe import for COLORS
let COLORS;
try {
  COLORS = require('@/constants').COLORS;
} catch (e) {
  COLORS = {
    primary: '#10B981',
    success: '#10B981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
}

/**
 * MultiStopNavigation
 * Manages navigation through multiple stops during active ride
 * Shows progress, handles arrivals, and manages stop completion
 */
const MultiStopNavigation = ({
  ride,
  currentStopIndex = 0,
  onStopComplete,
  onArrived,
  onNavigateToStop,
  style,
}) => {
  const [hasArrived, setHasArrived] = useState(false);
  const [waitStartTime, setWaitStartTime] = useState(null);

  const stops = ride?.stops || [];
  const currentStop = stops[currentStopIndex];
  const totalStops = stops.length;
  const isLastStop = currentStopIndex === totalStops - 1;

  // Reset arrival state when moving to next stop
  useEffect(() => {
    setHasArrived(false);
    setWaitStartTime(null);
  }, [currentStopIndex]);

  const handleArrived = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasArrived(true);
    setWaitStartTime(Date.now());
    
    if (onArrived) {
      onArrived(currentStop.id, currentStopIndex);
    }
  };

  const handleComplete = () => {
    const waitTime = waitStartTime ? Math.floor((Date.now() - waitStartTime) / 1000) : 0;
    const waitMinutes = Math.floor(waitTime / 60);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Complete Stop',
      `Mark "${currentStop.address}" as complete?${waitTime > 300 ? `\n\nWait time: ${waitMinutes} minutes` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLastStop ? 'Complete Ride' : 'Next Stop',
          style: 'default',
          onPress: () => {
            setHasArrived(false);
            setWaitStartTime(null);
            if (onStopComplete) {
              onStopComplete(currentStop.id, currentStopIndex, waitTime);
            }
          },
        },
      ]
    );
  };

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!currentStop?.coordinates) {
      Alert.alert('Navigation Error', 'Stop coordinates not available');
      return;
    }

    const lat = currentStop.coordinates.lat;
    const lng = currentStop.coordinates.lng;
    const address = encodeURIComponent(currentStop.address);
    
    // Open navigation app
    const scheme = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${address})`
    });
    
    Alert.alert(
      'Navigate to Stop',
      'Choose navigation app:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apple/Google Maps',
          onPress: () => Linking.openURL(scheme),
        },
        {
          text: 'Waze',
          onPress: () => Linking.openURL(`waze://?ll=${lat},${lng}&navigate=yes`),
        },
      ]
    );

    if (onNavigateToStop) {
      onNavigateToStop(currentStop, currentStopIndex);
    }
  };

  if (!currentStop) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Stop {currentStopIndex + 1} of {totalStops}
          </Text>
          <View style={styles.progressDots}>
            {stops.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < currentStopIndex && styles.progressDotCompleted,
                  index === currentStopIndex && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Current Stop Card */}
      <View style={styles.stopCard}>
        <View style={styles.stopHeader}>
          <View style={styles.stopBadge}>
            <Text style={styles.stopBadgeText}>{currentStopIndex + 1}</Text>
          </View>
          <View style={styles.stopInfo}>
            <Text style={styles.stopLabel}>Current Stop</Text>
            <Text style={styles.stopAddress} numberOfLines={2}>
              {currentStop.address}
            </Text>
          </View>
        </View>

        {/* Special Instructions */}
        {currentStop.specialInstructions && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <Text style={styles.instructionsText} numberOfLines={3}>
              {currentStop.specialInstructions}
            </Text>
          </View>
        )}

        {/* Contact Info */}
        {currentStop.contactInfo && (
          <View style={styles.contactContainer}>
            <Ionicons name="person-circle" size={16} color="#6b7280" />
            <Text style={styles.contactText}>
              {currentStop.contactInfo.name || 'Contact available'}
            </Text>
            {currentStop.contactInfo.phone && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${currentStop.contactInfo.phone}`)}
                style={styles.callButton}
              >
                <Ionicons name="call" size={14} color="#10b981" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!hasArrived ? (
            <>
              {/* Navigate Button */}
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={handleNavigate}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={20} color="white" />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>

              {/* Arrived Button */}
              <TouchableOpacity
                style={styles.arrivedButton}
                onPress={handleArrived}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.arrivedButtonText}>I've Arrived</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Waiting Indicator */}
              <View style={styles.waitingIndicator}>
                <Ionicons name="time" size={16} color="#10b981" />
                <Text style={styles.waitingText}>Waiting at stop...</Text>
              </View>

              {/* Complete Button */}
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done" size={20} color="white" />
                <Text style={styles.completeButtonText}>
                  {isLastStop ? 'Complete Ride' : 'Next Stop'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Next Stop Preview */}
      {!isLastStop && currentStopIndex < totalStops - 1 && (
        <View style={styles.nextStopPreview}>
          <View style={styles.nextStopHeader}>
            <Ionicons name="arrow-forward" size={14} color="#6b7280" />
            <Text style={styles.nextStopLabel}>Next Stop:</Text>
          </View>
          <Text style={styles.nextStopAddress} numberOfLines={1}>
            {stops[currentStopIndex + 1].address}
          </Text>
        </View>
      )}

      {/* Completed Stops Summary */}
      {currentStopIndex > 0 && (
        <View style={styles.completedSummary}>
          <Ionicons name="checkmark-done-circle" size={16} color="#10b981" />
          <Text style={styles.completedText}>
            {currentStopIndex} of {totalStops} stops completed
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  progressDotCompleted: {
    backgroundColor: '#10b981',
  },
  progressDotCurrent: {
    backgroundColor: '#3b82f6',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  stopInfo: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stopAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 22,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  arrivedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  arrivedButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  waitingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  waitingText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  nextStopPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  nextStopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextStopAddress: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  completedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  completedText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
});

export default MultiStopNavigation;

