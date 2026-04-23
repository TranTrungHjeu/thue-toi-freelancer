import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  InfoCircle,
  NavArrowRight
} from 'iconoir-react';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';

const AdminBroadcastPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    targetRole: 'all',
    type: 'system',
    title: '',
    content: '',
    link: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmBroadcast = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      await adminApi.broadcast(form);
      addToast(t('toasts.admin.broadcastSuccess'), 'success');
      setForm({ targetRole: 'all', type: 'system', title: '', content: '', link: '' });
    } catch (error) {
      addToast(error?.message || t('adminPages.broadcast.broadcastError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const targetOptions = [
    { value: 'all', label: t('adminPages.broadcast.targetAll') },
    { value: 'freelancer', label: t('adminPages.broadcast.targetFreelancers') },
    { value: 'customer', label: t('adminPages.broadcast.targetCustomers') },
  ];

  const typeOptions = [
    { value: 'system', label: t('status.notificationType.system') },
    { value: 'project', label: t('status.notificationType.project') },
    { value: 'contract', label: t('status.notificationType.contract') },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.broadcast.caption')}</Caption>
        </div>
        <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
          {t('adminPages.broadcast.title')}
        </H1>
        <Text className="mt-2 max-w-2xl text-slate-500 text-base">
          {t('adminPages.broadcast.desc')}
        </Text>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white p-6 md:p-8 shadow-premium border border-slate-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Select
                label={t('adminPages.broadcast.targetLabel')}
                value={form.targetRole}
                options={targetOptions}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                disabled={submitting}
              />
              <Select
                label={t('adminPages.broadcast.typeLabel')}
                value={form.type}
                options={typeOptions}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={submitting}
              />
            </div>

            <Input
              label={t('adminPages.broadcast.titleLabel')}
              placeholder={t('adminPages.broadcast.titlePlaceholder')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={submitting}
            />

            <Textarea
              label={t('adminPages.broadcast.contentLabel')}
              placeholder={t('adminPages.broadcast.contentPlaceholder')}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              required
              disabled={submitting}
            />

            <Input
              label={t('adminPages.broadcast.linkLabel')}
              placeholder={t('adminPages.broadcast.linkPlaceholder')}
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              disabled={submitting}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold"
                disabled={submitting || !form.title.trim() || !form.content.trim()}
              >
                {submitting ? (
                  <Spinner size="sm" tone="current" inline label={t('adminPages.broadcast.sendingLabel')} />
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" /> {t('adminPages.broadcast.submitBtn')}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Live Preview */}
          <Card className="bg-slate-900 p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <H2 className="text-xl font-bold tracking-tight mb-4">{t('adminPages.broadcast.previewTitle')}</H2>
              <div className="bg-white/10 backdrop-blur-md p-4 space-y-2 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-1.5 bg-primary-500 rounded-none shrink-0">
                    <Megaphone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white mb-0.5">
                      {form.title || t('adminPages.broadcast.previewPlaceholderTitle')}
                    </div>
                    <div className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                      {form.content || t('adminPages.broadcast.previewPlaceholderContent')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-[9px] font-bold text-primary-400 flex items-center gap-1 uppercase tracking-widest">
                    {t('adminPages.broadcast.previewViewNow')} <NavArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
            <Megaphone className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
          </Card>

          {/* Tips Card */}
          <Card className="bg-white p-6 border-2 border-primary-100">
            <div className="flex gap-3">
              <InfoCircle className="w-5 h-5 text-primary-600 shrink-0" />
              <div className="space-y-3">
                <Text className="text-sm font-bold text-slate-900">{t('adminPages.broadcast.tipsTitle')}</Text>
                <ul className="space-y-2">
                  {[
                    t('adminPages.broadcast.tip1'),
                    t('adminPages.broadcast.tip2'),
                    t('adminPages.broadcast.tip3'),
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-slate-500 flex gap-2">
                      <span className="text-primary-600 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t('adminPages.broadcast.confirmTitle')}
      >
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            {t('adminPages.broadcast.confirmPrompt')}
          </p>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmBroadcast}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBroadcastPage;
