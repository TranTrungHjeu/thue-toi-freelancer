import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ViewGrid, 
  Search, 
  CheckCircle, 
  XmarkCircle, 
  Archive,
  User,
  Wallet,
  Calendar,
  Filter,
  Eye,
  Settings
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Tag from '../../components/common/Tag';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { addToast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      const response = await adminApi.getAllProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch {
      addToast("Không thể tải danh sách dự án", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpdateStatus = async (projectId, status) => {
    try {
      const response = await adminApi.updateProjectStatus(projectId, status);
      if (response.success) {
        addToast(`Cập nhật trạng thái dự án thành công`, "success");
        fetchProjects();
      }
    } catch {
      addToast("Không thể cập nhật trạng thái dự án", "error");
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterStatus, projects]);

  const headers = [
    {
      key: 'title',
      label: 'Dự án',
      sortable: true,
      render: (title, row) => (
        <div className="flex flex-col gap-1.5 max-w-sm">
          <span className="font-bold text-slate-900 leading-tight line-clamp-1">{title}</span>
          <div className="flex flex-wrap gap-1">
            {row.skills?.slice(0, 3).map(skill => (
              <Tag key={skill.id} size="sm" className="scale-90 origin-left border-slate-100 bg-slate-50 text-slate-500 font-bold">
                {skill.name}
              </Tag>
            ))}
            {row.skills?.length > 3 && <span className="text-[9px] text-slate-400 font-bold">+{row.skills.length - 3}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Chủ dự án',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="text-xs font-bold text-slate-700">{user?.fullName}</span>
        </div>
      )
    },
    {
      key: 'budget',
      label: 'Ngân sách',
      sortable: true,
      render: (budget) => (
        <div className="flex items-center gap-1.5 text-primary-700 font-bold">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-sm tracking-tighter">{formatCurrency(budget)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      render: (status) => {
        const configs = {
          open: { color: 'success', label: 'Đang mở' },
          in_progress: { color: 'info', label: 'Đang làm' },
          completed: { color: 'success', label: 'Hoàn thành' },
          cancelled: { color: 'error', label: 'Đã hủy' }
        };
        const config = configs[status] || { color: 'info', label: status };
        return <Badge color={config.color} className="uppercase text-[9px] tracking-widest">{config.label}</Badge>;
      }
    },
    {
      key: 'createdAt',
      label: 'Đăng ngày',
      render: (date) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{formatDateTime(date).split(' ')[0]}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="px-2 border-slate-100 hover:bg-slate-50">
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'open' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="px-2 text-red-500 hover:bg-red-50 border-red-100 hover:border-red-200"
              onClick={() => handleUpdateStatus(row.id, 'cancelled')}
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary-600 rounded-none border border-primary-500 shadow-lg shadow-primary-500/20">
              <ViewGrid className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-primary-600 font-bold uppercase tracking-[0.2em]">Kiểm duyệt</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            Quản lý <span className="text-primary-600">Dự án</span>
          </H1>
          <Text className="text-slate-500">Giám sát hoạt động đăng dự án và đảm bảo chất lượng nội dung trên sàn.</Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-9 pr-8 h-12 bg-white border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none min-w-[160px] shadow-premium"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Đang mở</option>
              <option value="in_progress">Đang triển khai</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div className="w-full sm:w-72">
            <Input 
              placeholder="Tìm tên dự án, khách hàng..."
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
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Đang nạp dữ liệu dự án...</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100 mb-12">
          <AdvancedTable 
            headers={headers} 
            data={filteredProjects} 
            pageSize={10}
            className="[&_table]:border-0"
          />
        </div>
      )}

      {/* Quick Summary Footer */}
      {!loading && (
        <div className="flex flex-wrap gap-4 p-6 bg-slate-900 border border-slate-800 -mt-20 mx-0 z-10 relative overflow-hidden group">
          <div className="border-r border-white/10 pr-6">
            <Caption className="text-slate-500 font-bold uppercase mb-1">Tổng quan</Caption>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{projects.length}</span>
              <Text className="text-xs text-slate-400">Dự án</Text>
            </div>
          </div>
          <div className="border-r border-white/10 pr-6">
            <Caption className="text-slate-500 font-bold uppercase mb-1">Giá trị tích lũy</Caption>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-400 tracking-tight">
                {formatCurrency(projects.reduce((acc, p) => acc + (p.budget || 0), 0))}
              </span>
              <Text className="text-xs text-slate-400">Volume</Text>
            </div>
          </div>
          <div className="absolute right-[-10px] top-[-20px] opacity-[0.05] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <Settings width={120} height={120} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPage;
