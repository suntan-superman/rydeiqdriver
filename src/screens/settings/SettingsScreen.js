import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
// Import Redux actions
import { updateSettings, setTheme, setLanguage } from '@/store/slices/appSlice';

import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  // Redux state
  const settings = useSelector(state => state.app.settings);
  const language = useSelector(state => state.app.language);
  const appVersion = useSelector(state => state.app.version?.current || '1.0.0');
  
  // Local state for demo purposes (will integrate with driver slice later)
  const [driverSettings, setDriverSettings] = useState({
    minimumFare: 5.00,
    maximumDistance: 50,
    autoAcceptEnabled: false,
    preferredRideTypes: ['standard', 'premium'],
    instantPayouts: true,
    emergencyContact: null
  });

  // Language options
  const LANGUAGE_OPTIONS = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  const handleSettingChange = (setting, value) => {
    dispatch(updateSettings({ [setting]: value }));
  };

  const handleDriverSettingChange = (setting, value) => {
    setDriverSettings(prev => ({ ...prev, [setting]: value }));
    // TODO: Dispatch to driverSlice when implemented
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };

  const handleLanguageSelect = () => {
    Alert.alert(
      t('settings'),
      t('Choose your preferred language'),
      LANGUAGE_OPTIONS.map(lang => ({
        text: `${lang.flag} ${lang.name}`,
        onPress: async () => {
          await i18n.changeLanguage(lang.code);
        }
      })).concat([{ text: t('Cancel'), style: 'cancel' }])
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support Options',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => Linking.openURL('mailto:driver-support@antryde.com') },
        { text: 'Call Support', onPress: () => Linking.openURL('tel:+18005551234') },
        { text: 'Live Chat', onPress: () => Alert.alert('Coming Soon', 'Live chat will be available in the next update') }
      ]
    );
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

  const openLink = (url) => {
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, onPress, rightComponent, showArrow = false }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color={theme.COLORS.primary[500]} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || (
          onToggle ? (
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{ false: theme.COLORS.secondary[300], true: theme.COLORS.primary[400] }}
              thumbColor={value ? theme.COLORS.primary[500] : theme.COLORS.secondary[500]}
            />
          ) : showArrow ? (
            <Ionicons name="chevron-forward" size={20} color={theme.COLORS.secondary[500]} />
          ) : null
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={theme.COLORS.primary[500]} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
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
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>{t('settings')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account & Profile Section */}
        <SectionHeader title="Account & Profile" icon="person-circle-outline" />
        <Card>
          <SettingItem
            icon="person-outline"
            title="Profile Information"
            subtitle="Update your personal details"
            onPress={() => navigation.navigate('Profile')}
            showArrow
          />
          <SettingItem
            icon="car-outline"
            title="Vehicle Information"
            subtitle="Manage your vehicle details"
            onPress={() => Alert.alert('Coming Soon', 'Vehicle management will be available in the next update')}
            showArrow
          />
          <SettingItem
            icon="card-outline"
            title="Banking & Payouts"
            subtitle="Manage payment methods"
            onPress={() => navigation.navigate('Banking')}
            showArrow
          />
        </Card>

        {/* App Preferences Section */}
        <SectionHeader title="App Preferences" icon="settings-outline" />
        <Card>
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Toggle dark/light theme"
            value={theme.mode === 'dark'}
            onToggle={toggleTheme}
          />
          <SettingItem
            icon="language-outline"
            title={t('Language')}
            subtitle={LANGUAGE_OPTIONS.find(l => l.code === i18n.language)?.name || 'English'}
            onPress={handleLanguageSelect}
            showArrow
          />
          <SettingItem
            icon="volume-high-outline"
            title="Sound Effects"
            subtitle="App sounds and alerts"
            value={settings.sound}
            onToggle={(value) => handleSettingChange('sound', value)}
          />
          <SettingItem
            icon="phone-portrait-outline"
            title="Vibration"
            subtitle="Haptic feedback"
            value={settings.vibration}
            onToggle={(value) => handleSettingChange('vibration', value)}
          />
          <SettingItem
            icon="sunny-outline"
            title="Keep Screen On"
            subtitle="Prevent auto-lock while driving"
            value={settings.keepScreenOn}
            onToggle={(value) => handleSettingChange('keepScreenOn', value)}
          />
          <SettingItem
            icon="globe-outline"
            title="Units"
            subtitle={settings.units === 'imperial' ? 'Miles, Fahrenheit' : 'Kilometers, Celsius'}
            onPress={() => {
              const newUnits = settings.units === 'imperial' ? 'metric' : 'imperial';
              handleSettingChange('units', newUnits);
            }}
            showArrow
          />
        </Card>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" icon="notifications-outline" />
        <Card>
          <SettingItem
            icon="car-sport-outline"
            title="Ride Requests"
            subtitle="New ride request alerts"
            value={settings.notifications?.rideRequests !== false}
            onToggle={(value) => handleSettingChange('notifications', { ...settings.notifications, rideRequests: value })}
          />
          <SettingItem
            icon="trending-up-outline"
            title="Bid Updates"
            subtitle="Bidding status notifications"
            value={settings.notifications?.bidUpdates !== false}
            onToggle={(value) => handleSettingChange('notifications', { ...settings.notifications, bidUpdates: value })}
          />
          <SettingItem
            icon="cash-outline"
            title="Earnings Updates"
            subtitle="Payment and earnings alerts"
            value={settings.notifications?.earnings !== false}
            onToggle={(value) => handleSettingChange('notifications', { ...settings.notifications, earnings: value })}
          />
          <SettingItem
            icon="information-circle-outline"
            title="System Notifications"
            subtitle="App updates and announcements"
            value={settings.notifications?.system !== false}
            onToggle={(value) => handleSettingChange('notifications', { ...settings.notifications, system: value })}
          />
        </Card>

        {/* Ride & Bidding Preferences */}
        <SectionHeader title="Ride & Bidding" icon="car-outline" />
        <Card>
          <SettingItem
            icon="cash-outline"
            title="Minimum Fare"
            subtitle={`$${driverSettings.minimumFare.toFixed(2)} minimum per ride`}
            onPress={() => Alert.alert('Coming Soon', 'Fare settings will be available in the next update')}
            showArrow
          />
          <SettingItem
            icon="speedometer-outline"
            title="Maximum Distance"
            subtitle={`${driverSettings.maximumDistance} miles max per ride`}
            onPress={() => Alert.alert('Coming Soon', 'Distance settings will be available in the next update')}
            showArrow
          />
          <SettingItem
            icon="checkmark-circle-outline"
            title="Auto-Accept Bids"
            subtitle="Automatically accept company bids"
            value={driverSettings.autoAcceptEnabled}
            onToggle={(value) => handleDriverSettingChange('autoAcceptEnabled', value)}
          />
          <SettingItem
            icon="star-outline"
            title="Preferred Ride Types"
            subtitle="Standard, Premium selected"
            onPress={() => Alert.alert('Coming Soon', 'Ride type preferences will be available in the next update')}
            showArrow
          />
        </Card>

        {/* Safety & Security Section */}
        <SectionHeader title="Safety & Security" icon="shield-checkmark-outline" />
        <Card>
          <SettingItem
            icon="call-outline"
            title="Emergency Contact"
            subtitle={driverSettings.emergencyContact || "Not set"}
            onPress={() => navigation.navigate('EmergencyContact')}
            showArrow
          />
          <SettingItem
            icon="finger-print-outline"
            title="Biometric Authentication"
            subtitle="Use Face ID / Touch ID"
            value={settings.biometricAuth !== false}
            onToggle={(value) => handleSettingChange('biometricAuth', value)}
          />
          <SettingItem
            icon="eye-off-outline"
            title="Privacy Mode"
            subtitle="Hide sensitive information"
            value={settings.privacyMode}
            onToggle={(value) => handleSettingChange('privacyMode', value)}
          />
          <SettingItem
            icon="location-outline"
            title="Location Sharing"
            subtitle="Share location with emergency contacts"
            value={settings.locationSharing !== false}
            onToggle={(value) => handleSettingChange('locationSharing', value)}
          />
        </Card>

        {/* App Information Section */}
        <SectionHeader title="App Information" icon="information-circle-outline" />
        <Card>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={handleSupport}
            showArrow
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => openLink('https://anyryde.com/terms')}
            showArrow
          />
          <SettingItem
            icon="shield-outline"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => openLink('https://anyryde.com/privacy')}
            showArrow
          />
          <SettingItem
            icon="share-outline"
            title="Share AnyRyde Driver"
            subtitle="Invite other drivers"
            onPress={handleShareApp}
            showArrow
          />
          <SettingItem
            icon="star-outline"
            title="Rate the App"
            subtitle="Leave a review in the app store"
            onPress={() => Alert.alert('Coming Soon', 'App store rating will be available in the next update')}
            showArrow
          />
          <SettingItem
            icon="information-outline"
            title="About"
            subtitle={`Version ${appVersion}`}
            onPress={() => Alert.alert('AnyRyde Driver', `Version ${appVersion}\n\nYour rides. Your rates. Your rules.\n\n© 2024 WORKSIDE SOFTWARE`)}
            showArrow
          />
        </Card>

        {/* Sign Out Section */}
        <Card style={styles.signOutCard}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={theme.COLORS.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  headerRight: {
    width: 40, // Placeholder for symmetry
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingS,
    paddingVertical: DIMENSIONS.paddingM,
    marginTop: DIMENSIONS.paddingL,
  },
  sectionHeaderText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[800],
    marginLeft: DIMENSIONS.paddingS,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    marginBottom: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingS,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[50] || COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutCard: {
    marginTop: DIMENSIONS.paddingL,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.paddingL,
  },
  signOutText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.error,
    marginLeft: DIMENSIONS.paddingS,
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
});

export default SettingsScreen; 