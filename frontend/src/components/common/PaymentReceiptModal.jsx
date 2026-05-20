import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Xmark, Download, Copy, CheckCircle } from 'iconoir-react';
import Button from './Button';
import { H2, Text, Caption } from './Typography';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useI18n } from '../../hooks/useI18n';

const PaymentReceiptModal = ({
  isOpen,
  onClose,
  payment,
  contract
}) => {
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(payment?.orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusLabel = (status) => {
    if (!status) return '';
    const key = `paymentReceipt.statusBadge.${String(status).toLowerCase()}`;
    const translated = t(key);
    return translated === key ? String(status).toUpperCase() : translated;
  };

  const handleDownloadReceipt = () => {
    const div = t('paymentReceipt.download.divider');
    const lines = [
      t('paymentReceipt.download.heading'),
      div,
      '',
      `${t('paymentReceipt.download.orderCode')}: ${payment?.orderCode ?? ''}`,
      `${t('paymentReceipt.download.date')}: ${formatDateTime(payment?.createdAt || new Date())}`,
      `${t('paymentReceipt.download.status')}: ${getStatusLabel(payment?.status)}`,
      '',
      t('paymentReceipt.download.paymentDetailsTitle'),
      div,
      `${t('paymentReceipt.download.amount')}: ${formatCurrency(payment?.amount)}`,
      `${t('paymentReceipt.download.method')}: ${payment?.method || t('paymentReceipt.methodFallback')}`,
      `${t('paymentReceipt.download.transactionId')}: ${payment?.transactionId ?? ''}`,
      '',
      t('paymentReceipt.download.contractDetailsTitle'),
      div,
      `${t('paymentReceipt.download.contractId')}: ${contract?.id ?? ''}`,
      `${t('paymentReceipt.download.project')}: ${contract?.projectTitle ?? ''}`,
      `${t('paymentReceipt.download.freelancer')}: ${contract?.freelancerName ?? ''}`,
      `${t('paymentReceipt.download.startDate')}: ${contract?.startDate ? formatDateTime(contract.startDate) : ''}`,
      '',
      t('paymentReceipt.download.nextStepsTitle'),
      div,
      t('paymentReceipt.download.nextStep1'),
      t('paymentReceipt.download.nextStep2'),
      t('paymentReceipt.download.nextStep3'),
      t('paymentReceipt.download.nextStep4'),
      '',
      t('paymentReceipt.download.supportLine'),
    ];
    const receiptContent = lines.join('\n');

    const filename = `${t('paymentReceipt.filenamePrefix')}-${payment?.orderCode || 'unknown'}.txt`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 320, damping: 26 }
    },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
  };

  if (!mounted || !payment) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden rounded-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <H2 id="receipt-title" className="!mb-0 text-xl">
                  {t('paymentReceipt.title')}
                </H2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-secondary-900 transition-colors p-1 rounded-none hover:bg-slate-100"
                aria-label={t('paymentReceipt.closeAria')}
                type="button"
              >
                <Xmark className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4">
                <Text className="text-sm text-emerald-700">
                  {t('paymentReceipt.successMessage')}
                </Text>
              </div>

              <div className="space-y-4 bg-slate-50 rounded-none p-4">
                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">{t('paymentReceipt.orderCodeLabel')}</Text>
                  <div className="flex items-center gap-2">
                    <Text className="font-mono text-sm text-slate-900">
                      {payment?.orderCode}
                    </Text>
                    <button
                      onClick={handleCopyOrderCode}
                      className="p-1 hover:bg-slate-200 rounded-none transition-colors"
                      title={t('paymentReceipt.copyTitle')}
                      type="button"
                    >
                      <Copy className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">{t('paymentReceipt.amountLabel')}</Text>
                  <Text className="font-bold text-lg text-primary-600">
                    {formatCurrency(payment?.amount)}
                  </Text>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">{t('paymentReceipt.methodLabel')}</Text>
                  <Text className="font-semibold text-slate-900">
                    {payment?.method || t('paymentReceipt.methodFallback')}
                  </Text>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">{t('paymentReceipt.statusLabel')}</Text>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-none text-sm font-semibold">
                    {getStatusLabel(payment?.status)}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">{t('paymentReceipt.dateLabel')}</Text>
                  <Text className="text-slate-900">
                    {formatDateTime(payment?.createdAt)}
                  </Text>
                </div>
              </div>

              <div className="space-y-3">
                <Caption className="text-slate-600">
                  {t('paymentReceipt.nextStepsTitle')}
                </Caption>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">1.</span>
                    <span>{t('paymentReceipt.nextStep1')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">2.</span>
                    <span>{t('paymentReceipt.nextStep2')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">3.</span>
                    <span>{t('paymentReceipt.nextStep3')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">4.</span>
                    <span>{t('paymentReceipt.nextStep4')}</span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('paymentReceipt.downloadReceiptBtn')}
                </Button>
                <Button
                  variant="primary"
                  onClick={onClose}
                  className="flex-1"
                >
                  {t('paymentReceipt.continueBtn')}
                </Button>
              </div>

              {copied && (
                <Text className="text-center text-xs text-emerald-600">
                  {t('paymentReceipt.copySuccess')}
                </Text>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PaymentReceiptModal;
