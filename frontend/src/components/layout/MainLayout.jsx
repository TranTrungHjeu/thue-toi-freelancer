import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Home, Page, PageSearch, ProfileCircle, ViewGrid } from 'iconoir-react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';

const MainLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      title: 'Workspace',
      items: [
        { label: 'Tong quan', to: '/workspace', icon: Home },
        { label: 'Du an', to: '/workspace/projects', icon: ViewGrid },
        { label: 'Hop dong', to: '/workspace/contracts', icon: PageSearch },
        { label: 'Thong bao', to: '/workspace/notifications', icon: Bell },
        { label: 'Ho so', to: '/workspace/profile', icon: ProfileCircle },
      ],
    },
    {
      title: 'Resources',
      items: [
        { label: 'UI Gallery', to: '/gallery', icon: Page },
        { label: 'API Lab', to: '/api-lab', icon: PageSearch },
      ],
    },
  ];

  const mobileNavigation = [
    { label: 'Tong quan', to: '/workspace', icon: Home },
    { label: 'Du an', to: '/workspace/projects', icon: ViewGrid },
    { label: 'Hop dong', to: '/workspace/contracts', icon: PageSearch },
    { label: 'Thong bao', to: '/workspace/notifications', icon: Bell },
    { label: 'Ho so', to: '/workspace/profile', icon: ProfileCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onOpenMenu={() => setIsDrawerOpen(true)} />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navigation={navigation}
        currentPath={location.pathname}
        onLogout={logout}
      />

      <div className="flex flex-1 pt-16 pb-16 lg:pb-0">
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
