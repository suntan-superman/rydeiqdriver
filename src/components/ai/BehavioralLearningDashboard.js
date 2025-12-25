/**
 * 🧠 BEHAVIORAL LEARNING DASHBOARD
 * 
 * Advanced AI-powered behavioral learning dashboard showing:
 * - Driver behavior patterns and insights
 * - Learning progress and personalization
 * - Adaptive recommendations
 * - Success predictions
 * - Personalized UI preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import behavioralLearningService from '../../services/ai/behavioralLearningService';

const { width } = Dimensions.get('window');

const BehavioralLearningDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [learningData, setLearningData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeLearning();
  }, []);

  const initializeLearning = async () => {
    try {
      setLoading(true);
      
      // Initialize the behavioral learning service
      const initialized = await behavioralLearningService.initialize(user?.uid);
      
      if (initialized) {
        await loadLearningData();
      } else {
        Alert.alert('AI Learning Unavailable', 'Behavioral learning is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize learning:', error);
      Alert.alert('Error', 'Failed to load behavioral learning data');
    } finally {
      setLoading(false);
    }
  };

  const loadLearningData = async () => {
    try {
      const [insights, uiPreferences, adaptiveRecommendations] = await Promise.all([
        behavioralLearningService.getBehavioralInsights('30d'),
        behavioralLearningService.getPersonalizedUIPreferences(),
        behavioralLearningService.getAdaptiveRecommendations()
      ]);

      setLearningData({
        insights,
        uiPreferences,
        adaptiveRecommendations
      });
    } catch (error) {
      console.error('❌ Failed to load learning data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLearningData();
    setRefreshing(false);
  };

  const handleLearnFromAction = async (action, outcome, context) => {
    try {
      const result = await behavioralLearningService.learnFromAction(action, outcome, context);
      
      if (result.success) {
        Alert.alert('Learning Updated', `AI learned from your ${action} action`);
        await loadLearningData(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Failed to learn from action:', error);
    }
  };

  const renderInsightsTab = () => {
    const { insights } = learningData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.learningProgressCard}>
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Ionicons name="bulb" size={24} color="white" />
              <Text style={styles.progressTitle}>AI Learning Progress</Text>
            </View>
            <Text style={styles.progressScore}>
              {Math.round(insights?.confidence || 0) * 100}% Learned
            </Text>
            <Text style={styles.progressSubtext}>
              {insights?.patterns ? Object.keys(insights.patterns).length : 0} patterns identified
            </Text>
          </LinearGradient>
        </View>

        {insights?.patterns && Object.entries(insights.patterns).map(([patternType, pattern]) => (
          <View key={patternType} style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternTitle}>{patternType.replace(/_/g, ' ').toUpperCase()}</Text>
              <View style={styles.successRateBadge}>
                <Text style={styles.successRateText}>
                  {Math.round(pattern.successRate * 100)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.patternStats}>
              <View style={styles.patternStat}>
                <Text style={styles.patternStatValue}>{pattern.totalActions}</Text>
                <Text style={styles.patternStatLabel}>Total Actions</Text>
              </View>
              <View style={styles.patternStat}>
                <Text style={styles.patternStatValue}>{Math.round(pattern.successRate * 100)}%</Text>
                <Text style={styles.patternStatLabel}>Success Rate</Text>
              </View>
            </View>

            {pattern.patterns && pattern.patterns.map((p, index) => (
              <View key={index} style={styles.patternDetail}>
                <Text style={styles.patternDetailTitle}>{p.type} Pattern</Text>
                <Text style={styles.patternDetailDescription}>
                  Confidence: {Math.round(p.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        ))}

        {insights?.trends && Object.entries(insights.trends).map(([trendType, trend]) => (
          <View key={trendType} style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Ionicons 
                name={trend.direction === 'improving' ? 'trending-up' : 'trending-down'} 
                size={20} 
                color={trend.direction === 'improving' ? '#4CAF50' : '#F44336'} 
              />
              <Text style={styles.trendTitle}>{trendType} Trend</Text>
            </View>
            <Text style={styles.trendDescription}>
              {trend.direction === 'improving' ? 'Improving' : 'Declining'} performance
            </Text>
            <Text style={styles.trendConfidence}>
              Confidence: {Math.round(trend.confidence * 100)}%
            </Text>
          </View>
        ))}

        {insights?.strengths && insights.strengths.length > 0 && (
          <View style={styles.strengthsCard}>
            <Text style={styles.cardTitle}>Your Strengths</Text>
            {insights.strengths.map((strength, index) => (
              <View key={index} style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.strengthText}>{strength}</Text>
              </View>
            ))}
          </View>
        )}

        {insights?.improvements && insights.improvements.length > 0 && (
          <View style={styles.improvementsCard}>
            <Text style={styles.cardTitle}>Areas for Improvement</Text>
            {insights.improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <Ionicons name="arrow-up" size={16} color="#FF9800" />
                <Text style={styles.improvementText}>{improvement}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLearningTab = () => {
    const { adaptiveRecommendations } = learningData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.learningStatusCard}>
          <View style={styles.learningStatusHeader}>
            <Ionicons name="school" size={24} color="#2196F3" />
            <Text style={styles.learningStatusTitle}>Learning Status</Text>
          </View>
          
          <View style={styles.learningMetrics}>
            <View style={styles.learningMetric}>
              <Text style={styles.learningMetricValue}>
                {adaptiveRecommendations?.personalizationLevel || 0}%
              </Text>
              <Text style={styles.learningMetricLabel}>Personalization</Text>
            </View>
            <View style={styles.learningMetric}>
              <Text style={styles.learningMetricValue}>
                {adaptiveRecommendations?.adaptationScore || 0}%
              </Text>
              <Text style={styles.learningMetricLabel}>Adaptation</Text>
            </View>
            <View style={styles.learningMetric}>
              <Text style={styles.learningMetricValue}>
                {adaptiveRecommendations?.learningProgress?.totalActions || 0}
              </Text>
              <Text style={styles.learningMetricLabel}>Actions</Text>
            </View>
          </View>
        </View>

        {adaptiveRecommendations?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.adaptiveRecommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <View style={[
                styles.personalizationBadge,
                { backgroundColor: getPersonalizationColor(rec.personalizationLevel) }
              ]}>
                <Text style={styles.personalizationText}>{rec.personalizationLevel}</Text>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
            
            <View style={styles.recommendationActions}>
              <TouchableOpacity 
                style={styles.learnButton}
                onPress={() => handleLearnFromAction(rec.type, 'positive', { recommendation: rec.title })}
              >
                <Ionicons name="thumbs-up" size={16} color="white" />
                <Text style={styles.learnButtonText}>Good</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.learnButton}
                onPress={() => handleLearnFromAction(rec.type, 'negative', { recommendation: rec.title })}
              >
                <Ionicons name="thumbs-down" size={16} color="white" />
                <Text style={styles.learnButtonText}>Not Good</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {adaptiveRecommendations?.nextLearningGoals && (
          <View style={styles.goalsCard}>
            <Text style={styles.cardTitle}>Next Learning Goals</Text>
            {adaptiveRecommendations.nextLearningGoals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <Ionicons name="target" size={16} color="#2196F3" />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPredictionsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.predictionsHeader}>
          <Ionicons name="crystal-ball" size={24} color="#FF9800" />
          <Text style={styles.predictionsTitle}>Success Predictions</Text>
        </View>

        <View style={styles.predictionDemoCard}>
          <Text style={styles.predictionTitle}>Route Recommendation</Text>
          <Text style={styles.predictionDescription}>
            AI predicts 85% success rate for this route based on your past behavior
          </Text>
          
          <View style={styles.predictionFactors}>
            <View style={styles.predictionFactor}>
              <Ionicons name="time" size={16} color="#4CAF50" />
              <Text style={styles.predictionFactorText}>Time preference match</Text>
            </View>
            <View style={styles.predictionFactor}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.predictionFactorText}>Location preference</Text>
            </View>
            <View style={styles.predictionFactor}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.predictionFactorText}>Earnings goal alignment</Text>
            </View>
          </View>

          <View style={styles.predictionConfidence}>
            <Text style={styles.confidenceLabel}>Confidence: 88%</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceBarFill, { width: '88%' }]} />
            </View>
          </View>
        </View>

        <View style={styles.predictionInsightsCard}>
          <Text style={styles.cardTitle}>Prediction Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="analytics" size={16} color="#2196F3" />
            <Text style={styles.insightText}>Based on 47 similar past actions</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>Your success rate with this type: 89%</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="time" size={16} color="#FF9800" />
            <Text style={styles.insightText}>Optimal time for you: Morning</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPersonalizationTab = () => {
    const { uiPreferences } = learningData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.personalizationCard}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.personalizationGradient}
          >
            <View style={styles.personalizationHeader}>
              <Ionicons name="person" size={24} color="white" />
              <Text style={styles.personalizationTitle}>Personalization</Text>
            </View>
            <Text style={styles.personalizationScore}>
              {uiPreferences?.personalizationScore || 0}%
            </Text>
            <Text style={styles.adaptationLevel}>
              {uiPreferences?.adaptationLevel || 'Beginner'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.preferencesCard}>
          <Text style={styles.cardTitle}>UI Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Layout</Text>
            <Text style={styles.preferenceValue}>{uiPreferences?.layout || 'Standard'}</Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Color Scheme</Text>
            <Text style={styles.preferenceValue}>{uiPreferences?.colors || 'Default'}</Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Notifications</Text>
            <Text style={styles.preferenceValue}>{uiPreferences?.notifications || 'Medium'}</Text>
          </View>
          
          {uiPreferences?.features && (
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Preferred Features</Text>
              {uiPreferences.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.learningInsightsCard}>
          <Text style={styles.cardTitle}>Learning Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color="#9C27B0" />
            <Text style={styles.insightText}>AI has learned your driving patterns</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>Recommendations are becoming more accurate</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="star" size={16} color="#FF9800" />
            <Text style={styles.insightText}>Personalization level is increasing</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'insights':
        return renderInsightsTab();
      case 'learning':
        return renderLearningTab();
      case 'predictions':
        return renderPredictionsTab();
      case 'personalization':
        return renderPersonalizationTab();
      default:
        return renderInsightsTab();
    }
  };

  // Helper functions
  const getPersonalizationColor = (level) => {
    if (level === 'High') return '#4CAF50';
    if (level === 'Medium') return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Loading AI Learning...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={24} color="#9C27B0" />
          <Text style={styles.headerTitle}>AI Learning</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'insights', label: 'Insights', icon: 'analytics' },
            { id: 'learning', label: 'Learning', icon: 'school' },
            { id: 'predictions', label: 'Predictions', icon: 'crystal-ball' },
            { id: 'personalization', label: 'Personal', icon: 'person' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.id ? '#9C27B0' : '#666'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#F3E5F5',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#9C27B0',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  // Learning Progress Card
  learningProgressCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  progressScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Pattern Cards
  patternCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  successRateBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successRateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patternStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  patternStat: {
    alignItems: 'center',
  },
  patternStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patternStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  patternDetail: {
    marginBottom: 8,
  },
  patternDetailTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  patternDetailDescription: {
    fontSize: 12,
    color: '#666',
  },
  // Trend Cards
  trendCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  trendDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trendConfidence: {
    fontSize: 12,
    color: '#999',
  },
  // Strengths and Improvements
  strengthsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  improvementsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  strengthText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  improvementText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Learning Status
  learningStatusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  learningStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  learningStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  learningMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  learningMetric: {
    alignItems: 'center',
  },
  learningMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  learningMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Adaptive Recommendations
  adaptiveRecommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  personalizationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  personalizationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  recommendationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  learnButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  learnButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Goals
  goalsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  goalText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Predictions
  predictionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  predictionDemoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  predictionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  predictionFactors: {
    marginBottom: 12,
  },
  predictionFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  predictionFactorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
  },
  predictionConfidence: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  predictionInsightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  insightText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Personalization
  personalizationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  personalizationGradient: {
    padding: 20,
  },
  personalizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personalizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  personalizationScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  adaptationLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  preferencesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
  },
  featuresSection: {
    marginTop: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  learningInsightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
});

export default BehavioralLearningDashboard;
