import React from 'react';
import { Link } from 'react-router-dom';

import { Menu } from 'iconoir-react';
import { H2 } from '../common/Typography';
import UserDropdown from './UserDropdown';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from './NotificationBell';
import { useI18n } from '../../hooks/useI18n';

const Header = ({ user, onOpenMenu }) => {
  const { t } = useI18n();

  return (
    <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="p-2 -ml-2 transition-colors hover:bg-slate-100 lg:hidden"
          title={t('layout.openMenu')}
        >
          <Menu className="h-6 w-6 text-secondary-900" />
        </button>
        <Link to="/workspace" className="flex items-center gap-3 active:scale-95 transition-transform">
          <img src="/favicon.svg" alt="logo" className="h-9 w-9 object-contain" />
          <div className="hidden sm:flex flex-col justify-center">
            <H2 className="!mb-0 text-lg font-black tracking-tight text-slate-900">
              ThuêTôi<span className="text-primary-600 font-extrabold">.vn</span>
            </H2>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary-600 leading-none mt-0.5">
              {t('layout.workspace') || 'Workspace'}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher className="hidden md:inline-flex" />
        {user && <NotificationBell />}
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm font-semibold italic">{t('layout.notSignedIn')}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

