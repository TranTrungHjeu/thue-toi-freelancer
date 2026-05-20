import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Xmark, Download, Copy, CheckCircle } from 'iconoir-react';
import Button from './Button';
import { H2, Text, Caption } from './Typography';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentReceiptModal = ({
  isOpen,
  onClose,
  payment,
  contract
}) => {
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

  const handleDownloadReceipt = () => {
    // Generate PDF receipt
    const receiptContent = `
PAYMENT RECEIPT
===============

Order Code: ${payment?.orderCode}
Date: ${formatDateTime(new Date())}
Status: ${payment?.status?.toUpperCase()}

PAYMENT DETAILS
===============
Amount: ${formatCurrency(payment?.amount)}
Method: ${payment?.method}
Transaction ID: ${payment?.transactionId}

CONTRACT DETAILS
================
Contract ID: ${contract?.id}
Project: ${contract?.projectTitle}
Freelancer: ${contract?.freelancerName}
Start Date: ${formatDateTime(contract?.startDate)}

NEXT STEPS
==========
1. The contract has been created
2. You can now communicate with the freelancer
3. Create milestones to track progress
4. Release payment upon completion

For support, contact: support@thuetoi.com
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
    element.setAttribute('download', `receipt-${payment?.orderCode}.txt`);
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
                  Payment Receipt
                </H2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-secondary-900 transition-colors p-1 rounded-none hover:bg-slate-100"
                aria-label="Close dialog"
                type="button"
              >
                <Xmark className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Success Message */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4">
                <Text className="text-sm text-emerald-700">
                  Your payment has been successfully processed. The contract has been created and the freelancer has been notified.
                </Text>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4 bg-slate-50 rounded-none p-4">
                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">Order Code</Text>
                  <div className="flex items-center gap-2">
                    <Text className="font-mono text-sm text-slate-900">
                      {payment?.orderCode}
                    </Text>
                    <button
                      onClick={handleCopyOrderCode}
                      className="p-1 hover:bg-slate-200 rounded-none transition-colors"
                      title="Copy order code"
                    >
                      <Copy className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">Amount</Text>
                  <Text className="font-bold text-lg text-primary-600">
                    {formatCurrency(payment?.amount)}
                  </Text>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">Payment Method</Text>
                  <Text className="font-semibold text-slate-900">
                    {payment?.method}
                  </Text>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">Status</Text>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-none text-sm font-semibold">
                    {payment?.status?.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <Text className="text-slate-600">Date</Text>
                  <Text className="text-slate-900">
                    {formatDateTime(payment?.createdAt)}
                  </Text>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-3">
                <Caption className="text-slate-600">
                  NEXT STEPS
                </Caption>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">1.</span>
                    <span>The contract has been created and is now active</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">2.</span>
                    <span>You can now communicate with the freelancer</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">3.</span>
                    <span>Create milestones to track project progress</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary-600">4.</span>
                    <span>Release payment upon milestone completion</span>
                  </li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
                <Button
                  variant="primary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>

              {/* Copy Confirmation */}
              {copied && (
                <Text className="text-center text-xs text-emerald-600">
                  ✓ Order code copied to clipboard
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
