import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle,
  Download,
  Filter,
  Group,
  InfoCircle,
  Key,
  Lock,
  Mail,
  NavArrowLeft,
  NavArrowRight,
  Refresh,
  Search,
  ShieldCheck,
  StatsUpSquare,
  User,
  Wallet,
  WarningTriangle,
  Xmark,
} from 'iconoir-react';
import { AnimatePresence, motion } from 'motion/react';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { Caption, H1, H2, Text } from '../../components/common/Typography';
import adminApi from '../../api/adminApi';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const DEFAULT_FILTERS = {
  page: 0,
  size: 20,
  q: '',
  role: 'all',
  status: 'all',
  verified: 'all',
  sort: 'createdAt',
  direction: 'desc',
};

const ROLE_OPTIONS = ['all', 'customer', 'freelancer', 'admin'];
const STATUS_OPTIONS = ['all', 'active', 'locked'];
const VERIFIED_OPTIONS = ['all', 'true', 'false'];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', labelKey: 'adminPages.users.sortNewest' },
  { value: 'createdAt:asc', labelKey: 'adminPages.users.sortOldest' },
  { value: 'fullName:asc', labelKey: 'adminPages.users.sortNameAsc' },
  { value: 'balance:desc', labelKey: 'adminPages.users.sortBalanceDesc' },
  { value: 'updatedAt:desc', labelKey: 'adminPages.users.sortRecentlyUpdated' },
];

const roleBadgeClass = {
  customer: 'border-sky-200 bg-sky-50 text-sky-700',
  freelancer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  admin: 'border-rose-200 bg-rose-50 text-rose-700',
};

const parseNumberParam = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeFilters = (searchParams) => {
  const role = searchParams.get('role') || DEFAULT_FILTERS.role;
  const status = searchParams.get('status') || DEFAULT_FILTERS.status;
  const verified = searchParams.get('verified') || DEFAULT_FILTERS.verified;

  return {
    page: Math.max(parseNumberParam(searchParams.get('page'), DEFAULT_FILTERS.page), 0),
    size: Math.min(Math.max(parseNumberParam(searchParams.get('size'), DEFAULT_FILTERS.size), 10), 100),
    q: searchParams.get('q') || DEFAULT_FILTERS.q,
    role: ROLE_OPTIONS.includes(role) ? role : DEFAULT_FILTERS.role,
    status: STATUS_OPTIONS.includes(status) ? status : DEFAULT_FILTERS.status,
    verified: VERIFIED_OPTIONS.includes(verified) ? verified : DEFAULT_FILTERS.verified,
    sort: searchParams.get('sort') || DEFAULT_FILTERS.sort,
    direction: searchParams.get('direction') === 'asc' ? 'asc' : 'desc',
  };
};

const formatRole = (role, t) => t(`roles.${role || 'user'}`);

const isSameUser = (currentUser, targetUser) => {
  if (!currentUser?.id || !targetUser?.id) return false;
  return Number(currentUser.id) === Number(targetUser.id);
};

const StatusBadge = ({ user, t }) => {
  const active = Boolean(user?.isActive);
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
      {active ? <CheckCircle className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {active ? t('adminPages.users.statusActive') : t('adminPages.users.statusLocked')}
    </span>
  );
};

const RoleBadge = ({ role, t }) => (
  <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-semibold ${roleBadgeClass[role] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
    {formatRole(role, t)}
  </span>
);

const KycBadge = ({ verified, t }) => (
  <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${verified ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
    <ShieldCheck className="h-3.5 w-3.5" />
    {verified ? t('adminPages.users.verifiedBadge') : t('adminPages.users.unverifiedBadge')}
  </span>
);

const SegmentedControl = ({ label, options, value, onChange, getLabel }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
    <div className="flex flex-wrap gap-1 border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-9 px-3 text-xs font-bold transition-colors ${active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  </div>
);

const AdminUsersPage = () => {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => normalizeFilters(searchParams), [searchParams]);

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: DEFAULT_FILTERS.size, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusDialog, setStatusDialog] = useState({ open: false, user: null, bulk: false, active: null });
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const updateFilters = useCallback((patch, options = {}) => {
    const nextFilters = {
      ...filters,
      ...patch,
      page: options.keepPage ? filters.page : 0,
    };

    if (patch.page !== undefined) {
      nextFilters.page = patch.page;
    }

    const nextParams = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key];
      if (value !== defaultValue && value !== '' && value !== null && value !== undefined) {
        nextParams.set(key, String(value));
      }
    });
    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  const fetchUsers = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const params = {
        page: filters.page,
        size: filters.size,
        sort: filters.sort,
        direction: filters.direction,
      };

      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.role !== 'all') params.role = filters.role;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.verified !== 'all') params.verified = filters.verified === 'true';

      const response = await adminApi.getUserPage(params);
      if (response.success) {
        const data = response.data;
        setUsers(data.content || []);
        setSummary(data.summary || null);
        setPageInfo({
          page: data.page ?? 0,
          size: data.size ?? filters.size,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        });
      }
    } catch {
      addToast(t('toasts.admin.loadUsersError'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast, filters, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft !== filters.q) {
        updateFilters({ q: searchDraft });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.q, searchDraft, updateFilters]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters.page, filters.q, filters.role, filters.status, filters.verified, filters.sort, filters.direction]);

  const selectableUsers = useMemo(
    () => users.filter((item) => !isSameUser(currentUser, item)),
    [currentUser, users],
  );

  const allPageSelected = selectableUsers.length > 0 && selectableUsers.every((item) => selectedIds.includes(item.id));

  const summaryItems = useMemo(() => [
    {
      key: 'all',
      label: t('adminPages.users.kpiAll'),
      value: summary?.totalUsers ?? 0,
      active: filters.role === 'all' && filters.status === 'all' && filters.verified === 'all',
      patch: { role: 'all', status: 'all', verified: 'all' },
    },
    {
      key: 'active',
      label: t('adminPages.users.statusActive'),
      value: summary?.activeUsers ?? 0,
      active: filters.status === 'active',
      patch: { status: 'active', role: 'all', verified: 'all' },
    },
    {
      key: 'locked',
      label: t('adminPages.users.statusLocked'),
      value: summary?.lockedUsers ?? 0,
      active: filters.status === 'locked',
      patch: { status: 'locked', role: 'all', verified: 'all' },
    },
    {
      key: 'verified',
      label: t('adminPages.users.verifiedShort'),
      value: summary?.verifiedUsers ?? 0,
      active: filters.verified === 'true',
      patch: { verified: 'true', role: 'all', status: 'all' },
    },
    {
      key: 'customer',
      label: t('roles.customer'),
      value: summary?.customerUsers ?? 0,
      active: filters.role === 'customer',
      patch: { role: 'customer', status: 'all', verified: 'all' },
    },
    {
      key: 'freelancer',
      label: t('roles.freelancer'),
      value: summary?.freelancerUsers ?? 0,
      active: filters.role === 'freelancer',
      patch: { role: 'freelancer', status: 'all', verified: 'all' },
    },
    {
      key: 'admin',
      label: t('roles.admin'),
      value: summary?.adminUsers ?? 0,
      active: filters.role === 'admin',
      patch: { role: 'admin', status: 'all', verified: 'all' },
    },
  ], [filters.role, filters.status, filters.verified, summary, t]);

  const visibleRange = useMemo(() => {
    if (!pageInfo.totalElements) return { from: 0, to: 0 };
    return {
      from: pageInfo.page * pageInfo.size + 1,
      to: Math.min((pageInfo.page + 1) * pageInfo.size, pageInfo.totalElements),
    };
  }, [pageInfo]);

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(selectableUsers.map((item) => item.id));
  };

  const toggleSelected = (targetUser) => {
    if (isSameUser(currentUser, targetUser)) return;
    setSelectedIds((previous) => (
      previous.includes(targetUser.id)
        ? previous.filter((id) => id !== targetUser.id)
        : [...previous, targetUser.id]
    ));
  };

  const openStatusDialog = (targetUser, active) => {
    if (isSameUser(currentUser, targetUser)) {
      addToast(t('adminPages.users.selfStatusError'), 'error');
      return;
    }
    setReason('');
    setStatusDialog({ open: true, user: targetUser, bulk: false, active });
  };

  const openBulkStatusDialog = (active) => {
    if (selectedIds.length === 0) return;
    setReason('');
    setStatusDialog({ open: true, user: null, bulk: true, active });
  };

  const closeStatusDialog = () => {
    if (submitting) return;
    setStatusDialog({ open: false, user: null, bulk: false, active: null });
    setReason('');
  };

  const confirmStatusChange = async () => {
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (statusDialog.bulk) {
        await adminApi.bulkToggleUserStatus(selectedIds, statusDialog.active, reason.trim());
        setUsers((previous) => previous.map((item) => (
          selectedIds.includes(item.id) ? { ...item, isActive: statusDialog.active } : item
        )));
        setSelectedIds([]);
      } else if (statusDialog.user) {
        await adminApi.toggleUserStatus(statusDialog.user.id, reason.trim());
        setUsers((previous) => previous.map((item) => (
          item.id === statusDialog.user.id ? { ...item, isActive: statusDialog.active } : item
        )));
        if (detailUser?.id === statusDialog.user.id) {
          setDetailUser((previous) => previous ? { ...previous, isActive: statusDialog.active } : previous);
        }
      }
      addToast(t('toasts.admin.updateStatusSuccess'), 'success');
      setStatusDialog({ open: false, user: null, bulk: false, active: null });
      setReason('');
      fetchUsers({ showLoading: false });
    } catch (error) {
      addToast(error.message || t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (targetUser) => {
    setDetailOpen(true);
    setDetailUser(targetUser);
    setDetailLoading(true);
    try {
      const response = await adminApi.getUserDetail(targetUser.id);
      if (response.success) {
        setDetailUser(response.data);
      }
    } catch {
      addToast(t('adminPages.users.detailLoadError'), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
  };

  const handleUpdateRole = async (nextRole) => {
    if (!detailUser || updatingRole || detailUser.role === nextRole) return;
    if (isSameUser(currentUser, detailUser)) {
      addToast(t('adminPages.users.selfDemoteError'), 'error');
      return;
    }

    setUpdatingRole(true);
    try {
      await adminApi.updateUserRole(detailUser.id, nextRole);
      setDetailUser((previous) => previous ? { ...previous, role: nextRole } : previous);
      setUsers((previous) => previous.map((item) => (
        item.id === detailUser.id ? { ...item, role: nextRole } : item
      )));
      addToast(t('toasts.admin.updateRoleSuccess'), 'success');
      fetchUsers({ showLoading: false });
    } catch (error) {
      addToast(error.message || t('errors.code.ERR_AUTH_04'), 'error');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleExport = () => {
    if (!users.length) return;
    exportToCsv(
      users,
      [
        { key: 'id', label: 'ID' },
        { key: 'fullName', label: t('adminPages.users.tableHeaderUserInfo') },
        { key: 'email', label: t('common.email') },
        { key: 'role', label: t('adminPages.users.tableHeaderRole') },
        { key: 'isActive', label: t('adminPages.users.tableHeaderStatus') },
        { key: 'verified', label: t('adminPages.users.verifiedBadge') },
        { key: 'balance', label: t('adminPages.users.walletBalance') },
        { key: 'createdAt', label: t('adminPages.users.tableHeaderDate') },
      ],
      'Users_Current_View',
    );
    addToast(t('toasts.admin.exportSuccess'), 'success');
  };

  const changePage = (nextPage) => {
    updateFilters({ page: Math.min(Math.max(nextPage, 0), Math.max(pageInfo.totalPages - 1, 0)) }, { keepPage: true });
  };

  const handleSortPreset = (value) => {
    const [sort, direction] = value.split(':');
    updateFilters({ sort, direction });
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-slate-950 text-white">
                <Group className="h-5 w-5" />
              </div>
              <Caption className="font-bold uppercase tracking-[0.2em] text-slate-500">
                {t('adminPages.users.caption')}
              </Caption>
            </div>
            <H1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              {t('adminPages.users.title')}
            </H1>
            <Text className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              {t('adminPages.users.desc')}
            </Text>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-950 hover:text-white"
              onClick={() => fetchUsers({ showLoading: false })}
              disabled={refreshing}
            >
              {refreshing ? <Spinner size="sm" tone="current" inline /> : <Refresh className="h-4 w-4" />}
              {t('adminPages.users.refresh')}
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-950 hover:text-white"
              onClick={handleExport}
              disabled={!users.length}
            >
              <Download className="h-4 w-4" />
              {t('adminPages.users.exportCurrentView')}
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {summaryItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => updateFilters(item.patch)}
            className={`border px-4 py-3 text-left transition-colors ${item.active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
          >
            <div className={`text-2xl font-bold tracking-tight ${item.active ? 'text-white' : 'text-slate-950'}`}>{item.value}</div>
            <div className={`mt-1 text-[11px] font-bold uppercase tracking-[0.14em] ${item.active ? 'text-slate-300' : 'text-slate-400'}`}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className="border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.2fr)_auto_auto_auto] xl:items-end">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {t('adminPages.users.searchLabel')}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t('adminPages.users.searchPlaceholder')}
                className="h-11 w-full border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium outline-none transition-colors focus:border-slate-950 focus:bg-white"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-950"
                  aria-label={t('adminPages.users.clearSearch')}
                >
                  <Xmark className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <SegmentedControl
            label={t('adminPages.users.roleFilter')}
            options={ROLE_OPTIONS}
            value={filters.role}
            onChange={(role) => updateFilters({ role })}
            getLabel={(role) => role === 'all' ? t('adminPages.users.filterAllRoles') : formatRole(role, t)}
          />

          <SegmentedControl
            label={t('adminPages.users.statusFilter')}
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(status) => updateFilters({ status })}
            getLabel={(status) => status === 'all' ? t('adminPages.users.filterAllStatuses') : t(`adminPages.users.status${status === 'active' ? 'Active' : 'Locked'}`)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('adminPages.users.kycFilter')}</span>
              <select
                value={filters.verified}
                onChange={(event) => updateFilters({ verified: event.target.value })}
                className="h-11 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-slate-950 focus:bg-white"
              >
                <option value="all">{t('adminPages.users.filterAllKyc')}</option>
                <option value="true">{t('adminPages.users.verifiedBadge')}</option>
                <option value="false">{t('adminPages.users.unverifiedBadge')}</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('adminPages.users.sortLabel')}</span>
              <select
                value={`${filters.sort}:${filters.direction}`}
                onChange={(event) => handleSortPreset(event.target.value)}
                className="h-11 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-slate-950 focus:bg-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center border border-slate-100 bg-white shadow-sm">
          <Spinner size="md" />
          <Text className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('adminPages.users.loading')}
          </Text>
        </div>
      ) : (
        <>
          <section className="hidden overflow-hidden border border-slate-200 bg-white shadow-sm lg:block">
            <div className="max-h-[80vh] overflow-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-12 px-5 py-4">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        disabled={!selectableUsers.length}
                        className="h-4 w-4 border-slate-300 text-slate-950 focus:ring-slate-950"
                      />
                    </th>
                    <th className="w-36 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.tableHeaderUserInfo')}</th>
                    <th className="w-36 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.tableHeaderRole')}</th>
                    <th className="w-48 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.tableHeaderStatus')}</th>
                    <th className="w-28 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.walletBalance')}</th>
                    <th className="w-32 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.tableHeaderDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const self = isSameUser(currentUser, item);
                    return (
                      <tr key={item.id} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${selectedIds.includes(item.id) ? 'bg-primary-50/50' : ''}`}>
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelected(item)}
                            disabled={self}
                            className="h-4 w-4 border-slate-300 text-slate-950 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => openDetail(item)} className="flex max-w-[360px] items-center gap-3 text-left">
                            <Avatar src={item.avatarUrl} name={item.fullName} size="md" className="border border-slate-200" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-slate-950">{item.fullName}</span>
                              <span className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-slate-500">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {item.email}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="w-40 px-5 py-4"><RoleBadge role={item.role} t={t} /></td>
                        <td className="w-48 px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge user={item} t={t} />
                            <KycBadge verified={item.verified} t={t} />
                          </div>
                        </td>
                        <td className="w-28 px-5 py-4 text-sm font-bold text-slate-800">{formatCurrency(item.balance || 0)}</td>
                        <td className="w-32 px-5 py-4 text-xs font-medium text-slate-500">{formatDateTime(item.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.length === 0 && <EmptyUsersState t={t} />}
          </section>

          <section className="flex flex-col gap-3 lg:hidden">
            {users.map((item) => {
              const self = isSameUser(currentUser, item);
              return (
                <article key={item.id} className={`border bg-white p-4 shadow-sm ${selectedIds.includes(item.id) ? 'border-slate-950' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item)}
                      disabled={self}
                      className="mt-3 h-4 w-4 border-slate-300 text-slate-950 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    <Avatar src={item.avatarUrl} name={item.fullName} size="md" className="border border-slate-200" />
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => openDetail(item)} className="block max-w-full text-left">
                        <span className="block truncate text-sm font-bold text-slate-950">{item.fullName}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{item.email}</span>
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <RoleBadge role={item.role} t={t} />
                        <StatusBadge user={item} t={t} />
                        <KycBadge verified={item.verified} t={t} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <div className="font-bold uppercase tracking-[0.12em] text-slate-400">{t('adminPages.users.walletBalance')}</div>
                          <div className="mt-1 font-bold text-slate-900">{formatCurrency(item.balance || 0)}</div>
                        </div>
                        <div>
                          <div className="font-bold uppercase tracking-[0.12em] text-slate-400">{t('adminPages.users.tableHeaderDate')}</div>
                          <div className="mt-1 font-medium text-slate-600">{formatDateTime(item.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1 border-slate-200" onClick={() => openDetail(item)}>
                      <InfoCircle className="h-4 w-4" />
                      {t('adminPages.users.viewDetail')}
                    </Button>
                    <Button
                      variant={item.isActive ? 'ghost' : 'outline'}
                      className={`flex-1 ${item.isActive ? 'text-rose-600 hover:border-rose-100 hover:bg-rose-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'}`}
                      onClick={() => openStatusDialog(item, !item.isActive)}
                      disabled={self}
                    >
                      {item.isActive ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                      {item.isActive ? t('adminPages.users.lockBtn') : t('adminPages.users.unlockBtn')}
                    </Button>
                  </div>
                </article>
              );
            })}
            {users.length === 0 && <EmptyUsersState t={t} />}
          </section>

          <footer className="flex flex-col gap-3 border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Text className="text-xs font-semibold text-slate-500">
              {t('common.pagination.showing', {
                from: visibleRange.from,
                to: visibleRange.to,
                total: pageInfo.totalElements,
              })}
            </Text>
            <div className="flex items-center gap-2">
              <select
                value={filters.size}
                onChange={(event) => updateFilters({ size: Number(event.target.value) })}
                className="h-10 border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-950"
              >
                {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}/page</option>)}
              </select>
              <Button variant="outline" className="min-h-10 px-3" disabled={pageInfo.page <= 0} onClick={() => changePage(pageInfo.page - 1)}>
                <NavArrowLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                {pageInfo.totalPages === 0 ? '0 / 0' : `${pageInfo.page + 1} / ${pageInfo.totalPages}`}
              </span>
              <Button variant="outline" className="min-h-10 px-3" disabled={pageInfo.page >= pageInfo.totalPages - 1} onClick={() => changePage(pageInfo.page + 1)}>
                <NavArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        </>
      )}

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-white shadow-2xl md:inset-x-auto md:left-1/2 md:bottom-6 md:-translate-x-1/2 md:border md:px-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-primary-600">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                    {t('common.bulk.selectionCount', { count: selectedIds.length })}
                  </div>
                  <div className="text-[11px] text-slate-500">{t('adminPages.users.bulkHint')}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:border-l md:border-white/10 md:pl-4">
                <Button className="min-h-10 bg-emerald-600 px-3 text-xs hover:bg-emerald-700" onClick={() => openBulkStatusDialog(true)}>
                  <CheckCircle className="h-4 w-4" />
                  {t('adminPages.users.bulkUnlock')}
                </Button>
                <Button className="min-h-10 bg-rose-600 px-3 text-xs hover:bg-rose-700" onClick={() => openBulkStatusDialog(false)}>
                  <Lock className="h-4 w-4" />
                  {t('adminPages.users.bulkLock')}
                </Button>
                <button type="button" onClick={() => setSelectedIds([])} className="flex min-h-10 items-center justify-center px-3 text-slate-400 hover:text-white">
                  <Xmark className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserDetailDrawer
        user={detailUser}
        isOpen={detailOpen}
        loading={detailLoading}
        updatingRole={updatingRole}
        currentUser={currentUser}
        onClose={closeDetail}
        onRoleChange={handleUpdateRole}
        onToggleStatus={(targetUser) => openStatusDialog(targetUser, !targetUser.isActive)}
        t={t}
      />

      <Modal
        isOpen={statusDialog.open}
        onClose={closeStatusDialog}
        title={statusDialog.active ? t('adminPages.users.modalToggleTitleUnlock') : t('adminPages.users.modalToggleTitleLock')}
      >
        <div className="flex flex-col gap-5">
          <div className={`border p-4 ${statusDialog.active ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex gap-3">
              {statusDialog.active ? <InfoCircle className="h-5 w-5 shrink-0 text-emerald-700" /> : <WarningTriangle className="h-5 w-5 shrink-0 text-rose-700" />}
              <div>
                <Text className="font-bold text-slate-950">
                  {statusDialog.bulk
                    ? t('adminPages.users.bulkConfirmTitle', { count: selectedIds.length })
                    : `${t('adminPages.users.modalToggleConfirmLabel')} ${statusDialog.user?.fullName || ''}`}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-slate-600">
                  {statusDialog.active ? t('adminPages.users.modalToggleConfirmUnlock') : t('adminPages.users.modalToggleConfirmLock')}
                </Text>
              </div>
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t('adminPages.users.modalToggleReasonLabel')}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
              placeholder={t('adminPages.users.modalToggleReasonPlaceholder')}
              className="min-h-28 border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none transition-colors focus:border-slate-950 focus:bg-white"
            />
            <span className="text-xs text-slate-400">{t('adminPages.users.modalToggleNote')}</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="sm:min-w-32" onClick={closeStatusDialog} disabled={submitting}>
              {t('adminPages.users.modalToggleCancelBtn')}
            </Button>
            <Button
              variant={statusDialog.active ? 'primary' : 'danger'}
              className="sm:min-w-40"
              onClick={confirmStatusChange}
              disabled={submitting || !reason.trim()}
            >
              {submitting
                ? <Spinner size="sm" tone="current" inline />
                : statusDialog.active
                  ? t('adminPages.users.modalToggleConfirmUnlockBtn')
                  : t('adminPages.users.modalToggleConfirmLockBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const EmptyUsersState = ({ t }) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center border-t border-slate-100 bg-white px-6 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400">
      <Filter className="h-6 w-6" />
    </div>
    <H2 className="mt-4 text-lg font-bold text-slate-950">{t('adminPages.users.emptyTitle')}</H2>
    <Text className="mt-2 max-w-md text-sm text-slate-500">{t('adminPages.users.emptyDesc')}</Text>
  </div>
);

const UserDetailDrawer = ({
  user,
  isOpen,
  loading,
  updatingRole,
  currentUser,
  onClose,
  onRoleChange,
  onToggleStatus,
  t,
}) => {
  const self = isSameUser(currentUser, user);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50">
          <motion.button
            type="button"
            aria-label={t('adminPages.users.closeProfile')}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute inset-x-0 bottom-0 max-h-[calc(100svh-4rem)] overflow-y-auto bg-white shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[480px]"
          >
            {!user ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-5">
                <section className="relative border border-slate-200 bg-slate-950 p-5 pr-14 text-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={t('adminPages.users.closeProfile')}
                  >
                    <Xmark className="h-5 w-5" />
                  </button>
                  <div className="flex gap-4">
                    <Avatar src={user.avatarUrl} name={user.fullName} size="xl" className="border-4 border-white/10" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <H2 className="!mb-0 text-2xl font-bold text-white">{user.fullName}</H2>
                        {loading && <Spinner size="sm" tone="current" inline />}
                      </div>
                      <Text className="mt-1 break-all text-sm text-slate-300">{user.email}</Text>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <RoleBadge role={user.role} t={t} />
                        <StatusBadge user={user} t={t} />
                        <KycBadge verified={user.verified} t={t} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-3 border border-slate-200 bg-white">
                  <Metric icon={User} label={t('adminPages.users.projectsMetric')} value={user.projectCount ?? 0} />
                  <Metric icon={StatsUpSquare} label={t('adminPages.users.bidsMetric')} value={user.bidCount ?? 0} />
                  <Metric icon={CheckCircle} label={t('adminPages.users.contractsMetric')} value={user.contractCount ?? 0} />
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock icon={Wallet} label={t('adminPages.users.walletBalance')} value={formatCurrency(user.balance || 0)} />
                  <InfoBlock icon={Mail} label={t('common.email')} value={user.email} />
                  <InfoBlock icon={Group} label={t('adminPages.users.tableHeaderDate')} value={formatDateTime(user.createdAt)} />
                  <InfoBlock icon={Refresh} label={t('adminPages.users.updatedAt')} value={formatDateTime(user.updatedAt)} />
                </section>

                <section className="border border-slate-200 p-4">
                  <Caption className="font-bold uppercase tracking-[0.16em] text-slate-400">{t('adminPages.users.profileDescription')}</Caption>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">
                    {user.profileDescription || t('values.notUpdated')}
                  </Text>
                </section>

                <section className="border border-slate-200 p-4">
                  <Caption className="font-bold uppercase tracking-[0.16em] text-slate-400">{t('adminPages.users.skillsTitle')}</Caption>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.skills?.length || user.skills?.size ? (
                      Array.from(user.skills).map((skill) => (
                        <span key={skill} className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{skill}</span>
                      ))
                    ) : (
                      <Text className="text-sm text-slate-500">{t('values.notUpdated')}</Text>
                    )}
                  </div>
                </section>

                <section className="border border-primary-200 bg-primary-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
                    <div>
                      <Caption className="font-bold uppercase tracking-[0.16em] text-primary-700">{t('adminPages.users.editRole')}</Caption>
                      <Text className="mt-1 text-xs leading-5 text-slate-600">{t('adminPages.users.changeRoleWarning')}</Text>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['customer', 'freelancer', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => onRoleChange(role)}
                        disabled={updatingRole || user.role === role || self}
                        className={`min-h-10 border px-4 text-xs font-bold transition-colors ${user.role === role ? 'border-primary-700 bg-primary-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-600'} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {formatRole(role, t)}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={onClose}>{t('adminPages.users.closeProfile')}</Button>
                  <Button
                    variant={user.isActive ? 'danger' : 'primary'}
                    onClick={() => onToggleStatus(user)}
                    disabled={self}
                  >
                    {user.isActive ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                    {user.isActive ? t('adminPages.users.lockBtn') : t('adminPages.users.unlockBtn')}
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

const Metric = ({ icon, label, value }) => (
  <div className="border-r border-slate-200 p-4 last:border-r-0">
    {React.createElement(icon, { className: 'h-4 w-4 text-slate-400' })}
    <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
  </div>
);

const InfoBlock = ({ icon, label, value }) => (
  <div className="border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {React.createElement(icon, { className: 'h-4 w-4' })}
      {label}
    </div>
    <div className="mt-2 break-words text-sm font-bold text-slate-900">{value}</div>
  </div>
);

export default AdminUsersPage;
