import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  };
}

/**
 * WaitTimerWidget
 * Displays wait time with grace period and charge accumulator
 * Shows live timer: first 5 min free, then $0.40/min
 */
const WaitTimerWidget = ({ 
  stopId, 
  startTime, 
  graceMinutes = 5,
  chargePerMinute = 0.40,
  onWaitTimeUpdate,
  style,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate initial elapsed time
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsedSeconds(initialElapsed);

    // Start interval
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      
      if (onWaitTimeUpdate) {
        onWaitTimeUpdate(elapsed, stopId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, stopId]);

  if (!startTime) {
    return null;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsDisplay = elapsedSeconds % 60;
  const isInGrace = elapsedMinutes < graceMinutes;
  const chargeableMinutes = Math.max(0, elapsedMinutes - graceMinutes);
  const currentCharge = chargeableMinutes * chargePerMinute;

  const formatTime = (minutes, seconds) => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Timer Display */}
      <View style={styles.timerSection}>
        <Ionicons 
          name="time" 
          size={32} 
          color={isInGrace ? '#10b981' : '#f59e0b'} 
        />
        <Text style={[
          styles.timerText,
          isInGrace ? styles.timerTextGrace : styles.timerTextCharging
        ]}>
          {formatTime(elapsedMinutes, elapsedSecondsDisplay)}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        {isInGrace ? (
          <View style={styles.graceStatus}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <View style={styles.graceInfo}>
              <Text style={styles.graceText}>Grace Period</Text>
              <Text style={styles.graceSubtext}>
                {graceMinutes - elapsedMinutes} min {elapsedMinutes === graceMinutes - 1 ? `${60 - elapsedSecondsDisplay} sec` : ''} remaining
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.chargingStatus}>
            <Ionicons name="cash" size={18} color="#f59e0b" />
            <View style={styles.chargingInfo}>
              <Text style={styles.chargingLabel}>Wait Charge</Text>
              <View style={styles.chargeRow}>
                <Text style={styles.chargingText}>
                  ${currentCharge.toFixed(2)}
                </Text>
                <Text style={styles.chargeRate}>
                  ({chargeableMinutes} min × ${chargePerMinute}/min)
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Text style={styles.infoText}>
          First {graceMinutes} min free • ${chargePerMinute}/min after
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timerText: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timerTextGrace: {
    color: '#10b981',
  },
  timerTextCharging: {
    color: '#f59e0b',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  graceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 10,
  },
  graceInfo: {
    alignItems: 'flex-start',
  },
  graceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 2,
  },
  graceSubtext: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  chargingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 10,
  },
  chargingInfo: {
    alignItems: 'flex-start',
  },
  chargingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  chargingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
  },
  chargeRate: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  infoFooter: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default WaitTimerWidget;

