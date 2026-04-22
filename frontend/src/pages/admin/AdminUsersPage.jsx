import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Group, 
  Search, 
  Lock, 
  Key, 
  Mail, 
  CheckCircle, 
  WarningTriangle,
  InfoCircle,
  ShieldCheck as ShieldIcon,
  Download,
  Check,
  Xmark
} from 'iconoir-react';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';

const AdminUsersPage = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // State for toggle status modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State for user detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminApi.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch {
      addToast(t('toasts.admin.loadUsersError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setReason('');
    setIsModalOpen(true);
  };

  const handleViewDetail = (user) => {
    setUserDetail(user);
    setIsDetailModalOpen(true);
  };

  const handleUpdateRole = async (newRole) => {
    if (!userDetail || updatingRole) return;
    setUpdatingRole(true);
    try {
      await adminApi.updateUserRole(userDetail.id, newRole);
      addToast(t('toasts.admin.updateRoleSuccess'), 'success');
      setUserDetail(prev => ({ ...prev, role: newRole }));
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || t('errors.code.ERR_AUTH_04'), 'error');
    } finally {
      setUpdatingRole(false);
    }
  };
  const confirmToggleStatus = async () => {
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    try {
      const response = await adminApi.toggleUserStatus(selectedUser.id, reason);
      if (response.success) {
        addToast(t('toasts.admin.updateStatusSuccess'), 'success');
        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleExport = () => {
    const exportHeaders = [
      { key: 'id', label: 'ID' },
      { key: 'fullName', label: t('adminPages.users.tableHeaderUserInfo') },
      { key: 'email', label: t('common.email') },
      { key: 'role', label: t('adminPages.users.tableHeaderRole') },
      { key: 'isActive', label: t('adminPages.users.tableHeaderStatus') },
      { key: 'verified', label: t('adminPages.users.verifiedBadge') },
      { key: 'balance', label: t('adminPages.users.walletBalance') },
      { key: 'createdAt', label: t('adminPages.users.tableHeaderDate') }
    ];
    exportToCsv(filteredUsers, exportHeaders, 'Users_List');
    addToast(t('toasts.admin.exportSuccess'), 'success');
  };

  const handleBulkStatusChange = async (active) => {
    if (selectedIds.length === 0 || bulkActionLoading) return;
    
    const confirmMsg = t('common.bulk.confirmDesc', { count: selectedIds.length });
    if (!window.confirm(confirmMsg)) return;

    setBulkActionLoading(true);
    try {
      await adminApi.bulkToggleUserStatus(selectedIds, active, "Administrative action (Bulk)");
      addToast(t('toasts.admin.updateStatusSuccess'), 'success');
      setSelectedIds([]);
      fetchUsers();
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }, [searchTerm, users]);

  const headers = [
    {
      key: 'user',
      label: t('adminPages.users.tableHeaderUserInfo'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatarUrl} name={row.fullName} size="md" className="border border-slate-100" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.fullName}</span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {row.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: t('adminPages.users.tableHeaderRole'),
      sortable: true,
      render: (role) => (
        <Badge color={role === 'admin' ? 'error' : role === 'customer' ? 'info' : 'success'}>
          {t(`roles.${role}`)}
        </Badge>
      )
    },
    {
      key: 'status',
      label: t('adminPages.users.tableHeaderStatus'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <span className="flex items-center gap-1.5 text-green-600 text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5" /> {t('adminPages.users.statusActive')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" /> {t('adminPages.users.statusLocked')}
            </span>
          )}
          {row.verified && (
            <Badge color="info" className="scale-75 origin-left">{t('adminPages.users.verifiedBadge')}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('adminPages.users.tableHeaderDate'),
      sortable: true,
      render: (date) => <span className="text-xs text-slate-500 font-medium">{formatDateTime(date)}</span>
    },
    {
      key: 'actions',
      label: t('adminPages.users.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 px-2 py-2 border-slate-100"
            onClick={() => handleViewDetail(row)}
            title={t('adminPages.users.viewDetail')}
          >
            <InfoCircle className="w-4 h-4 text-slate-400" />
          </Button>
          <Button
            variant={row.isActive ? 'outline' : 'primary'}
            size="sm"
            className="min-w-0 px-2 py-2"
            onClick={() => handleToggleStatus(row)}
            title={row.isActive ? t('adminPages.users.lockBtn') : t('adminPages.users.unlockBtn')}
          >
            {row.isActive ? <Lock className="w-4 h-4" /> : <Key className="w-4 h-4" />}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
              <Group className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.users.caption')}</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {t('adminPages.users.title')}
          </H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            {t('adminPages.users.desc')}
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="md" 
            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('common.bulk.exportCsv')}
          </Button>
          <div className="w-full md:w-72">
            <Input
              placeholder={t('adminPages.users.searchPlaceholder')}
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-premium"
            />
          </div>
        </div>
      </header>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 shadow-2xl flex items-center gap-8 border border-white/10 ring-8 ring-slate-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t('common.bulk.selectionCount', { count: selectedIds.length })}
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter mt-0.5">
                  {t('common.bulk.actions')}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 border-none text-[11px]"
                onClick={() => handleBulkStatusChange(true)}
                disabled={bulkActionLoading}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                {t('adminPages.users.statusActive')}
              </Button>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 border-none text-[11px]"
                onClick={() => handleBulkStatusChange(false)}
                disabled={bulkActionLoading}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                {t('adminPages.users.statusLocked')}
              </Button>
              <button 
                className="p-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => setSelectedIds([])}
                disabled={bulkActionLoading}
              >
                <Xmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.users.loading')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          <AdvancedTable
            headers={headers}
            data={filteredUsers}
            pageSize={10}
            className="[&_table]:border-0"
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      )}

      {/* Toggle Status Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={selectedUser?.isActive ? t('adminPages.users.modalToggleTitleLock') : t('adminPages.users.modalToggleTitleUnlock')}
      >
        <div className="flex flex-col gap-6">
          <div className={`p-4 flex gap-3 ${selectedUser?.isActive ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} border`}>
            {selectedUser?.isActive ? (
              <WarningTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <InfoCircle className="w-5 h-5 text-green-600 shrink-0" />
            )}
            <div>
              <Text className="font-bold text-slate-900 mb-1">
                {t('adminPages.users.modalToggleConfirmLabel')} <span className="italic">{selectedUser?.fullName}</span>
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">
                {selectedUser?.isActive
                  ? t('adminPages.users.modalToggleConfirmLock')
                  : t('adminPages.users.modalToggleConfirmUnlock')}
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('adminPages.users.modalToggleReasonLabel')}</Text>
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 outline-none transition-colors text-sm font-medium"
              placeholder={t('adminPages.users.modalToggleReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
            <Caption className="text-slate-400">{t('adminPages.users.modalToggleNote')}</Caption>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {t('adminPages.users.modalToggleCancelBtn')}
            </Button>
            <Button
              variant={selectedUser?.isActive ? 'error' : 'primary'}
              className="flex-1"
              onClick={confirmToggleStatus}
              disabled={submitting || !reason.trim()}
            >
              {submitting
                ? <Spinner size="sm" tone="current" inline />
                : selectedUser?.isActive
                  ? t('adminPages.users.modalToggleConfirmLockBtn')
                  : t('adminPages.users.modalToggleConfirmUnlockBtn')
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('adminPages.users.detailTitle')}
        size="lg"
      >
        {userDetail && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6 p-6 bg-slate-900 !text-white border-none relative overflow-hidden">
              <Avatar src={userDetail.avatarUrl} name={userDetail.fullName} size="xl" className="border-4 border-white/10 relative z-10" />
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <H2 className="!mb-0 text-white text-2xl font-bold tracking-tight">{userDetail.fullName}</H2>
                  {userDetail.verified && <CheckCircle className="w-5 h-5 text-primary-400" />}
                </div>
                <Text className="text-slate-400 font-medium">{userDetail.email}</Text>
                <div className="flex gap-2 mt-3">
                  <Badge color={userDetail.role === 'admin' ? 'error' : userDetail.role === 'customer' ? 'info' : 'success'}>
                    {t(`roles.${userDetail.role}`)}
                  </Badge>
                  <Badge color={userDetail.isActive ? 'success' : 'error'}>
                    {userDetail.isActive ? t('adminPages.users.statusActive') : t('adminPages.users.statusLocked')}
                  </Badge>
                </div>
              </div>
              <div className="absolute right-[-10%] top-[-20%] opacity-10">
                <Group width={180} height={180} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
              <div className="flex flex-col gap-6">
                <section>
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-3">{t('adminPages.users.walletBalance')}</Caption>
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-none flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{t('adminPages.users.walletBalance')}</span>
                      <span className="text-lg font-bold text-slate-900 tracking-tighter">
                        {userDetail.balance !== undefined ? formatCurrency(userDetail.balance) : '---'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col gap-4 p-5 bg-primary-50 border border-primary-100 relative overflow-hidden">
                  <div>
                    <Caption className="text-primary-600 font-bold uppercase tracking-widest mb-1">{t('adminPages.users.editRole')}</Caption>
                    <Text className="text-[11px] text-slate-500 mb-4">{t('adminPages.users.changeRoleWarning')}</Text>
                  </div>

                  <div className="flex flex-wrap gap-2 relative z-10">
                    {['customer', 'freelancer', 'admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => handleUpdateRole(role)}
                        disabled={updatingRole || userDetail.role === role}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-2 
                          ${userDetail.role === role
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary-400'
                          } ${updatingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {t(`roles.${role}`)}
                      </button>
                    ))}
                  </div>

                  <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] rotate-12">
                    <ShieldIcon width={100} height={100} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end px-6 pb-2">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>{t('adminPages.users.closeProfile')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
