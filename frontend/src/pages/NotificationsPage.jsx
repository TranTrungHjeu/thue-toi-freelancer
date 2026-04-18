import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import Spinner from '../components/common/Spinner';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import marketplaceApi from '../api/marketplaceApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDateTime, getNotificationTypeMeta } from '../utils/formatters';

const getNotificationsPageCopy = (locale) => {
  if (locale === 'en') {
    return {
      heroCaption: 'Notifications',
      heroTitle: 'Track the latest business updates in one place.',
      heroDescription: 'This inbox is tied directly to the signed-in account so you can follow project, bid, and contract activity without extra refresh steps.',
      statsTotal: 'Total notifications',
      statsUnread: 'Unread',
      inboxCaption: 'Inbox',
      inboxTitle: 'All notifications',
      reload: 'Reload',
      reloadLoading: 'Reloading...',
      loadingList: 'Loading notifications...',
      openLink: 'Open link',
      markRead: 'Mark as read',
      markReadLoading: 'Updating...',
      emptyTitle: 'No notifications yet',
      emptyDescription: 'When there are updates related to your account, projects, or contracts, they will appear here.',
      readStatus: 'Read',
      newStatus: 'New',
      realtimeConnected: 'Connected',
      realtimeDisconnected: 'Waiting',
      realtimeToast: 'New notification received.',
    };
  }

  return {
    heroCaption: 'Thông báo',
    heroTitle: 'Theo dõi các cập nhật nghiệp vụ mới nhất tại một nơi.',
    heroDescription: 'Hộp thư này gắn trực tiếp với tài khoản đang đăng nhập, giúp bạn theo dõi thay đổi của dự án, báo giá và hợp đồng mà không cần thao tác bổ sung.',
    statsTotal: 'Tổng thông báo',
    statsUnread: 'Chưa đọc',
    inboxCaption: 'Hộp thư',
    inboxTitle: 'Tất cả thông báo',
    reload: 'Tải lại',
    reloadLoading: 'Đang tải lại...',
    loadingList: 'Đang tải danh sách thông báo...',
    openLink: 'Mở liên kết',
    markRead: 'Đánh dấu đã đọc',
    markReadLoading: 'Đang cập nhật...',
    emptyTitle: 'Chưa có thông báo',
    emptyDescription: 'Khi có cập nhật liên quan đến tài khoản, dự án hoặc hợp đồng, hệ thống sẽ hiển thị tại đây.',
    readStatus: 'Đã đọc',
    newStatus: 'Mới',
    realtimeConnected: 'Đã kết nối',
    realtimeDisconnected: 'Đang chờ',
    realtimeToast: 'Có thông báo mới.',
  };
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = useMemo(() => getNotificationsPageCopy(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const visibleLoading = useMinimumLoadingState(loading, 700);
  const [notifications, setNotifications] = useState([]);
  const [reloading, setReloading] = useState(false);
  const [updatingReadIds, setUpdatingReadIds] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = useCallback(async (manual = false) => {
    if (manual) {
      setReloading(true);
    }
    setLoading(true);
    try {
      const response = await marketplaceApi.getNotificationsMe();
      setNotifications(response.data || []);
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.loadError'), 'error');
    } finally {
      setLoading(false);
      if (manual) {
        setReloading(false);
      }
    }
  }, [addToast, t]);

  const handleRealtimeNotification = useCallback(({ channel, payload }) => {
    if (channel !== 'notification' || !payload) {
      return;
    }

    setNotifications((previous) => {
      const existingNotification = previous.find((notification) => notification.id === payload.id);
      if (existingNotification) {
        return previous.map((notification) => (
          notification.id === payload.id ? { ...notification, ...payload } : notification
        ));
      }
      return [payload, ...previous];
    });
    addToast(copy.realtimeToast, 'info');
  }, [addToast, copy.realtimeToast]);

  const { isConnected: isRealtimeConnected } = useWebSocket(handleRealtimeNotification, ['/user/queue/notifications']);

  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    setUpdatingReadIds((previous) => [...new Set([...previous, notificationId])]);
    try {
      await marketplaceApi.markNotificationAsRead(notificationId);
      addToast(t('toasts.notifications.markReadSuccess'), 'success');
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.updateError'), 'error');
    } finally {
      setUpdatingReadIds((previous) => previous.filter((id) => id !== notificationId));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.heroCaption}
          </Caption>
          <H1 className="mt-3 text-4xl">
            {copy.heroTitle}
          </H1>
          <Text className="mt-4 text-slate-600">
            {copy.heroDescription}
          </Text>
          <div className="mt-5 flex items-center gap-3">
            <Badge color={isRealtimeConnected ? 'success' : 'warning'}>
              {isRealtimeConnected ? copy.realtimeConnected : copy.realtimeDisconnected}
            </Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatMetricCard label={copy.statsTotal} value={notifications.length} isLoading={visibleLoading} />
        <StatMetricCard label={copy.statsUnread} value={unreadCount} isLoading={visibleLoading} />
      </section>

      <Card className="border-2 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              {copy.inboxCaption}
            </Caption>
            <H2 className="mt-2 text-2xl">
              {copy.inboxTitle}
            </H2>
          </div>
          <Button variant="outline" disabled={reloading} onClick={() => loadNotifications(true)}>
            {reloading ? copy.reloadLoading : copy.reload}
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {visibleLoading && (
            <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-5">
              <Spinner size="sm" label={copy.loadingList} />
            </div>
          )}

          {notifications.map((notification) => (
            <InfoPanel key={notification.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-secondary-900">{notification.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge color={getNotificationTypeMeta(notification.type, locale).color}>
                      {getNotificationTypeMeta(notification.type, locale).label}
                    </Badge>
                    <Caption className="text-xs text-slate-500">
                      {formatDateTime(notification.createdAt, locale)}
                    </Caption>
                  </div>
                </div>
                <Badge color={notification.isRead ? 'info' : 'warning'}>
                  {notification.isRead ? copy.readStatus : copy.newStatus}
                </Badge>
              </div>
              <Text className="mt-3 text-sm text-slate-600">
                {notification.content}
              </Text>
              {(notification.link || !notification.isRead) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {notification.link && (
                    <Button variant="outline" onClick={() => navigate(notification.link)}>
                      {copy.openLink}
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      disabled={updatingReadIds.includes(notification.id)}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      {updatingReadIds.includes(notification.id) ? copy.markReadLoading : copy.markRead}
                    </Button>
                  )}
                </div>
              )}
            </InfoPanel>
          ))}

          {!visibleLoading && notifications.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-semibold text-secondary-900">{copy.emptyTitle}</div>
              <div className="mt-2">{copy.emptyDescription}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
