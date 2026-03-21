import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'iconoir-react';
import { H2 } from '../common/Typography';
import UserDropdown from './UserDropdown';

const Header = ({ user, onOpenMenu }) => {
  return (
    <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="p-2 -ml-2 transition-colors hover:bg-slate-100 lg:hidden"
          title="Mo menu"
        >
          <Menu className="h-6 w-6 text-secondary-900" />
        </button>
        <Link to="/workspace" className="flex items-center gap-3">
          <div className="bg-secondary-900 p-1.5 text-xl font-bold leading-none text-white">TT</div>
          <div className="hidden sm:flex flex-col">
            <H2 className="!mb-0 text-xl tracking-tight uppercase">Thuê Tôi</H2>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Freelancer Workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm font-semibold italic">Chua dang nhap</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
