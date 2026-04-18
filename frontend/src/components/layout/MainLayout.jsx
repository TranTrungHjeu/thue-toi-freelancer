import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Home, Page, PageSearch, ProfileCircle, ViewGrid } from 'iconoir-react';
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

  const navigation = [
    {
      title: t('layout.navigation.workspace'),
      items: [
        { label: t('layout.navigation.dashboard'), to: '/workspace', icon: Home },
        { label: t('layout.navigation.projects'), to: '/workspace/projects', icon: ViewGrid },
        { label: t('layout.navigation.contracts'), to: '/workspace/contracts', icon: PageSearch },
        { label: t('layout.navigation.notifications'), to: '/workspace/notifications', icon: Bell },
        { label: t('layout.navigation.profile'), to: '/workspace/profile', icon: ProfileCircle },
      ],
    },
    {
      title: t('layout.navigation.tools'),
      items: [
        { label: t('layout.navigation.gallery'), to: '/gallery', icon: Page },
        { label: t('layout.navigation.apiLab'), to: '/api-lab', icon: PageSearch },
      ],
    },
  ];

  const mobileNavigation = [
    { label: t('layout.navigation.dashboard'), to: '/workspace', icon: Home },
    { label: t('layout.navigation.projects'), to: '/workspace/projects', icon: ViewGrid },
    { label: t('layout.navigation.contracts'), to: '/workspace/contracts', icon: PageSearch },
    { label: t('layout.navigation.notifications'), to: '/workspace/notifications', icon: Bell },
    { label: t('layout.navigation.profile'), to: '/workspace/profile', icon: ProfileCircle },
  ];

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
          <Sidebar navigation={navigation} currentPath={location.pathname} onLogout={logout} />
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
