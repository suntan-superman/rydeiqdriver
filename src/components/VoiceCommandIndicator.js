/**
 * Voice Command Indicator
 * Visual feedback for voice recognition state
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const VoiceCommandIndicator = ({ isListening, context }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      // Pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  if (!isListening) {
    return null;
  }

  const getContextMessage = () => {
    switch (context) {
      case 'ride_request':
        return 'Say "Accept" or "Decline"';
      case 'confirmation':
        return 'Say "Confirm" or "Cancel"';
      default:
        return 'Listening...';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons name="mic" size={32} color={COLORS.white} />
      </Animated.View>
      <Text style={styles.message}>{getContextMessage()}</Text>
      <View style={styles.waveContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.wave} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  iconContainer: {
    backgroundColor: COLORS.success,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  waveContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  wave: {
    width: 3,
    height: 20,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
});

export default VoiceCommandIndicator;

