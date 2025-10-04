import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import tr from '@/locales/tr.json';
import en from '@/locales/en.json';
import pl from '@/locales/pl.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  pl: { translation: pl },
};

// Check if we're on the server side
const isServer = typeof window === 'undefined';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr',
    lng: isServer ? 'tr' : undefined, // Use fixed language on server
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
