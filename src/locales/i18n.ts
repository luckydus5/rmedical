// ================================
// Sanovia Internationalization (i18n) Setup
// Supports: English, Kinyarwanda, Swahili, French
// ================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './en.json';
import rw from './rw.json';
import sw from './sw.json';
import fr from './fr.json';

const resources = {
  en: { translation: en },
  rw: { translation: rw },
  sw: { translation: sw },
  fr: { translation: fr },
};

// Get saved language from localStorage or default to English
const getSavedLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sanovia-language') || 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Function to change language
export const changeLanguage = (lang: string): void => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('sanovia-language', lang);
  }
};

// Available languages
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export default i18n;
