import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, PageSearch, StatsUpSquare, ViewGrid } from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import marketplaceApi from '../api/marketplaceApi';
import { buildBudgetRange, formatCurrency, formatDate, formatDateTime, formatRole } from '../utils/formatters';

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
          marketplaceApi.getMyContracts(),
        ]);

        const notifications = notificationsResponse.data || [];
        const contracts = contractsResponse.data || [];

        if (user.role === 'customer') {
          const projectsResponse = await marketplaceApi.getMyProjects();
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
            marketplaceApi.getMyBids(),
          ]);

          setDashboardData({
            customerProjects: [],
            marketplaceProjects: projectsResponse.data || [],
            myBids: bidsResponse.data || [],
            contracts,
            notifications,
          });
        }
      } catch (error) {
        addToast(error?.message || 'Không thể tải dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [addToast, user]);

  const unreadNotifications = dashboardData.notifications.filter((notification) => !notification.isRead).length;

  const statCards = user?.role === 'customer'
    ? [
        { label: 'Dự án của bạn', value: dashboardData.customerProjects.length, icon: ViewGrid },
        { label: 'Hợp đồng liên quan', value: dashboardData.contracts.length, icon: PageSearch },
        { label: 'Thông báo chưa đọc', value: unreadNotifications, icon: Bell },
      ]
    : [
        { label: 'Project đang mở', value: dashboardData.marketplaceProjects.length, icon: ViewGrid },
        { label: 'Báo giá của bạn', value: dashboardData.myBids.length, icon: StatsUpSquare },
        { label: 'Hợp đồng liên quan', value: dashboardData.contracts.length, icon: PageSearch },
      ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Tổng quan
          </Caption>
          <H1 className="mt-3 text-4xl">
            Chào mừng {user?.fullName}, workspace đã sẵn sàng.
          </H1>
          <Text className="mt-4 text-slate-600">
            Bạn đang đăng nhập với vai trò <strong>{formatRole(user?.role)}</strong>. Frontend hiện đang bám sát
            các API auth, project, bid, contract và notification đã có sẵn ở backend.
          </Text>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/workspace/projects')}>
              {user?.role === 'customer' ? 'Quản lý dự án' : 'Tìm project và gửi bid'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/workspace/contracts')}>
              Xem hợp đồng
            </Button>
            <Button variant="ghost" onClick={() => navigate('/workspace/profile')}>
              Hồ sơ của tôi
            </Button>
          </div>
        </Card>

        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            Trạng thái tài khoản
          </Caption>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge color="success" className="border-slate-600 bg-primary-100 text-primary-800">
              Đã xác thực
            </Badge>
            <Badge color={user?.isActive ? 'success' : 'error'} className="border-slate-600 bg-slate-100 text-slate-800">
              {user?.isActive ? 'Đang hoạt động' : 'Đã khoá'}
            </Badge>
          </div>
          <Text className="mt-4 text-sm text-slate-300">
            Frontend đang đọc profile hiện tại trực tiếp từ backend thay vì dùng local mock state.
          </Text>
          <div className="mt-6 border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary-300" />
              <span className="text-sm font-semibold text-white">JWT + refresh cookie đang hoạt động</span>
            </div>
            <Text className="mt-3 text-sm text-slate-300">
              Khi access token hết hạn, client sẽ thử refresh một lần bằng cookie trước khi xoá auth state.
            </Text>
          </div>
        </Card>
      </section>

      <Callout type="success" title="Workspace đã bám sát workflow">
        Đăng ký, verify OTP, đăng nhập, rồi vào workspace role-based. Từ đây, khách hàng có thể tạo project và freelancer có thể gửi bid trên dữ liệu thật từ backend.
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
                {user?.role === 'customer' ? 'Dự án' : 'Marketplace'}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {user?.role === 'customer' ? 'Dự án gần đây' : 'Project đang mở'}
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/projects')}>
              Xem tất cả
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
                        Hạn cuối: {formatDate(project.deadline)}
                      </Caption>
                    </div>
                    <Badge color="success">{project.status || 'open'}</Badge>
                  </div>
                  <Text className="mt-3 text-sm text-slate-600">
                    {project.description || 'Chưa có mô tả chi tiết cho project này.'}
                  </Text>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    Ngân sách: {buildBudgetRange(project)}
                  </div>
                </div>
              ))}

            {!loading && (user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects).length === 0 && (
              <Callout type="info" title="Chưa có dữ liệu">
                {user?.role === 'customer'
                  ? 'Bạn chưa đăng project nào. Hãy tạo project đầu tiên từ trang Dự án.'
                  : 'Chưa có project đang mở phù hợp để hiển thị lúc này.'}
              </Callout>
            )}
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Thông báo
              </Caption>
              <H2 className="mt-2 text-2xl">
                Cập nhật mới nhất
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/notifications')}>
              Quản lý
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
                    {notification.isRead ? 'Đã đọc' : 'Mới'}
                  </Badge>
                </div>
                <Text className="mt-3 text-sm text-slate-600">
                  {notification.content}
                </Text>
              </div>
            ))}

            {!loading && dashboardData.notifications.length === 0 && (
              <Callout type="info" title="Thông báo trống">
                Hệ thống chưa có thông báo mới cho tài khoản này.
              </Callout>
            )}
          </div>
        </Card>
      </section>

      {user?.role === 'freelancer' && (
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Báo giá của tôi
          </Caption>
          <H2 className="mt-2 text-2xl">
            Báo giá gần đây
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
                  Giá đề xuất: {formatCurrency(bid.price)}
                </Text>
              </div>
            ))}

            {!loading && dashboardData.myBids.length === 0 && (
              <Callout type="info" title="Chưa có báo giá">
                Bạn chưa gửi bid nào. Hãy vào trang Dự án để nộp đề xuất đầu tiên.
              </Callout>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceDashboardPage;
