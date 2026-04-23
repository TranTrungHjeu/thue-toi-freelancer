import React, { useEffect, useState, useCallback } from 'react';
import { 
  WarningTriangle, 
  User, 
  Page, 
  CheckCircle
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminReportsPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const reportsRes = await adminApi.getReports();

      if (reportsRes.success) {
        setReports(reportsRes.data);
      }
    } catch {
      addToast(t('toasts.admin.loadReportsError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminApi.updateReportStatus(id, status);
      addToast(t('toasts.reports.updateStatusSuccess'), 'success');
      fetchData();
    } catch (error) {
      addToast(error?.message || t('toasts.reports.updateStatusError'), 'error');
    }
  };

  // Status badge config
  const reportStatusConfig = {
    RESOLVED: 'success',
    PENDING: 'warning',
    DISMISSED: 'secondary',
  };

  const headers = [
    {
      key: 'reporter',
      label: t('adminPages.reports.tableHeaderReporter'),
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-xs">{row.reporter?.fullName || 'N/A'}</span>
          <span className="text-[10px] text-slate-400 font-medium">{row.reporter?.email || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'target',
      label: t('adminPages.reports.tableHeaderTarget'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.targetType === 'PROJECT' ? <Page className="w-4 h-4 text-primary-500" /> : <User className="w-4 h-4 text-secondary-500" />}
          <div className="flex flex-col">
            <Badge color="secondary" className="scale-75 origin-left mb-0.5">{row.targetType}</Badge>
            <span className="text-[11px] font-bold text-slate-700">ID: {row.targetId}</span>
          </div>
        </div>
      )
    },
    {
      key: 'reason',
      label: t('adminPages.reports.tableHeaderReason'),
      render: (_, row) => (
        <div className="flex flex-col gap-1 min-w-[200px]">
          <Badge color="error" className="w-fit">{t(`reportModal.reasons.${row.reason}`)}</Badge>
          <Text className="text-[11px] text-slate-500 line-clamp-2 italic">"{row.description || t('values.notAvailable')}"</Text>
        </div>
      )
    },
    {
      key: 'status',
      label: t('adminPages.reports.tableHeaderStatus'),
      render: (status) => {
        const statusKey = status?.toLowerCase();
        return (
          <Badge color={reportStatusConfig[status] || 'secondary'}>
            {t(`status.report.${statusKey}`) || status}
          </Badge>
        );
      }
    },
    {
      key: 'createdAt',
      label: t('adminPages.reports.tableHeaderDate'),
      sortable: true,
      render: (date) => <span className="text-[11px] text-slate-400 font-medium">{formatDateTime(date)}</span>
    },
    {
      key: 'actions',
      label: t('adminPages.reports.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => handleUpdateStatus(row.id, 'RESOLVED')}>
                {t('adminPages.reports.resolveBtn')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(row.id, 'DISMISSED')}>
                {t('adminPages.reports.dismissBtn')}
              </Button>
            </>
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
            <WarningTriangle className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.reports.caption')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.reports.title')}
        </H1>
        <Text className="mt-2 max-w-2xl text-slate-500 text-base">
          {t('adminPages.reports.desc')}
        </Text>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.reports.loading')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          {reports.length > 0 ? (
            <AdvancedTable
              headers={headers}
              data={reports}
              pageSize={10}
              className="[&_table]:border-0"
            />
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-slate-200 mb-4" />
              <Text className="text-slate-400 font-medium">{t('adminPages.reports.empty')}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
