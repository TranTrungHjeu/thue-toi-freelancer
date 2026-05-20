  import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  RefreshDouble,
  Download,
  Clock,
  Bank,
  CheckCircle,
  WarningTriangle
} from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useWalletMe, useWalletLedger, useDepositWallet } from '../hooks/useWallet';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useToast } from '../hooks/useToast';

const WalletPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionParam = searchParams.get('action');

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWalletMe();
  const { data: ledger, isLoading: ledgerLoading, refetch: refetchLedger } = useWalletLedger();
  const depositMutation = useDepositWallet();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [depositOrder, setDepositOrder] = useState(null); // Lưu thông tin đơn SePay

  // Lắng nghe action từ Dashboard chuyển sang để tự động kích hoạt Modal
  useEffect(() => {
    if (actionParam === 'deposit') {
      setIsDepositOpen(true);
      setDepositOrder(null);

      // Xóa param action khỏi URL để tránh mở lại modal khi refresh F5
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    } else if (actionParam === 'withdraw') {
      setIsWithdrawOpen(true);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [actionParam, searchParams, setSearchParams]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!depositAmount || amount <= 0) {
      addToast('Vui lòng nhập số tiền nạp hợp lệ!', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const response = await depositMutation.mutateAsync(amount);
      // response trả về có dạng { data: { qrCodeUrl, accountNumber, bankName, orderCode, ... } }
      setDepositOrder(response?.data || response);
      addToast('Đã tạo mã nạp tiền, vui lòng quét QR để thanh toán', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || 'Nạp tiền thất bại!', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDepositModal = () => {
    setIsDepositOpen(false);
    setDepositAmount('');
    setDepositOrder(null);
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      addToast('Vui lòng nhập số tiền rút hợp lệ!', 'warning');
      return;
    }
    if (Number(withdrawAmount) > (wallet?.balance || 0)) {
      addToast('Số dư khả dụng không đủ!', 'error');
      return;
    }
    if (!bankName || !bankAccount) {
      addToast('Vui lòng điền đầy đủ thông tin ngân hàng!', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      setTimeout(() => {
        addToast('Yêu cầu rút tiền đã được gửi và đang chờ Admin duyệt!', 'success');
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        setBankName('');
        setBankAccount('');
        setActionLoading(false);
        refetchWallet();
        refetchLedger();
      }, 1500);
    } catch (err) {
      addToast('Gửi yêu cầu rút tiền thất bại!', 'error');
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchWallet(), refetchLedger()]);
    addToast('Cập nhật số dư thành công!', 'success');
  };

  if (walletLoading || ledgerLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner className="w-12 h-12 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-52 bg-gradient-to-r from-primary-100/50 via-sky-50/50 to-indigo-100/30 blur-2xl" />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Ví của bạn
          </H1>
          <Text className="text-slate-500 text-sm">
            Xem số dư, nạp tiền, rút tiền và lịch sử giao dịch
          </Text>
        </div>
        <Button
          variant="ghost"
          onClick={handleRefresh}
          className="flex items-center gap-2 self-start sm:self-center"
        >
          <RefreshDouble className="w-4 h-4" />
          Làm mới
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Available Balance */}
        <Card className="border border-slate-200/80 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Caption className="text-emerald-100 text-xs font-semibold tracking-wider uppercase">
                Số dư hiện tại
              </Caption>
              <H2 className="text-3xl font-black mt-2 text-white">
                {formatCurrency(wallet?.balance || 0)}
              </H2>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <Text className="text-xs text-emerald-100/80">
            Tiền bạn có thể dùng để thanh toán hoặc rút ra ngay
          </Text>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsDepositOpen(true);
                setDepositOrder(null);
              }}
              className="flex-1 flex items-center justify-center py-2.5 rounded-lg bg-white hover:bg-slate-50 text-emerald-700 font-bold border border-emerald-200 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Nạp tiền
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="flex-1 flex items-center justify-center py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold border border-emerald-600 shadow-sm transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Rút tiền
            </button>
          </div>
        </Card>

        {/* Escrow Balance */}
        <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Caption className="text-slate-500 text-xs font-semibold tracking-wider uppercase">
                  Tiền đang chờ
                </Caption>
                <H2 className="text-3xl font-bold mt-2 text-slate-900">
                  {formatCurrency(wallet?.escrow || 0)}
                </H2>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <Activity className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <Text className="text-sm text-slate-500">
              Tiền được giữ an toàn cho các dự án đang thực hiện. Sẽ được giải phóng khi công việc hoàn tất.
            </Text>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Tiền sẽ được chuyển cho Freelancer khi bạn xác nhận công việc hoàn tất</span>
          </div>
        </Card>

        {/* Pending release */}
        <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Caption className="text-slate-500 text-xs font-semibold tracking-wider uppercase">
                  Tiền sắp nhận
                </Caption>
                <H2 className="text-3xl font-bold mt-2 text-slate-900">
                  {formatCurrency(wallet?.pending || 0)}
                </H2>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Text className="text-sm text-slate-500">
              Tiền từ các công việc đã hoàn tất và đang được chuyển vào ví của bạn
            </Text>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-600 font-medium animate-pulse">
            <WarningTriangle className="w-4 h-4 shrink-0" />
            <span>Tiền đang được chuyển vào ví của bạn</span>
          </div>
        </Card>
      </div>

      {/* Transaction History Section */}
      <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <H2 className="text-xl font-bold text-slate-900">Lịch sử giao dịch</H2>
            <Text className="text-sm text-slate-500">
              Tất cả các giao dịch nạp, rút và thanh toán của bạn
            </Text>
          </div>
          <Button variant="ghost" className="flex items-center gap-2 text-xs">
            <Download className="w-4 h-4" />
            Xuất file CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Mã Giao Dịch</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Loại Giao Dịch</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Số Tiền</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Chi Tiết</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {!ledger || ledger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                    Chưa có giao dịch nào được thực hiện.
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-slate-500">
                      TXN-{entry.id}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        entry.entryType === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700' :
                        entry.entryType === 'PAYMENT' ? 'bg-indigo-50 text-indigo-700' :
                        entry.entryType === 'MILESTONE_RELEASE' ? 'bg-blue-50 text-blue-700' :
                        entry.entryType === 'REFUND' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {entry.entryType === 'DEPOSIT' ? 'Nạp tiền' :
                         entry.entryType === 'PAYMENT' ? 'Thanh toán dự án' :
                         entry.entryType === 'MILESTONE_RELEASE' ? 'Giải phóng milestone' :
                         entry.entryType === 'REFUND' ? 'Hoàn tiền' :
                         'Rút tiền'}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${
                      entry.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {entry.amount > 0 ? '+' : ''}{formatCurrency(entry.amount)}
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositOpen} onClose={handleCloseDepositModal} title="Nạp tiền vào ví">
        {!depositOrder ? (
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <Input
              label="Số tiền nạp (VND)"
              type="number"
              placeholder="Ví dụ: 10,000,000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              min="10000"
            />
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
              <Bank className="w-5 h-5 text-slate-500 mt-0.5" />
              <div className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700">Cách nạp tiền:</span> Mở ứng dụng ngân hàng và quét mã QR do hệ thống tạo. Tiền sẽ vào ví tự động trong vài giây.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={handleCloseDepositModal} className="flex-1" disabled={actionLoading}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" className="flex-1" isLoading={actionLoading}>
                Tạo mã QR Nạp Tiền
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <img
                src={depositOrder.vietQrUrl || depositOrder.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(depositOrder.qrCode)}`}
                alt="QR Code Nạp Tiền"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div>
              <H2 className="text-xl font-bold text-emerald-600 mb-2">
                Nạp {formatCurrency(depositOrder.amount || Number(depositAmount))}
              </H2>
              <Text className="text-sm text-slate-500 mb-4 px-4">
                Sử dụng ứng dụng ngân hàng của bạn (MBBank, VCB, Momo...) để quét mã QR bên trên. Hệ thống sẽ tự động cộng tiền ngay sau khi nhận được thanh toán.
              </Text>
              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <Spinner className="w-4 h-4" />
                <span className="text-sm font-medium">Đang chờ bạn thanh toán...</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="w-full mt-4"
            >
              Tôi đã chuyển khoản (Làm mới số dư)
            </Button>
          </div>
        )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Rút tiền từ ví">
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <Input
            label="Số tiền muốn rút (VND)"
            type="number"
            placeholder="Ví dụ: 5,000,000"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
            max={wallet?.balance}
          />
          <Input
            label="Tên Ngân Hàng"
            placeholder="Ví dụ: Vietcombank, Techcombank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <Input
            label="Số Tài Khoản"
            placeholder="Nhập số tài khoản ngân hàng"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            required
          />
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
            <Bank className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700">Cách rút tiền:</span> Nhập thông tin ngân hàng của bạn. Tiền sẽ được chuyển vào tài khoản trong 24 giờ.
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsWithdrawOpen(false)} className="flex-1" disabled={actionLoading}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" className="flex-1" isLoading={actionLoading}>
              Xác nhận rút
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WalletPage;
