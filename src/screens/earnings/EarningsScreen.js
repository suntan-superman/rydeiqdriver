import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const EarningsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Mock earnings data
  const earningsData = {
    today: {
      total: 187.50,
      trips: 12,
      hours: 6.5,
      tips: 23.75
    },
    week: {
      total: 1247.80,
      trips: 89,
      hours: 42.3,
      tips: 167.90
    },
    month: {
      total: 4892.45,
      trips: 324,
      hours: 178.5,
      tips: 634.20
    }
  };

  const currentData = earningsData[selectedPeriod];
  const hourlyRate = (currentData.total / currentData.hours).toFixed(2);

  const periods = [
    { key: 'today', label: 'today' },
    { key: 'week', label: 'week' },
    { key: 'month', label: 'month' }
  ];

  const recentTrips = [
    { id: 1, from: 'Downtown', to: 'Airport', amount: 28.50, tip: 5.00, time: '2:30 PM' },
    { id: 2, from: 'Mall', to: 'University', amount: 15.75, tip: 2.50, time: '1:45 PM' },
    { id: 3, from: 'Hospital', to: 'Residential', amount: 22.00, tip: 4.00, time: '12:15 PM' },
    { id: 4, from: 'Office Complex', to: 'Restaurant', amount: 12.25, tip: 1.75, time: '11:30 AM' }
  ];

  const StatCard = ({ title, value, subtitle, icon, color = COLORS.primary[500] }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const TripItem = ({ trip }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripRoute}>
        <View style={styles.routeIcon}>
          <Ionicons name="location" size={16} color={COLORS.primary[500]} />
        </View>
        <View style={styles.routeDetails}>
          <Text style={styles.routeFrom}>{trip.from}</Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.secondary[500]} />
          <Text style={styles.routeTo}>{trip.to}</Text>
        </View>
      </View>
      <View style={styles.tripEarnings}>
        <Text style={styles.tripAmount}>${trip.amount.toFixed(2)}</Text>
        <Text style={styles.tripTip}>+${trip.tip.toFixed(2)} tip</Text>
        <Text style={styles.tripTime}>{trip.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>{t('earnings')}</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={theme.COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {t(period.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Earnings Card */}
        <View style={styles.totalEarningsCard}>
          <Text style={styles.totalEarningsLabel}>{t('totalEarnings')}</Text>
          <Text style={styles.totalEarningsAmount}>${currentData.total.toFixed(2)}</Text>
          <Text style={styles.totalEarningsSubtext}>
            {currentData.trips} {t('trips')} • ${hourlyRate}/{t('hourlyRate')}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title={t('tripEarnings')}
            value={`$${(currentData.total - currentData.tips).toFixed(2)}`}
            subtitle={`${currentData.trips} ${t('trips')}`}
            icon="car"
            color={COLORS.primary[500]}
          />
          <StatCard
            title={t('tips')}
            value={`$${currentData.tips.toFixed(2)}`}
            subtitle={t('customerTips')}
            icon="heart"
            color={COLORS.success}
          />
          <StatCard
            title={t('hoursOnline')}
            value={`${currentData.hours}h`}
            subtitle={t('activeTime')}
            icon="time"
            color={COLORS.warning}
          />
          <StatCard
            title={t('hourlyRate')}
            value={`$${hourlyRate}`}
            subtitle={t('perHour')}
            icon="trending-up"
            color={COLORS.primary[600]}
          />
        </View>

        {/* Payout Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('payoutOptions')}</Text>
          <View style={styles.payoutCard}>
            <View style={styles.payoutOptions}>
              <TouchableOpacity style={styles.payoutOption}>
                <View style={styles.payoutOptionIcon}>
                  <Ionicons name="flash" size={20} color={COLORS.warning} />
                </View>
                <View style={styles.payoutOptionContent}>
                  <Text style={styles.payoutOptionTitle}>{t('instantPayout')}</Text>
                  <Text style={styles.payoutOptionSubtitle}>{t('instantPayoutSubtitle')}</Text>
                </View>
                <Text style={styles.payoutOptionAmount}>$186.00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.payoutOption}>
                <View style={styles.payoutOptionIcon}>
                  <Ionicons name="calendar" size={20} color={COLORS.primary[500]} />
                </View>
                <View style={styles.payoutOptionContent}>
                  <Text style={styles.payoutOptionTitle}>{t('weeklyPayout')}</Text>
                  <Text style={styles.payoutOptionSubtitle}>{t('weeklyPayoutSubtitle')}</Text>
                </View>
                <Text style={styles.payoutOptionAmount}>$187.50</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Trips */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentTrips')}</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tripsCard}>
            {recentTrips.map((trip) => (
              <TripItem key={trip.id} trip={trip} />
            ))}
          </View>
        </View>

        {/* Earnings Goals */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('dailyGoal')}</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalProgress}>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: '75%' }]} />
              </View>
              <Text style={styles.goalProgressText}>{t('dailyGoalProgress')}</Text>
            </View>
            <TouchableOpacity style={styles.goalButton}>
              <Text style={styles.goalButtonText}>{t('updateGoal')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  backButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
  },
  filterButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingXS,
    marginTop: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingL,
  },
  periodButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.paddingM,
    alignItems: 'center',
    borderRadius: DIMENSIONS.radiusM,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary[500],
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[700],
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  totalEarningsCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingXL,
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingL,
  },
  totalEarningsLabel: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: DIMENSIONS.paddingS,
  },
  totalEarningsAmount: {
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.white,
    marginBottom: DIMENSIONS.paddingS,
  },
  totalEarningsSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.white,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: DIMENSIONS.paddingL,
  },
  statCard: {
    width: (SCREEN_WIDTH - DIMENSIONS.paddingM * 3) / 2,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
    marginRight: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingM,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[500],
  },
  sectionContainer: {
    marginBottom: DIMENSIONS.paddingL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingM,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.primary[500],
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  payoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
  },
  payoutOptions: {
    gap: DIMENSIONS.paddingM,
  },
  payoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  payoutOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  payoutOptionContent: {
    flex: 1,
  },
  payoutOptionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  payoutOptionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  payoutOptionAmount: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary[500],
  },
  tripsCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingM,
  },
  tripItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeIcon: {
    marginRight: DIMENSIONS.paddingS,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeFrom: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    marginRight: DIMENSIONS.paddingS,
  },
  routeTo: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginLeft: DIMENSIONS.paddingS,
  },
  tripEarnings: {
    alignItems: 'flex-end',
  },
  tripAmount: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
  },
  tripTip: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
  },
  tripTime: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
  },
  goalProgress: {
    marginBottom: DIMENSIONS.paddingM,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: COLORS.secondary[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.paddingS,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
  },
  goalProgressText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  goalButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusM,
    paddingVertical: DIMENSIONS.paddingM,
    alignItems: 'center',
  },
  goalButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
});

export default EarningsScreen; 