import React, { useEffect, useState } from 'react';
import { 
  Group, 
  PageSearch, 
  ViewGrid, 
  Wallet, 
  StatsUpSquare,
  Activity,
  UserPlus,
  RefreshDouble,
  Flash,
  ShieldCheck
} from 'iconoir-react';
import StatCard from '../../components/common/StatCard';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import adminApi from '../../api/adminApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getSystemStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch {
        addToast("Không thể tải thống kê hệ thống", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm">
        <Spinner size="lg" />
        <Text className="mt-4 text-slate-500 font-medium animate-pulse text-xs uppercase tracking-widest">Đang tính toán dữ liệu hệ thống...</Text>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-8"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary-100 rounded-none border border-primary-200">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
          </div>
          <Caption className="text-primary-600 font-bold uppercase tracking-[0.2em]">Quản trị hệ thống</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          Tổng quan <span className="text-primary-600">Sức khỏe hệ thống</span>
        </H1>
        <Text className="max-w-2xl text-slate-500">
          Chào mừng trở lại quản trị viên. Dưới đây là các chỉ số vận hành thực tế của sàn Thuê Tôi tính đến thời điểm hiện tại.
        </Text>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={stats?.totalUsers || 0}
          icon={Group}
          trend="up"
          trendValue="12%"
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label="Dự án đang chạy"
          value={stats?.activeProjects || 0}
          icon={Activity}
          trend="up"
          trendValue="5%"
          animation="pulse"
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label="Hợp đồng hoàn thành"
          value={stats?.completedContracts || 0}
          icon={Flash}
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label="Tổng giá trị GMV"
          value={formatCurrency(stats?.totalGmv || 0)}
          icon={Wallet}
          className="border-none shadow-premium bg-primary-900 border-primary-900 !text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Visualizer */}
        <Card className="lg:col-span-2 border-none shadow-premium bg-white pb-8 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1">Hiệu năng</Caption>
              <H2 className="!mb-0 text-2xl font-bold tracking-tight">Tỷ lệ khớp lệnh</H2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary-600 tracking-tighter">{stats?.matchingRate?.toFixed(1) || 0}%</span>
              <Text className="text-[10px] uppercase text-slate-400 font-bold">Thành công</Text>
            </div>
          </div>
          
          <div className="flex items-end gap-2 h-48 px-2">
            {[35, 45, 60, 40, 75, 55, 90, 65, 80, 50, 70, 85].map((h, i) => (
              <div 
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 min-w-[6px] ${i === 6 ? 'bg-primary-500' : 'bg-slate-100 hover:bg-primary-200'} transition-colors rounded-t-sm`}
              />
            ))}
          </div>
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
             <StatsUpSquare width={180} height={180} />
          </div>
        </Card>

        {/* Roles Distribution */}
        <Card className="border-none shadow-premium bg-slate-900 !text-white flex flex-col justify-between overflow-hidden relative">
          <div>
            <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1">Cơ cấu người dùng</Caption>
            <H2 className="text-2xl font-bold tracking-tight text-white">Vai trò trên hệ thống</H2>
          </div>
          
          <div className="flex flex-col gap-6 my-8">
            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <Text className="text-white font-medium">Người thuê</Text>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{stats?.totalCustomers || 0}</span>
            </div>
            
            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 text-green-400 border border-green-500/30">
                  <PageSearch className="w-4 h-4" />
                </div>
                <Text className="text-white font-medium">Người tìm việc</Text>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{stats?.totalFreelancers || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-auto">
            <RefreshDouble className="w-3 h-3 animate-spin-slow" />
            Cập nhật theo thời gian thực
          </div>

          <div className="absolute bottom-[-10%] right-[-10%] opacity-10">
             <ViewGrid width={150} height={150} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
