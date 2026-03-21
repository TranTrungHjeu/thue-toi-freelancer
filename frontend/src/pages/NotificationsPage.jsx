import React, { useCallback, useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useToast } from '../components/common/Toast';
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
      addToast(error?.message || 'Khong the tai thong bao.', 'error');
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
      addToast('Da danh dau thong bao la da doc.', 'success');
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      addToast(error?.message || 'Khong the cap nhat thong bao.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Notifications
          </Caption>
          <H1 className="mt-3 text-4xl">
            Quan ly thong bao va cap nhat nghiep vu moi nhat.
          </H1>
          <Text className="mt-4 text-slate-600">
            Frontend dang dung endpoint `/notifications/user/me` de lay thong bao dung theo current principal thay vi truyen userId thu cong.
          </Text>
        </Card>

        <Callout type="success" title="Principal-based endpoint">
          Day la mot trong nhung luong da duoc chuan hoa theo auth moi: thong bao cua toi duoc lay truc tiep tu token hien tai.
        </Callout>
      </section>

      <Card className="border-2 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              Inbox
            </Caption>
            <H2 className="mt-2 text-2xl">
              Tat ca thong bao
            </H2>
          </div>
          <Button variant="outline" onClick={loadNotifications}>
            Tai lai
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
                  {notification.isRead ? 'Da doc' : 'Moi'}
                </Badge>
              </div>
              <Text className="mt-3 text-sm text-slate-600">
                {notification.content}
              </Text>
              {!notification.isRead && (
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                    Danh dau da doc
                  </Button>
                </div>
              )}
            </div>
          ))}

          {!loading && notifications.length === 0 && (
            <Callout type="info" title="Khong co thong bao">
              He thong hien chua co ban ghi thong bao nao cho tai khoan hien tai.
            </Callout>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
