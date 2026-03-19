import React from 'react';
import { Menu } from 'iconoir-react';
import { H2 } from '../common/Typography';
import UserDropdown from './UserDropdown';

/**
 * Standard Header component following "Strict Sharpness".
 * Fixed height, glass effect, consistent spacing.
 */
const Header = ({ user, onOpenMenu }) => {
  return (
    <header className="h-16 w-full fixed top-0 left-0 z-40 glass border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMenu}
          className="lg:hidden p-2 -ml-2 hover:bg-slate-100 transition-colors"
          title="Mở Menu"
        >
          <Menu className="w-6 h-6 text-secondary-900" />
        </button>
        <div className="bg-secondary-900 text-white p-1.5 font-bold text-xl leading-none">TT</div>
        <H2 className="!mb-0 text-xl tracking-tight uppercase hidden sm:block">Thuê Tôi</H2>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm font-semibold italic">Chào khách</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
