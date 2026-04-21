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
  MoreHoriz
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // State for toggle status modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminApi.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch {
      addToast("Không thể tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setReason('');
    setIsModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await adminApi.toggleUserStatus(selectedUser.id, reason);
      addToast(`Đã ${selectedUser.isActive ? 'khóa' : 'mở khóa'} tài khoản thành công`, "success");
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
    } catch {
      addToast("Không thể cập nhật trạng thái người dùng", "error");
    } finally {
      setSubmitting(false);
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
      label: 'Thông tin người dùng',
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
      label: 'Vai trò',
      sortable: true,
      render: (role) => (
        <Badge color={role === 'admin' ? 'error' : role === 'customer' ? 'info' : 'success'}>
          {role === 'customer' ? 'Người thuê' : role === 'freelancer' ? 'Người tìm việc' : 'Admin'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (_, row) => (
        <div className="flex items-center gap-2">
           {row.isActive ? (
             <span className="flex items-center gap-1.5 text-green-600 text-[11px] font-bold uppercase tracking-wider">
               <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
             </span>
           ) : (
             <span className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold uppercase tracking-wider">
               <Lock className="w-3.5 h-3.5" /> Bị khóa
             </span>
           )}
           {row.verified && (
             <Badge color="info" className="scale-75 origin-left">Verified</Badge>
           )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Ngày gia nhập',
      sortable: true,
      render: (date) => <span className="text-xs text-slate-500 font-medium">{formatDateTime(date)}</span>
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_, row) => (
        <Button 
          variant={row.isActive ? "outline" : "primary"}
          size="sm"
          className="min-w-0 px-2 py-2"
          onClick={() => handleToggleStatus(row)}
          title={row.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        >
          {row.isActive ? <Lock className="w-4 h-4" /> : <Key className="w-4 h-4" />}
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-secondary-900 rounded-none">
              <Group className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">Hệ thống</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            Quản lý <span className="text-primary-600">Người dùng</span>
          </H1>
          <Text className="text-slate-500">Xem danh sách, kiểm soát quyền truy cập và bảo vệ cộng đồng Thuê Tôi.</Text>
        </div>
        
        <div className="w-full md:w-80">
          <Input 
            placeholder="Tìm theo tên, email, vai trò..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-premium"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Đang truy xuất dữ liệu...</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          <AdvancedTable 
            headers={headers} 
            data={filteredUsers} 
            pageSize={10}
            className="[&_table]:border-0"
          />
        </div>
      )}

      {/* Toggle Status Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={selectedUser?.isActive ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
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
                Xác nhận thay đổi trạng thái cho <span className="italic">{selectedUser?.fullName}</span>
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">
                {selectedUser?.isActive 
                  ? "Tài khoản sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa lại." 
                  : "Tài khoản sẽ được khôi phục quyền truy cập đầy đủ vào các tính năng của sàn."}
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">Lý do thay đổi (Bắt buộc)</Text>
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 outline-none transition-colors text-sm font-medium"
              placeholder="Nhập lý do chi tiết..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
            <Caption className="text-slate-400">Người dùng sẽ nhận được thông báo kèm lý do này qua hệ thống.</Caption>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button 
              variant={selectedUser?.isActive ? "error" : "primary"}
              className="flex-1"
              onClick={confirmToggleStatus}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? <Spinner size="sm" tone="current" inline /> : (selectedUser?.isActive ? "Xác nhận khóa" : "Kích hoạt ngay")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
