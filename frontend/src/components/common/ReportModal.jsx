import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import Card from '../common/Card';
import Button from '../common/Button';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import InlineErrorBlock from './InlineErrorBlock';
import { H2, Caption } from '../common/Typography';
import marketplaceApi from '../../api/marketplaceApi';

/**
 * ReportModal: Component cho phép người dùng gửi báo cáo vi phạm chuyên nghiệp
 */
const ReportModal = ({ isOpen, onClose, targetType, targetId, targetName }) => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  // We manage an active open state so that closing animations can play when isOpen becomes false
  const [activeOpen, setActiveOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveOpen(true);
      setIsLeaving(false);
    } else if (activeOpen) {
      setIsLeaving(true);
      const timer = setTimeout(() => {
        setActiveOpen(false);
        setIsLeaving(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeOpen]);

  if (!activeOpen) return null;

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setFormError(t('reportModal.descriptionLabel') + ' không được để trống.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      await marketplaceApi.submitReport({
        targetType,
        targetId,
        reason,
        description
      });
      addToast(t('toasts.reports.submitSuccess'), 'success');
      handleClose();
    } catch {
      addToast(t('toasts.reports.submitError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reasonOptions = [
    { value: 'spam', label: t('reportModal.reasons.spam') },
    { value: 'inappropriate', label: t('reportModal.reasons.inappropriate') },
    { value: 'harassment', label: t('reportModal.reasons.harassment') },
    { value: 'other', label: t('reportModal.reasons.other') },
  ];

  return (
    <div className={`ui-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center bg-secondary-900/40 backdrop-blur-sm p-4 ${isLeaving ? 'is-leaving' : ''}`}>
      <Card className={`ui-modal-panel max-w-md w-full bg-white p-6 md:p-8 ${isLeaving ? 'is-leaving' : ''}`}>
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
          {t('reportModal.titleHeader')}
        </Caption>
        <H2 className="mt-2 text-2xl">
          {targetType === 'PROJECT'
            ? t('reportModal.projectTitle', { title: targetName })
            : t('reportModal.userTitle', { name: targetName })}
        </H2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {formError && (
            <InlineErrorBlock title={t('reportModal.titleHeader')}>
              {formError}
            </InlineErrorBlock>
          )}
          <Select
            label={t('reportModal.reasonLabel')}
            value={reason}
            options={reasonOptions}
            onChange={(e) => setReason(e.target.value)}
          />

          <Textarea
            label={t('reportModal.descriptionLabel')}
            placeholder={t('reportModal.descriptionPlaceholder')}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (formError) {
                setFormError('');
              }
            }}
            rows={4}
          />

          <div className="mt-2 flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? t('reportModal.submitBtn') + '...' : t('reportModal.submitBtn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              {t('reportModal.cancelBtn')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportModal;

