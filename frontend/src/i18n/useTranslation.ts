import { create } from 'zustand';
import { Locale, TRANSLATIONS } from './translations';

interface I18nState {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: (localStorage.getItem('opspages_locale') as Locale) || 'pt-BR',
  setLocale: (loc: Locale) => {
    localStorage.setItem('opspages_locale', loc);
    set({ locale: loc });
  },
  t: (key: string, fallback?: string) => {
    const loc = get().locale;
    return TRANSLATIONS[loc]?.[key] || TRANSLATIONS['pt-BR']?.[key] || fallback || key;
  },
}));
