"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AnimatePresence } from 'motion/react';
import { Bell, LogOut, Page, Settings, User } from 'iconoir-react';
import { Caption } from '../common/Typography';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRole } from '../../utils/formatters';

const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { logout } = useAuth();
  const { locale, t } = useI18n();
  const { unreadCount } = useNotifications();
  const notificationBadge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;

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
    { icon: Bell, label: t('layout.navigation.notifications'), path: '/workspace/notifications', badge: notificationBadge },
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
            {/* Đã loại bỏ phần hiển thị ID và Email theo yêu cầu */}
            <div className="flex flex-col gap-1 mt-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-secondary-900"
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <item.icon className="h-5 w-5 text-slate-400" />
                    {item.badge && (
                      <span className="absolute -right-2 -top-2 min-w-4 border border-white bg-red-500 px-1 text-[9px] font-black leading-4 text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <button
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                onClick={async () => {
                  await logout();
                  router.replace('/auth/login');
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
