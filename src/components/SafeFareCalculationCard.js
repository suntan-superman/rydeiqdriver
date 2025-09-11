import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

// Safe wrapper for FareCalculationCard that prevents crashes
const SafeFareCalculationCard = ({ rideRequest, driverVehicle, driverLocation, onCalculationComplete, style }) => {
  // Try to load the actual FareCalculationCard component
  let FareCalculationCard;
  try {
    FareCalculationCard = require('./FareCalculationCard').default;
  } catch (error) {
    FareCalculationCard = null;
  }

  // If the component loaded successfully, render it
  if (FareCalculationCard) {
    try {
      return (
        <FareCalculationCard
          rideRequest={rideRequest}
          driverVehicle={driverVehicle}
          driverLocation={driverLocation}
          onCalculationComplete={onCalculationComplete}
          style={style}
        />
      );
    } catch (error) {
      // Fall through to fallback UI
    }
  }

  // Fallback UI when FareCalculationCard fails or isn't available
  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.fallbackHeader}>
        <Text style={styles.fallbackTitle}>Fare Information</Text>
      </View>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackText}>
          Trip distance: {rideRequest?.estimatedDistance || 'N/A'}
        </Text>
        <Text style={styles.fallbackText}>
          Estimated duration: {rideRequest?.estimatedDuration || 'N/A'}
        </Text>
        <Text style={styles.fallbackSubtext}>
          Detailed cost analysis unavailable
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    marginVertical: 8,
    overflow: 'hidden',
  },
  fallbackHeader: {
    backgroundColor: COLORS.secondary[50],
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  fallbackContent: {
    padding: 16,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 12,
    color: COLORS.secondary[500],
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SafeFareCalculationCard;
