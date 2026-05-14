"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Wallet, 
  StatsUpSquare, 
  Activity, 
  Flash, 
  ShieldCheck,
  NavArrowRight,
  Calculator,
  Coins,
  ArrowUp,
  RefreshDouble
} from 'iconoir-react';
import { useRouter } from 'next/navigation';

import StatCard from '../../components/common/StatCard';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import adminApi from '../../api/adminApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';

const AdminFinancePage = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const router = useRouter();

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
    fetchStats();
  }, [addToast, t]);

  const platformRevenue = useMemo(() => {
    // Platform fee 10% assumption logic
    return (stats?.totalGmv || 0) * 0.1;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <Text className="mt-4 text-slate-500 font-bold animate-pulse text-[10px] uppercase tracking-[0.2em]">{t('adminPages.dashboard.updating')}</Text>
      </div>
    );
  }

  const growthValues = stats?.userGrowthTrend ? Object.values(stats.userGrowthTrend) : [];
  const maxGrowth = Math.max(...growthValues, 1);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.finance.caption')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.finance.title')}
        </H1>
        <Text className="mt-2 max-w-2xl text-slate-500 text-base">
          {t('adminPages.finance.desc')}
        </Text>
      </header>

      {/* Main Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-premium bg-slate-900 !text-white flex flex-col justify-between overflow-hidden relative min-h-[220px]">
          <div>
            <Caption className="text-slate-500 font-bold uppercase tracking-widest mb-2">{t('adminPages.dashboard.platformProfit')}</Caption>
            <div className="text-4xl font-bold tracking-tighter text-primary-400 mb-1">
              {formatCurrency(platformRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase">
              <ArrowUp className="w-3.5 h-3.5" /> +8.5%
            </div>
          </div>
          
          <div className="mt-auto">
             <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> 10{t('adminPages.finance.percentageOfGmv')}
             </Text>
          </div>

          <div className="absolute right-[-20%] bottom-[-20%] opacity-[0.03] rotate-12">
            <Calculator width={200} height={200} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-white flex flex-col justify-between overflow-hidden relative min-h-[220px]">
          <div>
            <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-2">{t('adminPages.finance.escrowLabel')}</Caption>
            <div className="text-4xl font-bold tracking-tighter text-slate-900 mb-1">
              {formatCurrency((stats?.totalGmv || 0) * 0.4)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase">
              <Activity className="w-3.5 h-3.5" /> {t('status.contract.in_progress')}
            </div>
          </div>
          
          <div className="mt-auto">
             <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                 <RefreshDouble className="w-3.5 h-3.5" /> {t('adminPages.finance.realtime')}
             </Text>
          </div>

          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05]">
            <Flash width={150} height={150} className="text-primary-600" />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-white flex flex-col justify-between overflow-hidden relative min-h-[220px]">
          <div>
            <Caption className="text-slate-400 font-bold uppercase tracking-widest mb-2">{t('adminPages.dashboard.totalGmv')}</Caption>
            <div className="text-4xl font-bold tracking-tighter text-slate-900 mb-1">
              {formatCurrency(stats?.totalGmv || 0)}
            </div>
            <div className="flex items-center gap-1.5 text-primary-600 text-xs font-bold uppercase">
              <StatsUpSquare className="w-3.5 h-3.5" /> {t('adminPages.dashboard.growthTitle')}
            </div>
          </div>
          
          <div className="mt-auto">
             <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {t('adminPages.finance.platformGmv')}
             </Text>
          </div>

          <div className="absolute right-[-20px] top-[-20px] opacity-[0.03]">
            <Wallet width={180} height={180} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card className="bg-white shadow-premium border-none p-6">
          <H2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-3">
             <Calculator className="w-5 h-5 text-primary-600" /> {t('adminPages.finance.quickActionsTitle')}
          </H2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/workspace/admin/withdrawals')}
              className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 hover:border-primary-500 hover:bg-white transition-all group"
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-900 group-hover:text-primary-600">{t('adminPages.finance.approveTitle')}</span>
                <Caption className="text-slate-400 uppercase tracking-tight">{t('status.bid.pending')}</Caption>
              </div>
              <NavArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </button>
            
            <button className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed">
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-900">{t('adminPages.finance.taxReportLabel')}</span>
                <Caption className="text-slate-400 uppercase tracking-tight">{t('adminPages.finance.comingSoon')}</Caption>
              </div>
              <NavArrowRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </Card>

        {/* Mini Chart Mockup */}
        <Card className="bg-white shadow-premium border-none p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <H2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary-600" /> {t('adminPages.finance.gmvGrowthTitle')}
             </H2>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('adminPages.finance.last7Days')}</span>
          </div>
          
          <div className="flex-1 flex items-end gap-3 h-32 px-2">
            {growthValues.length > 0 ? growthValues.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                <div 
                  style={{ height: `${(val / maxGrowth) * 100}%`, minHeight: '2px' }}
                  className={`w-full ${i === growthValues.length - 1 ? 'bg-primary-600' : 'bg-slate-100 group-hover:bg-primary-200'} transition-all`}
                />
              </div>
            )) : (
               <div className="w-full flex items-center justify-center italic text-slate-300 text-xs">{t('values.notAvailable')}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminFinancePage;
