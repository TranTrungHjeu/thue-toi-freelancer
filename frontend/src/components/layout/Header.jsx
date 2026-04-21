import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'iconoir-react';
import { H2 } from '../common/Typography';
import UserDropdown from './UserDropdown';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useI18n } from '../../hooks/useI18n';

const Header = ({ user, onOpenMenu }) => {
  const { t } = useI18n();

  return (
    <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="-ml-2 p-2 transition-colors hover:bg-slate-100 lg:hidden"
          title={t('layout.openMenu')}
        >
          <Menu className="h-6 w-6 text-secondary-900" />
        </button>
        <Link to="/workspace" className="flex items-center gap-3">
          <div className="p-1 px-0 flex items-center justify-center">
            <img src="/favicon.svg" alt="logo" className="h-8 w-8" />
          </div>
          <div className="hidden sm:flex flex-col">
            <H2 className="!mb-0 text-xl tracking-tight uppercase">{t('app.brand')}</H2>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {t('layout.workspace')}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher className="hidden md:inline-flex" />
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('layout.notSignedIn')}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
