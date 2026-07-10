import { createContext, useContext, useState } from 'react';
import { translate, LANGUAGES } from '../i18n/translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('snj_lang') || 'en');

  function changeLang(code) {
    setLang(code);
    localStorage.setItem('snj_lang', code);
    const dir = LANGUAGES.find(l => l.code === code)?.dir || 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', code);
  }

  function t(key) {
    return translate(key, lang);
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
