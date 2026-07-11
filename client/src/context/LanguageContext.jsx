import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translate, LANGUAGES } from '../i18n/translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('snj_lang') || 'en');

  const changeLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem('snj_lang', code);
    const dir = LANGUAGES.find(l => l.code === code)?.dir || 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', code);
  }, []);

  const t = useCallback((key) => translate(key, lang), [lang]);

  const value = useMemo(() => ({ lang, changeLang, t, LANGUAGES }), [lang, changeLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
