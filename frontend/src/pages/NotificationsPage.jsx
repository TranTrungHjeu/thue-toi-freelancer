import React, { useCallback, useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import marketplaceApi from '../api/marketplaceApi';
import { formatDateTime } from '../utils/formatters';

const NotificationsPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketplaceApi.getNotificationsMe();
      setNotifications(response.data || []);
    } catch (error) {
      addToast(error?.message || 'Không thể tải thông báo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await marketplaceApi.markNotificationAsRead(notificationId);
      addToast('Đã đánh dấu thông báo là đã đọc.', 'success');
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      addToast(error?.message || 'Không thể cập nhật thông báo.', 'error');
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
            Frontend đang dùng endpoint <code>/notifications/user/me</code> để lấy thông báo đúng theo current principal thay vì truyền userId thủ công.
          </Text>
        </Card>

        <Callout type="success" title="Endpoint theo principal">
          Đây là một trong những luồng đã được chuẩn hoá theo auth mới: thông báo của tôi được lấy trực tiếp từ token hiện tại.
        </Callout>
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
                  <Caption className="text-xs text-slate-500">
                    {formatDateTime(notification.createdAt)}
                  </Caption>
                </div>
                <Badge color={notification.isRead ? 'info' : 'warning'}>
                  {notification.isRead ? 'Đã đọc' : 'Mới'}
                </Badge>
              </div>
              <Text className="mt-3 text-sm text-slate-600">
                {notification.content}
              </Text>
              {!notification.isRead && (
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                    Đánh dấu đã đọc
                  </Button>
                </div>
              )}
            </div>
          ))}

          {!loading && notifications.length === 0 && (
            <Callout type="info" title="Không có thông báo">
              Hệ thống hiện chưa có bản ghi thông báo nào cho tài khoản hiện tại.
            </Callout>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
