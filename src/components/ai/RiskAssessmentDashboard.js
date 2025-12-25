/**
 * 🧠 RISK ASSESSMENT DASHBOARD
 * 
 * Advanced AI-powered risk assessment dashboard showing:
 * - Predictive safety scoring and risk analysis
 * - Driver reliability analysis and trends
 * - Risk mitigation strategies and recommendations
 * - Safety incident analysis and patterns
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
import riskAssessmentService from '../../services/ai/riskAssessmentService';

const { width } = Dimensions.get('window');

const RiskAssessmentDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('safety');
  const [riskData, setRiskData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeRiskAssessment();
  }, []);

  const initializeRiskAssessment = async () => {
    try {
      setLoading(true);
      
      // Initialize the risk assessment service
      const initialized = await riskAssessmentService.initialize(user?.uid);
      
      if (initialized) {
        await loadRiskData();
      } else {
        Alert.alert('Risk Assessment Unavailable', 'Risk assessment is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize risk assessment:', error);
      Alert.alert('Error', 'Failed to load risk assessment data');
    } finally {
      setLoading(false);
    }
  };

  const loadRiskData = async () => {
    try {
      const dashboardData = await riskAssessmentService.getRiskAssessmentDashboard();
      setRiskData(dashboardData);
    } catch (error) {
      console.error('❌ Failed to load risk data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRiskData();
    setRefreshing(false);
  };

  const renderSafetyTab = () => {
    const { safetyScore } = riskData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.safetyScoreCard}>
          <LinearGradient
            colors={getSafetyScoreColors(safetyScore?.overallScore || 0)}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Ionicons name="shield" size={24} color="white" />
              <Text style={styles.scoreTitle}>Safety Score</Text>
            </View>
            <Text style={styles.scoreValue}>
              {safetyScore?.overallScore || 0}/100
            </Text>
            <Text style={styles.scoreLevel}>
              {safetyScore?.riskLevel || 'Unknown'}
            </Text>
            <Text style={styles.scoreConfidence}>
              Confidence: {Math.round((safetyScore?.confidence || 0) * 100)}%
            </Text>
          </LinearGradient>
        </View>

        {safetyScore?.safetyFactors && Object.entries(safetyScore.safetyFactors).map(([factor, data]) => (
          <View key={factor} style={styles.safetyFactorCard}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorTitle}>{factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
              <View style={[
                styles.factorScoreBadge,
                { backgroundColor: getFactorColor(data.score || 0) }
              ]}>
                <Text style={styles.factorScoreText}>{data.score || 0}</Text>
              </View>
            </View>
            
            <View style={styles.factorDetails}>
              {data.factors && data.factors.map((factor, index) => (
                <Text key={index} style={styles.factorDetailText}>• {factor}</Text>
              ))}
            </View>
            
            <View style={styles.factorTrend}>
              <Ionicons 
                name={data.trends === 'improving' ? 'trending-up' : data.trends === 'declining' ? 'trending-down' : 'remove'} 
                size={16} 
                color={data.trends === 'improving' ? '#4CAF50' : data.trends === 'declining' ? '#F44336' : '#666'} 
              />
              <Text style={styles.factorTrendText}>{data.trends || 'Stable'}</Text>
            </View>
          </View>
        ))}

        {safetyScore?.alerts && safetyScore.alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <Text style={styles.cardTitle}>Safety Alerts</Text>
            {safetyScore.alerts.map((alert, index) => (
              <View key={index} style={[
                styles.alertItem,
                { borderLeftColor: getAlertColor(alert.type) }
              ]}>
                <Ionicons 
                  name={getAlertIcon(alert.type)} 
                  size={16} 
                  color={getAlertColor(alert.type)} 
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {safetyScore?.recommendations && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Safety Recommendations</Text>
            {safetyScore.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderReliabilityTab = () => {
    const { reliability } = riskData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.reliabilityScoreCard}>
          <LinearGradient
            colors={getReliabilityColors(reliability?.overallReliability || 0)}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Ionicons name="star" size={24} color="white" />
              <Text style={styles.scoreTitle}>Reliability Score</Text>
            </View>
            <Text style={styles.scoreValue}>
              {reliability?.overallReliability || 0}/100
            </Text>
            <Text style={styles.scoreLevel}>
              {reliability?.reliabilityLevel || 'Unknown'}
            </Text>
            <Text style={styles.scoreConfidence}>
              Driver Performance Rating
            </Text>
          </LinearGradient>
        </View>

        {reliability?.reliabilityMetrics && Object.entries(reliability.reliabilityMetrics).map(([metric, value]) => (
          <View key={metric} style={styles.reliabilityMetricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
              <Text style={styles.metricValue}>
                {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
              </Text>
            </View>
            
            <View style={styles.metricBar}>
              <View style={[
                styles.metricBarFill, 
                { 
                  width: `${Math.min(100, (typeof value === 'number' ? value : 0.8) * 100)}%`,
                  backgroundColor: getMetricColor(value)
                }
              ]} />
            </View>
          </View>
        ))}

        {reliability?.strengths && reliability.strengths.length > 0 && (
          <View style={styles.strengthsCard}>
            <Text style={styles.cardTitle}>Reliability Strengths</Text>
            {reliability.strengths.map((strength, index) => (
              <View key={index} style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.strengthText}>{strength}</Text>
              </View>
            ))}
          </View>
        )}

        {reliability?.improvements && reliability.improvements.length > 0 && (
          <View style={styles.improvementsCard}>
            <Text style={styles.cardTitle}>Areas for Improvement</Text>
            {reliability.improvements.map((improvement, index) => (
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

  const renderMitigationTab = () => {
    const { mitigationStrategies } = riskData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.mitigationOverviewCard}>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="shield-checkmark" size={24} color="white" />
              <Text style={styles.overviewTitle}>Risk Mitigation</Text>
            </View>
            <Text style={styles.overviewScore}>
              {mitigationStrategies?.highImpactStrategies || 0} High-Impact
            </Text>
            <Text style={styles.overviewSubtext}>
              {mitigationStrategies?.totalStrategies || 0} total strategies
            </Text>
          </LinearGradient>
        </View>

        {mitigationStrategies?.strategies?.map((strategy, index) => (
          <View key={strategy.id} style={styles.strategyCard}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyTitle}>{strategy.title}</Text>
              <View style={[
                styles.strategyImpactBadge,
                { backgroundColor: getImpactColor(strategy.impact) }
              ]}>
                <Text style={styles.strategyImpactText}>{strategy.impact}</Text>
              </View>
            </View>
            
            <Text style={styles.strategyDescription}>{strategy.description}</Text>
            
            <View style={styles.strategyDetails}>
              <View style={styles.strategyDetail}>
                <Ionicons name="trending-down" size={16} color="#4CAF50" />
                <Text style={styles.strategyDetailText}>
                  {Math.round(strategy.riskReduction * 100)}% Risk Reduction
                </Text>
              </View>
              <View style={styles.strategyDetail}>
                <Ionicons name="time" size={16} color="#2196F3" />
                <Text style={styles.strategyDetailText}>{strategy.timeframe}</Text>
              </View>
              <View style={styles.strategyDetail}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
                <Text style={styles.strategyDetailText}>
                  {Math.round(strategy.successProbability * 100)}% Success Rate
                </Text>
              </View>
            </View>

            <View style={styles.strategyRequirements}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              {strategy.requirements?.map((req, reqIndex) => (
                <Text key={reqIndex} style={styles.requirementText}>• {req}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderIncidentsTab = () => {
    const { incidentAnalysis } = riskData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.incidentsOverviewCard}>
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="warning" size={24} color="white" />
              <Text style={styles.overviewTitle}>Incident Analysis</Text>
            </View>
            <Text style={styles.overviewScore}>
              {incidentAnalysis?.analysis?.totalIncidents || 0} Incidents
            </Text>
            <Text style={styles.overviewSubtext}>
              Last 30 days analysis
            </Text>
          </LinearGradient>
        </View>

        {incidentAnalysis?.analysis?.severityBreakdown && (
          <View style={styles.severityCard}>
            <Text style={styles.cardTitle}>Severity Breakdown</Text>
            <View style={styles.severityBreakdown}>
              <View style={styles.severityItem}>
                <View style={[styles.severityIndicator, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.severityLabel}>Low: {incidentAnalysis.analysis.severityBreakdown.low}</Text>
              </View>
              <View style={styles.severityItem}>
                <View style={[styles.severityIndicator, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.severityLabel}>Medium: {incidentAnalysis.analysis.severityBreakdown.medium}</Text>
              </View>
              <View style={styles.severityItem}>
                <View style={[styles.severityIndicator, { backgroundColor: '#F44336' }]} />
                <Text style={styles.severityLabel}>High: {incidentAnalysis.analysis.severityBreakdown.high}</Text>
              </View>
            </View>
          </View>
        )}

        {incidentAnalysis?.analysis?.commonCauses && incidentAnalysis.analysis.commonCauses.length > 0 && (
          <View style={styles.causesCard}>
            <Text style={styles.cardTitle}>Common Causes</Text>
            {incidentAnalysis.analysis.commonCauses.map((cause, index) => (
              <View key={index} style={styles.causeItem}>
                <Ionicons name="alert-circle" size={16} color="#F44336" />
                <Text style={styles.causeText}>
                  {cause.cause} ({cause.count} incidents)
                </Text>
              </View>
            ))}
          </View>
        )}

        {incidentAnalysis?.analysis?.improvementAreas && incidentAnalysis.analysis.improvementAreas.length > 0 && (
          <View style={styles.improvementsCard}>
            <Text style={styles.cardTitle}>Improvement Areas</Text>
            {incidentAnalysis.analysis.improvementAreas.map((area, index) => (
              <View key={index} style={styles.improvementItem}>
                <Ionicons name="arrow-up" size={16} color="#FF9800" />
                <Text style={styles.improvementText}>{area}</Text>
              </View>
            ))}
          </View>
        )}

        {incidentAnalysis?.incidents && incidentAnalysis.incidents.length > 0 && (
          <View style={styles.incidentsCard}>
            <Text style={styles.cardTitle}>Recent Incidents</Text>
            {incidentAnalysis.incidents.map((incident, index) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <Text style={styles.incidentType}>{incident.type}</Text>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(incident.severity) }
                  ]}>
                    <Text style={styles.severityText}>{incident.severity}</Text>
                  </View>
                </View>
                <Text style={styles.incidentDescription}>{incident.description}</Text>
                <Text style={styles.incidentDate}>{incident.date}</Text>
                <Text style={styles.incidentCause}>Cause: {incident.cause}</Text>
                {incident.lessons && (
                  <Text style={styles.incidentLessons}>Lesson: {incident.lessons}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'safety':
        return renderSafetyTab();
      case 'reliability':
        return renderReliabilityTab();
      case 'mitigation':
        return renderMitigationTab();
      case 'incidents':
        return renderIncidentsTab();
      default:
        return renderSafetyTab();
    }
  };

  // Helper functions
  const getSafetyScoreColors = (score) => {
    if (score >= 90) return ['#4CAF50', '#45a049'];
    if (score >= 75) return ['#FF9800', '#F57C00'];
    if (score >= 60) return ['#FF5722', '#E64A19'];
    return ['#F44336', '#D32F2F'];
  };

  const getReliabilityColors = (score) => {
    if (score >= 90) return ['#4CAF50', '#45a049'];
    if (score >= 80) return ['#2196F3', '#1976D2'];
    if (score >= 70) return ['#FF9800', '#F57C00'];
    return ['#F44336', '#D32F2F'];
  };

  const getFactorColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    if (score >= 60) return '#FF5722';
    return '#F44336';
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const getMetricColor = (value) => {
    if (typeof value === 'number') {
      if (value >= 0.9) return '#4CAF50';
      if (value >= 0.8) return '#2196F3';
      if (value >= 0.7) return '#FF9800';
      return '#F44336';
    }
    return '#2196F3';
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Low': return '#2196F3';
      default: return '#666';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F44336" />
        <Text style={styles.loadingText}>Loading Risk Assessment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield" size={24} color="#F44336" />
          <Text style={styles.headerTitle}>Risk Assessment</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'safety', label: 'Safety', icon: 'shield' },
            { id: 'reliability', label: 'Reliability', icon: 'star' },
            { id: 'mitigation', label: 'Mitigation', icon: 'shield-checkmark' },
            { id: 'incidents', label: 'Incidents', icon: 'warning' }
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
                color={activeTab === tab.id ? '#F44336' : '#666'} 
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
    backgroundColor: '#FFEBEE',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#F44336',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  // Safety Score Card
  safetyScoreCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reliabilityScoreCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  scoreLevel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  scoreConfidence: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Safety Factor Cards
  safetyFactorCard: {
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
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  factorScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  factorScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  factorDetails: {
    marginBottom: 8,
  },
  factorDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  factorTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorTrendText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  // Alerts Card
  alertsCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Recommendations Card
  recommendationsCard: {
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
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Reliability Metrics
  reliabilityMetricCard: {
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
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  metricBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Strengths and Improvements
  strengthsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  improvementsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  // Mitigation Overview
  mitigationOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  incidentsOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  overviewScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Strategy Cards
  strategyCard: {
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
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  strategyImpactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  strategyImpactText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  strategyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  strategyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  strategyRequirements: {
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  // Severity Card
  severityCard: {
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
  severityBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityLabel: {
    fontSize: 12,
    color: '#333',
  },
  // Causes Card
  causesCard: {
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
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  causeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Incidents Card
  incidentsCard: {
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
  incidentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  incidentDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  incidentDate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  incidentCause: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  incidentLessons: {
    fontSize: 10,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
});

export default RiskAssessmentDashboard;
