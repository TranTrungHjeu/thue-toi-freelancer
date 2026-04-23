import React from 'react';
import { NavLink } from 'react-router-dom';
import { Caption } from '../common/Typography';

const Sidebar = ({ navigation = [], currentPath = '' }) => {
  return (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-slate-200/80 bg-white/85 py-6 backdrop-blur-sm">
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navigation.map((group) => (
          <div key={group.title} className="mb-4 border-b border-slate-100 pb-4 last:mb-0 last:border-b-0 last:pb-0">
            <Caption className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {group.title}
            </Caption>
            <div className="mt-2 flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = currentPath === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 border-l-4 px-3 py-3 text-sm font-semibold transition-all ${
                      isActive
                          ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-secondary-900'
                    }`}
                  >
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <item.icon className="h-5 w-5" />
                      {item.badge && (
                        <span
                          className="absolute -right-2 -top-2 min-w-4 border border-white bg-red-500 px-1 text-[9px] font-black leading-4 text-white"
                          aria-label={item.badgeLabel}
                        >
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
