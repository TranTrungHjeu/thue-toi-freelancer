"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  PageSearch, 
  User, 
  Activity, 
  Database,
  Search,
  Filter,
  Calendar
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminActivityLogPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAuditLogs();
      if (response.success) {
        setLogs(response.data);
      }
    } catch {
      addToast(t('adminPages.logs.loadingError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.adminEmail.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.detail && log.detail.toLowerCase().includes(term))
    );
  }, [searchTerm, logs]);

  const headers = [
    {
      key: 'adminEmail',
      label: t('adminPages.logs.tableHeaderAdmin'),
      sortable: true,
      render: (email) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <User className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <span className="font-bold text-slate-900 text-xs">{email}</span>
        </div>
      )
    },
    {
      key: 'action',
      label: t('adminPages.logs.tableHeaderAction'),
      sortable: true,
      render: (action) => (
        <Badge color="primary" className="text-[10px] uppercase font-bold tracking-wider">
          {action}
        </Badge>
      )
    },
    {
      key: 'entityType',
      label: t('adminPages.logs.tableHeaderTarget'),
      render: (type, row) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">[{type}]</span>
          <span className="text-xs font-medium text-slate-700">ID: {row.entityId}</span>
        </div>
      )
    },
    {
      key: 'detail',
      label: t('adminPages.logs.tableHeaderDetail'),
      render: (detail) => (
        <div className="max-w-[300px]">
          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed italic" title={detail}>
            {detail || '---'}
          </p>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('adminPages.logs.tableHeaderDate'),
      sortable: true,
      render: (date) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3 h-3" />
          <span className="text-xs font-bold whitespace-nowrap">{formatDateTime(date)}</span>
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: t('adminPages.logs.tableHeaderIp'),
      render: (ip) => (
        <code className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-bold">
          {ip || '0.0.0.0'}
        </code>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
              <PageSearch className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.logs.caption')}</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {t('adminPages.logs.title')}
          </H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            {t('adminPages.logs.desc')}
          </Text>
        </div>

        <div className="w-full md:w-80">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text"
              placeholder={t('adminPages.logs.filterPlaceholder')}
              className="w-full h-12 pl-10 pr-4 bg-white border-2 border-slate-100 outline-none focus:border-primary-500 transition-all font-medium text-sm shadow-premium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white shadow-premium border border-slate-50">
          <Spinner size="md" />
          <Text className="mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.logs.loading')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100 rounded-sm">
          {filteredLogs.length > 0 ? (
            <AdvancedTable
              headers={headers}
              data={filteredLogs}
              pageSize={15}
              className="[&_table]:border-0"
            />
          ) : (
            <div className="p-24 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-50 rounded-full border border-slate-100 mb-4 opacity-50">
                <Database className="w-10 h-10 text-slate-300" />
              </div>
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('adminPages.logs.empty')}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogPage;
