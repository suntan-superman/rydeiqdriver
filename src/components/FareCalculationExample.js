import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  calculateFareEstimate, 
  selectFareCalculation, 
  selectIsCalculatingFare,
  clearFareCalculation 
} from '@/store/slices/biddingSlice';
import FareCalculationCard from './FareCalculationCard';

/**
 * Example component showing how to integrate FareCalculationCard with Redux
 * This demonstrates the complete fare calculation flow with state management
 */
const FareCalculationExample = ({ rideRequest, driverVehicle, driverLocation }) => {
  const dispatch = useDispatch();
  const fareCalculation = useSelector(selectFareCalculation);
  const isCalculating = useSelector(selectIsCalculatingFare);

  useEffect(() => {
    // Calculate fare estimate when component mounts or props change
    if (rideRequest && driverVehicle) {
      dispatch(calculateFareEstimate({
        rideRequest,
        driverVehicle,
        driverLocation
      }));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearFareCalculation());
    };
  }, [rideRequest, driverVehicle, driverLocation, dispatch]);

  const handleFareCalculationComplete = (fareData) => {
    // This data is now also available in Redux store
    // You can dispatch additional actions or updates here
    console.log('Fare calculation completed:', fareData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fare Calculation Integration Example</Text>
      
      {/* Using the FareCalculationCard component */}
      <FareCalculationCard
        rideRequest={rideRequest}
        driverVehicle={driverVehicle}
        driverLocation={driverLocation}
        onCalculationComplete={handleFareCalculationComplete}
      />

      {/* Display Redux state information */}
      {isCalculating && (
        <View style={styles.reduxInfo}>
          <Text style={styles.reduxInfoText}>
            Redux State: Calculating fare...
          </Text>
        </View>
      )}

      {fareCalculation && (
        <View style={styles.reduxInfo}>
          <Text style={styles.reduxInfoText}>
            Redux State: Fare calculation available
          </Text>
          <Text style={styles.reduxInfoDetail}>
            Estimated Fuel Cost: ${fareCalculation.estimatedFuelCost?.toFixed(2)}
          </Text>
          <Text style={styles.reduxInfoDetail}>
            Total Estimated Costs: ${fareCalculation.totalEstimatedCosts?.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  reduxInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  reduxInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  reduxInfoDetail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default FareCalculationExample;
