import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Xmark, CheckCircle, CheckCircleSolid, Wallet, Bank, WarningTriangle } from 'iconoir-react';
import Button from './Button';
import { H2, Text, Caption } from './Typography';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useWalletMe } from '../../hooks/useWallet';

const BidSelectionModal = ({
  isOpen,
  onClose,
  bid,
  onConfirm,
  isLoading
}) => {
  const [mounted, setMounted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('sepay'); // 'sepay' or 'wallet'
  const { data: walletData, isLoading: loadingWallet, refetch: refreshWallet } = useWalletMe({
    enabled: isOpen
  });
  const balance = walletData?.balance || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshWallet();
      setConfirmed(false);
    }
  }, [isOpen, refreshWallet]);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm?.(paymentMethod);
  };

  const isBalanceInsufficient = paymentMethod === 'wallet' && (balance < bid?.price);

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

  if (!mounted || !bid) return null;

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
            aria-labelledby="bid-selection-title"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <H2 id="bid-selection-title" className="!mb-0 text-lg font-bold tracking-tight">
                Xác nhận lựa chọn báo giá
              </H2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-secondary-900 transition-colors p-1 rounded-none hover:bg-slate-50"
                aria-label="Close dialog"
                type="button"
                disabled={isLoading}
              >
                <Xmark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Freelancer Info */}
              <div className="bg-slate-50 p-3 border border-slate-200">
                <div className="min-w-0 flex-1">
                  <Text className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    {bid.freelancer?.fullName}
                    {bid.freelancer?.kycApproved && (
                      <CheckCircleSolid className="h-3.5 w-3.5 text-emerald-500 shadow-sm shrink-0" title="Tài khoản đã xác minh" />
                    )}
                  </Text>
                  <Text className="text-xs text-slate-500 truncate">
                    {bid.freelancer?.email}
                  </Text>
                </div>
              </div>

              {/* Bid Details */}
              <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-100 py-3 text-xs bg-white">
                <div className="text-center border-r border-slate-100">
                  <Text className="text-slate-500 mb-0.5 font-medium">Mức giá</Text>
                  <Text className="text-sm font-bold text-primary-600">
                    {formatCurrency(bid.price)}
                  </Text>
                </div>

                <div className="text-center border-r border-slate-100">
                  <Text className="text-slate-500 mb-0.5 font-medium">Dự kiến hoàn thành</Text>
                  <Text className="text-sm font-bold text-slate-900">
                    {bid.estimatedTime}
                  </Text>
                </div>

                <div className="text-center">
                  <Text className="text-slate-500 mb-0.5 font-medium">Ngày đề xuất</Text>
                  <Text className="text-sm font-bold text-slate-900">
                    {formatDate(bid.createdAt)}
                  </Text>
                </div>
              </div>

              {/* Message */}
              {bid.message && (
                <div className="bg-slate-50/50 border border-slate-100 p-3 text-xs">
                  <Caption className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">
                    Thư giới thiệu từ Freelancer
                  </Caption>
                  <Text className="text-slate-700 leading-relaxed italic">
                    "{bid.message}"
                  </Text>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Caption className="text-slate-500 font-bold uppercase tracking-wider">Chọn phương thức thanh toán</Caption>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* SePay Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sepay')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-none border-2 transition-all ${
                      paymentMethod === 'sepay'
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <Bank className={`w-6 h-6 ${paymentMethod === 'sepay' ? 'text-primary-600' : 'text-slate-400'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-bold ${paymentMethod === 'sepay' ? 'text-primary-900' : 'text-slate-700'}`}>Chuyển khoản</div>
                      <div className="text-[10px] text-slate-500">Qua mã QR (SePay)</div>
                    </div>
                  </button>

                  {/* Wallet Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-none border-2 transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <Wallet className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-primary-600' : 'text-slate-400'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-bold ${paymentMethod === 'wallet' ? 'text-primary-900' : 'text-slate-700'}`}>Ví điện tử</div>
                      <div className="text-[10px] text-slate-500">Số dư: {formatCurrency(balance || 0)}</div>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'wallet' && isBalanceInsufficient && (
                  <div className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <WarningTriangle className="w-3.5 h-3.5" />
                    Số dư không đủ. Vui lòng nạp thêm hoặc chọn phương thức khác.
                  </div>
                )}
              </div>

              {/* Confirmation Message */}
              <div className="bg-slate-50 border border-slate-200 rounded-none p-3 text-xs">
                <Text className="text-slate-600">
                  {paymentMethod === 'wallet'
                    ? `Trừ ${formatCurrency(bid.price)} trực tiếp từ ví.`
                    : `Thanh toán quét mã QR qua SePay (${formatCurrency(bid.price)}).`}
                </Text>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 font-bold"
                  disabled={isLoading}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="flex-1 font-bold"
                  disabled={isLoading || isBalanceInsufficient}
                  isLoading={isLoading}
                >
                  {confirmed ? 'Đang xử lý...' : (paymentMethod === 'wallet' ? 'Thanh toán ngay' : 'Xác nhận & Thanh toán')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BidSelectionModal;
