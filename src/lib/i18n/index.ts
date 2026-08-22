import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window !== 'undefined' ? localStorage.getItem('milyfe-lang') || 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
