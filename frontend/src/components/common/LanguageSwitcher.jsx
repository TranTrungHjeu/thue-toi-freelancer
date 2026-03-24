import React from 'react';
import { useI18n } from '../../hooks/useI18n';

const LanguageSwitcher = ({ className = '' }) => {
  const { locale, setLocale, availableLocales, t } = useI18n();

  return (
    <div className={`inline-flex items-center border border-slate-200 bg-white ${className}`}>
      {availableLocales.map((nextLocale) => {
        const isActive = locale === nextLocale;

        return (
          <button
            key={nextLocale}
            type="button"
            onClick={() => setLocale(nextLocale)}
            title={t(`locales.${nextLocale}`)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
              isActive
                ? 'bg-secondary-900 text-white'
                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary-900'
            }`}
          >
            {nextLocale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
