/**
 * Voice Command Indicator
 * Visual feedback for voice recognition state
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { FONT_SIZES, SPACING, ICON_SIZES, BORDER_RADIUS, hp, wp } from '@/constants/responsiveSizes';

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
        <Ionicons name="mic" size={hp('4%')} color={COLORS.white} />
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
    top: hp('12%'),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  iconContainer: {
    backgroundColor: COLORS.success,
    borderRadius: hp('5%'),
    width: hp('10%'),
    height: hp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.5%') },
    shadowOpacity: 0.3,
    shadowRadius: hp('1%'),
    elevation: 8,
  },
  message: {
    marginTop: SPACING.SMALL,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: COLORS.secondary[900],
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.XLARGE,
    overflow: 'hidden',
  },
  waveContainer: {
    flexDirection: 'row',
    marginTop: SPACING.SMALL,
    gap: wp('1%'),
  },
  wave: {
    width: wp('0.8%'),
    height: hp('2.5%'),
    backgroundColor: COLORS.success,
    borderRadius: hp('0.3%'),
  },
});

export default VoiceCommandIndicator;

