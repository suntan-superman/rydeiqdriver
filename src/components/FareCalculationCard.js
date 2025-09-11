import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { calculateFuelCost } from '@/utils/fuelEstimation';
import { getFuelPrices } from '@/services/api/fuelPriceService';

const FareCalculationCard = ({ 
  rideRequest, 
  driverVehicle, 
  driverLocation,
  onCalculationComplete,
  style,
  forceExpanded = false,
  hideToggleButton = false
}) => {
  const [fareData, setFareData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rideRequest && driverVehicle) {
      calculateFareEstimate();
    }
  }, [rideRequest, driverVehicle, driverLocation]);

  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  const calculateFareEstimate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get trip distance from ride request
      const tripDistance = parseFloat(rideRequest.estimatedDistance?.replace(/[^\d.]/g, '')) || 0;
      
      if (tripDistance === 0) {
        throw new Error('Trip distance not available');
      }

      // Provide fallback location if not provided
      const safeDriverLocation = driverLocation || {
        latitude: 35.3733,
        longitude: -119.0187,
        isFallback: true
      };



      // Initialize with safe fallback values
      let fuelCostResult = {
        totalCost: tripDistance * 0.15, // Fallback: $0.15 per mile
        vehicleData: {
          combined: 25,
          effectiveMPG: 25,
          fuelType: 'gasoline'
        }
      };
      let fuelPrices = {
        gasoline: 3.45,
        source: 'fallback',
        lastUpdated: new Date().toISOString()
      };

      try {
        // Calculate fuel cost using existing utility with timeout protection
        const fuelCostPromise = calculateFuelCost({
          distance: tripDistance,
          vehicle: driverVehicle,
          location: safeDriverLocation
        });

        const fuelPricePromise = getFuelPrices(safeDriverLocation);

        // Add timeout protection for both operations
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Calculation timeout')), 8000)
        );

        const [actualFuelCost, actualFuelPrices] = await Promise.race([
          Promise.all([fuelCostPromise, fuelPricePromise]),
          timeoutPromise
        ]);

        // Use actual results if they exist and are valid
        if (actualFuelCost && typeof actualFuelCost.totalCost === 'number') {
          fuelCostResult = actualFuelCost;
        }
        if (actualFuelPrices && actualFuelPrices.gasoline) {
          fuelPrices = actualFuelPrices;
        }
        
      } catch (calcError) {
        // Continue with fallback values - no need to throw
      }
      
      // Safely extract vehicle MPG info with fallbacks
      const vehicleMPG = fuelCostResult?.vehicleData?.combined || 
                        fuelCostResult?.vehicleData?.effectiveMPG || 
                        25; // fallback

      // Calculate estimated fuel cost with safety check
      const estimatedFuelCost = fuelCostResult?.totalCost || 0;
      
      // Get fuel type and price
      const fuelType = driverVehicle.fuelType || 'gasoline';
      const fuelPrice = fuelPrices[fuelType] || fuelPrices.gasoline || 3.45;

      // Optional factors for future enhancement
      const maintenanceCostPerMile = 0.15; // $0.15 per mile
      const estimatedMaintenanceCost = tripDistance * maintenanceCostPerMile;
      
      // Driver time value (can be configured per driver in the future)
      const estimatedDuration = parseFloat(rideRequest.estimatedDuration?.replace(/[^\d.]/g, '')) || 30;
      const timeValuePerHour = 15; // $15/hour default
      const estimatedTimeValue = (estimatedDuration / 60) * timeValuePerHour;

      const fareCalculation = {
        tripDistance,
        vehicleMPG,
        fuelPrice,
        fuelType,
        estimatedFuelCost,
        estimatedMaintenanceCost,
        estimatedTimeValue,
        totalEstimatedCosts: estimatedFuelCost + estimatedMaintenanceCost + estimatedTimeValue,
        fuelPriceSource: fuelPrices.source || 'estimate',
        lastUpdated: fuelPrices.lastUpdated || new Date().toISOString(),
        usingFallbackLocation: safeDriverLocation.isFallback || false
      };

      setFareData(fareCalculation);
      onCalculationComplete?.(fareCalculation);
      
    } catch (err) {
      console.error('Error calculating fare estimate:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMPG = (mpg) => {
    return typeof mpg === 'number' ? mpg.toFixed(1) : mpg || 'N/A';
  };

  const formatFuelType = (type) => {
    const typeMap = {
      gasoline: 'Regular Gas',
      premium: 'Premium Gas',
      diesel: 'Diesel',
      hybrid: 'Hybrid',
      electric: 'Electric'
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Calculating fare estimate...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="warning" size={20} color={COLORS.warning} />
        <Text style={styles.errorText}>Unable to calculate fare estimate</Text>
        <TouchableOpacity onPress={calculateFareEstimate} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!fareData) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      {hideToggleButton ? (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="calculator" size={20} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Fare Calculation</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="calculator" size={20} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Fare Calculation</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={COLORS.secondary[600]} 
          />
        </TouchableOpacity>
      )}

      {/* Main Info - Always Visible */}
      {/* <View style={styles.mainInfo}>
        <View style={styles.tripInfo}>
          <Ionicons name="car" size={16} color={COLORS.secondary[600]} />
          <Text style={styles.tripText}>
            This ride is approximately {fareData.tripDistance} miles
          </Text>
        </View>
        
        <View style={styles.fuelCostDisplay}>
          <Text style={styles.fuelCostLabel}>Estimated Fuel Cost:</Text>
          <Text style={styles.fuelCostValue}>
            ${fareData.estimatedFuelCost.toFixed(2)} based on your vehicle
          </Text>
        </View>
      </View> */}

      {/* Expanded Details */}
      {(isExpanded || forceExpanded) && (
        <View style={styles.expandedContent}>
          <View style={styles.detailsGrid}>
            {/* Vehicle MPG */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vehicle MPG:</Text>
              <Text style={styles.detailValue}>{formatMPG(fareData.vehicleMPG)} mpg</Text>
            </View>

            {/* Fuel Type & Price */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fuel Type:</Text>
              <Text style={styles.detailValue}>{formatFuelType(fareData.fuelType)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Local Gas Price:</Text>
              <Text style={styles.detailValue}>
                ${fareData.fuelPrice.toFixed(2)}/gal
              </Text>
            </View>

            {/* Optional Factors */}
            <View style={styles.optionalFactors}>
              <Text style={styles.optionalTitle}>Additional Considerations:</Text>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Maintenance (~$0.15/mile):</Text>
                <Text style={styles.detailValue}>
                  ${fareData.estimatedMaintenanceCost.toFixed(2)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Time Value (~$15/hour):</Text>
                <Text style={styles.detailValue}>
                  ${fareData.estimatedTimeValue.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalCosts}>
                <Text style={styles.totalLabel}>Total Estimated Costs:</Text>
                <Text style={styles.totalValue}>
                  ${fareData.totalEstimatedCosts.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Data Source Info */}
          <View style={styles.sourceInfo}>
            <Ionicons name="information-circle" size={12} color={COLORS.secondary[500]} />
            <Text style={styles.sourceText}>
              Fuel prices from {fareData.fuelPriceSource} • Updated {new Date(fareData.lastUpdated).toLocaleTimeString()}
              {fareData.usingFallbackLocation && ' • Using default location'}
            </Text>
          </View>
        </View>
      )}

      {/* Call to Action */}
      <View style={styles.callToAction}>
        <Text style={styles.promptText}>
          Set your ride price based on time, effort, and cost
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    marginVertical: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.secondary[600],
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.warning + '10',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.warning,
    marginVertical: 8,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.secondary[50],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginLeft: 8,
  },
  mainInfo: {
    padding: 16,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripText: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 8,
  },
  fuelCostDisplay: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelCostLabel: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  fuelCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
    padding: 16,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.secondary[600],
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[900],
  },
  optionalFactors: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  optionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  totalCosts: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[300],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[800],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[200],
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginLeft: 4,
  },
  callToAction: {
    backgroundColor: COLORS.success + '15',
    padding: 12,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
    textAlign: 'center',
  },
});

export default FareCalculationCard;
