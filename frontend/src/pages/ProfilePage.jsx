import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { formatDateTime, formatRole } from '../utils/formatters';

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile();
      addToast('Da dong bo lai profile tu backend.', 'success');
    } catch (error) {
      addToast(error?.message || 'Khong the dong bo profile.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Profile
          </Caption>
          <H1 className="mt-3 text-4xl">
            Ho so hien tai duoc doc truc tiep tu backend.
          </H1>
          <Text className="mt-4 text-slate-600">
            Day la nguon du lieu auth chinh thuc cua frontend sau khi login, khong tra ve password hash va khong phu thuoc state mock.
          </Text>
          <div className="mt-6">
            <Button variant="outline" onClick={handleRefreshProfile}>
              Tai lai profile
            </Button>
          </div>
        </Card>

        <Callout type="info" title="Role-aware workspace">
          {user?.role === 'customer'
            ? 'Customer se duoc dan tiep sang flow tao project, xem bid va theo doi hop dong.'
            : 'Freelancer se duoc dan tiep sang flow duyet project dang mo, gui bid va quan ly proposal da nop.'}
        </Callout>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Identity
          </Caption>
          <H2 className="mt-2 text-2xl">
            Thong tin co ban
          </H2>
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Ho ten</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user?.fullName}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Email</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user?.email}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Vai tro</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{formatRole(user?.role)}</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Account detail
          </Caption>
          <H2 className="mt-2 text-2xl">
            Trang thai va mo ta
          </H2>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge color={user?.verified ? 'success' : 'warning'}>
              {user?.verified ? 'Verified email' : 'Chua verify'}
            </Badge>
            <Badge color={user?.isActive ? 'success' : 'error'}>
              {user?.isActive ? 'Active' : 'Locked'}
            </Badge>
          </div>
          <Text className="mt-5 text-sm text-slate-600">
            {user?.profileDescription || 'Tai khoan nay chua cap nhat profile description.'}
          </Text>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Tao luc
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user?.createdAt)}
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Cap nhat gan nhat
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user?.updatedAt)}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ProfilePage;
