import { messages } from './messages';

export const DEFAULT_LOCALE = 'vi';
export const LOCALE_STORAGE_KEY = 'thuetoi.locale';
export const SUPPORTED_LOCALES = Object.keys(messages);

let activeLocale = DEFAULT_LOCALE;

const getByPath = (source, path) =>
  path.split('.').reduce((accumulator, segment) => (accumulator ? accumulator[segment] : undefined), source);

const interpolate = (template, params = {}) =>
  Object.entries(params).reduce(
    (nextTemplate, [key, value]) => nextTemplate.replaceAll(`{${key}}`, String(value)),
    template,
  );

export const resolveLocale = (locale) =>
  SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

export const getStoredLocale = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return resolveLocale(storedLocale || DEFAULT_LOCALE);
};

export const getActiveLocale = () => activeLocale;

export const setActiveLocale = (locale) => {
  activeLocale = resolveLocale(locale);
  return activeLocale;
};

export const getLocaleMessages = (locale = activeLocale) => messages[resolveLocale(locale)] || messages[DEFAULT_LOCALE];

export const t = (key, params = {}, locale = activeLocale) => {
  const resolvedLocale = resolveLocale(locale);
  const localizedValue = getByPath(messages[resolvedLocale], key);
  const fallbackValue = getByPath(messages[DEFAULT_LOCALE], key);
  const value = localizedValue ?? fallbackValue ?? key;

  if (typeof value !== 'string') {
    return value;
  }

  return interpolate(value, params);
};

