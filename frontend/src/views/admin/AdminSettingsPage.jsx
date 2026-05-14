"use client";

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  RefreshDouble, 
  InfoCircle,
  Database,
  Flash,
  Percentage,
  PrivacyPolicy,
  Calculator,
  Lock,
  Internet,
  Coins,
  Megaphone,
} from 'iconoir-react';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';

const AdminSettingsPage = () => {
  const { t } = useI18n();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { addToast } = useToast();

  const fetchSettings = async () => {
    try {
      const response = await adminApi.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // Giữ nguyên dependency mảng rỗng để tránh infinite loop vì fetchSettings bị re-create ở mỗi render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async (key, value) => {
    setSaving(key);
    try {
      const response = await adminApi.updateSetting(key, value);
      if (response.success) {
        addToast(t('toasts.admin.saveSettingSuccess'), 'success');
        fetchSettings();
      }
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setSaving(null);
    }
  };

  const getSettingValue = (key) => {
    return settings.find(s => s.key === key)?.value || '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="md" />
        <Text className="mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.dashboard.updating')}</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('layout.navigation.adminSettings')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.settings.title')}
        </H1>
        <Text className="mt-2 max-w-2xl text-slate-500 text-base">
          {t('adminPages.settings.desc')}
        </Text>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial & Operations Settings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Financial Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              <H2 className="text-xl font-bold tracking-tight !mb-0">{t('adminPages.settings.financialSection')}</H2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingCard
                icon={Percentage}
                label={t('adminPages.settings.platformFeeLabel')}
                description={t('adminPages.settings.platformFeeDesc')}
                value={getSettingValue('platform_fee_percent') || '10'}
                unit="%"
                onSave={(val) => handleUpdate('platform_fee_percent', val)}
                isSaving={saving === 'platform_fee_percent'}
              />
              <SettingCard
                icon={Coins}
                label={t('adminPages.settings.minWithdrawalLabel')}
                description={t('adminPages.settings.minWithdrawalDesc')}
                value={getSettingValue('min_withdrawal_amount') || '50000'}
                unit="VNĐ"
                onSave={(val) => handleUpdate('min_withdrawal_amount', val)}
                isSaving={saving === 'min_withdrawal_amount'}
              />
            </div>
          </section>

          {/* Operations Section */}
          <section className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Flash className="w-5 h-5 text-primary-600" />
              <H2 className="text-xl font-bold tracking-tight !mb-0">{t('adminPages.settings.operationsSection')}</H2>
            </div>

            <div className="flex flex-col gap-4">
              <SettingCard
                icon={Megaphone}
                label={t('adminPages.settings.globalAnnouncement')}
                description={t('adminPages.settings.globalAnnouncementDesc')}
                value={getSettingValue('global_announcement')}
                placeholder={t('adminPages.settings.announcementPlaceholder')}
                onSave={(val) => handleUpdate('global_announcement', val)}
                isSaving={saving === 'global_announcement'}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingCard
                  icon={Internet}
                  label={t('adminPages.settings.autoApproveLabel')}
                  description={t('adminPages.settings.autoApproveDesc')}
                  value={getSettingValue('auto_approve_projects') || 'false'}
                  type="select"
                  options={[
                    { label: t('adminPages.settings.autoApproveOn'), value: 'true' },
                    { label: t('adminPages.settings.autoApproveOff'), value: 'false' }
                  ]}
                  onSave={(val) => handleUpdate('auto_approve_projects', val)}
                  isSaving={saving === 'auto_approve_projects'}
                />
                <SettingCard
                  icon={Lock}
                  label={t('adminPages.settings.maintenanceLabel')}
                  description={t('adminPages.settings.maintenanceDesc')}
                  value={getSettingValue('maintenance_mode') || 'false'}
                  type="select"
                  options={[
                    { label: t('adminPages.settings.maintenanceOff'), value: 'false' },
                    { label: t('adminPages.settings.maintenanceOn'), value: 'true' }
                  ]}
                  onSave={(val) => handleUpdate('maintenance_mode', val)}
                  isSaving={saving === 'maintenance_mode'}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Info Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="bg-primary-900 !text-white border-none shadow-premium p-6 overflow-hidden relative">
            <H2 className="text-lg font-bold tracking-tight text-white mb-4">{t('adminPages.settings.sidebarTitle')}</H2>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex gap-3">
                <InfoCircle className="w-5 h-5 text-primary-400 shrink-0" />
                <Text className="text-xs text-primary-100 leading-relaxed">{t('adminPages.settings.sidebarTip1')}</Text>
              </div>
              <div className="flex gap-3">
                <PrivacyPolicy className="w-5 h-5 text-primary-400 shrink-0" />
                <Text className="text-xs text-primary-100 leading-relaxed">{t('adminPages.settings.sidebarTip2')}</Text>
              </div>
            </div>
            <div className="absolute right-[-20%] bottom-[-10%] opacity-10">
              <Database width={150} height={150} />
            </div>
          </Card>

          <Card className="bg-white shadow-premium p-6 border-none">
            <Caption className="text-slate-400 font-bold uppercase mb-4 tracking-widest">{t('adminPages.settings.statusSidebarTitle')}</Caption>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-xs font-bold text-slate-700">{t('adminPages.settings.statusDataSource')}</Text>
                <Badge color="success">{t('adminPages.settings.dbLabel')}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-xs font-bold text-slate-700">{t('adminPages.settings.statusLastUpdated')}</Text>
                <Caption className="font-mono">{t('adminPages.settings.statusJustNow')}</Caption>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Internal sub-component for individual setting cards
const SettingCard = ({ icon, label, description, value, unit, placeholder, type = 'text', options = [], onSave, isSaving }) => {
  const [localValue, setLocalValue] = useState(value);
  const hasChanged = localValue !== value;

  return (
    <Card className="bg-white shadow-premium border-none p-5 flex flex-col gap-4 transition-all hover:ring-2 hover:ring-primary-500/10">
      <div className="flex gap-3">
        <div className="p-2 bg-slate-50 text-slate-400 border border-slate-100">
          {React.createElement(icon, { className: 'w-4 h-4' })}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{label}</span>
          <Caption className="text-[10px] text-slate-400 leading-tight uppercase font-medium">{description}</Caption>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {type === 'select' ? (
          <select
            className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
          >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors"
              value={localValue}
              placeholder={placeholder}
              onChange={(e) => setLocalValue(e.target.value)}
            />
            {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">{unit}</span>}
          </div>
        )}

        <Button
          size="sm"
          variant={hasChanged ? 'primary' : 'ghost'}
          className={`h-10 px-3 ${!hasChanged ? 'opacity-30 cursor-default grayscale' : ''}`}
          disabled={!hasChanged || isSaving}
          onClick={() => onSave(localValue)}
        >
          {isSaving ? <Spinner size="sm" tone="current" inline /> : <RefreshDouble className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};

export default AdminSettingsPage;
