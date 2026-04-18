import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'iconoir-react';
import { Caption } from '../common/Typography';
import Button from '../common/Button';
import { useI18n } from '../../hooks/useI18n';

const Sidebar = ({ navigation = [], currentPath = '', onLogout }) => {
  const { t } = useI18n();

  return (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-slate-200/80 bg-white/85 py-6 backdrop-blur-sm">
      <div className="px-6 pb-5">
        <div className="border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {t('layout.workspace')}
          </div>
          <div className="mt-1 text-sm font-semibold text-secondary-900">
            Thuê Tôi
          </div>
        </div>
      </div>
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
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3">
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:border-red-100 hover:bg-red-50" onClick={onLogout}>
          <LogOut className="h-5 w-5" />
          {t('layout.logout')}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
