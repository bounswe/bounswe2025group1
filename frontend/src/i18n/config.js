import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';

const resources = {
  en: {
    translation: enTranslations
  },
  tr: {
    translation: trTranslations
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language in localStorage
      caches: ['localStorage'],
      
      // Key to store language in localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Fallback language if detection fails
    fallbackLng: 'en',
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      // Wait for translation to be loaded before rendering
      useSuspense: false,
    },
    
    // Default namespace
    defaultNS: 'translation',
    
    // Key separator (use dots for nested keys)
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
