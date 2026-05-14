"use client";

import { useEffect, useMemo, useState } from 'react';
import { I18nContext } from './i18n-context';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getStoredLocale,
  resolveLocale,
  setActiveLocale,
  t as translate,
} from '../i18n';

export const I18nProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(() => {
    const initialLocale = getStoredLocale();
    setActiveLocale(initialLocale);
    return initialLocale;
  });

  useEffect(() => {
    setActiveLocale(locale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = (nextLocale) => {
    setLocaleState(resolveLocale(nextLocale || DEFAULT_LOCALE));
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      availableLocales: SUPPORTED_LOCALES,
      t: (key, params = {}) => translate(key, params, locale),
    }),
    [locale],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

