import React, { useEffect, useState, useMemo } from 'react';
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
  Database,
  Megaphone,
  WarningTriangle,
  NavArrowRight,
  Coins,
  ShieldCheck as ShieldIcon,
  Settings,
  Database as DbIcon,
  HardDrive,
  Cpu
} from 'iconoir-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import adminApi from '../../api/adminApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';

const AdminDashboardPage = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getSystemStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch {
        addToast(t('toasts.dashboard.loadError'), "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchHealth = async () => {
      try {
        const response = await adminApi.getHealthDetailed();
        if (response.success) {
          setHealth(response.data);
        }
      } catch (err) {
        console.error("Health monitoring error", err);
      }
    };

    fetchStats();
    fetchHealth();
    
    // Auto-refresh health every 10s
    const timer = setInterval(fetchHealth, 10000);
    return () => clearInterval(timer);
  }, [addToast, t]);

  const chartData = useMemo(() => {
    if (!stats?.userGrowthTrend) return [];
    return Object.entries(stats.userGrowthTrend).map(([date, value]) => ({
      name: date.split('-').slice(1).join('/'),
      count: value
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm">
        <Spinner size="lg" />
        <Text className="mt-4 text-slate-500 font-medium animate-pulse text-xs uppercase tracking-widest">{t('adminPages.dashboard.updating')}</Text>
      </div>
    );
  }


  return (
    <div 
      className="flex flex-col gap-8"
    >
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
            <ShieldIcon className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.dashboard.caption')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.dashboard.title')}
        </H1>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <Text className="text-slate-500 max-w-xl text-base">
            {t('adminPages.dashboard.greeting')}
          </Text>
          
          {health && (
            <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              health.status === 'UP' ? 'bg-green-50 border-green-100 text-green-700' : 
              health.status === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                health.status === 'UP' ? 'bg-green-500' : 
                health.status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">System {health.status}</span>
            </div>
          )}
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('adminPages.dashboard.totalUsers')}
          value={stats?.totalUsers || 0}
          icon={Group}
          trend="up"
          trendValue="12%"
          chartData={[30, 40, 35, 50, 45, 60, 55]}
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label={t('adminPages.dashboard.activeProjects')}
          value={stats?.activeProjects || 0}
          icon={Activity}
          trend="up"
          trendValue="5%"
          chartData={[45, 30, 40, 35, 50, 45, 60]}
          animation="pulse"
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label={t('adminPages.dashboard.totalGmv')}
          value={formatCurrency(stats?.totalGmv || 0)}
          icon={Wallet}
          className="border-none shadow-premium bg-white/80 backdrop-blur-md"
        />
        <StatCard
          label={t('adminPages.dashboard.platformProfit')}
          value={formatCurrency((stats?.totalGmv || 0) * 0.1)}
          icon={Coins}
          className="border-none shadow-premium bg-primary-900 border-primary-900 !text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Visualizer */}
        <Card className="lg:col-span-2 border-none shadow-premium bg-white pb-8 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1">{t('adminPages.dashboard.growthTitle')}</Caption>
              <H2 className="!mb-0 text-2xl font-bold tracking-tight">{t('adminPages.dashboard.matchingRate')}</H2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary-600 tracking-tighter">{stats?.matchingRate?.toFixed(1) || 0}%</span>
              <Text className="text-[10px] uppercase text-slate-400 font-bold">{t('status.bid.accepted')}</Text>
            </div>
          </div>
          
          <div className="h-64 mt-4">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                   />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ 
                       background: '#0f172a', 
                       border: 'none', 
                       borderRadius: '8px',
                       color: '#fff',
                       fontSize: '11px',
                       fontWeight: 700
                     }} 
                   />
                   <Area 
                     type="monotone" 
                     dataKey="count" 
                     stroke="#22c55e" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorCount)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex items-center justify-center italic text-slate-300 text-xs">{t('values.notAvailable')}</div>
             )}
          </div>
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
             <StatsUpSquare width={180} height={180} />
          </div>
        </Card>

        {/* Roles Distribution */}
        <Card className="border-none shadow-premium bg-slate-900 !text-white flex flex-col justify-between overflow-hidden relative">
          <div>
            <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-1">{t('adminPages.dashboard.userStructure')}</Caption>
            <H2 className="text-2xl font-bold tracking-tight text-white">{t('adminPages.dashboard.userStructure')}</H2>
          </div>
          
          <div className="flex flex-col gap-6 my-8">
            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <Text className="text-white font-medium">{t('roles.customer')}</Text>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{stats?.totalCustomers || 0}</span>
            </div>
            
            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 text-green-400 border border-green-500/30">
                  <PageSearch className="w-4 h-4" />
                </div>
                <Text className="text-white font-medium">{t('roles.freelancer')}</Text>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{stats?.totalFreelancers || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-auto">
            <RefreshDouble className="w-3 h-3 animate-spin-slow" />
            {t('layout.version')}
          </div>

          <div className="absolute bottom-[-10%] right-[-10%] opacity-10">
             <ViewGrid width={150} height={150} />
          </div>
        </Card>
      </div>

      {health && (
        <section>
          <div className="flex flex-col gap-2 mb-6">
            <Caption className="text-primary-600 font-bold uppercase tracking-[0.2em]">{t('adminPages.dashboard.liveMonitoring')}</Caption>
            <H2 className="text-2xl font-bold tracking-tight">{t('adminPages.dashboard.resourceTitle')}</H2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 shadow-premium border border-slate-100 flex flex-col gap-4 group">
               <div className="flex items-center justify-between">
                 <div className="p-2.5 bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <Cpu className="w-5 h-5" />
                 </div>
                 <span className="text-2xl font-black tracking-tighter text-slate-900">{health.cpuUsage?.toFixed(1)}%</span>
               </div>
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{t('adminPages.dashboard.cpuLoad')}</span>
                    <span>{health.cpuUsage > 70 ? t('adminPages.dashboard.statusHigh') : t('adminPages.dashboard.statusNormal')}</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${health.cpuUsage > 80 ? 'bg-red-500' : 'bg-slate-900'}`} 
                      style={{ width: `${health.cpuUsage}%` }}
                    />
                 </div>
               </div>
            </div>

            <div className="bg-white p-6 shadow-premium border border-slate-100 flex flex-col gap-4 group">
               <div className="flex items-center justify-between">
                 <div className="p-2.5 bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <Activity className="w-5 h-5" />
                 </div>
                 <span className="text-2xl font-black tracking-tighter text-slate-900">{health.memoryUsagePercent?.toFixed(1)}%</span>
               </div>
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{t('adminPages.dashboard.ramUsage')}</span>
                    <span>{(health.usedMemory / (1024 * 1024)).toFixed(0)} MB / {(health.totalMemory / (1024 * 1024)).toFixed(0)} MB</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${health.memoryUsagePercent > 85 ? 'bg-red-500' : 'bg-slate-900'}`} 
                      style={{ width: `${health.memoryUsagePercent}%` }}
                    />
                 </div>
               </div>
            </div>

            <div className="bg-white p-6 shadow-premium border border-slate-100 flex flex-col gap-4 group">
               <div className="flex items-center justify-between">
                 <div className="p-2.5 bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <HardDrive className="w-5 h-5" />
                 </div>
                 <span className="text-2xl font-black tracking-tighter text-slate-900">{health.diskUsagePercent?.toFixed(1)}%</span>
               </div>
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{t('adminPages.dashboard.diskSpace')}</span>
                    <span>{health.diskUsagePercent > 90 ? t('adminPages.dashboard.statusCrit') : t('adminPages.dashboard.statusSafe')}</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${health.diskUsagePercent > 90 ? 'bg-red-500' : 'bg-slate-900'}`} 
                      style={{ width: `${health.diskUsagePercent}%` }}
                    />
                 </div>
               </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-4">
        <div className="flex flex-col gap-2 mb-6">
          <Caption className="text-primary-600 font-bold uppercase tracking-[0.2em]">{t('layout.navigation.tools')}</Caption>
          <H2 className="text-2xl font-bold tracking-tight">{t('adminPages.dashboard.quickActionsTitle')}</H2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: t('adminPages.finance.title'), 
              desc: t('adminPages.finance.caption'), 
              icon: Coins, 
              path: "/workspace/admin/finance",
              color: "text-amber-600",
              bgColor: "bg-amber-50"
            },
            { 
              title: t('adminPages.settings.title'), 
              desc: t('adminPages.settings.title'), 
              icon: Settings, 
              path: "/workspace/admin/settings",
              color: "text-slate-600",
              bgColor: "bg-slate-50"
            },
            { 
              title: t('adminPages.kyc.title'), 
              desc: t('adminPages.kyc.caption'), 
              icon: ShieldIcon, 
              path: "/workspace/admin/kyc",
              color: "text-green-600",
              bgColor: "bg-green-50"
            },
            { 
              title: t('adminPages.reports.title'), 
              desc: t('adminPages.reports.caption'), 
              icon: WarningTriangle, 
              path: "/workspace/admin/reports",
              color: "text-red-600",
              bgColor: "bg-red-50"
            }
          ].map((item, idx) => (
            <Card 
              key={idx}
              className="group p-5 bg-white border border-slate-100 shadow-premium hover:border-primary-500 transition-all cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <div className="flex flex-col h-full">
                <div className={`p-3 w-fit ${item.bgColor} ${item.color} mb-4 transition-transform group-hover:scale-110`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{item.title}</div>
                  <Text className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{item.desc}</Text>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.1em] group-hover:text-primary-500 transition-colors">{t('adminPages.dashboard.moduleEntry')}</span>
                  <NavArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
