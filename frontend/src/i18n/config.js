import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations
  },
  tr: {
    translation: trTranslations
  },
  ar: {
    translation: arTranslations
  }
};

// RTL language codes
const RTL_LANGUAGES = ['ar', 'fa', 'ur'];

// Helper function to update document direction
const updateDocumentDirection = (language) => {
  const isRTL = RTL_LANGUAGES.includes(language);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
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
    
    // Supported languages
    supportedLngs: ['en', 'tr', 'ar'],
    
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

// Initialize direction on load
updateDocumentDirection(i18n.language);

// Update HTML lang attribute and direction when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  updateDocumentDirection(lng);
});

// Export helper to check if current language is RTL
export const isRTLLanguage = (lang) => RTL_LANGUAGES.includes(lang);

export default i18n;
