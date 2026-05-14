"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import Spinner from '../components/common/Spinner';
import SearchInput from '../components/common/SearchInput';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useI18n } from '../hooks/useI18n';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import { useNotifications } from '../hooks/useNotifications';
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
      filterType: 'Type',
      filterReadStatus: 'Read status',
      filterArchiveStatus: 'Inbox state',
      filterAllTypes: 'All types',
      filterAllReadStates: 'All',
      filterUnreadOnly: 'Unread only',
      filterActiveOnly: 'Active',
      filterArchivedOnly: 'Archived',
      searchPlaceholder: 'Search title or content',
      reload: 'Reload',
      reloadLoading: 'Reloading...',
      markAllRead: 'Mark all as read',
      markAllReadLoading: 'Updating...',
      loadingList: 'Loading notifications...',
      openLink: 'Open link',
      markRead: 'Mark as read',
      markReadLoading: 'Updating...',
      archive: 'Archive',
      archiveLoading: 'Archiving...',
      delete: 'Delete',
      deleteLoading: 'Deleting...',
      emptyTitle: 'No notifications yet',
      emptyDescription: 'When there are updates related to your account, projects, or contracts, they will appear here.',
      readStatus: 'Read',
      newStatus: 'New',
      realtimeConnected: 'Connected',
      realtimeDisconnected: 'Waiting',
      realtimeToast: 'New notification received.',
      paginationRange: '{from} - {to} of {total}',
      previousPage: 'Previous',
      nextPage: 'Next',
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
    filterType: 'Loại thông báo',
    filterReadStatus: 'Trạng thái đọc',
    filterArchiveStatus: 'Trạng thái hộp thư',
    filterAllTypes: 'Tất cả loại',
    filterAllReadStates: 'Tất cả',
    filterUnreadOnly: 'Chỉ chưa đọc',
    filterActiveOnly: 'Đang hiển thị',
    filterArchivedOnly: 'Đã lưu trữ',
    searchPlaceholder: 'Tìm theo tiêu đề hoặc nội dung',
    reload: 'Tải lại',
    reloadLoading: 'Đang tải lại...',
    markAllRead: 'Đánh dấu tất cả đã đọc',
    markAllReadLoading: 'Đang cập nhật...',
    loadingList: 'Đang tải danh sách thông báo...',
    openLink: 'Mở liên kết',
    markRead: 'Đánh dấu đã đọc',
    markReadLoading: 'Đang cập nhật...',
    archive: 'Lưu trữ',
    archiveLoading: 'Đang lưu trữ...',
    delete: 'Xóa',
    deleteLoading: 'Đang xóa...',
    emptyTitle: 'Chưa có thông báo',
    emptyDescription: 'Khi có cập nhật liên quan đến tài khoản, dự án hoặc hợp đồng, hệ thống sẽ hiển thị tại đây.',
    readStatus: 'Đã đọc',
    newStatus: 'Mới',
    realtimeConnected: 'Đã kết nối',
    realtimeDisconnected: 'Đang chờ',
    realtimeToast: 'Có thông báo mới.',
    paginationRange: '{from} - {to} trên {total}',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
  };
};

const NotificationsPage = () => {
  const router = useRouter();
  const { locale } = useI18n();
  const copy = useMemo(() => getNotificationsPageCopy(locale), [locale]);
  const {
    notifications,
    unreadCount,
    totalNotifications,
    page,
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
  } = useNotifications();
  const visibleLoading = useMinimumLoadingState(loading, 700);
  const typeOptions = useMemo(() => ['project', 'bid', 'contract', 'system'].map((type) => ({
    value: type,
    label: getNotificationTypeMeta(type, locale).label,
  })), [locale]);
  const pageFrom = pageInfo.totalElements === 0 ? 0 : page * pageInfo.size + 1;
  const pageTo = Math.min((page + 1) * pageInfo.size, pageInfo.totalElements);
  const rangeText = copy.paginationRange
    .replace('{from}', pageFrom)
    .replace('{to}', pageTo)
    .replace('{total}', pageInfo.totalElements);

  const handleOpenLink = async (notification) => {
    if (!notification?.link) {
      return;
    }
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id, { silent: true });
      } catch {
        // Navigation should not be blocked by a transient read-state update failure.
      }
    }
    router.push(notification.link);
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
        <StatMetricCard label={copy.statsTotal} value={totalNotifications} isLoading={visibleLoading} />
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
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" disabled={markingAllRead || unreadCount === 0} onClick={markAllAsRead}>
              {markingAllRead ? copy.markAllReadLoading : copy.markAllRead}
            </Button>
            <Button variant="outline" disabled={reloading} onClick={() => reloadNotifications({ manual: true })}>
              {reloading ? copy.reloadLoading : copy.reload}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {copy.searchPlaceholder}
            <SearchInput
              value={filters.q || ''}
              onChange={(event) => setNotificationFilters({ q: event.target.value })}
              placeholder={copy.searchPlaceholder}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {copy.filterType}
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-secondary-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              value={filters.type}
              onChange={(event) => setNotificationFilters({ type: event.target.value })}
            >
              <option value="all">{copy.filterAllTypes}</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {copy.filterReadStatus}
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-secondary-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              value={filters.readStatus}
              onChange={(event) => setNotificationFilters({ readStatus: event.target.value })}
            >
              <option value="all">{copy.filterAllReadStates}</option>
              <option value="unread">{copy.filterUnreadOnly}</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {copy.filterArchiveStatus}
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-secondary-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              value={filters.archived || 'active'}
              onChange={(event) => setNotificationFilters({ archived: event.target.value })}
            >
              <option value="active">{copy.filterActiveOnly}</option>
              <option value="archived">{copy.filterArchivedOnly}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {visibleLoading && (
            <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-5">
              <Spinner size="sm" label={copy.loadingList} />
            </div>
          )}

          {notifications.map((notification) => (
            (() => {
              const isArchiving = archivingIds.includes(notification.id);
              const isDeleting = deletingIds.includes(notification.id);
              const isUpdating = updatingReadIds.includes(notification.id) || isArchiving || isDeleting;

              return (
            <InfoPanel
              key={notification.id}
              className={`group rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-px ${!notification.isRead
                ? 'border-l-4 border-primary-400 bg-gradient-to-br from-slate-50 to-white shadow-sm'
                : 'border border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`font-serif text-base leading-tight transition-colors duration-200 ${!notification.isRead ? 'font-bold text-secondary-900' : 'font-medium text-slate-700'}`}>{notification.title}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                        {getNotificationTypeMeta(notification.type, locale).label}
                      </span>
                      <Caption className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {formatDateTime(notification.createdAt, locale)}
                      </Caption>
                    </div>
                  </div>
                  <Text className={`mt-2.5 text-sm line-clamp-3 transition-colors duration-200 ${!notification.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                    {notification.content}
                  </Text>
                </div>

              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  {notification.link && (
                    <Button variant="outline" disabled={isUpdating} onClick={() => handleOpenLink(notification)}>
                      {copy.openLink}
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      disabled={isUpdating}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {updatingReadIds.includes(notification.id) ? copy.markReadLoading : copy.markRead}
                    </Button>
                  )}
                  {filters.archived !== 'archived' && (
                    <Button
                      variant="ghost"
                      disabled={isUpdating}
                      onClick={() => archiveNotification(notification.id)}
                    >
                      {isArchiving ? copy.archiveLoading : copy.archive}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    disabled={isUpdating}
                    onClick={() => deleteNotification(notification.id)}
                  >
                    {isDeleting ? copy.deleteLoading : copy.delete}
                  </Button>
              </div>
            </InfoPanel>
              );
            })()
          ))}

          {!visibleLoading && notifications.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 rounded-3xl">
              <div className="font-semibold text-secondary-900">{copy.emptyTitle}</div>
              <div className="mt-2">{copy.emptyDescription}</div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Caption className="text-xs text-slate-500">
            {rangeText}
          </Caption>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={page <= 0 || reloading || loading}
              onClick={() => setNotificationPage(page - 1)}
            >
              {copy.previousPage}
            </Button>
            <Button
              variant="outline"
              disabled={pageInfo.totalPages === 0 || page >= pageInfo.totalPages - 1 || reloading || loading}
              onClick={() => setNotificationPage(page + 1)}
            >
              {copy.nextPage}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
