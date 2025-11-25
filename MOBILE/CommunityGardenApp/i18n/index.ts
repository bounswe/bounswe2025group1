import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en/translation.json';
import tr from '../locales/tr/translation.json';

const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
};

// Language detection with persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        console.log('Using saved language:', savedLanguage);
        callback(savedLanguage);
        return;
      }
      
      // Fallback to device locale
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      console.log('Using device language:', deviceLanguage);
      callback(deviceLanguage);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
      console.log('Language saved to storage:', lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
