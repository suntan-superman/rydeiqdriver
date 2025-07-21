import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const WEB_BANKING_URL = 'https://anyryde.com/banking'; // TODO: Replace with actual link if available

const BankingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  // Placeholder banking info
  const bankingInfo = {
    bankName: 'Bank of America',
    accountHolder: 'John Doe',
    last4: '1234',
    isVerified: true
  };

  // Placeholder payout history
  const payoutHistory = [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>{t('banking')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bankAccount')}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color={theme.COLORS.primary} style={{ marginRight: 12 }} />
            <Text style={styles.infoText}>{bankingInfo.bankName} •••• {bankingInfo.last4}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={theme.COLORS.primary} style={{ marginRight: 12 }} />
            <Text style={styles.infoText}>{bankingInfo.accountHolder}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name={bankingInfo.isVerified ? 'checkmark-circle' : 'close-circle'} size={20} color={bankingInfo.isVerified ? theme.COLORS.success : theme.COLORS.error} style={{ marginRight: 12 }} />
            <Text style={styles.infoText}>{bankingInfo.isVerified ? t('verified') : t('notVerified')}</Text>
          </View>
          <Text style={styles.infoNote}>
            {t('bankingSecurityNote')}
          </Text>
          <TouchableOpacity style={styles.webButton} onPress={() => Linking.openURL(WEB_BANKING_URL)}>
            <Ionicons name="open-outline" size={18} color={theme.COLORS.white} />
            <Text style={styles.webButtonText}>{t('manageBankingWeb')}</Text>
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
  webButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
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