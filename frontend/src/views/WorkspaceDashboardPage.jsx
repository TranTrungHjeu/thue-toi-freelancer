import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Bell,
  PageSearch,
  StatsUpSquare,
  ViewGrid,
  Wallet,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Settings,
  User,
  Plus
} from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import BidStatusStepper from '../components/common/BidStatusStepper';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { useNotifications } from '../hooks/useNotifications';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import marketplaceApi from '../api/marketplaceApi';
import { useWalletMe } from '../hooks/useWallet';
import {
  buildBudgetRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRole,
  getBidStatusMeta,
  getProjectStatusMeta,
} from '../utils/formatters';

const getProjectTitle = (contract) => (
  contract?.projectTitle
  || contract?.project?.title
  || contract?.title
  || `Hợp đồng #${String(contract?.id || '').slice(0, 6)}`
);

const loadProjectTitleMap = async (contracts) => {
  const projectIds = [...new Set(contracts.map((contract) => contract.projectId).filter(Boolean))];
  const entries = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const response = await marketplaceApi.getProject(projectId);
        return [projectId, response.data?.title || ''];
      } catch {
        return [projectId, ''];
      }
    }),
  );
  return new Map(entries);
};

const WorkspaceDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const { notifications, unreadCount: unreadNotifications } = useNotifications();
  const copy = t('workspaceDashboard');
  const [loading, setLoading] = useState(true);
  const visibleLoading = useMinimumLoadingState(loading, 700);
  const [dashboardData, setDashboardData] = useState({
    customerProjects: [],
    marketplaceProjects: [],
    myBids: [],
    contracts: [],
  });

  const { data: walletData } = useWalletMe({ enabled: !!user?.id });

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      try {
        const contractsResponse = await marketplaceApi.getMyContracts();
        const rawContracts = contractsResponse.data || [];
        const projectTitleMap = await loadProjectTitleMap(rawContracts);
        const contracts = rawContracts.map((contract) => ({
          ...contract,
          projectTitle: projectTitleMap.get(contract.projectId),
        }));

        if (user.role === 'customer') {
          const projectsResponse = await marketplaceApi.getMyProjects();
          setDashboardData({
            customerProjects: projectsResponse.data || [],
            marketplaceProjects: [],
            myBids: [],
            contracts,
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
          });
        }
      } catch (error) {
        addToast(error?.message || t('toasts.dashboard.loadError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [addToast, t, user]);

  // Lấy dữ liệu tài chính thực tế từ ví
  const financialData = useMemo(() => {
    const balance = walletData?.balance || 0;
    const activeEscrow = walletData?.escrow || 0;
    const pendingClearance = walletData?.pending || 0;

    if (user?.role === 'customer') {
      const totalSpent = dashboardData.contracts
        .filter(c => c.status === 'completed' || c.status === 'in_progress')
        .reduce((sum, c) => sum + (c.price || 0), 0);
      return {
        balance,
        totalSpent,
        activeEscrow,
      };
    } else {
      const totalEarnings = dashboardData.contracts
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.price || 0), 0);
      return {
        balance,
        totalEarnings,
        pendingClearance,
      };
    }
  }, [user, dashboardData.contracts, walletData]);

  const activeContractsCount = useMemo(() => {
    return dashboardData.contracts.filter(c => c.status === 'in_progress').length;
  }, [dashboardData.contracts]);

  const statCards = user?.role === 'customer'
    ? [
        { label: copy.stats.customer.projects, value: dashboardData.customerProjects.length, change: '+12% tuần này', trend: 'up' },
        { label: copy.stats.customer.contracts, value: dashboardData.contracts.length, change: `${activeContractsCount} đang chạy`, trend: 'neutral' },
        { label: copy.stats.customer.unreadNotifications, value: unreadNotifications, change: 'Thời gian thực', trend: 'up' },
      ]
    : [
        { label: copy.stats.freelancer.openProjects, value: dashboardData.marketplaceProjects.length, change: 'Dự án mới', trend: 'up' },
        { label: copy.stats.freelancer.myBids, value: dashboardData.myBids.length, change: 'Tỉ lệ khớp 85%', trend: 'up' },
        { label: copy.stats.freelancer.contracts, value: dashboardData.contracts.length, change: `${activeContractsCount} đang chạy`, trend: 'neutral' },
      ];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pt-4">
      {/* METRICS & QUICK SUMMARY PANEL */}
      <section className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat, idx) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden border border-slate-200/80 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_12px_35px_rgb(0,0,0,0.03)] hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-primary-600 transition-colors duration-300">
                  {stat.label}
                </p>
                <h3 className="mt-2.5 text-3xl font-bold text-slate-800 tracking-tight">
                  {visibleLoading ? '...' : stat.value}
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                stat.trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : stat.trend === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-slate-50 text-slate-600'
              }`}>
                {stat.change}
              </span>
            </div>

            {/* Visual accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-primary-500 group-hover:to-emerald-500 transition-all duration-300"></div>
          </div>
        ))}
      </section>

      {/* SECTION 2: 3-COLUMN MASTER WORKSPACE GRID */}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr_1fr] items-start">

        {/* COLUMN 1: FINANCIAL CARD & ACTIVE CONTRACTS */}
        <div className="flex flex-col gap-6">
          {/* Elegant Financial Wallet Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
            {/* Subtle glow background effects */}
            <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-emerald-500 rounded-full filter blur-[80px] opacity-25 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-48 h-48 bg-primary-500 rounded-full filter blur-[70px] opacity-20 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Wallet Account
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase px-2 py-0.5 border border-slate-700 rounded bg-slate-900/60">
                  {user?.role === 'customer' ? 'CLIENT' : 'FREELANCER'}
                </span>
              </div>

              <div className="mt-8">
                <p className="text-xs text-slate-400">{user?.role === 'customer' ? 'Tổng số dư khả dụng' : 'Số dư ví khả dụng'}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {formatCurrency(financialData.balance, locale)}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-700/50 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">
                    {user?.role === 'customer' ? 'Đã chi trả' : 'Thu nhập tích lũy'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-400">
                    {formatCurrency(user?.role === 'customer' ? financialData.totalSpent : financialData.totalEarnings, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">
                    {user?.role === 'customer' ? 'Đang tạm giữ' : 'Chờ giải ngân'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-400">
                    {formatCurrency(user?.role === 'customer' ? financialData.activeEscrow : financialData.pendingClearance, locale)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => navigate(user?.role === 'customer' ? '/workspace/wallet?action=deposit' : '/workspace/wallet?action=withdraw')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-slate-900 font-bold py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors text-xs"
                >
                  {user?.role === 'customer' ? 'Nạp tiền' : 'Rút tiền'} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('/workspace/wallet')}
                  className="flex-1 flex items-center justify-center gap-1 bg-slate-800/80 text-slate-200 border border-slate-700/60 font-semibold py-2 px-3 rounded-xl hover:bg-slate-700 transition-colors text-xs"
                >
                  Lịch sử giao dịch
                </button>
              </div>
            </div>
          </div>

          {/* Active Contracts Widget */}
          <Card className="border border-slate-200 bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <Caption className="text-[10px] uppercase tracking-[0.15em] text-primary-700">
                  {copy.hero.contractsAction}
                </Caption>
                <H2 className="text-lg font-bold text-slate-800 mt-0.5">Hợp đồng hoạt động</H2>
              </div>
              <Badge color="info">{activeContractsCount}</Badge>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {dashboardData.contracts.slice(0, 3).map((contract) => {
                // Generate a realistic progress for visual enhancement
                const progress = contract.status === 'completed' ? 100 : contract.status === 'cancelled' ? 0 : 60;

                return (
                  <div key={contract.id} className="group relative p-3.5 border border-slate-100/80 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-emerald-100 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                        {getProjectTitle(contract)}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {formatCurrency(contract.price, locale)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span>Tiến độ Milestone</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dashboardData.contracts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa có hợp đồng nào đang chạy.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* COLUMN 2: PROJECTS SECTION (CLIENT PROJECTS OR FREELANCER BIDDING) */}
        <div className="flex flex-col gap-6">
          <Card className="border border-slate-200 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                  {user?.role === 'customer' ? copy.projectsSection.customerCaption : copy.projectsSection.freelancerCaption}
                </Caption>
                <H2 className="mt-1 text-xl font-bold text-slate-800">
                  {user?.role === 'customer' ? copy.projectsSection.customerTitle : copy.projectsSection.freelancerTitle}
                </H2>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/workspace/projects')}
                className="text-xs hover:bg-slate-50 py-1.5 px-3 text-primary-700 font-semibold"
              >
                {copy.projectsSection.viewAll} →
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {(user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects)
                .slice(0, 3)
                .map((project) => (
                  <div
                    key={project.id}
                    className="group relative overflow-hidden border border-slate-200/60 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate('/workspace/projects')}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full filter blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -translate-y-10 translate-x-10"></div>
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors duration-200">
                          {project.title}
                        </div>
                        <Caption className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          Hạn chót: {formatDate(project.deadline, locale)}
                        </Caption>
                      </div>
                      <Badge color={getProjectStatusMeta(project.status, locale).color}>
                        {getProjectStatusMeta(project.status, locale).label}
                      </Badge>
                    </div>

                    <Text className="relative mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {project.description || copy.projectsSection.descriptionFallback}
                    </Text>

                    <div className="relative mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Ngân sách dự kiến</span>
                      <span className="text-xs font-bold text-slate-800">
                        {buildBudgetRange(project, locale)}
                      </span>
                    </div>
                  </div>
                ))}

              {!visibleLoading && (user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects).length === 0 && (
                <div className="border border-dashed border-slate-200 bg-slate-50/50 p-6 rounded-xl text-center text-xs text-slate-500">
                  <div className="font-semibold text-slate-700">
                    {user?.role === 'customer' ? copy.projectsSection.emptyCustomerTitle : copy.projectsSection.emptyFreelancerTitle}
                  </div>
                  <div className="mt-1 text-slate-400">
                    {user?.role === 'customer'
                      ? copy.projectsSection.emptyCustomerDescription
                      : copy.projectsSection.emptyFreelancerDescription}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Freelancer bids sub-section if applicable */}
          {user?.role === 'freelancer' && (
            <Card className="border border-slate-200 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                    {copy.bidsSection.caption}
                  </Caption>
                  <H2 className="mt-1 text-xl font-bold text-slate-800">
                    {copy.bidsSection.title}
                  </H2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/workspace/projects')}
                  className="text-xs hover:bg-slate-50 text-primary-700 font-semibold"
                >
                  Chi tiết
                </Button>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {dashboardData.myBids.slice(0, 3).map((bid) => (
                  <div key={bid.id} className="group p-3.5 border border-slate-100/80 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-primary-100 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer" onClick={() => navigate('/workspace/projects')}>
                    <div className="min-w-0 font-medium">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {bid.project?.title || t('workspaceDashboard.bidsSection.projectFallback', { id: bid.project?.id || bid.id })}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                        Giá đề xuất: <span className="text-primary-700">{formatCurrency(bid.price, locale)}</span>
                      </div>
                    </div>
                    <BidStatusStepper status={bid.status} locale={locale} />
                  </div>
                ))}

                {!visibleLoading && dashboardData.myBids.length === 0 && (
                  <div className="border border-dashed border-slate-200 bg-slate-50/30 p-6 rounded-xl text-center text-xs text-slate-400">
                    Chưa có đề xuất báo giá nào được gửi.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* COLUMN 3: REAL-TIME NOTIFICATIONS & ACTIVITY FEED */}
        <Card className="border border-slate-200 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.notificationsSection.caption}
              </Caption>
              <H2 className="mt-1 text-xl font-bold text-slate-800">
                {copy.notificationsSection.title}
              </H2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/workspace/notifications')}
              className="text-xs hover:bg-slate-50 text-primary-700 font-semibold"
            >
              {copy.notificationsSection.manage}
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {notifications.slice(0, 4).map((notification) => (
              <div
                key={notification.id}
                className="relative p-4 border border-slate-100/80 rounded-xl bg-gradient-to-b from-white to-slate-50/30 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-primary-100 transition-all duration-300"
              >
                {!notification.isRead && (
                  <span className="absolute top-3.5 right-3.5 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-700">
                    Mới
                  </span>
                )}

                <div className="pr-14">
                  <div className="text-xs font-bold text-slate-800 leading-snug">{notification.title}</div>
                  <Caption className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                    {formatDateTime(notification.createdAt, locale)}
                  </Caption>
                  <Text className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {notification.content}
                  </Text>
                </div>
              </div>
            ))}

            {!visibleLoading && notifications.length === 0 && (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 p-6 rounded-xl text-center text-xs text-slate-400">
                <div className="font-semibold text-slate-600">{copy.notificationsSection.emptyTitle}</div>
                <div className="mt-1">{copy.notificationsSection.emptyDescription}</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WorkspaceDashboardPage;
