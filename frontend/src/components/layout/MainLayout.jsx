import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Home, Page, PageSearch, ProfileCircle, ViewGrid, Group, Settings, Reports, Coins, ShieldCheck, Megaphone, WarningTriangle, Database } from 'iconoir-react';
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
          title: t('layout.adminSections.moderation'),
          items: [
            { label: t('layout.navigation.adminDashboard'), to: '/workspace/admin/dashboard', icon: Home },
            { label: t('layout.navigation.adminUsers'), to: '/workspace/admin/users', icon: Group },
            { label: t('layout.navigation.adminProjects'), to: '/workspace/admin/projects', icon: ViewGrid },
            { label: t('layout.navigation.adminKyc'), to: '/workspace/admin/kyc', icon: ShieldCheck },
            { label: t('layout.navigation.adminReports'), to: '/workspace/admin/reports', icon: WarningTriangle },
          ],
        },
        {
          title: t('layout.adminSections.finance'),
          items: [
            { label: t('layout.navigation.adminFinance'), to: '/workspace/admin/finance', icon: Coins },
            { label: t('layout.navigation.adminWithdrawals'), to: '/workspace/admin/withdrawals', icon: Reports },
          ],
        },
        {
          title: t('layout.adminSections.system'),
          items: [
            { label: t('layout.navigation.adminBroadcast'), to: '/workspace/admin/broadcast', icon: Megaphone },
            { label: t('layout.navigation.adminSkills'), to: '/workspace/admin/skills', icon: Database },
            { label: t('layout.navigation.adminSettings'), to: '/workspace/admin/settings', icon: Settings },
            { label: t('layout.navigation.adminLogs'), to: '/workspace/admin/logs', icon: PageSearch },
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
          { label: t('layout.navigation.findJobs'), to: '/workspace/projects', icon: PageSearch },
          { label: t('layout.navigation.myContracts'), to: '/workspace/contracts', icon: ViewGrid },
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
        { label: t('layout.navigation.projects'), to: '/workspace/admin/projects', icon: ViewGrid },
        { label: t('layout.navigation.adminUsers'), to: '/workspace/admin/users', icon: Group },
        { label: t('layout.navigation.adminFinance'), to: '/workspace/admin/finance', icon: Reports },
      ];
    }

    if (role === 'customer') {
      return [
        ...baseNav,
        { label: t('layout.navigation.projects'), to: '/workspace/projects', icon: ViewGrid },
        { label: t('layout.navigation.rent'), to: '/workspace/contracts', icon: PageSearch },
        { label: t('layout.navigation.profile'), to: '/workspace/profile', icon: ProfileCircle },
      ];
    }

    return [
      ...baseNav,
      { label: t('layout.navigation.findJobs'), to: '/workspace/projects', icon: PageSearch },
      { label: t('layout.navigation.contracts'), to: '/workspace/contracts', icon: ViewGrid },
      { label: t('layout.navigation.profile'), to: '/workspace/profile', icon: ProfileCircle },
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
