import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import marketplaceApi from '../api/marketplaceApi';
import { formatDateTime, getNotificationTypeMeta } from '../utils/formatters';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketplaceApi.getNotificationsMe();
      setNotifications(response.data || []);
    } catch (error) {
      addToast(error?.message || t('toasts.notifications.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
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
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Thông báo
          </Caption>
          <H1 className="mt-3 text-4xl">
            Quản lý thông báo và cập nhật nghiệp vụ mới nhất.
          </H1>
          <Text className="mt-4 text-slate-600">
            Danh sách này tự động hiển thị đúng theo tài khoản đang đăng nhập, giúp bạn theo dõi thông tin mới mà không cần thao tác bổ sung.
          </Text>
        </Card>

        <Callout type="success" title="Thông báo theo đúng tài khoản">
          Hệ thống chỉ hiển thị thông báo thuộc về tài khoản hiện tại, giúp đảm bảo đúng người, đúng việc và đúng thời điểm.
        </Callout>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-slate-200 bg-white p-5">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Tổng thông báo
          </Caption>
          <div className="mt-4 text-4xl font-black text-secondary-900">
            {loading ? '...' : notifications.length}
          </div>
        </Card>
        <Card className="border-2 border-slate-200 bg-white p-5">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Chưa đọc
          </Caption>
          <div className="mt-4 text-4xl font-black text-secondary-900">
            {loading ? '...' : unreadCount}
          </div>
        </Card>
      </section>

      <Card className="border-2 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              Hộp thư
            </Caption>
            <H2 className="mt-2 text-2xl">
              Tất cả thông báo
            </H2>
          </div>
          <Button variant="outline" onClick={loadNotifications}>
            Tải lại
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="border border-slate-200 bg-slate-50 p-4">
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
                  {notification.isRead ? 'Đã đọc' : 'Mới'}
                </Badge>
              </div>
              <Text className="mt-3 text-sm text-slate-600">
                {notification.content}
              </Text>
              {(notification.link || !notification.isRead) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {notification.link && (
                    <Button variant="outline" onClick={() => navigate(notification.link)}>
                      Mở liên kết
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {!loading && notifications.length === 0 && (
            <Callout type="info" title="Chưa có thông báo">
              Khi có cập nhật liên quan đến tài khoản, dự án hoặc hợp đồng, hệ thống sẽ hiển thị tại đây.
            </Callout>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
