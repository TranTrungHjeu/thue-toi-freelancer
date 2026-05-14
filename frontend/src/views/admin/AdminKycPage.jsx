"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldCheck, 
  Mail,
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminKycPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho hộp thoại phê duyệt KYC — thay thế window.confirm để nhất quán với UI hệ thống
  const [approveDialog, setApproveDialog] = useState({ open: false, requestId: null });

  // State for Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const kycRes = await adminApi.getKycRequests();

      if (kycRes.success) {
        setRequests(kycRes.data);
      }
    } catch {
      addToast(t('toasts.admin.loadKycError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    const id = approveDialog.requestId;
    if (!id) return;
    setApproveDialog({ open: false, requestId: null });
    try {
      await adminApi.approveKyc(id);
      addToast(t('toasts.admin.kycApproveSuccess'), 'success');
      fetchData();
    } catch {
      addToast(t('adminPages.kyc.approveError'), 'error');
    }
  };

  const handleOpenRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await adminApi.rejectKyc(selectedRequest.id, rejectReason);
      addToast(t('toasts.admin.kycRejectSuccess'), 'success');
      setIsRejectModalOpen(false);
      fetchData();
    } catch {
      addToast(t('adminPages.kyc.rejectError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const headers = [
    {
      key: 'user',
      label: t('adminPages.kyc.tableHeaderUser'),
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.user?.avatarUrl} name={row.user?.fullName} size="md" className="border border-slate-100" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.user?.fullName || 'N/A'}</span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {row.user?.email || 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('adminPages.kyc.tableHeaderStatus'),
      render: (status) => {
        const statusKey = status?.toLowerCase();
        return (
          <Badge color={status === 'APPROVED' ? 'success' : status === 'PENDING' ? 'warning' : 'error'}>
            {t(`status.kyc.${statusKey}`) || status}
          </Badge>
        );
      }
    },
    {
      key: 'createdAt',
      label: t('adminPages.kyc.tableHeaderDate'),
      sortable: true,
      render: (date) => <span className="text-xs text-slate-500 font-medium">{formatDateTime(date)}</span>
    },
    {
      key: 'actions',
      label: t('adminPages.kyc.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => setApproveDialog({ open: true, requestId: row.id })}>
                {t('adminPages.kyc.approveBtn')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenRejectModal(row)}>
                {t('adminPages.kyc.rejectBtn')}
              </Button>
            </>
          )}
          {row.status === 'REJECTED' && (
            <div className="text-[10px] text-slate-400 italic max-w-[180px] line-clamp-1" title={row.note}>
              {t('adminPages.kyc.rejectedReason')} {row.note}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.kyc.caption')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.kyc.title')}
        </H1>
        <Text className="mt-2 max-w-2xl text-slate-500 text-base">
          {t('adminPages.kyc.desc')}
        </Text>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.kyc.loading')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          {requests.length > 0 ? (
            <AdvancedTable
              headers={headers}
              data={requests}
              pageSize={10}
              className="[&_table]:border-0"
            />
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
              <Text className="text-slate-400 font-medium">{t('adminPages.kyc.empty')}</Text>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !submitting && setIsRejectModalOpen(false)}
        title={t('adminPages.kyc.rejectTitle')}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('adminPages.kyc.rejectReasonLabel')}</Text>
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 outline-none transition-colors text-sm font-medium"
              placeholder={t('adminPages.kyc.rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={submitting}
            >
              {t('adminPages.kyc.rejectCancelBtn')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmReject}
              disabled={submitting || !rejectReason.trim()}
            >
              {submitting ? <Spinner size="sm" tone="current" inline /> : t('adminPages.kyc.rejectConfirmBtn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hộp thoại xác nhận phê duyệt KYC */}
      <Modal
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, requestId: null })}
        title={t('adminPages.kyc.approveTitle')}
        size="sm"
      >
        <div className="flex flex-col gap-6">
          <Text className="text-slate-600">
            {t('adminPages.kyc.approveConfirm')}
          </Text>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setApproveDialog({ open: false, requestId: null })}
            >
              {t('adminPages.kyc.rejectCancelBtn')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleApprove}
            >
              {t('adminPages.kyc.approveBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminKycPage;
