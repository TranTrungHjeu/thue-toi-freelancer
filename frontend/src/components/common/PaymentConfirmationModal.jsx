import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, WarningTriangle } from 'iconoir-react';
import Button from './Button';
import Spinner from './Spinner';
import { H2, Text } from './Typography';
import { usePaymentWebSocket } from '../../hooks/usePaymentWebSocket';

const PaymentConfirmationModal = ({
  isOpen,
  onClose,
  orderCode,
  amount,
  projectTitle,
  onPaymentSuccess,
  onPaymentFailed
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { isConnected } = usePaymentWebSocket(orderCode, (data) => {
    setPaymentStatus(data.status);

    if (data.status === 'paid') {
      onPaymentSuccess?.();
    } else if (data.status === 'failed' || data.status === 'cancelled') {
      setErrorMessage(data.message || 'Payment failed. Please try again.');
      onPaymentFailed?.();
    }
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setPaymentStatus('pending');
    setErrorMessage('');
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

  if (!mounted) return null;

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
            className="relative bg-white w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden rounded-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            tabIndex={-1}
          >
            <div className="p-8">
              {/* Status Icon */}
              <div className="flex justify-center mb-6">
                {paymentStatus === 'pending' && (
                  <Spinner className="w-12 h-12 text-primary-600" />
                )}
                {paymentStatus === 'paid' && (
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                )}
                {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                  <WarningTriangle className="w-12 h-12 text-red-500" />
                )}
              </div>

              {/* Title */}
              <H2
                id="payment-modal-title"
                className="!mb-2 text-center text-xl"
              >
                {paymentStatus === 'pending' && 'Processing Payment'}
                {paymentStatus === 'paid' && 'Payment Successful'}
                {paymentStatus === 'failed' && 'Payment Failed'}
                {paymentStatus === 'cancelled' && 'Payment Cancelled'}
              </H2>

              {/* Project Title */}
              <Text className="text-center text-slate-600 mb-6">
                {projectTitle}
              </Text>

              {/* Amount */}
              <div className="bg-slate-50 rounded-none p-4 mb-6">
                <Text className="text-center text-sm text-slate-600 mb-1">
                  Amount
                </Text>
                <Text className="text-center text-2xl font-bold text-slate-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(amount)}
                </Text>
              </div>

              {/* Status Message */}
              {paymentStatus === 'pending' && (
                <Text className="text-center text-sm text-slate-600 mb-6">
                  {isConnected ? 'Waiting for payment confirmation...' : 'Connecting...'}
                </Text>
              )}

              {paymentStatus === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4 mb-6">
                  <Text className="text-center text-sm text-emerald-700">
                    Your payment has been confirmed. The contract will be created shortly.
                  </Text>
                </div>
              )}

              {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                <div className="bg-red-50 border border-red-200 rounded-none p-4 mb-6">
                  <Text className="text-center text-sm text-red-700">
                    {errorMessage}
                  </Text>
                </div>
              )}

              {/* Order Code */}
              <div className="bg-slate-50 rounded-none p-3 mb-6">
                <Text className="text-xs text-slate-600 mb-1">
                  Order Code
                </Text>
                <Text className="text-sm font-mono text-slate-900 break-all">
                  {orderCode}
                </Text>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {paymentStatus === 'pending' && (
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                )}

                {paymentStatus === 'paid' && (
                  <Button
                    variant="primary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                )}

                {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRetry}
                      className="flex-1"
                    >
                      Retry Payment
                    </Button>
                  </>
                )}
              </div>

              {/* Retry Count */}
              {retryCount > 0 && (
                <Text className="text-center text-xs text-slate-500 mt-4">
                  Retry attempt: {retryCount}
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

export default PaymentConfirmationModal;
