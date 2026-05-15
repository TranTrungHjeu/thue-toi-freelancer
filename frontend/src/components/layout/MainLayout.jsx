"use client";

import React, { useState, useMemo } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

import { Bell, Home, Page, PageSearch, ProfileCircle, ViewGrid, Group, Settings, Reports, Coins, ShieldCheck, Megaphone, WarningTriangle, Database } from 'iconoir-react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import LoadingOverlay from '../common/LoadingOverlay';
import AiChatbot from '../features/AiChatbot';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { useNotifications } from '../../hooks/useNotifications';

const MainLayout = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const location = ({ pathname, search: searchParams.toString() });
  const { t } = useI18n();
  const { unreadCount } = useNotifications();

  // Security Route Guard and RBAC
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (user && pathname.startsWith('/workspace/admin') && user.role?.toLowerCase() !== 'admin') {
      router.replace('/workspace');
    }
  }, [loading, user, pathname, router]);

  const role = (user?.role || '').toLowerCase();
  const notificationBadge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;

  const navigation = useMemo(() => {
    const notificationItem = {
      label: t('layout.navigation.notifications'),
      href: '/workspace/notifications',
      icon: Bell,
      badge: notificationBadge,
      badgeLabel: t('notificationsCenter.unreadBadge', { count: unreadCount }),
    };

    const commonWorkspaceItems = [
      notificationItem,
      { label: t('layout.navigation.profile'), href: '/workspace/profile', icon: ProfileCircle },
    ];

    if (role === 'admin') {
      return [
        {
          title: t('layout.adminSections.moderation'),
          items: [
            { label: t('layout.navigation.adminDashboard'), href: '/workspace/admin/dashboard', icon: Home },
            { label: t('layout.navigation.adminUsers'), href: '/workspace/admin/users', icon: Group },
            { label: t('layout.navigation.adminProjects'), href: '/workspace/admin/projects', icon: ViewGrid },
            { label: t('layout.navigation.adminKyc'), href: '/workspace/admin/kyc', icon: ShieldCheck },
            { label: t('layout.navigation.adminReports'), href: '/workspace/admin/reports', icon: WarningTriangle },
          ],
        },
        {
          title: t('layout.adminSections.finance'),
          items: [
            { label: t('layout.navigation.adminFinance'), href: '/workspace/admin/finance', icon: Coins },
            { label: t('layout.navigation.adminWithdrawals'), href: '/workspace/admin/withdrawals', icon: Reports },
          ],
        },
        {
          title: t('layout.adminSections.system'),
          items: [
            { label: t('layout.navigation.adminBroadcast'), href: '/workspace/admin/broadcast', icon: Megaphone },
            { label: t('layout.navigation.adminSkills'), href: '/workspace/admin/skills', icon: Database },
            { label: t('layout.navigation.adminSettings'), href: '/workspace/admin/settings', icon: Settings },
            { label: t('layout.navigation.adminLogs'), href: '/workspace/admin/logs', icon: PageSearch },
            ...commonWorkspaceItems,
          ],
        }
      ];
    }

    if (role === 'customer') {
      return [
        {
          title: t('roles.customer'),
          items: [
            { label: t('layout.navigation.dashboard'), href: '/workspace', icon: Home },
            { label: t('layout.navigation.projects'), href: '/workspace/projects', icon: ViewGrid },
            { label: t('layout.navigation.contracts'), href: '/workspace/contracts', icon: PageSearch },
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
          { label: t('layout.navigation.dashboard'), href: '/workspace', icon: Home },
          { label: t('layout.navigation.findJobs'), href: '/workspace/projects', icon: PageSearch },
          { label: t('layout.navigation.myContracts'), href: '/workspace/contracts', icon: ViewGrid },
          ...commonWorkspaceItems,
        ],
      }
    ];
  }, [notificationBadge, role, t, unreadCount]);

  const mobileNavigation = useMemo(() => {
    const baseNav = [
      { label: t('layout.navigation.dashboard'), href: '/workspace', icon: Home },
    ];
    const notificationItem = {
      label: t('layout.navigation.notifications'),
      href: '/workspace/notifications',
      icon: Bell,
      badge: notificationBadge,
      badgeLabel: t('notificationsCenter.unreadBadge', { count: unreadCount }),
    };

    if (role === 'admin') {
      return [
        ...baseNav,
        { label: t('layout.navigation.projects'), href: '/workspace/admin/projects', icon: ViewGrid },
        { label: t('layout.navigation.adminUsers'), href: '/workspace/admin/users', icon: Group },
        { label: t('layout.navigation.adminFinance'), href: '/workspace/admin/finance', icon: Reports },
        notificationItem,
      ];
    }

    if (role === 'customer') {
      return [
        ...baseNav,
        { label: t('layout.navigation.projects'), href: '/workspace/projects', icon: ViewGrid },
        { label: t('layout.navigation.rent'), href: '/workspace/contracts', icon: PageSearch },
        notificationItem,
        { label: t('layout.navigation.profile'), href: '/workspace/profile', icon: ProfileCircle },
      ];
    }

    return [
      ...baseNav,
      { label: t('layout.navigation.findJobs'), href: '/workspace/projects', icon: PageSearch },
      { label: t('layout.navigation.contracts'), href: '/workspace/contracts', icon: ViewGrid },
      notificationItem,
      { label: t('layout.navigation.profile'), href: '/workspace/profile', icon: ProfileCircle },
    ];
  }, [notificationBadge, role, t, unreadCount]);

  if (loading || !user) {
    return <LoadingOverlay isActive={true} />;
  }

  if (pathname.startsWith('/workspace/admin') && role !== 'admin') {
    return null;
  }

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
            {children}
          </div>
        </main>
      </div>

      <BottomNav items={mobileNavigation} currentPath={location.pathname} />
      <AiChatbot user={user} />
    </div>
  );
};

export default MainLayout;
