import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { en, TranslationKeys } from './en';
import { fr } from './fr';
import { es } from './es';
import { pt } from './pt';
import { de } from './de';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'pt' | 'de' | 'zh' | 'ja' | 'ko';

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  fr,
  es,
  pt,
  de,
  zh,
  ja,
  ko,
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationKeys;
  translate: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'fleetly-language';

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`;
  });
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && Object.keys(translations).includes(stored)) {
          return stored as SupportedLanguage;
        }
        const browserLang = navigator.language.split('-')[0];
        if (Object.keys(translations).includes(browserLang)) {
          return browserLang as SupportedLanguage;
        }
      } catch (e) {
        console.warn('Failed to read language from localStorage:', e);
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[language], key);
    return interpolate(value, params);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, translate, language } = useI18n();
  return { t, translate, language };
}

export { en, fr, es, pt, de, zh, ja, ko };
export type { TranslationKeys };
