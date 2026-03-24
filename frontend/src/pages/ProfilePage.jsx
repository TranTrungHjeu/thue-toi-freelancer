import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { formatDateTime, formatRole } from '../utils/formatters';

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile();
      addToast(t('toasts.profile.refreshSuccess'), 'success');
    } catch (error) {
      addToast(error?.message || t('toasts.profile.refreshError'), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Hồ sơ
          </Caption>
          <H1 className="mt-3 text-4xl">
            Hồ sơ hiện tại được đồng bộ trực tiếp từ hệ thống.
          </H1>
          <Text className="mt-4 text-slate-600">
            Đây là thông tin chính thức của tài khoản đang đăng nhập, giúp các màn hình luôn hiển thị đúng vai trò và trạng thái sử dụng.
          </Text>
          <div className="mt-6">
            <Button variant="outline" onClick={handleRefreshProfile}>
              Tải lại hồ sơ
            </Button>
          </div>
        </Card>

        <Callout type="info" title="Khu làm việc nhận biết vai trò">
          {user?.role === 'customer'
            ? 'Khách hàng sẽ tiếp tục tới luồng đăng dự án, xem báo giá và theo dõi hợp đồng.'
            : 'Người tìm việc sẽ tiếp tục tới luồng tìm dự án đang tuyển, gửi báo giá và quản lý báo giá đã nộp.'}
        </Callout>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Danh tính
          </Caption>
          <H2 className="mt-2 text-2xl">
            Thông tin cơ bản
          </H2>
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Họ tên</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user?.fullName}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Email</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user?.email}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Vai trò</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{formatRole(user?.role, locale)}</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Chi tiết tài khoản
          </Caption>
          <H2 className="mt-2 text-2xl">
            Trạng thái và mô tả
          </H2>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge color={user?.verified ? 'success' : 'warning'}>
              {user?.verified ? 'Email đã xác thực' : 'Chưa xác thực'}
            </Badge>
            <Badge color={user?.isActive ? 'success' : 'error'}>
              {user?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
            </Badge>
          </div>
          <Text className="mt-5 text-sm text-slate-600">
            {user?.profileDescription || 'Tài khoản này chưa cập nhật mô tả hồ sơ.'}
          </Text>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Tạo lúc
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user?.createdAt, locale)}
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Cập nhật gần nhất
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user?.updatedAt, locale)}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ProfilePage;
