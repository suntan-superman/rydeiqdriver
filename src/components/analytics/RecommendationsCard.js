import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const RecommendationsCard = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'schedule':
        return 'time';
      case 'pricing':
        return 'cash';
      case 'market':
        return 'trending-up';
      default:
        return 'bulb';
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'schedule':
        return COLORS.primary[600];
      case 'pricing':
        return COLORS.success[600];
      case 'market':
        return COLORS.warning[600];
      default:
        return COLORS.info[600];
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return COLORS.error[600];
      case 'medium':
        return COLORS.warning[600];
      case 'low':
        return COLORS.success[600];
      default:
        return COLORS.gray[600];
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'warning';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={20} color={COLORS.warning[600]} />
        <Text style={styles.title}>Recommendations</Text>
      </View>
      
      {recommendations.map((recommendation, index) => (
        <View key={index} style={styles.recommendationItem}>
          <View style={styles.recommendationHeader}>
            <View style={styles.recommendationInfo}>
              <Ionicons 
                name={getRecommendationIcon(recommendation.type)} 
                size={18} 
                color={getRecommendationColor(recommendation.type)} 
              />
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
            </View>
            
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) }]}>
              <Ionicons 
                name={getPriorityIcon(recommendation.priority)} 
                size={12} 
                color="white" 
              />
              <Text style={styles.priorityText}>{recommendation.priority.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.recommendationDescription}>
            {recommendation.description}
          </Text>
          
          <View style={styles.recommendationDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="trending-up" size={14} color={COLORS.success[600]} />
              <Text style={styles.detailLabel}>Impact:</Text>
              <Text style={styles.detailValue}>{recommendation.impact}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary[600]} />
              <Text style={styles.detailLabel}>Action:</Text>
              <Text style={styles.detailValue}>{recommendation.action}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  recommendationItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  recommendationDescription: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[600],
    minWidth: 50,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[700],
    lineHeight: 16,
  },
});

export default RecommendationsCard;
