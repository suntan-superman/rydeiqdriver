import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const SupportScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const contactOptions = [
    {
      id: 1,
      title: 'Live Chat',
      subtitle: 'Chat with our support team',
      icon: 'chatbubble-ellipses',
      color: COLORS.primary[500],
      onPress: () => Alert.alert('Live Chat', 'Live chat will be available in the next update'),
      available: '24/7'
    },
    {
      id: 2,
      title: 'Call Support',
      subtitle: 'Speak directly with support',
      icon: 'call',
      color: COLORS.info,
      onPress: () => Linking.openURL('tel:+18005551234'),
      available: '6 AM - 10 PM'
    },
    {
      id: 3,
      title: 'Email Support',
      subtitle: 'Send us a detailed message',
      icon: 'mail',
      color: COLORS.warning,
      onPress: () => Linking.openURL('mailto:driver-support@anyryde.com?subject=Driver Support Request'),
      available: 'Response in 2-4 hours'
    },
    {
      id: 4,
      title: 'Report an Issue',
      subtitle: 'Technical problems or bugs',
      icon: 'bug',
      color: COLORS.error,
      onPress: () => Alert.alert('Report Issue', 'Bug reporting feature coming soon'),
      available: 'High priority'
    }
  ];

  const quickHelp = [
    {
      id: 1,
      title: 'How to Go Online',
      subtitle: 'Start accepting ride requests',
      icon: 'power',
      color: COLORS.success
    },
    {
      id: 2,
      title: 'Bidding System Guide',
      subtitle: 'Set your own prices',
      icon: 'pricetag',
      color: COLORS.primary[500]
    },
    {
      id: 3,
      title: 'Payment & Earnings',
      subtitle: 'Understand your payouts',
      icon: 'card',
      color: COLORS.warning
    },
    {
      id: 4,
      title: 'Safety Features',
      subtitle: 'Emergency and security tools',
      icon: 'shield-checkmark',
      color: COLORS.error
    }
  ];

  const faqData = [
    {
      id: 1,
      question: 'How does the bidding system work?',
      answer: 'AnyRyde allows you to set your own prices. When a ride request comes in, you can either accept the company estimate or submit a custom bid. Customers choose based on price, arrival time, and driver rating.'
    },
    {
      id: 2,
      question: 'When do I get paid?',
      answer: 'You have multiple payout options: Instant payout (available immediately with $1.50 fee), daily payout ($0.50 fee), or weekly payout (free, paid every Monday). Payments are sent directly to your linked bank account.'
    },
    {
      id: 3,
      question: 'What happens if I have car trouble during a ride?',
      answer: 'Contact support immediately through the emergency button in the app. We\'ll help arrange alternative transportation for your passenger and assist with your vehicle situation. Safety is our top priority.'
    },
    {
      id: 4,
      question: 'How are customer ratings calculated?',
      answer: 'Customers rate you on a 5-star scale after each completed trip. Your overall rating is an average of your last 500 trips. Maintaining a 4.6+ rating ensures continued access to the platform.'
    },
    {
      id: 5,
      question: 'Can I drive in multiple cities?',
      answer: 'Yes! Your AnyRyde Driver account works in all supported cities. Just update your location in the app and you can start accepting rides in any new area.'
    },
    {
      id: 6,
      question: 'What documents do I need to drive?',
      answer: 'You need a valid driver\'s license, vehicle insurance, vehicle registration, and to pass a background check. Some cities may require additional permits or inspections.'
    }
  ];

  const emergencyInfo = {
    title: 'Emergency Assistance',
    subtitle: '24/7 immediate help',
    phone: '+1-800-EMERGENCY',
    description: 'For immediate safety concerns during rides'
  };

  const handleContactPress = (option) => {
    option.onPress();
  };

  const handleQuickHelpPress = (item) => {
    Alert.alert(item.title, `${item.subtitle}\n\nDetailed help guides coming soon!`);
  };

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Join AnyRyde Driver - Set your own prices and earn more! Download: https://anyryde.com/driver',
        title: 'AnyRyde Driver'
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const ContactCard = ({ option }) => (
    <TouchableOpacity 
      style={styles.contactCard}
      onPress={() => handleContactPress(option)}
    >
      <View style={[styles.contactIcon, { backgroundColor: option.color + '20' }]}>
        <Ionicons name={option.icon} size={28} color={option.color} />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{option.title}</Text>
        <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
        <Text style={styles.contactAvailability}>{option.available}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary} />
    </TouchableOpacity>
  );

  const QuickHelpCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.quickHelpCard}
      onPress={() => handleQuickHelpPress(item)}
    >
      <View style={[styles.quickHelpIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.quickHelpTitle}>{item.title}</Text>
      <Text style={styles.quickHelpSubtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );

  const FAQItem = ({ item }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.faqQuestion}
        onPress={() => toggleFAQ(item.id)}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Ionicons 
          name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.COLORS.secondary} 
        />
      </TouchableOpacity>
      {expandedFAQ === item.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  const SectionHeader = ({ title, subtitle }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );

  const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>{t('support')}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={theme.COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Emergency Card */}
        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="alert-circle" size={32} color={theme.COLORS.error} />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyTitle}>{emergencyInfo.title}</Text>
              <Text style={styles.emergencySubtitle}>{emergencyInfo.subtitle}</Text>
              <Text style={styles.emergencyDescription}>{emergencyInfo.description}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => Linking.openURL(`tel:${emergencyInfo.phone}`)}
          >
            <Ionicons name="call" size={20} color={theme.COLORS.white} />
            <Text style={styles.emergencyButtonText}>{t('callEmergency')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Contact Options */}
        <SectionHeader 
          title={t('contactSupport')} 
          subtitle={t('getHelpFromSupportTeam')}
        />
        <Card>
          {contactOptions.map((option) => (
            <ContactCard key={option.id} option={option} />
          ))}
        </Card>

        {/* Quick Help */}
        <SectionHeader 
          title={t('quickHelp')} 
          subtitle={t('commonTopicsAndGuides')}
        />
        <View style={styles.quickHelpGrid}>
          {quickHelp.map((item) => (
            <QuickHelpCard key={item.id} item={item} />
          ))}
        </View>

        {/* FAQ Section */}
        <SectionHeader 
          title={t('frequentlyAskedQuestions')} 
          subtitle={t('findAnswersToCommonQuestions')}
        />
        <Card>
          {faqData.map((item) => (
            <FAQItem key={item.id} item={item} />
          ))}
        </Card>

        {/* Additional Resources */}
        <SectionHeader 
          title={t('additionalResources')} 
          subtitle={t('moreWaysToGetHelp')}
        />
        <Card>
          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="book" size={24} color={theme.COLORS.primary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{t('driverHandbook')}</Text>
              <Text style={styles.resourceSubtitle}>{t('completeGuideToDrivingWithAnyRyde')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="videocam" size={24} color={theme.COLORS.info} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{t('videoTutorials')}</Text>
              <Text style={styles.resourceSubtitle}>{t('watchStepByStepGuides')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="people" size={24} color={theme.COLORS.success} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{t('driverCommunity')}</Text>
              <Text style={styles.resourceSubtitle}>{t('connectWithOtherDrivers')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={handleShareApp}
          >
            <View style={styles.resourceIcon}>
              <Ionicons name="share-social" size={24} color={theme.COLORS.warning} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{t('referADriver')}</Text>
              <Text style={styles.resourceSubtitle}>{t('shareAnyRydeWithFriends')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary} />
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <Card style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>{t('anyRydeDriver')}</Text>
          <Text style={styles.appInfoText}>
            {t('yourRidesYourRatesYourRules')}
          </Text>
          <Text style={styles.appInfoText}>
            {t('copyright')}
          </Text>
        </Card>

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
  searchButton: {
    padding: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    marginBottom: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyCard: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginTop: DIMENSIONS.paddingM,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingM,
  },
  emergencyIcon: {
    marginRight: DIMENSIONS.paddingM,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.error,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.error,
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
  },
  emergencyButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
    marginLeft: DIMENSIONS.paddingS,
  },
  sectionHeader: {
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingL,
    marginTop: DIMENSIONS.paddingM,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  contactAvailability: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary[500],
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingM,
  },
  quickHelpCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    padding: DIMENSIONS.paddingL,
    marginRight: '2%',
    marginBottom: DIMENSIONS.paddingM,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickHelpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DIMENSIONS.paddingM,
  },
  quickHelpTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  quickHelpSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[600],
    textAlign: 'center',
    lineHeight: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingL,
  },
  faqQuestionText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    flex: 1,
    marginRight: DIMENSIONS.paddingM,
  },
  faqAnswer: {
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingBottom: DIMENSIONS.paddingL,
  },
  faqAnswerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    lineHeight: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  resourceSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  appInfoCard: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.paddingXL,
  },
  appInfoTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary[500],
    marginBottom: DIMENSIONS.paddingM,
  },
  appInfoText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    textAlign: 'center',
    marginBottom: DIMENSIONS.paddingS,
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
});

export default SupportScreen; 