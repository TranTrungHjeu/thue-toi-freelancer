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
  Xmark,
  List,
  UserBag,
  Label,
  DoubleCheck,
  NavArrowRight,
  BinFull
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

const normalizeSkillNames = (skills) =>
  Array.isArray(skills)
    ? [...new Set(skills.map((skill) => `${skill || ''}`.trim()).filter(Boolean))]
    : [];

const getCoverImageBySkills = (skills) => {
  const skillNames = normalizeSkillNames(skills).map((s) => s.toLowerCase());

  if (skillNames.some((s) => s.includes('design') || s.includes('ui') || s.includes('ux'))) {
    return 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1000&auto=format&fit=crop';
  }
  if (skillNames.some((s) => s.includes('develop') || s.includes('code') || s.includes('program') || s.includes('javascript') || s.includes('react') || s.includes('node'))) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop';
  }
  if (skillNames.some((s) => s.includes('video') || s.includes('edit') || s.includes('motion'))) {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1000&auto=format&fit=crop';
  }
  if (skillNames.some((s) => s.includes('marketing') || s.includes('seo') || s.includes('social'))) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop';
  }
  if (skillNames.some((s) => s.includes('writing') || s.includes('content') || s.includes('copy'))) {
    return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop';
};

/**
 * Đảm bảo trường dữ liệu kỹ năng (skills) luôn trả về một mảng các chuỗi hợp lệ.
 * Chống treo/crash ứng dụng React khi backend trả về dữ liệu lỗi dạng chuỗi thuần,
 * chuỗi JSON thô, hoặc các giá trị rỗng/null từ database cũ.
 *
 * @param {*} skills Dữ liệu kỹ năng đầu vào từ API
 * @returns {string[]} Mảng danh sách tên kỹ năng đã được làm sạch
 */
const ensureSkillsArray = (skills) => {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string' && skills.trim()) {
    if (skills.startsWith('[') && skills.endsWith(']')) {
      try {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return skills.includes(',')
      ? skills.split(',').map(s => s.trim())
      : [skills.trim()];
  }
  return [];
};

const AdminProjectsPage = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const { addToast } = useToast();

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'table' | 'grid'
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, project: object }

  // State cho hộp thoại xác nhận bulk cancel — thay thế window.confirm để nhất quán với UI hệ thống

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
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
    // Giữ nguyên dependency mảng rỗng để tránh infinite loop vì fetchProjects là useCallback có tham chiếu thay đổi khi addToast/t đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleOpenActionMenu = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project
    });
  };

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
    setBulkConfirmOpen(false);
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
    const safeProjects = Array.isArray(projects) ? projects : [];

    return safeProjects.filter((project) => {
      const title = (project.title || '').toLowerCase();
      const ownerName = (project.user?.fullName || '').toLowerCase();
      const ownerEmail = (project.user?.email || '').toLowerCase();
      const skillsList = ensureSkillsArray(project.skills);
      const skillsStr = skillsList.join(' ').toLowerCase();
      const matchesSearch = title.includes(normalizedTerm)
        || ownerName.includes(normalizedTerm)
        || ownerEmail.includes(normalizedTerm)
        || skillsStr.includes(normalizedTerm);
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;

      let matchesDate = true;
      if (filterDate && project.createdAt) {
        const pDate = new Date(project.createdAt);
        if (!isNaN(pDate)) {
          const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
          matchesDate = pDateStr === filterDate;
        }
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [filterStatus, projects, searchTerm, filterDate]);

  const statusConfig = {
    open: { color: 'success', label: t('adminPages.projects.statusOpen') },
    in_progress: { color: 'info', label: t('adminPages.projects.statusInProgress') },
    completed: { color: 'success', label: t('adminPages.projects.statusCompleted') },
    cancelled: { color: 'error', label: t('adminPages.projects.statusCancelled') },
    pending_payment: { color: 'warning', label: 'Chờ thanh toán' }
  };

  const headers = [
    {
      key: 'title',
      label: t('adminPages.projects.tableHeaderProject'),
      sortable: true,
      render: (title, row) => {
        const skills = ensureSkillsArray(row.skills);
        const coverImage = getCoverImageBySkills(skills);
        return (
          <div className="flex items-center gap-3 max-w-sm">
            <div className="w-10 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
              <img src={coverImage} className="w-full h-full object-cover opacity-80" alt="Category" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-black text-slate-900 leading-tight line-clamp-1 text-xs">{title}</span>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 2).map((skill) => (
                  <Tag key={skill} size="sm" className="scale-75 origin-left border-slate-200 bg-white/50 text-slate-500 font-black py-0">
                    {skill}
                  </Tag>
                ))}
                {skills.length > 2 && <span className="text-[8px] text-slate-400 font-black">+{skills.length - 2}</span>}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'user',
      label: t('adminPages.projects.tableHeaderOwner'),
      render: (user) => (
        <div className="flex items-center gap-2.5">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm" alt={user.fullName} />
          ) : (
            <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center rounded-full text-[10px] font-black shadow-sm">
              {user?.fullName?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-slate-800 truncate leading-tight">{user?.fullName || 'N/A'}</span>
            <span className="text-[9px] text-slate-400 font-bold truncate tracking-tight">{user?.email || 'N/A'}</span>
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
          <span className="text-[10px] font-bold">{formatDateTime(date)}</span>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2 border-b border-slate-150 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-2 bg-slate-900 rounded-lg shadow-sm border border-slate-800">
              <ViewGrid className="w-4 h-4 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px]">{t('adminPages.projects.caption')}</Caption>
          </div>
          <H1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('adminPages.projects.title')}
          </H1>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
          {/* Nút chuyển đổi View Mode */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-10">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-black transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <ViewGrid className="w-3.5 h-3.5" />
              Lưới
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-black transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Bảng
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 h-10 rounded-lg text-xs font-black"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t('common.bulk.exportCsv')}
          </Button>

          {/* Lọc theo ngày */}
          <div className="shrink-0">
            <input
              type="date"
              className="h-10 px-3 bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors rounded-lg shadow-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Lọc dự án theo ngày đăng"
            />
          </div>

          <div className="relative group shrink-0">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              className="pl-8 pr-6 h-10 bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none min-w-[150px] shadow-sm rounded-lg"
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

          <div className="w-full sm:w-60 lg:w-48">
            <Input
              placeholder={t('adminPages.projects.filterPlaceholder')}
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm !h-10 !rounded-lg !text-xs"
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
                onClick={() => setBulkConfirmOpen(true)}
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

      {!loading && (
        <div className="flex flex-wrap gap-6 p-4 bg-slate-900 border border-slate-800 mb-6 mx-0 z-10 relative overflow-hidden group rounded-xl shadow-md">
          <div className="border-r border-white/10 pr-6 flex items-center gap-3">
            <div className="flex flex-col">
              <Caption className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">{t('adminPages.projects.summaryCaption')}</Caption>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white tracking-tight">{projects.length}</span>
                <span className="text-[10px] text-slate-400 font-bold">{t('adminPages.projects.summaryProjectCount')}</span>
              </div>
            </div>
          </div>
          <div className="border-r border-white/10 pr-6 flex items-center gap-3">
            <div className="flex flex-col">
              <Caption className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">{t('adminPages.projects.summaryVolumeCaption')}</Caption>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-primary-400 tracking-tight">
                  {formatCurrency(projects.reduce((acc, project) => acc + getProjectBudgetUpperBound(project), 0))}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{t('adminPages.projects.summaryVolumeLabel')}</span>
              </div>
            </div>
          </div>
          <div className="absolute right-[-5px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <Settings width={80} height={80} className="text-white" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium rounded-2xl">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.projects.loading')}</Text>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100 mb-12 rounded-2xl">
          <AdvancedTable
            headers={headers}
            data={filteredProjects}
            pageSize={10}
            className="[&_table]:border-0 [&_tbody_tr]:cursor-pointer"
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={(e, row) => handleOpenActionMenu(e, row)}
            rowClassName={(row) => {
              const statusRowStyles = {
                open: 'hover:bg-emerald-50/40 bg-white',
                in_progress: 'hover:bg-blue-50/40 bg-white',
                completed: 'hover:bg-slate-50 bg-white',
                cancelled: 'hover:bg-red-50/40 bg-red-50/10',
                pending_payment: 'hover:bg-amber-50/40 bg-amber-50/10'
              };
              return statusRowStyles[row.status] || 'hover:bg-slate-50 bg-white';
            }}
          />
        </div>
      ) : (
        /* Giao diện Grid Cards dự án nâng cao dành cho Admin */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-16 bg-white border border-slate-100 text-center rounded-2xl shadow-sm">
              <span className="text-sm font-semibold text-slate-400">Không tìm thấy dự án nào phù hợp.</span>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isSelected = selectedIds.includes(project.id);
              const skills = ensureSkillsArray(project.skills);
              const coverImage = getCoverImageBySkills(skills);

              // Cấu hình màu sắc Card theo trạng thái (Đậm nét và rõ ràng hơn)
              const statusCardStyles = {
                open: { border: 'border-emerald-200 hover:border-emerald-500', bg: 'bg-emerald-50/40', accent: 'bg-emerald-500' },
                in_progress: { border: 'border-blue-200 hover:border-blue-500', bg: 'bg-blue-50/40', accent: 'bg-blue-500' },
                completed: { border: 'border-slate-200 hover:border-slate-400', bg: 'bg-slate-50/80', accent: 'bg-slate-400' },
                cancelled: { border: 'border-red-200 hover:border-red-500', bg: 'bg-red-50/40', accent: 'bg-red-500' },
                pending_payment: { border: 'border-amber-200 hover:border-amber-500', bg: 'bg-amber-50/40', accent: 'bg-amber-500' }
              };
              const style = statusCardStyles[project.status] || { border: 'border-slate-100', bg: 'bg-white', accent: 'bg-slate-200' };

              return (
                <div
                  key={project.id}
                  onClick={(e) => handleOpenActionMenu(e, project)}
                  className={`group relative flex flex-col justify-between border transition-all duration-300 rounded-xl overflow-hidden cursor-pointer hover:shadow-sm ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/5 ring-2 ring-primary-500/5'
                      : `${style.border} ${style.bg}`
                  }`}
                >
                  {/* Header Image Background (Tương tự Marketplace) */}
                  <div className="h-20 w-full relative overflow-hidden">
                    <img
                      src={coverImage}
                      alt="Project Category"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                    {/* Badge trạng thái thu nhỏ nằm trên ảnh */}
                    <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${style.accent}`}>
                      {statusConfig[project.status]?.label || project.status}
                    </div>
                  </div>

                  {/* Accent bar lề trái để nhận diện trạng thái nhanh */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${isSelected ? 'bg-primary-500' : style.accent} opacity-80 z-10`} />

                  {/* Checkbox chọn hàng loạt */}
                  <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds((prev) =>
                          isSelected ? prev.filter((id) => id !== project.id) : [...prev, project.id]
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer shadow-sm"
                    />
                  </div>

                  <div className="p-3.5 pt-2 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[8px] text-slate-400 font-bold tracking-tight uppercase">#{project.id}</span>
                    </div>

                    {/* Tiêu đề tối giản */}
                    <h3
                      className="text-sm font-black text-slate-800 leading-snug mb-2 hover:text-primary-600 line-clamp-1 transition-colors"
                      title={project.title}
                    >
                      {project.title}
                    </h3>

                    {/* Tags kỹ năng tối giản */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {skills.slice(0, 2).map((skill) => (
                        <Tag key={skill} size="sm" className="border-slate-100 bg-white text-slate-500 font-bold text-[9px] py-0 px-1.5">
                          {skill}
                        </Tag>
                      ))}
                      {skills.length > 2 && (
                        <span className="inline-flex items-center text-[9px] text-slate-400 font-bold px-1 py-0 bg-white rounded-md border border-slate-100">
                          +{skills.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Footer Card tối giản */}
                    <div className="border-t border-slate-100 pt-2.5 mt-auto flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {project.user?.avatarUrl ? (
                            <img
                              src={project.user.avatarUrl}
                              alt={project.user.fullName}
                              className="w-6.5 h-6.5 rounded-full object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-6.5 h-6.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shadow-sm shrink-0">
                              {project.user?.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-slate-700 truncate leading-tight">{project.user?.fullName || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-primary-700 tracking-tighter">{buildBudgetRange(project)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100/50 pt-2">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[9px] font-bold">{formatDateTime(project.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div
                            className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-350 rounded-lg text-[9px] font-black shadow-sm transition-all flex items-center gap-1 text-slate-600"
                          >
                            <Settings className="w-3 h-3 text-slate-400" />
                            Hành động
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Context Menu (Chuột trái) chuyên nghiệp */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-white border border-slate-200 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden min-w-[220px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 300), left: Math.min(contextMenu.x, window.innerWidth - 250) }}
        >
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-black">
              #{contextMenu.project.id}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-slate-900 truncate pr-4">{contextMenu.project.title}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hành động dự án</span>
            </div>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => {
                handleViewDetail(contextMenu.project);
                setContextMenu(null);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-primary-600 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                Xem chi tiết dự án
              </div>
              <NavArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {contextMenu.project.status === 'open' && (
              <>
                <div className="h-px bg-slate-100 my-1.5 mx-2" />
                <button
                  onClick={() => {
                    handleUpdateStatus(contextMenu.project.id, 'cancelled');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BinFull className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                    Hủy dự án này
                  </div>
                  <NavArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </>
            )}

            <div className="h-px bg-slate-100 my-1.5 mx-2" />
            <button
              onClick={() => {
                handleExport();
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors group"
            >
              <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
              Xuất dữ liệu dự án
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={null}
        size="2xl"
      >
        {projectDetail && (
          <div className="flex flex-col overflow-hidden">
            {/* Header Info Banner - Fixed at top, no scroll */}
            <div className="relative overflow-hidden bg-slate-900 pt-12 pb-10 px-8 md:px-10 text-white shadow-2xl border-b border-white/5 shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pr-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Badge color={statusConfig[projectDetail.status]?.color || 'info'} className="uppercase font-black tracking-widest text-[10px] py-1.5 px-4 rounded-lg shadow-lg shadow-black/20 border border-white/10">
                      {statusConfig[projectDetail.status]?.label || projectDetail.status}
                    </Badge>
                    <span className="text-xs font-black text-slate-500 tracking-widest bg-white/5 px-2 py-1 rounded-md">ID: #{projectDetail.id}</span>
                  </div>
                  <H2 className="!mb-0 text-xl md:text-2xl font-black tracking-tighter leading-tight text-white">
                    {projectDetail.title}
                  </H2>
                </div>

                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-inner shrink-0">
                  <div className="flex flex-col">
                    <Caption className="text-slate-400 font-black uppercase text-[9px] tracking-widest mb-1">Ngân sách tối đa</Caption>
                    <span className="text-lg font-black text-primary-400 tracking-tighter">{buildBudgetRange(projectDetail)}</span>
                  </div>
                  <div className="w-px h-10 bg-white/10 mx-2" />
                  <div className="p-2 bg-primary-500/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-primary-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex flex-col gap-6 max-h-[calc(100vh-25rem)] overflow-y-auto scrollbar-premium py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-8">
                {/* Cột trái: Nội dung & Kỹ năng (8 columns) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                  <section className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <List className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chi tiết nội dung</h3>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">
                      {projectDetail.description || 'Không có mô tả chi tiết.'}
                    </div>
                  </section>

                  <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <Label className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kỹ năng yêu cầu</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ensureSkillsArray(projectDetail.skills).map((skill) => (
                        <Tag key={skill} className="bg-slate-50 border-slate-100 text-slate-700 font-black rounded-xl text-[11px] py-1.5 px-4 hover:border-primary-300 transition-colors cursor-default">
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Cột phải: Metadata & Client (4 columns) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Khách hàng card */}
                  <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Khách hàng</h3>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        {projectDetail.user?.avatarUrl ? (
                          <img
                            src={projectDetail.user.avatarUrl}
                            className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-md"
                            alt="Client"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center rounded-full text-2xl font-black shadow-md">
                            {projectDetail.user?.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" />
                      </div>
                      <span className="text-base font-black text-slate-900 tracking-tight mb-1">{projectDetail.user?.fullName || 'N/A'}</span>
                      <span className="text-xs font-bold text-slate-400 mb-4">{projectDetail.user?.email || 'N/A'}</span>

                      <div className="w-full h-px bg-slate-100 mb-4" />

                      <div className="flex items-center justify-center gap-2">
                         <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                           ID: #{projectDetail.user?.id || 'N/A'}
                         </span>
                      </div>
                    </div>
                  </section>

                  {/* Timeline card */}
                  <section className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Thời gian</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ngày đăng tin</span>
                        <span className="text-xs font-black text-slate-800">{formatDateTime(projectDetail.createdAt)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Hết hạn báo giá</span>
                        <span className="text-xs font-black text-primary-600">{projectDetail.deadline ? formatDateTime(projectDetail.deadline) : 'Không xác định'}</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer Modal Action Buttons - Fixed at bottom */}
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4 px-8 pb-8 bg-white shrink-0">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold text-xs px-4.5 h-10 transition-colors"
                onClick={() => setIsDetailModalOpen(false)}
              >
                {t('adminPages.projects.closeBtn') || 'Đóng'}
              </Button>
              {projectDetail.status === 'open' && (
                <Button
                  variant="error"
                  className="rounded-xl font-bold text-xs px-4.5 h-10 shadow-sm transition-colors"
                  onClick={async () => {
                    await handleUpdateStatus(projectDetail.id, 'cancelled');
                    setIsDetailModalOpen(false);
                  }}
                >
                  <XmarkCircle className="w-3.5 h-3.5 mr-1.5" />
                  {t('adminPages.projects.cancelProjectBtn') || 'Hủy dự án'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Hộp thoại xác nhận bulk cancel dự án */}
      <Modal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        title={t('common.bulk.confirmTitle')}
        size="sm"
      >
        <div className="flex flex-col gap-6">
          <Text className="text-slate-600">
            {t('common.bulk.confirmDesc', { count: selectedIds.length })}
          </Text>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setBulkConfirmOpen(false)}
            >
              {t('adminPages.projects.closeBtn')}
            </Button>
            <Button
              variant="error"
              className="flex-1"
              onClick={handleBulkCancel}
              disabled={bulkActionLoading}
            >
              {t('adminPages.projects.cancelProjectBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProjectsPage;

