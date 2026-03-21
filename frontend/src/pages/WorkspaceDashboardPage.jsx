import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, PageSearch, StatsUpSquare, ViewGrid } from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import marketplaceApi from '../api/marketplaceApi';
import { buildBudgetRange, formatCurrency, formatDate, formatDateTime, formatRole } from '../utils/formatters';

const filterContractsByOwner = (contracts, userId) => {
  return (contracts || []).filter(
    (contract) => contract.clientId === userId || contract.freelancerId === userId,
  );
};

const WorkspaceDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    customerProjects: [],
    marketplaceProjects: [],
    myBids: [],
    contracts: [],
    notifications: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      try {
        const [notificationsResponse, contractsResponse] = await Promise.all([
          marketplaceApi.getNotificationsMe(),
          marketplaceApi.getContractsByUser(user.id),
        ]);

        const notifications = notificationsResponse.data || [];
        const contracts = filterContractsByOwner(contractsResponse.data || [], user.id);

        if (user.role === 'customer') {
          const projectsResponse = await marketplaceApi.getProjectsByUser(user.id);
          setDashboardData({
            customerProjects: projectsResponse.data || [],
            marketplaceProjects: [],
            myBids: [],
            contracts,
            notifications,
          });
        } else {
          const [projectsResponse, bidsResponse] = await Promise.all([
            marketplaceApi.getAllProjects(),
            marketplaceApi.getBidsByFreelancer(user.id),
          ]);

          setDashboardData({
            customerProjects: [],
            marketplaceProjects: (projectsResponse.data || []).filter((project) => project.status === 'open'),
            myBids: bidsResponse.data || [],
            contracts,
            notifications,
          });
        }
      } catch (error) {
        addToast(error?.message || 'Khong the tai dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [addToast, user]);

  const unreadNotifications = dashboardData.notifications.filter((notification) => !notification.isRead).length;

  const statCards = user?.role === 'customer'
    ? [
        { label: 'Du an cua ban', value: dashboardData.customerProjects.length, icon: ViewGrid },
        { label: 'Hop dong lien quan', value: dashboardData.contracts.length, icon: PageSearch },
        { label: 'Thong bao chua doc', value: unreadNotifications, icon: Bell },
      ]
    : [
        { label: 'Project dang mo', value: dashboardData.marketplaceProjects.length, icon: ViewGrid },
        { label: 'Bao gia cua ban', value: dashboardData.myBids.length, icon: StatsUpSquare },
        { label: 'Hop dong lien quan', value: dashboardData.contracts.length, icon: PageSearch },
      ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Dashboard
          </Caption>
          <H1 className="mt-3 text-4xl">
            Chao mung {user?.fullName}, workspace da san sang.
          </H1>
          <Text className="mt-4 text-slate-600">
            Ban dang dang nhap voi vai tro <strong>{formatRole(user?.role)}</strong>. Frontend hien dang bam sat
            cac API auth, project, bid, contract va notification da co san o backend.
          </Text>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/workspace/projects')}>
              {user?.role === 'customer' ? 'Quan ly du an' : 'Tim project va gui bid'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/workspace/contracts')}>
              Xem hop dong
            </Button>
            <Button variant="ghost" onClick={() => navigate('/workspace/profile')}>
              Ho so cua toi
            </Button>
          </div>
        </Card>

        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            Account Status
          </Caption>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge color="success" className="border-slate-600 bg-primary-100 text-primary-800">
              Verified
            </Badge>
            <Badge color={user?.isActive ? 'success' : 'error'} className="border-slate-600 bg-slate-100 text-slate-800">
              {user?.isActive ? 'Active' : 'Locked'}
            </Badge>
          </div>
          <Text className="mt-4 text-sm text-slate-300">
            Frontend dang doc profile hien tai truc tiep tu backend thay vi dung local mock state.
          </Text>
          <div className="mt-6 border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary-300" />
              <span className="text-sm font-semibold text-white">JWT + refresh cookie dang hoat dong</span>
            </div>
            <Text className="mt-3 text-sm text-slate-300">
              Khi access token het han, client se thu refresh mot lan bang cookie truoc khi xoa auth state.
            </Text>
          </div>
        </Card>
      </section>

      <Callout type="success" title="Workspace da bam sat workflow">
        Dang ky, verify OTP, dang nhap, roi vao workspace role-based. Tu day, customer co the tao project va freelancer co the gui bid tren du lieu that tu backend.
      </Callout>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-2 border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </Caption>
              <stat.icon className="h-5 w-5 text-primary-700" />
            </div>
            <div className="mt-4 text-4xl font-black text-secondary-900">
              {loading ? '...' : stat.value}
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {user?.role === 'customer' ? 'Projects' : 'Marketplace'}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {user?.role === 'customer' ? 'Du an gan day' : 'Project dang mo'}
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/projects')}>
              Xem tat ca
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {(user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects)
              .slice(0, 3)
              .map((project) => (
                <div key={project.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                      <Caption className="text-xs text-slate-500">
                        Han cuoi: {formatDate(project.deadline)}
                      </Caption>
                    </div>
                    <Badge color="success">{project.status || 'open'}</Badge>
                  </div>
                  <Text className="mt-3 text-sm text-slate-600">
                    {project.description || 'Chua co mo ta chi tiet cho project nay.'}
                  </Text>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    Ngan sach: {buildBudgetRange(project)}
                  </div>
                </div>
              ))}

            {!loading && (user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects).length === 0 && (
              <Callout type="info" title="Chua co du lieu">
                {user?.role === 'customer'
                  ? 'Ban chua dang project nao. Hay tao project dau tien tu trang Du an.'
                  : 'Chua co project dang mo phu hop de hien thi luc nay.'}
              </Callout>
            )}
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Notifications
              </Caption>
              <H2 className="mt-2 text-2xl">
                Cap nhat moi nhat
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/notifications')}>
              Quan ly
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {dashboardData.notifications.slice(0, 4).map((notification) => (
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
              </div>
            ))}

            {!loading && dashboardData.notifications.length === 0 && (
              <Callout type="info" title="Thong bao trong">
                He thong chua co thong bao moi cho tai khoan nay.
              </Callout>
            )}
          </div>
        </Card>
      </section>

      {user?.role === 'freelancer' && (
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            My bids
          </Caption>
          <H2 className="mt-2 text-2xl">
            Bao gia gan day
          </H2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardData.myBids.slice(0, 4).map((bid) => (
              <div key={bid.id} className="border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-secondary-900">
                    {bid.project?.title || `Project #${bid.project?.id || bid.id}`}
                  </div>
                  <Badge color={bid.status === 'accepted' ? 'success' : 'warning'}>
                    {bid.status || 'pending'}
                  </Badge>
                </div>
                <Text className="mt-3 text-sm text-slate-600">
                  Gia de xuat: {formatCurrency(bid.price)}
                </Text>
              </div>
            ))}

            {!loading && dashboardData.myBids.length === 0 && (
              <Callout type="info" title="Chua co bao gia">
                Ban chua gui bid nao. Hay vao trang Du an de nop de xuat dau tien.
              </Callout>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceDashboardPage;
