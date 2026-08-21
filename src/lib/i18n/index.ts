import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', city: 'City', life: 'Life', pocket: 'Pocket', you: 'You' },
      common: { search: 'Search', save: 'Save', cancel: 'Cancel', submit: 'Submit', loading: 'Loading...', back: 'Back' },
      home: { greeting: 'Hey, {{name}}', subtitle: 'Your community is active today.', quick_actions: 'Quick Actions', feed: 'Community Pulse' },
      wallet: { balance: 'Balance', send: 'Send', receive: 'Receive', exchange: 'Exchange', history: 'History' },
      health: { title: 'MiHealth', checkin: 'Daily Check-in', streak: 'Day streak', how_feeling: 'How are you feeling?' },
      rights: { title: 'MiRights', constitution: 'Constitution', situations: 'Situations', tools: 'Tools' },
      mly: { value: '1 MLY = $1 USD', daily_ubi: 'Daily UBI: +$10 MLY', earned: 'Earned', spent: 'Spent' },
    },
  },
  es: {
    translation: {
      nav: { home: 'Inicio', city: 'Ciudad', life: 'Vida', pocket: 'Bolsillo', you: 'Tú' },
      common: { search: 'Buscar', save: 'Guardar', cancel: 'Cancelar', submit: 'Enviar', loading: 'Cargando...', back: 'Atrás' },
      home: { greeting: 'Hola, {{name}}', subtitle: 'Tu comunidad está activa hoy.', quick_actions: 'Acciones Rápidas', feed: 'Pulso Comunitario' },
      wallet: { balance: 'Saldo', send: 'Enviar', receive: 'Recibir', exchange: 'Intercambiar', history: 'Historial' },
      health: { title: 'MiSalud', checkin: 'Registro Diario', streak: 'Días seguidos', how_feeling: '¿Cómo te sientes?' },
      rights: { title: 'MiDerechos', constitution: 'Constitución', situations: 'Situaciones', tools: 'Herramientas' },
      mly: { value: '1 MLY = $1 USD', daily_ubi: 'UBI Diario: +$10 MLY', earned: 'Ganado', spent: 'Gastado' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window !== 'undefined' ? localStorage.getItem('milyfe-lang') || 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
