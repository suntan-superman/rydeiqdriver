import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Linking, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

const WEB_BANKING_URL = 'https://anyryde.com/banking'; // TODO: Replace with actual link if available

const BankingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bankingInfo, setBankingInfo] = useState({
    bankName: '',
    accountHolder: '',
    last4: '',
    isVerified: false
  });

  // Placeholder payout history
  const [payoutHistory, setPayoutHistory] = useState([]);

  // Load banking info from Firebase
  useEffect(() => {
    const loadBankingInfo = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const driverDoc = await getDoc(doc(db, 'driverApplications', user.id));
        
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();
          const payoutSetup = driverData.payout_setup || {};
          
          // Extract last 4 digits from account number if available
          const accountNumber = payoutSetup.accountNumber || '';
          const last4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : '';
          
          setBankingInfo({
            bankName: payoutSetup.bankName || 'Not set',
            accountHolder: payoutSetup.accountHolderName || 'Not set',
            last4: last4 || '****',
            isVerified: payoutSetup.verificationMethod === 'microdeposit' || false
          });
        }
      } catch (error) {
        console.error('Error loading banking info:', error);
        Alert.alert('Error', 'Failed to load banking information');
      } finally {
        setLoading(false);
      }
    };

    loadBankingInfo();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Loading banking information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>Banking & Payouts</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
          {bankingInfo.accountHolder !== 'Not set' ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={COLORS.primary[500]} style={{ marginRight: 12 }} />
                <Text style={styles.infoText}>{bankingInfo.bankName} •••• {bankingInfo.last4}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color={COLORS.primary[500]} style={{ marginRight: 12 }} />
                <Text style={styles.infoText}>{bankingInfo.accountHolder}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name={bankingInfo.isVerified ? 'checkmark-circle' : 'close-circle'} size={20} color={bankingInfo.isVerified ? COLORS.success : COLORS.warning} style={{ marginRight: 12 }} />
                <Text style={styles.infoText}>{bankingInfo.isVerified ? 'Verified' : 'Pending Verification'}</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={COLORS.secondary[400]} />
              <Text style={styles.emptyStateText}>No banking information set</Text>
              <Text style={styles.emptyStateSubtext}>Add your banking details in the Profile section</Text>
            </View>
          )}
          <Text style={styles.infoNote}>
            For security, full banking details can only be managed through the web app or in your Profile section.
          </Text>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={18} color={COLORS.white} />
            <Text style={styles.webButtonText}>Edit in Profile</Text>
          </TouchableOpacity>
        </View>
        {/* Payout History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('payoutHistory')}</Text>
          {payoutHistory.length === 0 ? (
            <Text style={styles.infoNote}>{t('noPayoutsYet')}</Text>
          ) : (
            payoutHistory.map((payout, idx) => (
              <View key={idx} style={styles.payoutRow}>
                <Text style={styles.payoutText}>{payout.date}</Text>
                <Text style={styles.payoutText}>${payout.amount.toFixed(2)}</Text>
                <Text style={styles.payoutText}>{payout.status}</Text>
              </View>
            ))
          )}
        </View>
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
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingL,
    marginTop: DIMENSIONS.paddingL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[900],
  },
  infoNote: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginTop: 8,
    marginBottom: 12,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  webButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary[50],
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[600],
    marginTop: DIMENSIONS.paddingM,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.paddingXL,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[600],
    marginTop: DIMENSIONS.paddingM,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[500],
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  payoutText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[700],
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
});

export default BankingScreen; 