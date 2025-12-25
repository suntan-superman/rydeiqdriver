import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const InsightsCard = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'earnings':
        return 'cash';
      case 'bidding':
        return 'trending-up';
      case 'reliability':
        return 'shield-checkmark';
      default:
        return 'bulb';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'earnings':
        return COLORS.success[600];
      case 'bidding':
        return COLORS.primary[600];
      case 'reliability':
        return COLORS.warning[600];
      default:
        return COLORS.info[600];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={20} color={COLORS.warning[600]} />
        <Text style={styles.title}>Key Insights</Text>
      </View>
      
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightItem}>
          <View style={styles.insightHeader}>
            <Ionicons 
              name={getInsightIcon(insight.type)} 
              size={18} 
              color={getInsightColor(insight.type)} 
            />
            <Text style={styles.insightTitle}>{insight.title}</Text>
          </View>
          
          <Text style={styles.insightMessage}>{insight.message}</Text>
          
          {insight.value && (
            <View style={styles.insightValue}>
              <Text style={[styles.insightValueText, { color: getInsightColor(insight.type) }]}>
                {insight.value}
              </Text>
            </View>
          )}
          
          {insight.recommendation && (
            <View style={styles.insightRecommendation}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.gray[500]} />
              <Text style={styles.insightRecommendationText}>
                {insight.recommendation}
              </Text>
            </View>
          )}
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
  insightItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  insightMessage: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  insightValue: {
    marginBottom: 8,
  },
  insightValueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  insightRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  insightRecommendationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray[600],
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default InsightsCard;
