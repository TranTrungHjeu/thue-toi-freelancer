"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Bell, LogOut, Page, Settings, User } from 'iconoir-react';
import { Caption } from '../common/Typography';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { formatRole } from '../../utils/formatters';

const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { locale, t } = useI18n();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: t('layout.navigation.profile'), path: '/workspace/profile' },
    { icon: Page, label: t('layout.navigation.projects'), path: '/workspace/projects' },
    { icon: Bell, label: t('layout.navigation.notifications'), path: '/workspace/notifications' },
    { icon: Settings, label: t('layout.navigation.dashboard'), path: '/workspace' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border border-transparent p-1 transition-colors hover:border-slate-200 hover:bg-slate-50"
      >
        <Avatar size="sm" src={user?.avatarUrl || user?.avatar} />
        <div className="hidden flex-col items-start leading-none pr-2 md:flex">
          <span className="text-sm font-bold text-secondary-900">{user?.fullName || user?.name || t('common.account')}</span>
          <Caption className="text-[10px] uppercase font-bold text-primary-600">{formatRole(user?.role, locale)}</Caption>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-64 border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="mb-2 border-b border-slate-100 px-3 py-4">
              <span className="block text-sm font-bold text-secondary-900">{user?.email}</span>
              <Caption>ID: #{user?.id || '---'}</Caption>
            </div>

            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-secondary-900"
                >
                  <item.icon className="h-5 w-5 text-slate-400" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <button
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                onClick={async () => {
                  await logout();
                  navigate('/auth/login', { replace: true });
                }}
              >
                <LogOut className="h-5 w-5" />
                {t('layout.logout')}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
