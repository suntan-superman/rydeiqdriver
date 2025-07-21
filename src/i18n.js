import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (cb) => {
    const saved = await AsyncStorage.getItem('app_language');
    if (saved) return cb(saved);
    // Fallback to device language
    let locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0]
        : NativeModules.I18nManager.localeIdentifier;
    cb(locale ? locale.split('_')[0] : 'en');
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    await AsyncStorage.setItem('app_language', lng);
  },
};

const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      settings: 'Settings',
      earnings: 'Earnings',
      support: 'Support',
      banking: 'Banking & Payouts',
      // ...add more keys as needed
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido',
      settings: 'Configuración',
      earnings: 'Ganancias',
      support: 'Soporte',
      banking: 'Banca y Pagos',
      // ...add more keys as needed
    },
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 