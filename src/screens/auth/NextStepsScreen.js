import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useTranslation } from 'react-i18next';

const WEB_ONBOARDING_URL = 'https://anyryde.com/register';

const NextStepsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const handleOpenWebOnboarding = () => {
    Linking.openURL(WEB_ONBOARDING_URL);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.primary[500]} style={styles.icon} />
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('nextStepsSubtitle')}</Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenWebOnboarding}>
          <Ionicons name="open-outline" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>{t('continueOnboarding')}</Text>
        </TouchableOpacity>
        <Text style={styles.info}>{t('afterOnboardingInfo')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary[700],
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusM,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginLeft: 8,
  },
  info: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default NextStepsScreen; 