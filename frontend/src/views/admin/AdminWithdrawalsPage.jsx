"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  CheckCircle, 
  XmarkCircle, 
  Clock,
  User,
  Wallet,
  Filter,
  Eye,
  WarningTriangle
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminWithdrawalsPage = () => {
  const { t } = useI18n();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processStatus, setProcessStatus] = useState(''); // APPROVED or REJECTED
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await adminApi.getWithdrawals();
      if (response.success) {
        setWithdrawals(response.data);
      }
    } catch {
      addToast(t('toasts.contracts.loadListError'), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleOpenAction = (request, status) => {
    setSelectedRequest(request);
    setProcessStatus(status);
    setNote('');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || submitting) return;
    setSubmitting(true);
    try {
      await adminApi.processWithdrawal(selectedRequest.id, processStatus, note);
      addToast(t('toasts.admin.updateStatusSuccess'), "success");
      setIsModalOpen(false);
      fetchWithdrawals();
    } catch (err) {
      addToast(err.response?.data?.message || t('errors.code.ERR_SYS_01'), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return withdrawals.filter(w => {
      const matchesFilter = filterStatus === 'ALL' || w.status === filterStatus;
      const normalizedTerm = searchTerm.toLowerCase();
      const userId = String(w.user?.id || '');
      const userName = (w.user?.fullName || '').toLowerCase();
      const userEmail = (w.user?.email || '').toLowerCase();
      const bankInfo = (w.bankInfo || '').toLowerCase();
      const matchesSearch = userId.includes(searchTerm) || userName.includes(normalizedTerm) || userEmail.includes(normalizedTerm) || bankInfo.includes(normalizedTerm);
      return matchesFilter && matchesSearch;
    });
  }, [withdrawals, filterStatus, searchTerm]);

  const headers = [
    {
      key: 'user',
      label: t('adminPages.finance.tableHeaderUser'),
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 flex items-center justify-center border border-slate-800">
            <User className="w-4 h-4 text-primary-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.user?.fullName || `#${row.user?.id || 'N/A'}`}</span>
            <span className="text-[10px] text-slate-400 font-bold tracking-tight">{row.user?.email || `ID: #${row.user?.id || 'N/A'}`}</span>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: t('adminPages.finance.tableHeaderAmount'),
      sortable: true,
      render: (amount) => (
        <div className="flex flex-col">
           <span className="font-bold text-slate-900 tracking-tighter text-base">{formatCurrency(amount)}</span>
           <span className="text-[9px] text-slate-400 font-bold uppercase">{t('adminPages.finance.amount')}</span>
        </div>
      )
    },
    {
      key: 'bankInfo',
      label: t('adminPages.finance.tableHeaderBank'),
      render: (info) => (
        <div className="max-w-xs">
          <Text className="text-[11px] font-medium text-slate-600 leading-relaxed italic line-clamp-2">"{info}"</Text>
        </div>
      )
    },
    {
      key: 'status',
      label: t('adminPages.finance.tableHeaderStatus'),
      sortable: true,
      render: (status) => {
        const configs = {
          PENDING: { color: 'warning', label: t('status.bid.pending'), icon: Clock },
          APPROVED: { color: 'success', label: t('status.bid.accepted'), icon: CheckCircle },
          REJECTED: { color: 'error', label: t('status.bid.rejected'), icon: XmarkCircle }
        };
        const config = configs[status] || { color: 'info', label: status };
        return (
          <div className="flex items-center gap-1.5">
            <Badge color={config.color} className="uppercase text-[9px] tracking-widest">{config.label}</Badge>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      label: t('adminPages.finance.tableHeaderDate'),
      sortable: true,
      render: (date) => (
        <div className="flex flex-col">
           <span className="text-[11px] text-slate-700 font-bold">{formatDateTime(date).split(' ')[0]}</span>
           <span className="text-[9px] text-slate-400 font-medium">{formatDateTime(date).split(' ')[1]}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: t('adminPages.finance.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'PENDING' ? (
            <>
              <Button 
                variant="primary" 
                size="sm" 
                className="px-3"
                onClick={() => handleOpenAction(row, 'APPROVED')}
              >
                {t('adminPages.finance.approveBtn')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3 text-red-500 border-red-100 hover:bg-red-50"
                onClick={() => handleOpenAction(row, 'REJECTED')}
              >
                {t('adminPages.finance.rejectBtn')}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="min-w-0 px-2 opacity-30 cursor-default">
               <Eye className="w-4 h-4" />
            </Button>
          )}
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
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.finance.caption')}</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {t('adminPages.finance.title')}
          </H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            {t('adminPages.finance.desc')}
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-9 pr-8 h-12 bg-white border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none min-w-[160px] shadow-premium"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t('adminPages.finance.filterAll')}</option>
              <option value="PENDING">{t('status.bid.pending')}</option>
              <option value="APPROVED">{t('status.bid.accepted')}</option>
              <option value="REJECTED">{t('status.bid.rejected')}</option>
            </select>
          </div>
          
          <div className="w-full sm:w-72">
            <Input 
              placeholder={t('adminPages.finance.searchPlaceholder')}
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-premium"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.dashboard.updating')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          <AdvancedTable 
            headers={headers} 
            data={filteredData} 
            pageSize={10}
            className="[&_table]:border-0"
          />
        </div>
      )}

      {/* Process Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={processStatus === 'APPROVED' ? t('adminPages.finance.approveTitle') : t('adminPages.finance.rejectTitle')}
      >
        <div className="flex flex-col gap-6">
          <div className={`p-5 flex gap-4 ${processStatus === 'APPROVED' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} border`}>
            {processStatus === 'APPROVED' ? (
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            ) : (
              <WarningTriangle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            <div>
              <Text className="font-bold text-slate-900 mb-1 leading-tight">
                {processStatus === 'APPROVED' ? t('adminPages.finance.modalConfirmApprove') : t('adminPages.finance.modalConfirmReject')} {formatCurrency(selectedRequest?.amount || 0)}
              </Text>
              <Text className="text-[11px] text-slate-600 leading-normal">
                {processStatus === 'APPROVED' 
                  ? t('adminPages.finance.modalApproveNote')
                  : t('adminPages.finance.modalRejectNote')}
              </Text>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-100">
             <Caption className="text-slate-400 font-bold uppercase mb-2">{t('adminPages.finance.modalBankLabel')}</Caption>
             <Text className="text-sm font-bold text-slate-800 font-mono tracking-tight">{selectedRequest?.bankInfo}</Text>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('adminPages.finance.noteLabel')}</Text>
               <Caption className="text-slate-400">{t('adminPages.finance.noteSentToUser')}</Caption>
            </div>
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 outline-none transition-colors text-sm font-medium"
              placeholder={processStatus === 'APPROVED' ? t('adminPages.finance.notePlaceholderApprove') : t('adminPages.finance.notePlaceholderReject')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {t('adminPages.finance.cancelBtn')}
            </Button>
            <Button 
              variant={processStatus === 'APPROVED' ? "primary" : "error"}
              className="flex-1"
              onClick={handleConfirmAction}
              disabled={submitting || (processStatus === 'REJECTED' && !note.trim())}
            >
              {submitting ? <Spinner size="sm" tone="current" inline /> : t('adminPages.finance.confirmBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminWithdrawalsPage;
