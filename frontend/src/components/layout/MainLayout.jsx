import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Home, Page, PageSearch, ProfileCircle, ViewGrid, Group, Settings, Reports } from 'iconoir-react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';

const MainLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  const role = (user?.role || '').toLowerCase();

  const navigation = useMemo(() => {
    const commonWorkspaceItems = [
      { label: t('layout.navigation.notifications'), to: '/workspace/notifications', icon: Bell },
      { label: t('layout.navigation.profile'), to: '/workspace/profile', icon: ProfileCircle },
    ];

    if (role === 'admin') {
      return [
        {
          title: t('roles.admin'),
          items: [
            { label: "Tổng quan hệ thống", to: '/workspace/admin/dashboard', icon: Home },
            { label: "Quản lý người dùng", to: '/workspace/admin/users', icon: Group },
            { label: "Quản lý dự án", to: '/workspace/admin/projects', icon: ViewGrid },
            { label: "Thông báo hệ thống", to: '/workspace/notifications', icon: Bell },
          ],
        },
        {
          title: t('layout.navigation.tools'),
          items: [
            { label: "Logs hệ thống", to: '/workspace/contracts', icon: Reports },
            { label: "Cài đặt hệ thống", to: '/workspace/settings', icon: Settings },
          ],
        }
      ];
    }

    if (role === 'customer') {
      return [
        {
          title: t('roles.customer'),
          items: [
            { label: t('layout.navigation.dashboard'), to: '/workspace', icon: Home },
            { label: t('layout.navigation.projects'), to: '/workspace/projects', icon: ViewGrid },
            { label: t('workspaceMessages.contractsPage.participants.customer'), to: '/workspace/contracts', icon: PageSearch },
            ...commonWorkspaceItems,
          ],
        }
      ];
    }

    // Default to freelancer
    return [
      {
        title: t('roles.freelancer'),
        items: [
          { label: t('layout.navigation.dashboard'), to: '/workspace', icon: Home },
          { label: "Tìm việc làm", to: '/workspace/projects', icon: PageSearch },
          { label: "Hợp đồng của tôi", to: '/workspace/contracts', icon: ViewGrid },
          ...commonWorkspaceItems,
        ],
      }
    ];
  }, [role, t]);

  const mobileNavigation = useMemo(() => {
    const baseNav = [
      { label: t('layout.navigation.dashboard'), to: '/workspace', icon: Home },
    ];

    if (role === 'admin') {
      return [
        ...baseNav,
        { label: "Dự án", to: '/workspace/admin/projects', icon: ViewGrid },
        { label: "Người dùng", to: '/workspace/admin/users', icon: Group },
        { label: "Thống kê", to: '/workspace/admin/dashboard', icon: Reports },
      ];
    }

    if (role === 'customer') {
      return [
        ...baseNav,
        { label: "Dự án", to: '/workspace/projects', icon: ViewGrid },
        { label: "Thuê", to: '/workspace/contracts', icon: PageSearch },
        { label: "Hồ sơ", to: '/workspace/profile', icon: ProfileCircle },
      ];
    }

    return [
      ...baseNav,
      { label: "Tìm việc", to: '/workspace/projects', icon: PageSearch },
      { label: "Hợp đồng", to: '/workspace/contracts', icon: ViewGrid },
      { label: "Hồ sơ", to: '/workspace/profile', icon: ProfileCircle },
    ];
  }, [role, t]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_45%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary-100/50 to-transparent" />
      <Header user={user} onOpenMenu={() => setIsDrawerOpen(true)} />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navigation={navigation}
        currentPath={location.pathname}
        onLogout={logout}
      />

      <div className="relative z-10 flex flex-1 pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar navigation={navigation} currentPath={location.pathname} />
        </div>
        <main className="flex-1 overflow-x-hidden p-4 pb-20 md:p-8 lg:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav items={mobileNavigation} currentPath={location.pathname} />
    </div>
  );
};

export default MainLayout;
