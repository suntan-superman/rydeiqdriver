import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import smartMatchingService from '../../services/smartMatchingService';
import * as Haptics from 'expo-haptics';

const SmartRecommendations = ({ 
  driverId, 
  driverLocation, 
  onRideSelect, 
  onClose,
  visible = false 
}) => {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && driverId && driverLocation) {
      loadRecommendations();
    }
  }, [visible, driverId, driverLocation]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await smartMatchingService.getSmartRecommendations(driverId, driverLocation, {
        maxDistance: 10,
        timeWindow: 30,
        includePredictions: true,
        marketAnalysis: true
      });
      
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading smart recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRideSelect = (ride) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRideSelect(ride);
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDistance = (distance) => {
    return `${distance.toFixed(1)} mi`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success[600];
    if (score >= 60) return COLORS.warning[600];
    return COLORS.error[600];
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return 'star';
    if (score >= 60) return 'thumbs-up';
    return 'thumbs-down';
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Smart Recommendations</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Analyzing available rides...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error[500]} />
            <Text style={styles.errorTitle}>Failed to Load Recommendations</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {recommendations && !isLoading && (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Available Rides</Text>
              <Text style={styles.summaryText}>
                {recommendations.totalAvailable} rides found • {recommendations.recommendations.topPicks.length} recommended
              </Text>
            </View>

            {/* Insights */}
            {recommendations.recommendations.insights.length > 0 && (
              <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>Market Insights</Text>
                {recommendations.recommendations.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Ionicons 
                      name={insight.icon} 
                      size={16} 
                      color={insight.type === 'success' ? COLORS.success[600] : COLORS.warning[600]} 
                    />
                    <Text style={styles.insightText}>{insight.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Top Picks */}
            {recommendations.recommendations.topPicks.length > 0 && (
              <View style={styles.topPicksCard}>
                <Text style={styles.topPicksTitle}>Top Recommendations</Text>
                {recommendations.recommendations.topPicks.map((ride, index) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={styles.rideCard}
                    onPress={() => handleRideSelect(ride)}
                  >
                    <View style={styles.rideHeader}>
                      <View style={styles.rideInfo}>
                        <Text style={styles.rideDistance}>
                          {formatDistance(ride.scoreBreakdown?.distance || 0)} pickup
                        </Text>
                        <Text style={styles.rideEarnings}>
                          {formatCurrency(ride.estimatedEarnings || 15)}
                        </Text>
                      </View>
                      <View style={styles.scoreContainer}>
                        <Ionicons 
                          name={getScoreIcon(ride.smartScore)} 
                          size={20} 
                          color={getScoreColor(ride.smartScore)} 
                        />
                        <Text style={[styles.scoreText, { color: getScoreColor(ride.smartScore) }]}>
                          {ride.smartScore}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rideDetails}>
                      <Text style={styles.rideFrom}>
                        From: {ride.pickup?.address || 'Pickup Location'}
                      </Text>
                      <Text style={styles.rideTo}>
                        To: {ride.destination?.address || 'Destination'}
                      </Text>
                    </View>

                    {/* Score Breakdown */}
                    <View style={styles.scoreBreakdown}>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Distance</Text>
                        <Text style={styles.scoreValue}>{ride.scoreBreakdown?.distance || 0}</Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Time</Text>
                        <Text style={styles.scoreValue}>{ride.scoreBreakdown?.timeOfDay || 0}</Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Earnings</Text>
                        <Text style={styles.scoreValue}>{ride.scoreBreakdown?.earnings || 0}</Text>
                      </View>
                    </View>

                    {/* Recommendations */}
                    {ride.recommendations && ride.recommendations.length > 0 && (
                      <View style={styles.rideRecommendations}>
                        {ride.recommendations.map((rec, recIndex) => (
                          <View key={recIndex} style={styles.rideRecommendation}>
                            <Ionicons 
                              name={rec.type === 'success' ? 'checkmark-circle' : 
                                    rec.type === 'warning' ? 'warning' : 'information-circle'} 
                              size={14} 
                              color={rec.type === 'success' ? COLORS.success[600] : 
                                     rec.type === 'warning' ? COLORS.warning[600] : COLORS.info[600]} 
                            />
                            <Text style={styles.rideRecommendationText}>{rec.message}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {recommendations.recommendations.suggestions.length > 0 && (
              <View style={styles.suggestionsCard}>
                <Text style={styles.suggestionsTitle}>Smart Suggestions</Text>
                {recommendations.recommendations.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <View style={styles.suggestionHeader}>
                      <Ionicons 
                        name={suggestion.type === 'improvement' ? 'trending-up' : 'star'} 
                        size={18} 
                        color={suggestion.type === 'improvement' ? COLORS.warning[600] : COLORS.success[600]} 
                      />
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    </View>
                    <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
                    <Text style={styles.suggestionAction}>{suggestion.action}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Refresh Button */}
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color={COLORS.primary[600]} />
              <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  insightsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[700],
  },
  topPicksCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topPicksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  rideCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideInfo: {
    flex: 1,
  },
  rideDistance: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  rideEarnings: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success[600],
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rideDetails: {
    marginBottom: 8,
  },
  rideFrom: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  rideTo: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  rideRecommendations: {
    gap: 4,
  },
  rideRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rideRecommendationText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.gray[600],
  },
  suggestionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  suggestionItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  suggestionMessage: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  suggestionAction: {
    fontSize: 11,
    color: COLORS.primary[600],
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary[600],
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
});

export default SmartRecommendations;
