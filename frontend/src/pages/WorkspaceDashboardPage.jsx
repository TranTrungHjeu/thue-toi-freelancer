import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, PageSearch, StatsUpSquare, ViewGrid } from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import marketplaceApi from '../api/marketplaceApi';
import {
  buildBudgetRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRole,
  getBidStatusMeta,
  getProjectStatusMeta,
} from '../utils/formatters';

const WorkspaceDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('workspaceDashboard');
  const [loading, setLoading] = useState(true);
  const visibleLoading = useMinimumLoadingState(loading, 700);
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
        addToast(error?.message || t('toasts.dashboard.loadError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [addToast, t, user]);

  const unreadNotifications = dashboardData.notifications.filter((notification) => !notification.isRead).length;

  const statCards = user?.role === 'customer'
    ? [
        { label: copy.stats.customer.projects, value: dashboardData.customerProjects.length, icon: ViewGrid },
        { label: copy.stats.customer.contracts, value: dashboardData.contracts.length, icon: PageSearch },
        { label: copy.stats.customer.unreadNotifications, value: unreadNotifications, icon: Bell },
      ]
    : [
        { label: copy.stats.freelancer.openProjects, value: dashboardData.marketplaceProjects.length, icon: ViewGrid },
        { label: copy.stats.freelancer.myBids, value: dashboardData.myBids.length, icon: StatsUpSquare },
        { label: copy.stats.freelancer.contracts, value: dashboardData.contracts.length, icon: PageSearch },
      ];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.hero.caption}
          </Caption>
          <H1 className="mt-3 text-4xl">
            {t('workspaceDashboard.hero.title', { name: user?.fullName || '' })}
          </H1>
          <Text className="mt-4 text-slate-600">
            {t('workspaceDashboard.hero.description', { role: formatRole(user?.role, locale) })}
          </Text>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/workspace/projects')}>
              {user?.role === 'customer' ? copy.hero.customerAction : copy.hero.freelancerAction}
            </Button>
            <Button variant="outline" onClick={() => navigate('/workspace/contracts')}>
              {copy.hero.contractsAction}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/workspace/profile')}>
              {copy.hero.profileAction}
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <StatMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            isLoading={visibleLoading}
            labelClassName="text-slate-500"
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {user?.role === 'customer' ? copy.projectsSection.customerCaption : copy.projectsSection.freelancerCaption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {user?.role === 'customer' ? copy.projectsSection.customerTitle : copy.projectsSection.freelancerTitle}
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/projects')}>
              {copy.projectsSection.viewAll}
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {(user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects)
              .slice(0, 3)
              .map((project) => (
                <InfoPanel key={project.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                      <Caption className="text-xs text-slate-500">
                        {t('workspaceDashboard.projectsSection.deadline', { date: formatDate(project.deadline, locale) })}
                      </Caption>
                    </div>
                    <Badge color={getProjectStatusMeta(project.status, locale).color}>
                      {getProjectStatusMeta(project.status, locale).label}
                    </Badge>
                  </div>
                  <Text className="mt-3 text-sm text-slate-600">
                    {project.description || copy.projectsSection.descriptionFallback}
                  </Text>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    {t('workspaceDashboard.projectsSection.budget', { value: buildBudgetRange(project, locale) })}
                  </div>
                </InfoPanel>
              ))}

            {!visibleLoading && (user?.role === 'customer' ? dashboardData.customerProjects : dashboardData.marketplaceProjects).length === 0 && (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-secondary-900">
                  {user?.role === 'customer' ? copy.projectsSection.emptyCustomerTitle : copy.projectsSection.emptyFreelancerTitle}
                </div>
                <div className="mt-2">
                  {user?.role === 'customer'
                    ? copy.projectsSection.emptyCustomerDescription
                    : copy.projectsSection.emptyFreelancerDescription}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.notificationsSection.caption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.notificationsSection.title}
              </H2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/workspace/notifications')}>
              {copy.notificationsSection.manage}
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {dashboardData.notifications.slice(0, 4).map((notification) => (
              <InfoPanel key={notification.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-secondary-900">{notification.title}</div>
                    <Caption className="text-xs text-slate-500">
                      {formatDateTime(notification.createdAt, locale)}
                    </Caption>
                  </div>
                  <Badge color={notification.isRead ? 'info' : 'warning'}>
                    {notification.isRead ? copy.notificationsSection.read : copy.notificationsSection.new}
                  </Badge>
                </div>
                <Text className="mt-3 text-sm text-slate-600">
                  {notification.content}
                </Text>
              </InfoPanel>
            ))}

            {!visibleLoading && dashboardData.notifications.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-secondary-900">{copy.notificationsSection.emptyTitle}</div>
                <div className="mt-2">{copy.notificationsSection.emptyDescription}</div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {user?.role === 'freelancer' && (
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.bidsSection.caption}
          </Caption>
          <H2 className="mt-2 text-2xl">
            {copy.bidsSection.title}
          </H2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardData.myBids.slice(0, 4).map((bid) => (
              <InfoPanel key={bid.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-secondary-900">
                    {bid.project?.title || t('workspaceDashboard.bidsSection.projectFallback', { id: bid.project?.id || bid.id })}
                  </div>
                  <Badge color={getBidStatusMeta(bid.status, locale).color}>
                    {getBidStatusMeta(bid.status, locale).label}
                  </Badge>
                </div>
                <Text className="mt-3 text-sm text-slate-600">
                  {t('workspaceDashboard.bidsSection.price', { value: formatCurrency(bid.price, locale) })}
                </Text>
              </InfoPanel>
            ))}

            {!visibleLoading && dashboardData.myBids.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-secondary-900">{copy.bidsSection.emptyTitle}</div>
                <div className="mt-2">{copy.bidsSection.emptyDescription}</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceDashboardPage;
