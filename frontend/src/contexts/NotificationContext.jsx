"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import marketplaceApi from '../api/marketplaceApi';
import { NotificationContext } from './notification-context';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { useWebSocket } from '../hooks/useWebSocket';

const NOTIFICATION_TOPIC = '/user/queue/notifications';
const GLOBAL_NOTIFICATION_TOPIC = '/topic/global-notifications';
const NOTIFICATION_SYNC_CHANNEL = 'thue-toi-notification-sync';
const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_FILTERS = {
  type: 'all',
  readStatus: 'all',
  archived: 'active',
  q: '',
};

const DEFAULT_PAGE_INFO = {
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  totalNotifications: 0,
  unreadCount: 0,
};

const sortByNewest = (items) =>
  [...items].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));

const upsertNotification = (items, notification) => {
  if (!notification?.id) {
    return items;
  }

  const exists = items.some((item) => item.id === notification.id);
  const nextItems = exists
    ? items.map((item) => (item.id === notification.id ? { ...item, ...notification } : item))
    : [notification, ...items];

  return sortByNewest(nextItems);
};

const createTabId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

const normalizePageData = (data = {}) => ({
  notifications: sortByNewest(data.notifications || []),
  page: Number.isFinite(data.page) ? data.page : 0,
  size: Number.isFinite(data.size) ? data.size : DEFAULT_PAGE_SIZE,
  totalElements: Number.isFinite(data.totalElements) ? data.totalElements : 0,
  totalPages: Number.isFinite(data.totalPages) ? data.totalPages : 0,
  totalNotifications: Number.isFinite(data.totalNotifications) ? data.totalNotifications : 0,
  unreadCount: Number.isFinite(data.unreadCount) ? data.unreadCount : 0,
});

const matchesNotificationFilters = (notification, currentFilters) => {
  if (!notification?.id) {
    return false;
  }
  if (currentFilters.archived === 'archived') {
    return false;
  }
  if (currentFilters.type !== 'all' && notification.type !== currentFilters.type) {
    return false;
  }
  if (currentFilters.readStatus === 'unread' && notification.isRead) {
    return false;
  }

  const query = `${currentFilters.q || ''}`.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [notification.title, notification.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();
  const tabIdRef = useRef(createTabId());
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pageInfo, setPageInfo] = useState(DEFAULT_PAGE_INFO);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [updatingReadIds, setUpdatingReadIds] = useState([]);
  const [archivingIds, setArchivingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const reloadNotifications = useCallback(async ({
    manual = false,
    silent = false,
    nextPage = page,
    nextFilters = filters,
  } = {}) => {
    if (!user?.id) {
      setNotifications([]);
      setPageInfo(DEFAULT_PAGE_INFO);
      return [];
    }

    if (manual) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await marketplaceApi.getNotificationsPage({
        page: nextPage,
        size: pageSize,
        type: nextFilters.type === 'all' ? undefined : nextFilters.type,
        unreadOnly: nextFilters.readStatus === 'unread',
        archived: nextFilters.archived === 'archived',
        q: nextFilters.q || undefined,
      });
      const nextPageData = normalizePageData(response.data || {});
      setNotifications(nextPageData.notifications);
      setPageInfo({
        page: nextPageData.page,
        size: nextPageData.size,
        totalElements: nextPageData.totalElements,
        totalPages: nextPageData.totalPages,
        totalNotifications: nextPageData.totalNotifications,
        unreadCount: nextPageData.unreadCount,
      });
      return nextPageData.notifications;
    } catch (error) {
      if (!silent) {
        addToast(error?.message || t('toasts.notifications.loadError'), 'error');
      }
      return [];
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [addToast, filters, page, pageSize, t, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setPage(0);
      setFilters(DEFAULT_FILTERS);
      setPageInfo(DEFAULT_PAGE_INFO);
      return;
    }
    reloadNotifications({ silent: true });
  }, [reloadNotifications, user?.id]);

  const postSyncEvent = useCallback((eventType, payload = {}) => {
    if (!user?.id || typeof window === 'undefined') {
      return;
    }

    const message = {
      eventType,
      userId: user.id,
      sourceId: tabIdRef.current,
      payload,
      createdAt: Date.now(),
    };

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(NOTIFICATION_SYNC_CHANNEL);
      channel.postMessage(message);
      channel.close();
      return;
    }

    try {
      window.localStorage.setItem(NOTIFICATION_SYNC_CHANNEL, JSON.stringify(message));
    } catch {
      // localStorage can be unavailable in restricted browsing contexts.
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') {
      return undefined;
    }

    const handleSyncMessage = (message) => {
      if (!message || message.userId !== user.id || message.sourceId === tabIdRef.current) {
        return;
      }
      reloadNotifications({ silent: true });
    };

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(NOTIFICATION_SYNC_CHANNEL);
      channel.onmessage = (event) => handleSyncMessage(event.data);
    }

    const handleStorage = (event) => {
      if (event.key !== NOTIFICATION_SYNC_CHANNEL || !event.newValue) {
        return;
      }
      try {
        handleSyncMessage(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed cross-tab messages.
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [reloadNotifications, user?.id]);

  const handleRealtimeNotification = useCallback(({ channel, payload }) => {
    if (!payload) {
      return;
    }

    // Handle global broadcast or personal notification. Local upsert + optimistic count = smooth insert (no full reload/jump when mini list open).
    // Global signal no longer increments count (prevents double-counting when user queue also delivers payload).
    if (typeof payload === 'string' && payload === 'NEW_BROADCAST') {
      return;
    }

    if (channel !== 'notification' || !payload?.id) {
      return;
    }

    const alreadyVisible = notificationsRef.current.some((notification) => notification.id === payload.id);
    const shouldShowInCurrentPage = matchesNotificationFilters(payload, filters);

    if (shouldShowInCurrentPage) {
      setNotifications((previous) => upsertNotification(previous, payload));
    }

    if (!alreadyVisible) {
      setPageInfo((prev) => ({
        ...prev,
        unreadCount: (prev?.unreadCount || 0) + (payload.isRead ? 0 : 1),
        totalNotifications: (prev?.totalNotifications || 0) + 1,
        totalElements: shouldShowInCurrentPage ? (prev?.totalElements || 0) + 1 : prev?.totalElements || 0,
      }));
    }
  }, [filters, setNotifications, setPageInfo]);

  const notificationTopics = useMemo(() => (user?.id ? [NOTIFICATION_TOPIC, GLOBAL_NOTIFICATION_TOPIC] : []), [user?.id]);

  const {
    isConnected: isRealtimeConnected,
    connectionVersion,
  } = useWebSocket(
    handleRealtimeNotification,
    notificationTopics,
  );

  useEffect(() => {
    if (!user?.id || connectionVersion === 0) {
      return;
    }
    reloadNotifications({ silent: true });
  }, [connectionVersion, reloadNotifications, user?.id]);

  const markAsRead = useCallback(async (notificationId, { silent = false } = {}) => {
    if (!notificationId) {
      return null;
    }

    const currentNotification = notifications.find((notification) => notification.id === notificationId);
    if (currentNotification?.isRead) {
      return currentNotification;
    }

    setUpdatingReadIds((previous) => [...new Set([...previous, notificationId])]);
    try {
      const response = await marketplaceApi.markNotificationAsRead(notificationId);
      setNotifications((previous) => upsertNotification(previous, response.data));
      await reloadNotifications({ silent: true });
      postSyncEvent('notification-read', { notificationId });
      if (!silent) {
        addToast(t('toasts.notifications.markReadSuccess'), 'success');
      }
      return response.data;
    } catch (error) {
      if (!silent) {
        addToast(error?.message || t('toasts.notifications.updateError'), 'error');
      }
      throw error;
    } finally {
      setUpdatingReadIds((previous) => previous.filter((id) => id !== notificationId));
    }
  }, [addToast, notifications, postSyncEvent, reloadNotifications, t]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) {
      return { updatedCount: 0 };
    }

    setMarkingAllRead(true);
    try {
      const response = await marketplaceApi.markAllNotificationsAsRead();
      setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true })));
      await reloadNotifications({ silent: true });
      postSyncEvent('notifications-read-all');
      addToast(t('toasts.notifications.markAllReadSuccess'), 'success');
      return response.data;
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.updateError'), 'error');
      throw error;
    } finally {
      setMarkingAllRead(false);
    }
  }, [addToast, postSyncEvent, reloadNotifications, t, user?.id]);

  const archiveNotification = useCallback(async (notificationId) => {
    if (!notificationId) {
      return null;
    }

    setArchivingIds((previous) => [...new Set([...previous, notificationId])]);
    try {
      const response = await marketplaceApi.archiveNotification(notificationId);
      setNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));
      await reloadNotifications({ silent: true });
      postSyncEvent('notification-archived', { notificationId });
      addToast(t('toasts.notifications.archiveSuccess'), 'success');
      return response.data;
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.updateError'), 'error');
      throw error;
    } finally {
      setArchivingIds((previous) => previous.filter((id) => id !== notificationId));
    }
  }, [addToast, postSyncEvent, reloadNotifications, t]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!notificationId) {
      return null;
    }

    setDeletingIds((previous) => [...new Set([...previous, notificationId])]);
    try {
      await marketplaceApi.deleteNotification(notificationId);
      setNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));
      await reloadNotifications({ silent: true });
      postSyncEvent('notification-deleted', { notificationId });
      addToast(t('toasts.notifications.deleteSuccess'), 'success');
      return true;
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.updateError'), 'error');
      throw error;
    } finally {
      setDeletingIds((previous) => previous.filter((id) => id !== notificationId));
    }
  }, [addToast, postSyncEvent, reloadNotifications, t]);

  const setNotificationPage = useCallback((nextPage) => {
    setPage(Math.max(0, Number(nextPage) || 0));
  }, []);

  const setNotificationFilters = useCallback((nextFilters) => {
    setFilters((previous) => ({ ...previous, ...nextFilters }));
    setPage(0);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount: pageInfo.unreadCount,
    totalNotifications: pageInfo.totalNotifications,
    page,
    pageSize,
    pageInfo,
    filters,
    loading,
    reloading,
    updatingReadIds,
    archivingIds,
    deletingIds,
    markingAllRead,
    isRealtimeConnected,
    reloadNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    setNotificationPage,
    setNotificationFilters,
  }), [
    archiveNotification,
    archivingIds,
    deleteNotification,
    deletingIds,
    filters,
    isRealtimeConnected,
    loading,
    markAllAsRead,
    markAsRead,
    markingAllRead,
    notifications,
    page,
    pageInfo,
    pageSize,
    reloading,
    reloadNotifications,
    setNotificationFilters,
    setNotificationPage,
    updatingReadIds,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
