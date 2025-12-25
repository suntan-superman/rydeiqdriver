import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import vehicleManagementService from '../../services/vehicleManagementService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VehicleManagementDashboard = ({ driverId, onClose, visible = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [fuelData, setFuelData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [insuranceData, setInsuranceData] = useState(null);
  const [marketplaceData, setMarketplaceData] = useState(null);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'car' },
    { id: 'health', title: 'Health', icon: 'heart' },
    { id: 'maintenance', title: 'Maintenance', icon: 'construct' },
    { id: 'fuel', title: 'Fuel', icon: 'flash' },
    { id: 'expenses', title: 'Expenses', icon: 'wallet' },
    { id: 'insurance', title: 'Insurance', icon: 'shield' },
    { id: 'marketplace', title: 'Marketplace', icon: 'storefront' },
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadVehicleData();
    }
  }, [visible, driverId]);

  const loadVehicleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all vehicle data in parallel
      const [health, maintenance, fuel, expenses, insurance, marketplace] = await Promise.all([
        vehicleManagementService.getVehicleHealth(driverId),
        vehicleManagementService.getMaintenanceSchedule(driverId),
        vehicleManagementService.getFuelEfficiencyAnalytics(driverId),
        vehicleManagementService.getExpenseAnalytics(driverId),
        vehicleManagementService.getInsuranceInfo(driverId),
        vehicleManagementService.getMarketplaceListings()
      ]);

      setHealthData(health);
      setMaintenanceData(maintenance);
      setFuelData(fuel);
      setExpenseData(expenses);
      setInsuranceData(insurance);
      setMarketplaceData(marketplace);

    } catch (error) {
      console.error('Error loading vehicle data:', error);
      setError('Failed to load vehicle data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVehicleData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Vehicle Health Score */}
      <View style={styles.healthScoreCard}>
        <Text style={styles.cardTitle}>Vehicle Health Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{healthData?.overallScore || 0}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={styles.healthBreakdown}>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Engine</Text>
            <Text style={styles.healthValue}>{healthData?.engine?.score || 0}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Brakes</Text>
            <Text style={styles.healthValue}>{healthData?.brakes?.score || 0}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Tires</Text>
            <Text style={styles.healthValue}>{healthData?.tires?.score || 0}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Battery</Text>
            <Text style={styles.healthValue}>{healthData?.battery?.score || 0}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="flash" size={24} color={COLORS.primary[600]} />
          <Text style={styles.statValue}>{fuelData?.currentMPG || 0} MPG</Text>
          <Text style={styles.statLabel}>Fuel Efficiency</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="construct" size={24} color={COLORS.warning[600]} />
          <Text style={styles.statValue}>{maintenanceData?.upcoming?.length || 0}</Text>
          <Text style={styles.statLabel}>Upcoming Services</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={COLORS.success[600]} />
          <Text style={styles.statValue}>${expenseData?.monthlyAverage || 0}</Text>
          <Text style={styles.statLabel}>Monthly Costs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.info[600]} />
          <Text style={styles.statValue}>{fuelData?.efficiencyTrend || 'stable'}</Text>
          <Text style={styles.statLabel}>Efficiency Trend</Text>
        </View>
      </View>

      {/* Alerts */}
      {healthData?.alerts && healthData.alerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.cardTitle}>Vehicle Alerts</Text>
          <View style={styles.alertsList}>
            {healthData.alerts.map((alert, index) => (
              <View key={alert.id || index} style={styles.alertItem}>
                <Ionicons 
                  name={alert.type === 'warning' ? 'warning' : 'information-circle'} 
                  size={20} 
                  color={alert.type === 'warning' ? COLORS.warning[600] : COLORS.info[600]} 
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderHealthTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Vehicle Health Monitoring</Text>
      
      {/* Health Components */}
      <View style={styles.healthComponents}>
        {healthData && Object.entries(healthData).map(([key, value]) => {
          if (typeof value === 'object' && value.score !== undefined) {
            return (
              <View key={key} style={styles.healthComponentCard}>
                <View style={styles.healthComponentHeader}>
                  <Text style={styles.healthComponentTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={[styles.healthComponentScore, { color: this.getHealthColor(value.score) }]}>
                    {value.score}
                  </Text>
                </View>
                <Text style={styles.healthComponentStatus}>{value.status}</Text>
                {value.issues && value.issues.length > 0 && (
                  <View style={styles.healthIssues}>
                    {value.issues.map((issue, index) => (
                      <Text key={index} style={styles.healthIssueText}>• {issue}</Text>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          return null;
        })}
      </View>

      {/* Health Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Health Recommendations</Text>
        <View style={styles.recommendationsList}>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
            <Text style={styles.recommendationText}>Schedule brake service within 30 days</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.info[600]} />
            <Text style={styles.recommendationText}>Check tire pressure weekly</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={COLORS.success[600]} />
            <Text style={styles.recommendationText}>Battery is in excellent condition</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMaintenanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
      
      {/* Upcoming Maintenance */}
      <View style={styles.maintenanceCard}>
        <Text style={styles.cardTitle}>Upcoming Services</Text>
        {maintenanceData?.upcoming?.map((service, index) => (
          <View key={service.id || index} style={styles.maintenanceItem}>
            <View style={styles.maintenanceHeader}>
              <Text style={styles.maintenanceType}>{service.type}</Text>
              <Text style={[styles.maintenancePriority, { color: this.getPriorityColor(service.priority) }]}>
                {service.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.maintenanceDescription}>{service.description}</Text>
            <View style={styles.maintenanceDetails}>
              <Text style={styles.maintenanceDetail}>Due: {service.dueDate?.toLocaleDateString()}</Text>
              <Text style={styles.maintenanceDetail}>Cost: ${service.estimatedCost}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Maintenance History */}
      <View style={styles.maintenanceCard}>
        <Text style={styles.cardTitle}>Service History</Text>
        {maintenanceData?.history?.map((service, index) => (
          <View key={service.id || index} style={styles.maintenanceItem}>
            <View style={styles.maintenanceHeader}>
              <Text style={styles.maintenanceType}>{service.type}</Text>
              <Text style={styles.maintenanceDate}>{service.date?.toLocaleDateString()}</Text>
            </View>
            <Text style={styles.maintenanceDescription}>{service.description}</Text>
            <View style={styles.maintenanceDetails}>
              <Text style={styles.maintenanceDetail}>Mileage: {service.mileage?.toLocaleString()}</Text>
              <Text style={styles.maintenanceDetail}>Cost: ${service.cost}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderFuelTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Fuel Efficiency</Text>
      
      {/* Fuel Stats */}
      <View style={styles.fuelStatsCard}>
        <View style={styles.fuelStatRow}>
          <View style={styles.fuelStatItem}>
            <Text style={styles.fuelStatLabel}>Current MPG</Text>
            <Text style={styles.fuelStatValue}>{fuelData?.currentMPG || 0}</Text>
          </View>
          <View style={styles.fuelStatItem}>
            <Text style={styles.fuelStatLabel}>Average MPG</Text>
            <Text style={styles.fuelStatValue}>{fuelData?.averageMPG || 0}</Text>
          </View>
        </View>
        <View style={styles.fuelStatRow}>
          <View style={styles.fuelStatItem}>
            <Text style={styles.fuelStatLabel}>Best MPG</Text>
            <Text style={styles.fuelStatValue}>{fuelData?.bestMPG || 0}</Text>
          </View>
          <View style={styles.fuelStatItem}>
            <Text style={styles.fuelStatLabel}>Worst MPG</Text>
            <Text style={styles.fuelStatValue}>{fuelData?.worstMPG || 0}</Text>
          </View>
        </View>
      </View>

      {/* Fuel Cost Analysis */}
      <View style={styles.fuelCostCard}>
        <Text style={styles.cardTitle}>Fuel Cost Analysis</Text>
        <View style={styles.fuelCostRow}>
          <Text style={styles.fuelCostLabel}>Total Fuel Cost</Text>
          <Text style={styles.fuelCostValue}>${fuelData?.totalFuelCost || 0}</Text>
        </View>
        <View style={styles.fuelCostRow}>
          <Text style={styles.fuelCostLabel}>Average Cost/Gallon</Text>
          <Text style={styles.fuelCostValue}>${fuelData?.averageCostPerGallon || 0}</Text>
        </View>
        <View style={styles.fuelCostRow}>
          <Text style={styles.fuelCostLabel}>Monthly Savings</Text>
          <Text style={[styles.fuelCostValue, { color: COLORS.success[600] }]}>
            ${fuelData?.savings?.monthly || 0}
          </Text>
        </View>
      </View>

      {/* Fuel Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Efficiency Tips</Text>
        <View style={styles.recommendationsList}>
          {fuelData?.recommendations?.map((tip, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb" size={16} color={COLORS.info[600]} />
              <Text style={styles.recommendationText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderExpensesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Expense Management</Text>
      
      {/* Expense Summary */}
      <View style={styles.expenseSummaryCard}>
        <Text style={styles.cardTitle}>Monthly Summary</Text>
        <View style={styles.expenseSummaryRow}>
          <Text style={styles.expenseSummaryLabel}>Total Expenses</Text>
          <Text style={styles.expenseSummaryValue}>${expenseData?.totalExpenses || 0}</Text>
        </View>
        <View style={styles.expenseSummaryRow}>
          <Text style={styles.expenseSummaryLabel}>Monthly Average</Text>
          <Text style={styles.expenseSummaryValue}>${expenseData?.monthlyAverage || 0}</Text>
        </View>
        <View style={styles.expenseSummaryRow}>
          <Text style={styles.expenseSummaryLabel}>Cost per Mile</Text>
          <Text style={styles.expenseSummaryValue}>${expenseData?.costPerMile || 0}</Text>
        </View>
        <View style={styles.expenseSummaryRow}>
          <Text style={styles.expenseSummaryLabel}>Profit Margin</Text>
          <Text style={[styles.expenseSummaryValue, { color: COLORS.success[600] }]}>
            {expenseData?.profitMargin || 0}%
          </Text>
        </View>
      </View>

      {/* Expense Categories */}
      <View style={styles.expenseCategoriesCard}>
        <Text style={styles.cardTitle}>Expense Breakdown</Text>
        {expenseData?.categories && Object.entries(expenseData.categories).map(([category, amount]) => (
          <View key={category} style={styles.expenseCategoryRow}>
            <Text style={styles.expenseCategoryLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
            <Text style={styles.expenseCategoryValue}>${amount}</Text>
          </View>
        ))}
      </View>

      {/* Expense Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Cost Optimization</Text>
        <View style={styles.recommendationsList}>
          {expenseData?.recommendations?.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb" size={16} color={COLORS.warning[600]} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderInsuranceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Insurance Management</Text>
      
      {/* Policy Information */}
      <View style={styles.insuranceCard}>
        <Text style={styles.cardTitle}>Current Policy</Text>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceLabel}>Provider</Text>
          <Text style={styles.insuranceValue}>{insuranceData?.policy?.provider || 'N/A'}</Text>
        </View>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceLabel}>Coverage</Text>
          <Text style={styles.insuranceValue}>{insuranceData?.policy?.coverage || 'N/A'}</Text>
        </View>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceLabel}>Premium</Text>
          <Text style={styles.insuranceValue}>${insuranceData?.policy?.premium || 0}/month</Text>
        </View>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceLabel}>Deductible</Text>
          <Text style={styles.insuranceValue}>${insuranceData?.policy?.deductible || 0}</Text>
        </View>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceLabel}>Renewal Date</Text>
          <Text style={styles.insuranceValue}>
            {insuranceData?.policy?.renewalDate?.toLocaleDateString() || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Claims History */}
      <View style={styles.claimsCard}>
        <Text style={styles.cardTitle}>Claims History</Text>
        {insuranceData?.claims?.map((claim, index) => (
          <View key={claim.id || index} style={styles.claimItem}>
            <View style={styles.claimHeader}>
              <Text style={styles.claimType}>{claim.type}</Text>
              <Text style={[styles.claimStatus, { color: this.getClaimStatusColor(claim.status) }]}>
                {claim.status}
              </Text>
            </View>
            <Text style={styles.claimDescription}>{claim.description}</Text>
            <View style={styles.claimDetails}>
              <Text style={styles.claimDetail}>Date: {claim.date?.toLocaleDateString()}</Text>
              <Text style={styles.claimDetail}>Amount: ${claim.amount}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderMarketplaceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Vehicle Marketplace</Text>
      
      {/* Market Value */}
      <View style={styles.marketValueCard}>
        <Text style={styles.cardTitle}>Your Vehicle's Value</Text>
        <View style={styles.marketValueRow}>
          <Text style={styles.marketValueLabel}>Current Value</Text>
          <Text style={styles.marketValueValue}>${marketplaceData?.marketValue?.current || 0}</Text>
        </View>
        <View style={styles.marketValueRow}>
          <Text style={styles.marketValueLabel}>Value Range</Text>
          <Text style={styles.marketValueValue}>
            ${marketplaceData?.marketValue?.range?.min || 0} - ${marketplaceData?.marketValue?.range?.max || 0}
          </Text>
        </View>
        <View style={styles.marketValueRow}>
          <Text style={styles.marketValueLabel}>Trend</Text>
          <Text style={[styles.marketValueValue, { color: COLORS.success[600] }]}>
            {marketplaceData?.marketValue?.trend || 'stable'}
          </Text>
        </View>
      </View>

      {/* Featured Listings */}
      <View style={styles.listingsCard}>
        <Text style={styles.cardTitle}>Featured Listings</Text>
        {marketplaceData?.forSale?.map((listing, index) => (
          <View key={listing.id || index} style={styles.listingItem}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingTitle}>
                {listing.year} {listing.make} {listing.model}
              </Text>
              <Text style={styles.listingPrice}>${listing.price?.toLocaleString()}</Text>
            </View>
            <Text style={styles.listingDetails}>
              {listing.mileage?.toLocaleString()} miles • {listing.condition}
            </Text>
            <Text style={styles.listingLocation}>{listing.location}</Text>
          </View>
        ))}
      </View>

      {/* Marketplace Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Selling Tips</Text>
        <View style={styles.recommendationsList}>
          {marketplaceData?.recommendations?.map((tip, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb" size={16} color={COLORS.info[600]} />
              <Text style={styles.recommendationText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'health': return renderHealthTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'fuel': return renderFuelTab();
      case 'expenses': return renderExpensesTab();
      case 'insurance': return renderInsuranceTab();
      case 'marketplace': return renderMarketplaceTab();
      default: return renderOverviewTab();
    }
  };

  // Helper methods
  getHealthColor = (score) => {
    if (score >= 90) return COLORS.success[600];
    if (score >= 70) return COLORS.warning[600];
    return COLORS.error[600];
  };

  getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.error[600];
      case 'medium': return COLORS.warning[600];
      case 'low': return COLORS.info[600];
      default: return COLORS.secondary[600];
    }
  };

  getClaimStatusColor = (status) => {
    switch (status) {
      case 'Approved': return COLORS.success[600];
      case 'Pending': return COLORS.warning[600];
      case 'Denied': return COLORS.error[600];
      default: return COLORS.secondary[600];
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Management</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? COLORS.primary[600] : COLORS.secondary[600]}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary[600]} />
              <Text style={styles.loadingText}>Loading vehicle data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadVehicleData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.tabContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary[600]]}
                />
              }
            >
              {renderTabContent()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  refreshButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error[600],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  healthScoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  scoreLabel: {
    fontSize: 24,
    color: COLORS.secondary[600],
    marginLeft: 4,
  },
  healthBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginRight: '4%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  alertsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  healthComponents: {
    gap: 12,
  },
  healthComponentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthComponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthComponentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  healthComponentScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  healthComponentStatus: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginBottom: 8,
  },
  healthIssues: {
    marginTop: 8,
  },
  healthIssueText: {
    fontSize: 12,
    color: COLORS.warning[600],
    marginBottom: 4,
  },
  recommendationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  maintenanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  maintenanceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  maintenancePriority: {
    fontSize: 12,
    fontWeight: '600',
  },
  maintenanceDescription: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  maintenanceDetail: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  maintenanceDate: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  fuelStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fuelStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  fuelStatItem: {
    alignItems: 'center',
  },
  fuelStatLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  fuelStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  fuelCostCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fuelCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fuelCostLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  fuelCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  expenseSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expenseSummaryLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  expenseSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  expenseCategoriesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expenseCategoryLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  expenseCategoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  insuranceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insuranceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insuranceLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  insuranceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  claimsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  claimItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  claimStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimDescription: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginBottom: 8,
  },
  claimDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  claimDetail: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  marketValueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  marketValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  marketValueLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  marketValueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  listingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  listingDetails: {
    fontSize: 14,
    color: COLORS.secondary[700],
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
});

export default VehicleManagementDashboard;
