/**
 * 🧠 MARKET INTELLIGENCE DASHBOARD
 * 
 * Advanced AI-powered market intelligence dashboard showing:
 * - Real-time competitor analysis
 * - Market opportunity detection
 * - Trend analysis and predictions
 * - Strategic growth recommendations
 * - Market positioning insights
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
import marketIntelligenceService from '../../services/ai/marketIntelligenceService';

const { width } = Dimensions.get('window');

const MarketIntelligenceDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('competitors');
  const [marketData, setMarketData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeMarketIntelligence();
  }, []);

  const initializeMarketIntelligence = async () => {
    try {
      setLoading(true);
      
      // Initialize the market intelligence service
      const initialized = await marketIntelligenceService.initialize(user?.uid);
      
      if (initialized) {
        await loadMarketData();
      } else {
        Alert.alert('Market Intelligence Unavailable', 'Market intelligence is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize market intelligence:', error);
      Alert.alert('Error', 'Failed to load market intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketData = async () => {
    try {
      const location = { lat: 40.7128, lng: -74.0060 }; // Default NYC location
      const dashboardData = await marketIntelligenceService.getMarketIntelligenceDashboard(location, '24h');
      setMarketData(dashboardData);
    } catch (error) {
      console.error('❌ Failed to load market data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  const renderCompetitorsTab = () => {
    const { competitorAnalysis } = marketData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.marketOverviewCard}>
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="analytics" size={24} color="white" />
              <Text style={styles.overviewTitle}>Market Overview</Text>
            </View>
            <Text style={styles.overviewScore}>
              {Math.round((competitorAnalysis?.marketSaturation || 0) * 100)}% Saturated
            </Text>
            <Text style={styles.overviewSubtext}>
              {competitorAnalysis?.totalCompetitors || 0} competitors active
            </Text>
          </LinearGradient>
        </View>

        {competitorAnalysis?.marketLeader && (
          <View style={styles.marketLeaderCard}>
            <Text style={styles.cardTitle}>Market Leader</Text>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{competitorAnalysis.marketLeader.name}</Text>
              <View style={styles.leaderStats}>
                <View style={styles.leaderStat}>
                  <Text style={styles.leaderStatValue}>
                    {Math.round(competitorAnalysis.marketLeader.marketShare * 100)}%
                  </Text>
                  <Text style={styles.leaderStatLabel}>Market Share</Text>
                </View>
                <View style={styles.leaderStat}>
                  <Text style={styles.leaderStatValue}>
                    ${competitorAnalysis.marketLeader.avgPrice?.toFixed(2)}
                  </Text>
                  <Text style={styles.leaderStatLabel}>Avg Price</Text>
                </View>
                <View style={styles.leaderStat}>
                  <Text style={styles.leaderStatValue}>
                    {competitorAnalysis.marketLeader.rating?.toFixed(1)}
                  </Text>
                  <Text style={styles.leaderStatLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.competitiveIntensityCard}>
          <Text style={styles.cardTitle}>Competitive Intensity</Text>
          <View style={styles.intensityBar}>
            <View style={[
              styles.intensityBarFill, 
              { width: `${(competitorAnalysis?.competitiveIntensity || 0) * 100}%` }
            ]} />
          </View>
          <Text style={styles.intensityText}>
            {competitorAnalysis?.competitiveIntensity > 0.5 ? 'High' : 'Medium'} Competition
          </Text>
        </View>

        {competitorAnalysis?.opportunities && competitorAnalysis.opportunities.length > 0 && (
          <View style={styles.opportunitiesCard}>
            <Text style={styles.cardTitle}>Competitive Opportunities</Text>
            {competitorAnalysis.opportunities.map((opp, index) => (
              <View key={index} style={styles.opportunityItem}>
                <Ionicons name="trending-up" size={16} color="#4CAF50" />
                <Text style={styles.opportunityText}>
                  {opp.competitor}: {opp.opportunity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {competitorAnalysis?.threats && competitorAnalysis.threats.length > 0 && (
          <View style={styles.threatsCard}>
            <Text style={styles.cardTitle}>Competitive Threats</Text>
            {competitorAnalysis.threats.map((threat, index) => (
              <View key={index} style={styles.threatItem}>
                <Ionicons name="warning" size={16} color="#F44336" />
                <Text style={styles.threatText}>
                  {threat.competitor}: {threat.threat}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderOpportunitiesTab = () => {
    const { opportunities } = marketData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.opportunitiesOverviewCard}>
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="target" size={24} color="white" />
              <Text style={styles.overviewTitle}>Market Opportunities</Text>
            </View>
            <Text style={styles.overviewScore}>
              {opportunities?.highValueOpportunities || 0} High-Value
            </Text>
            <Text style={styles.overviewSubtext}>
              {opportunities?.totalOpportunities || 0} total opportunities
            </Text>
          </LinearGradient>
        </View>

        {opportunities?.opportunities?.map((opportunity, index) => (
          <View key={opportunity.id} style={styles.opportunityCard}>
            <View style={styles.opportunityHeader}>
              <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
              <View style={[
                styles.opportunityScoreBadge,
                { backgroundColor: getOpportunityColor(opportunity.opportunityScore) }
              ]}>
                <Text style={styles.opportunityScoreText}>
                  {Math.round(opportunity.opportunityScore * 100)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.opportunityDescription}>{opportunity.description}</Text>
            
            <View style={styles.opportunityDetails}>
              <View style={styles.opportunityDetail}>
                <Ionicons name="cash" size={16} color="#4CAF50" />
                <Text style={styles.opportunityDetailText}>
                  ${opportunity.potentialEarnings}
                </Text>
              </View>
              <View style={styles.opportunityDetail}>
                <Ionicons name="time" size={16} color="#2196F3" />
                <Text style={styles.opportunityDetailText}>
                  {opportunity.timeToMarket}
                </Text>
              </View>
              <View style={styles.opportunityDetail}>
                <Ionicons name="shield" size={16} color="#FF9800" />
                <Text style={styles.opportunityDetailText}>
                  {opportunity.riskLevel} Risk
                </Text>
              </View>
            </View>

            <View style={styles.opportunityRequirements}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              {opportunity.requirements?.map((req, reqIndex) => (
                <Text key={reqIndex} style={styles.requirementText}>• {req}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendsTab = () => {
    const { trends } = marketData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.trendsOverviewCard}>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.overviewTitle}>Market Trends</Text>
            </View>
            <Text style={styles.overviewScore}>7-Day Analysis</Text>
            <Text style={styles.overviewSubtext}>Real-time trend monitoring</Text>
          </LinearGradient>
        </View>

        {trends?.demandTrends && (
          <View style={styles.trendsCard}>
            <Text style={styles.cardTitle}>Demand Trends</Text>
            {trends.demandTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendPeriod}>{trend.period}</Text>
                  <View style={styles.trendIndicator}>
                    <Ionicons 
                      name={trend.trend === 'increasing' ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={trend.trend === 'increasing' ? '#4CAF50' : '#F44336'} 
                    />
                    <Text style={styles.trendText}>{trend.trend}</Text>
                  </View>
                </View>
                <View style={styles.trendBar}>
                  <View style={[
                    styles.trendBarFill, 
                    { 
                      width: `${Math.abs(trend.change) * 100}%`,
                      backgroundColor: trend.trend === 'increasing' ? '#4CAF50' : '#F44336'
                    }
                  ]} />
                </View>
                <Text style={styles.trendConfidence}>
                  Confidence: {Math.round(trend.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {trends?.priceTrends && (
          <View style={styles.trendsCard}>
            <Text style={styles.cardTitle}>Price Trends</Text>
            {trends.priceTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendPeriod}>{trend.period}</Text>
                  <View style={styles.trendIndicator}>
                    <Ionicons 
                      name={trend.trend === 'increasing' ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={trend.trend === 'increasing' ? '#4CAF50' : '#F44336'} 
                    />
                    <Text style={styles.trendText}>{trend.trend}</Text>
                  </View>
                </View>
                <View style={styles.trendBar}>
                  <View style={[
                    styles.trendBarFill, 
                    { 
                      width: `${Math.abs(trend.change) * 100}%`,
                      backgroundColor: trend.trend === 'increasing' ? '#4CAF50' : '#F44336'
                    }
                  ]} />
                </View>
                <Text style={styles.trendConfidence}>
                  Confidence: {Math.round(trend.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {trends?.marketTrends && (
          <View style={styles.trendsCard}>
            <Text style={styles.cardTitle}>Market Trends</Text>
            {trends.marketTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendPeriod}>{trend.metric}</Text>
                  <View style={styles.trendIndicator}>
                    <Ionicons 
                      name={trend.trend === 'increasing' ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={trend.trend === 'increasing' ? '#4CAF50' : '#F44336'} 
                    />
                    <Text style={styles.trendText}>{trend.trend}</Text>
                  </View>
                </View>
                <View style={styles.trendBar}>
                  <View style={[
                    styles.trendBarFill, 
                    { 
                      width: `${Math.abs(trend.change) * 100}%`,
                      backgroundColor: trend.trend === 'increasing' ? '#4CAF50' : '#F44336'
                    }
                  ]} />
                </View>
                <Text style={styles.trendConfidence}>
                  Confidence: {Math.round(trend.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGrowthTab = () => {
    const { positioning, advantages } = marketData;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.growthOverviewCard}>
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="rocket" size={24} color="white" />
              <Text style={styles.overviewTitle}>Growth Strategy</Text>
            </View>
            <Text style={styles.overviewScore}>
              {positioning?.marketPosition || 'Unknown'}
            </Text>
            <Text style={styles.overviewSubtext}>
              {Math.round((positioning?.marketShare || 0) * 100)}% market share
            </Text>
          </LinearGradient>
        </View>

        {positioning?.competitiveAdvantages && positioning.competitiveAdvantages.length > 0 && (
          <View style={styles.advantagesCard}>
            <Text style={styles.cardTitle}>Competitive Advantages</Text>
            {positioning.competitiveAdvantages.map((advantage, index) => (
              <View key={index} style={styles.advantageItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.advantageText}>{advantage}</Text>
              </View>
            ))}
          </View>
        )}

        {positioning?.targetSegments && positioning.targetSegments.length > 0 && (
          <View style={styles.segmentsCard}>
            <Text style={styles.cardTitle}>Target Segments</Text>
            {positioning.targetSegments.map((segment, index) => (
              <View key={index} style={styles.segmentItem}>
                <Ionicons name="people" size={16} color="#2196F3" />
                <Text style={styles.segmentText}>{segment}</Text>
              </View>
            ))}
          </View>
        )}

        {positioning?.differentiationFactors && positioning.differentiationFactors.length > 0 && (
          <View style={styles.differentiationCard}>
            <Text style={styles.cardTitle}>Differentiation Factors</Text>
            {positioning.differentiationFactors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <Ionicons name="star" size={16} color="#FF9800" />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}

        {advantages?.advantages && advantages.advantages.length > 0 && (
          <View style={styles.advantagesCard}>
            <Text style={styles.cardTitle}>Strategic Advantages</Text>
            {advantages.advantages.map((advantage, index) => (
              <View key={index} style={styles.advantageCard}>
                <View style={styles.advantageHeader}>
                  <Text style={styles.advantageTitle}>{advantage.title}</Text>
                  <View style={[
                    styles.advantageScoreBadge,
                    { backgroundColor: getAdvantageColor(advantage.advantageScore) }
                  ]}>
                    <Text style={styles.advantageScoreText}>
                      {Math.round(advantage.advantageScore * 100)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.advantageDescription}>{advantage.description}</Text>
                <View style={styles.advantageDetails}>
                  <View style={styles.advantageDetail}>
                    <Text style={styles.advantageDetailLabel}>Impact:</Text>
                    <Text style={styles.advantageDetailValue}>{advantage.impact}</Text>
                  </View>
                  <View style={styles.advantageDetail}>
                    <Text style={styles.advantageDetailLabel}>Sustainability:</Text>
                    <Text style={styles.advantageDetailValue}>{advantage.sustainability}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'competitors':
        return renderCompetitorsTab();
      case 'opportunities':
        return renderOpportunitiesTab();
      case 'trends':
        return renderTrendsTab();
      case 'growth':
        return renderGrowthTab();
      default:
        return renderCompetitorsTab();
    }
  };

  // Helper functions
  const getOpportunityColor = (score) => {
    if (score > 0.8) return '#4CAF50';
    if (score > 0.6) return '#FF9800';
    return '#F44336';
  };

  const getAdvantageColor = (score) => {
    if (score > 0.8) return '#4CAF50';
    if (score > 0.6) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Market Intelligence...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color="#2196F3" />
          <Text style={styles.headerTitle}>Market Intelligence</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'competitors', label: 'Competitors', icon: 'business' },
            { id: 'opportunities', label: 'Opportunities', icon: 'target' },
            { id: 'trends', label: 'Trends', icon: 'trending-up' },
            { id: 'growth', label: 'Growth', icon: 'rocket' }
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
                color={activeTab === tab.id ? '#2196F3' : '#666'} 
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
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  // Overview Cards
  marketOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  opportunitiesOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendsOverviewCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  growthOverviewCard: {
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
  // Market Leader Card
  marketLeaderCard: {
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
  leaderInfo: {
    marginBottom: 12,
  },
  leaderName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  leaderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaderStat: {
    alignItems: 'center',
  },
  leaderStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Competitive Intensity
  competitiveIntensityCard: {
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
  intensityBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  intensityBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  intensityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Opportunities
  opportunitiesCard: {
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
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  opportunityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Threats
  threatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  threatText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Opportunity Cards
  opportunityCard: {
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
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  opportunityScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  opportunityScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  opportunityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  opportunityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opportunityDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  opportunityRequirements: {
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
  // Trends
  trendsCard: {
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
  trendItem: {
    marginBottom: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendPeriod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  trendBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendConfidence: {
    fontSize: 12,
    color: '#666',
  },
  // Growth
  advantagesCard: {
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
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  advantageText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Segments
  segmentsCard: {
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
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  segmentText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Differentiation
  differentiationCard: {
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
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  factorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Advantage Cards
  advantageCard: {
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
  advantageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  advantageScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  advantageScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  advantageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  advantageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  advantageDetail: {
    alignItems: 'center',
  },
  advantageDetailLabel: {
    fontSize: 12,
    color: '#666',
  },
  advantageDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MarketIntelligenceDashboard;
