// Cooldown Banner Component
// Displays active cooldown with countdown timer

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import reliabilityService from '@/services/reliabilityService';

const CooldownBanner = ({ driverId, onCooldownEnd }) => {
  const [cooldownInfo, setCooldownInfo] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (driverId) {
      checkCooldown();
      const interval = setInterval(checkCooldown, 1000); // Check every second
      return () => clearInterval(interval);
    }
  }, [driverId]);

  useEffect(() => {
    if (cooldownInfo && cooldownInfo.isInCooldown && !dismissed) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [cooldownInfo, dismissed]);

  const checkCooldown = async () => {
    try {
      const info = await reliabilityService.checkCooldown(driverId);
      
      if (info.isInCooldown) {
        setCooldownInfo(info);
        setRemainingSec(info.retrySec);
      } else {
        // Cooldown ended
        if (cooldownInfo && cooldownInfo.isInCooldown) {
          // Was in cooldown, now ended
          if (onCooldownEnd) {
            onCooldownEnd();
          }
        }
        setCooldownInfo(null);
        setRemainingSec(0);
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => setDismissed(false), 10000); // Show again after 10 seconds
  };

  if (!cooldownInfo || !cooldownInfo.isInCooldown || dismissed) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <Ionicons name="time" size={24} color={COLORS.white} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Bidding Cooldown Active</Text>
          <Text style={styles.message}>
            {cooldownInfo.reason || 'Recent cancellation'}
          </Text>
          <View style={styles.timerContainer}>
            <Ionicons name="timer-outline" size={16} color={COLORS.white} />
            <Text style={styles.timer}>{formatTime(remainingSec)}</Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 16,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  message: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  dismissButton: {
    padding: 8,
  },
});

export default CooldownBanner;

