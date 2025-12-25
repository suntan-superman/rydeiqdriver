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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAccessibilitySettings, useUpdateAccessibilitySettings } from '@/hooks/queries';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  // React Query hooks for accessibility settings
  const driverId = user?.uid || user?.id;
  const { data: accessibilitySettings } = useAccessibilitySettings(driverId);
  const { mutate: updateAccessibilitySettings } = useUpdateAccessibilitySettings(driverId);

  const handleLanguageSelect = () => {
    const LANGUAGE_OPTIONS = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
    ];

    Alert.alert(
      'Language',
      'Choose your language',
      LANGUAGE_OPTIONS.map(lang => ({
        text: `${lang.flag} ${lang.name}`,
        onPress: async () => {
          await i18n.changeLanguage(lang.code);
        }
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const SettingItem = ({ icon, title, value, onToggle, onPress, showArrow }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.COLORS.card }]}
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={theme.COLORS.primary} style={styles.icon} />
        <Text style={[styles.settingTitle, { color: theme.COLORS.text }]}>{title}</Text>
      </View>
      {onToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.COLORS.border, true: theme.COLORS.primary + '40' }}
          thumbColor={value ? theme.COLORS.primary : theme.COLORS.textSecondary}
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={16} color={theme.COLORS.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background, paddingTop: Platform.OS === 'android' ? 16 : 0 }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.COLORS.card, borderBottomColor: theme.COLORS.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.COLORS.text }]}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: theme.COLORS.text }]}>Preferences</Text>
        
        <SettingItem
          icon="moon"
          title="Dark Mode"
          value={theme.mode === 'dark'}
          onToggle={toggleTheme}
        />
        
        <SettingItem
          icon="language"
          title="Language"
          onPress={handleLanguageSelect}
          showArrow
        />
        
        <SettingItem
          icon="volume-high"
          title="Sound Effects"
          value={accessibilitySettings?.sound}
          onToggle={(value) => updateAccessibilitySettings({ sound: value })}
        />
        
        <SettingItem
          icon="phone-portrait"
          title="Vibration"
          value={accessibilitySettings?.vibration}
          onToggle={(value) => updateAccessibilitySettings({ vibration: value })}
        />

        {/* Support Section */}
        <Text style={[styles.sectionTitle, { color: theme.COLORS.text, marginTop: 24 }]}>Support</Text>
        
        <SettingItem
          icon="help-circle"
          title="Help & Support"
          onPress={() => Linking.openURL('mailto:driver-support@antryde.com')}
          showArrow
        />
        
        <SettingItem
          icon="information-circle"
          title="About"
          onPress={() => Alert.alert('AnyRyde Driver', 'Version 1.0.0\n\n© 2024 WORKSIDE SOFTWARE')}
          showArrow
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
    width: 20,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 24,
  },
});

export default SettingsScreen;