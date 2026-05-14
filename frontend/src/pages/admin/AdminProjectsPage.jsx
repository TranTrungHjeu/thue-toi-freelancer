"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ViewGrid,
  Search,
  XmarkCircle,
  User,
  Wallet,
  Calendar,
  Filter,
  Eye,
  Settings,
  Download,
  Check,
  Xmark
} from 'iconoir-react';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { buildBudgetRange, formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';
import Spinner from '../../components/common/Spinner';

const getProjectBudgetUpperBound = (project) => Number(project?.budgetMax ?? project?.budgetMin ?? 0);

const AdminProjectsPage = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { addToast } = useToast();

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [projectDetail, setProjectDetail] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await adminApi.getAllProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch {
      addToast(t('toasts.admin.loadProjectsError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleExport = () => {
    const exportHeaders = [
      { key: 'id', label: 'ID' },
      { key: 'title', label: t('adminPages.projects.tableHeaderProject') },
      { key: 'owner', label: t('adminPages.projects.tableHeaderOwner') },
      { key: 'budgetRange', label: t('adminPages.projects.tableHeaderBudget') },
      { key: 'status', label: t('adminPages.projects.tableHeaderStatus') },
      { key: 'createdAt', label: t('adminPages.projects.tableHeaderDate') }
    ];

    const exportData = filteredProjects.map((project) => ({
      id: project.id,
      title: project.title,
      owner: project.user?.fullName || '',
      budgetRange: buildBudgetRange(project),
      status: project.status,
      createdAt: formatDateTime(project.createdAt)
    }));

    exportToCsv(exportData, exportHeaders, 'Projects_List');
    addToast(t('toasts.admin.exportSuccess'), 'success');
  };

  const handleUpdateStatus = useCallback(async (projectId, status) => {
    try {
      await adminApi.updateProjectStatus(projectId, status);
      addToast(t('toasts.admin.updateStatusSuccess'), 'success');
      setSelectedIds((currentIds) => currentIds.filter((id) => id !== projectId));
      setProjectDetail((currentProject) => {
        if (!currentProject || currentProject.id !== projectId) {
          return currentProject;
        }
        return { ...currentProject, status };
      });
      await fetchProjects();
    } catch (error) {
      addToast(error?.message || t('errors.code.ERR_SYS_01'), 'error');
    }
  }, [addToast, fetchProjects, t]);

  const handleBulkCancel = async () => {
    if (selectedIds.length === 0 || bulkActionLoading) return;

    const confirmMsg = t('common.bulk.confirmDesc', { count: selectedIds.length });
    if (!window.confirm(confirmMsg)) return;

    setBulkActionLoading(true);
    try {
      await adminApi.bulkUpdateProjectStatus(selectedIds, 'cancelled');
      addToast(t('toasts.admin.updateStatusSuccess'), 'success');
      setSelectedIds([]);
      await fetchProjects();
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleViewDetail = (project) => {
    setProjectDetail(project);
    setIsDetailModalOpen(true);
  };

  const filteredProjects = useMemo(() => {
    const normalizedTerm = searchTerm.toLowerCase();

    return projects.filter((project) => {
      const title = (project.title || '').toLowerCase();
      const ownerName = (project.user?.fullName || '').toLowerCase();
      const ownerEmail = (project.user?.email || '').toLowerCase();
      const skills = (project.skills || []).join(' ').toLowerCase();
      const matchesSearch = title.includes(normalizedTerm)
        || ownerName.includes(normalizedTerm)
        || ownerEmail.includes(normalizedTerm)
        || skills.includes(normalizedTerm);
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, projects, searchTerm]);

  const statusConfig = {
    open: { color: 'success', label: t('adminPages.projects.statusOpen') },
    in_progress: { color: 'info', label: t('adminPages.projects.statusInProgress') },
    completed: { color: 'success', label: t('adminPages.projects.statusCompleted') },
    cancelled: { color: 'error', label: t('adminPages.projects.statusCancelled') }
  };

  const headers = [
    {
      key: 'title',
      label: t('adminPages.projects.tableHeaderProject'),
      sortable: true,
      render: (title, row) => (
        <div className="flex flex-col gap-1.5 max-w-sm">
          <span className="font-bold text-slate-900 leading-tight line-clamp-1">{title}</span>
          <div className="flex flex-wrap gap-1">
            {row.skills?.slice(0, 3).map((skill) => (
              <Tag key={skill} size="sm" className="scale-90 origin-left border-slate-100 bg-slate-50 text-slate-500 font-bold">
                {skill}
              </Tag>
            ))}
            {row.skills?.length > 3 && <span className="text-[9px] text-slate-400 font-bold">+{row.skills.length - 3}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: t('adminPages.projects.tableHeaderOwner'),
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">{user?.fullName || 'N/A'}</span>
            <span className="text-[10px] text-slate-400 font-medium">{user?.email || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'budgetMax',
      label: t('adminPages.projects.tableHeaderBudget'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-primary-700 font-bold">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-sm tracking-tighter">{buildBudgetRange(row)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('adminPages.projects.tableHeaderStatus'),
      sortable: true,
      render: (status) => {
        const config = statusConfig[status] || { color: 'info', label: status };
        return <Badge color={config.color} className="uppercase text-[9px] tracking-widest">{config.label}</Badge>;
      }
    },
    {
      key: 'createdAt',
      label: t('adminPages.projects.tableHeaderDate'),
      render: (date) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{formatDateTime(date).split(' ')[0]}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: t('adminPages.projects.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-2 border-slate-100 hover:bg-slate-50"
            onClick={() => handleViewDetail(row)}
            title={t('adminPages.projects.detailTitle')}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              className="px-2 text-red-500 hover:bg-red-50 border-red-100 hover:border-red-200"
              onClick={() => handleUpdateStatus(row.id, 'cancelled')}
              title={t('adminPages.projects.cancelProjectBtn')}
            >
              <XmarkCircle className="w-4 h-4" />
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
              <ViewGrid className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.projects.caption')}</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {t('adminPages.projects.title')}
          </H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            {t('adminPages.projects.desc')}
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('common.bulk.exportCsv')}
          </Button>
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 h-12 bg-white border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none min-w-[180px] shadow-premium"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('adminPages.projects.statusAll')}</option>
              <option value="open">{t('adminPages.projects.statusOpen')}</option>
              <option value="in_progress">{t('adminPages.projects.statusInProgress')}</option>
              <option value="completed">{t('adminPages.projects.statusCompleted')}</option>
              <option value="cancelled">{t('adminPages.projects.statusCancelled')}</option>
            </select>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder={t('adminPages.projects.filterPlaceholder')}
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-premium"
            />
          </div>
        </div>
      </header>

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
                className="bg-red-600 hover:bg-red-700 border-none text-[11px]"
                onClick={handleBulkCancel}
                disabled={bulkActionLoading}
              >
                <XmarkCircle className="w-3.5 h-3.5 mr-1.5" />
                {t('adminPages.projects.cancelProjectBtn')}
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
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.projects.loading')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100 mb-12">
          <AdvancedTable
            headers={headers}
            data={filteredProjects}
            pageSize={10}
            className="[&_table]:border-0"
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      )}

      {!loading && (
        <div className="flex flex-wrap gap-4 p-6 bg-slate-900 border border-slate-800 -mt-20 mx-0 z-10 relative overflow-hidden group">
          <div className="border-r border-white/10 pr-6">
            <Caption className="text-slate-500 font-bold uppercase mb-1">{t('adminPages.projects.summaryCaption')}</Caption>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{projects.length}</span>
              <Text className="text-xs text-slate-400">{t('adminPages.projects.summaryProjectCount')}</Text>
            </div>
          </div>
          <div className="border-r border-white/10 pr-6">
            <Caption className="text-slate-500 font-bold uppercase mb-1">{t('adminPages.projects.summaryVolumeCaption')}</Caption>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-400 tracking-tight">
                {formatCurrency(projects.reduce((acc, project) => acc + getProjectBudgetUpperBound(project), 0))}
              </span>
              <Text className="text-xs text-slate-400">{t('adminPages.projects.summaryVolumeLabel')}</Text>
            </div>
          </div>
          <div className="absolute right-[-10px] top-[-20px] opacity-[0.05] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <Settings width={120} height={120} className="text-white" />
          </div>
        </div>
      )}

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('adminPages.projects.detailTitle')}
        size="lg"
      >
        {projectDetail && (
          <div className="flex flex-col gap-6">
            <header className="p-6 bg-slate-50 border-b border-slate-100">
              <Badge className="mb-2 uppercase tracking-widest">
                {statusConfig[projectDetail.status]?.label || projectDetail.status}
              </Badge>
              <H2 className="!mb-0 text-2xl font-bold tracking-tight text-slate-900">{projectDetail.title}</H2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 flex flex-col gap-6">
                <section>
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-2 text-[10px]">{t('adminPages.projects.modalDescLabel')}</Caption>
                  <Text className="text-sm text-slate-700 leading-relaxed font-medium">
                    {projectDetail.description}
                  </Text>
                </section>

                <section>
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-3 text-[10px]">{t('adminPages.projects.modalSkillsLabel')}</Caption>
                  <div className="flex flex-wrap gap-2">
                    {projectDetail.skills?.map((skill) => (
                      <Tag key={skill} className="bg-white border-slate-200 text-slate-600 font-bold">{skill}</Tag>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-6 pt-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                <div className="flex flex-col">
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1 text-[10px]">{t('adminPages.projects.modalBudgetLabel')}</Caption>
                  <div className="flex items-center gap-2 text-primary-700">
                    <Wallet className="w-4 h-4" />
                    <span className="text-2xl font-bold tracking-tighter">{buildBudgetRange(projectDetail)}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-2 text-[10px]">{t('adminPages.projects.modalOwnerLabel')}</Caption>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                      {projectDetail.user?.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">{projectDetail.user?.fullName || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{projectDetail.user?.email || `ID: #${projectDetail.user?.id || 'N/A'}`}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1 text-[10px]">{t('adminPages.projects.modalDateLabel')}</Caption>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDateTime(projectDetail.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>{t('adminPages.projects.closeBtn')}</Button>
              {projectDetail.status === 'open' && (
                <Button variant="error" onClick={async () => {
                  await handleUpdateStatus(projectDetail.id, 'cancelled');
                  setIsDetailModalOpen(false);
                }}>{t('adminPages.projects.cancelProjectBtn')}</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminProjectsPage;
