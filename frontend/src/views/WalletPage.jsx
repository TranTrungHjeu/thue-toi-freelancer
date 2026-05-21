import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  WarningTriangle,
  XmarkCircle,
  ClipboardCheck,
} from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useWalletMe, useWalletLedgerPaged, useDepositWallet } from '../hooks/useWallet';
import { useMyWithdrawalsPaged, useCancelWithdrawal } from '../hooks/useWithdrawals';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { downloadImage } from '../utils/downloadImage';
import { useToast } from '../hooks/useToast';
import { usePaymentWebSocket } from '../hooks/usePaymentWebSocket';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import marketplaceApi from '../api/marketplaceApi';
import WithdrawModal from '../components/wallet/WithdrawModal';

const WITHDRAWAL_STATUS_META = {
  PENDING: { label: 'Chờ admin duyệt', color: 'warning', icon: Clock },
  APPROVED: { label: 'Đã duyệt, đang chuyển', color: 'info', icon: ClipboardCheck },
  COMPLETED: { label: 'Hoàn tất', color: 'success', icon: CheckCircle },
  REJECTED: { label: 'Đã từ chối / hủy', color: 'error', icon: XmarkCircle },
};

const WITHDRAWALS_PAGE_SIZE = 5;
const LEDGER_PAGE_SIZE = 8;

const LEDGER_TYPE_META = {
  DEPOSIT: { label: 'Nạp tiền', cls: 'bg-emerald-50 text-emerald-700' },
  PAYMENT: { label: 'Thanh toán', cls: 'bg-indigo-50 text-indigo-700' },
  escrow_in: { label: 'Ký quỹ', cls: 'bg-indigo-50 text-indigo-700' },
  release_milestone: { label: 'Giải ngân milestone', cls: 'bg-blue-50 text-blue-700' },
  MILESTONE_RELEASE: { label: 'Giải ngân milestone', cls: 'bg-blue-50 text-blue-700' },
  platform_fee: { label: 'Phí nền tảng', cls: 'bg-purple-50 text-purple-700' },
  REFUND: { label: 'Hoàn tiền', cls: 'bg-amber-50 text-amber-700' },
  withdrawal_hold: { label: 'Rút tiền (đang giữ)', cls: 'bg-orange-50 text-orange-700' },
  withdrawal_refund: { label: 'Hoàn tiền rút', cls: 'bg-amber-50 text-amber-700' },
  withdrawal_completed: { label: 'Rút tiền hoàn tất', cls: 'bg-red-50 text-red-700' },
};

const WalletPage = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionParam = searchParams.get('action');

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWalletMe();

  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);

  const {
    data: withdrawalsPage_,
    isLoading: withdrawalsLoading,
    isFetching: withdrawalsFetching,
    refetch: refetchWithdrawals,
  } = useMyWithdrawalsPaged({ page: withdrawalsPage, limit: WITHDRAWALS_PAGE_SIZE });

  const {
    data: ledgerPage_,
    isLoading: ledgerLoading,
    isFetching: ledgerFetching,
    refetch: refetchLedger,
  } = useWalletLedgerPaged({ page: ledgerPage, limit: LEDGER_PAGE_SIZE });

  const withdrawalsItems = withdrawalsPage_?.data || [];
  const withdrawalsTotalItems = withdrawalsPage_?.pagination?.total ?? 0;
  const withdrawalsTotalPages = withdrawalsPage_?.pagination?.totalPages ?? 1;

  const ledgerItems = ledgerPage_?.data || [];
  const ledgerTotalItems = ledgerPage_?.pagination?.total ?? 0;
  const ledgerTotalPages = ledgerPage_?.pagination?.totalPages ?? 1;

  const depositMutation = useDepositWallet();
  const cancelWithdrawal = useCancelWithdrawal();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [depositOrder, setDepositOrder] = useState(null);
  const [depositStatus, setDepositStatus] = useState('pending');

  const handleCloseDepositModal = useCallback(() => {
    setIsDepositOpen(false);
    setDepositAmount('');
    setDepositOrder(null);
    setDepositStatus('pending');
  }, []);

  const handleDepositPaid = useCallback(() => {
    addToast('Nạp tiền thành công! Số dư đã được cập nhật.', 'success');
    refetchWallet();
    refetchLedger();
    setTimeout(() => {
      handleCloseDepositModal();
    }, 1800);
  }, [addToast, refetchWallet, refetchLedger, handleCloseDepositModal]);

  usePaymentWebSocket(depositOrder?.orderCode, (data) => {
    if (!data?.status) return;
    const normalized = String(data.status).toLowerCase();
    setDepositStatus(normalized);
    if (normalized === 'paid') {
      handleDepositPaid();
    } else if (['failed', 'cancelled', 'expired'].includes(normalized)) {
      addToast('Đơn nạp tiền không hoàn tất. Vui lòng thử lại.', 'error');
    }
  });

  // Polling fallback: nếu WebSocket bị chặn / không tới, vẫn tự đối soát trạng thái đơn
  // nạp mỗi 3 giây để auto-refresh ví khi SePay xác nhận thanh toán.
  useEffect(() => {
    if (!depositOrder?.orderCode) return undefined;
    const terminal = ['paid', 'failed', 'cancelled', 'expired'];
    if (terminal.includes(String(depositStatus).toLowerCase())) return undefined;

    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const res = await marketplaceApi.getPaymentByOrderCode(depositOrder.orderCode);
        const status = String(res?.data?.status || '').toLowerCase();
        if (!status || cancelled) return;
        if (status !== depositStatus) {
          setDepositStatus(status);
          if (status === 'paid') {
            handleDepositPaid();
          } else if (['failed', 'cancelled', 'expired'].includes(status)) {
            addToast('Đơn nạp tiền không hoàn tất. Vui lòng thử lại.', 'error');
          }
        }
      } catch {
        // Lỗi mạng tạm thời: bỏ qua, lần sau retry.
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [depositOrder?.orderCode, depositStatus, addToast, handleDepositPaid]);

  // Realtime: lắng nghe sự kiện thay đổi yêu cầu rút tiền của chính user qua STOMP.
  // Khi có sự kiện (created/cancelled/rejected/completed/updated) thì tự refetch
  // danh sách rút tiền + số dư ví mà không cần user bấm "làm mới".
  const withdrawalTopics = useMemo(
    () => (user?.id ? [`/topic/withdrawals/user/${user.id}`] : []),
    [user?.id]
  );
  const handleWithdrawalRealtime = useCallback(
    ({ payload }) => {
      if (!payload?.type) return;
      // Invalidate toàn bộ cache phân trang withdrawals (mọi page/limit) để
      // user đang ở page nào cũng thấy cập nhật mà không tải lại trang.
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'me'] });
      if (['completed', 'rejected', 'cancelled'].includes(payload.type)) {
        refetchWallet();
        queryClient.invalidateQueries({ queryKey: ['walletLedger'] });
      }
      if (payload.type === 'completed') {
        addToast('Yêu cầu rút tiền đã hoàn tất, vui lòng kiểm tra ngân hàng.', 'success');
      } else if (payload.type === 'rejected') {
        addToast('Yêu cầu rút tiền bị từ chối, tiền đã hoàn về ví khả dụng.', 'warning');
      }
    },
    [queryClient, refetchWallet, addToast]
  );
  useWebSocket(handleWithdrawalRealtime, withdrawalTopics);

  useEffect(() => {
    if (actionParam === 'deposit') {
      setIsDepositOpen(true);
      setDepositOrder(null);
      setDepositStatus('pending');
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
      setDepositOrder(response?.data || response);
      setDepositStatus('pending');
      addToast('Đã tạo mã nạp tiền, vui lòng quét QR để thanh toán', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || 'Nạp tiền thất bại!', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawSuccess = () => {
    refetchWallet();
    refetchLedger();
    refetchWithdrawals();
  };

  const handleCancelWithdrawal = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy yêu cầu rút tiền này?')) return;
    try {
      await cancelWithdrawal.mutateAsync(id);
      addToast('Đã hủy yêu cầu, số tiền đã được hoàn về ví khả dụng', 'success');
      refetchWallet();
      refetchLedger();
    } catch (err) {
      addToast(err?.message || err?.response?.data?.message || 'Không thể hủy yêu cầu', 'error');
    }
  };

  const handleDownloadDepositQr = async () => {
    const url = depositOrder?.vietQrUrl
      || depositOrder?.qrCodeUrl
      || (depositOrder?.qrCode
        ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(depositOrder.qrCode)}`
        : null);
    if (!url) {
      addToast('Không có ảnh QR để tải', 'warning');
      return;
    }
    const ok = await downloadImage(url, `nap-tien-${depositOrder.orderCode || 'qr'}.png`);
    addToast(ok ? 'Đã tải QR nạp tiền' : 'Trình duyệt đã mở ảnh QR ở tab mới', ok ? 'success' : 'info');
  };

  const handleRefresh = async () => {
    await Promise.all([refetchWallet(), refetchLedger(), refetchWithdrawals()]);
    addToast('Đã làm mới dữ liệu ví', 'success');
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    addToast('Đã sao chép', 'success');
  };

  // Nếu user xóa/hủy đơn ở trang cuối khiến trang hiện tại > totalPages, snap về trang trước.
  // PHẢI đứng TRƯỚC mọi conditional return để tuân thủ Rules of Hooks.
  useEffect(() => {
    if (withdrawalsPage > withdrawalsTotalPages) setWithdrawalsPage(withdrawalsTotalPages);
  }, [withdrawalsTotalPages, withdrawalsPage]);
  useEffect(() => {
    if (ledgerPage > ledgerTotalPages) setLedgerPage(ledgerTotalPages);
  }, [ledgerTotalPages, ledgerPage]);

  if (walletLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner className="w-12 h-12 text-primary-600" />
      </div>
    );
  }

  // Aggregate "đang chờ rút" lấy từ backend (đã group ở DB) - không cần load list.
  const pendingWithdrawalTotal = Number(wallet?.pendingWithdrawalAmount || 0);
  const pendingWithdrawalCount = Number(wallet?.pendingWithdrawalCount || 0);

  return (
    <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-6">
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-52 bg-gradient-to-r from-primary-100/50 via-sky-50/50 to-indigo-100/30 blur-2xl" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Ví của bạn
          </H1>
          <Text className="text-slate-500 text-sm">
            Xem số dư, nạp tiền, rút tiền và lịch sử giao dịch
          </Text>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/workspace/wallet/bank-accounts')}
            className="flex items-center gap-2"
          >
            <Bank className="w-4 h-4" />
            Tài khoản ngân hàng
          </Button>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshDouble className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-200/80 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Caption className="text-emerald-100 text-xs font-semibold tracking-wider uppercase">
                Số dư khả dụng
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
                setDepositStatus('pending');
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

        <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Caption className="text-slate-500 text-xs font-semibold tracking-wider uppercase">
                  Đang chờ rút
                </Caption>
                <H2 className="text-3xl font-bold mt-2 text-slate-900">
                  {formatCurrency(pendingWithdrawalTotal)}
                </H2>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <Text className="text-sm text-slate-500">
              Tổng số tiền của các yêu cầu rút đang chờ Admin duyệt hoặc chuyển khoản.
            </Text>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
            <Bank className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{pendingWithdrawalCount} yêu cầu đang được xử lý</span>
          </div>
        </Card>

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
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Text className="text-sm text-slate-500">
              Tiền từ các milestone vừa hoàn tất sẽ được chuyển vào ví
            </Text>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-600 font-medium">
            <WarningTriangle className="w-4 h-4 shrink-0" />
            <span>Tiền sẽ vào ví sau khi customer nghiệm thu</span>
          </div>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <H2 className="text-xl font-bold text-slate-900">Yêu cầu rút tiền</H2>
            <Text className="text-sm text-slate-500">
              Theo dõi trạng thái các yêu cầu rút tiền của bạn
            </Text>
          </div>
          <Button variant="ghost" onClick={() => refetchWithdrawals()} className="flex items-center gap-2 text-xs">
            <RefreshDouble className="w-4 h-4" />
            Tải lại
          </Button>
        </div>

        {withdrawalsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : withdrawalsItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Bạn chưa có yêu cầu rút tiền nào.
          </div>
        ) : (
          <>
            <ul
              className={`flex flex-col gap-3 transition-opacity ${withdrawalsFetching ? 'opacity-60' : 'opacity-100'}`}
            >
              {withdrawalsItems.map((w) => {
                const meta = WITHDRAWAL_STATUS_META[w.status] || WITHDRAWAL_STATUS_META.PENDING;
                const StatusIcon = meta.icon;
                return (
                  <li
                    key={w.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <StatusIcon className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopy(w.orderCode)}
                            className="font-mono text-xs text-slate-700 hover:text-primary-600 hover:underline truncate"
                            title="Sao chép mã đơn"
                          >
                            {w.orderCode || `#${w.id}`}
                          </button>
                          <Badge color={meta.color} className="text-[10px] uppercase tracking-wider">
                            {meta.label}
                          </Badge>
                        </div>
                        <Text className="text-xs text-slate-500 mt-0.5 truncate">
                          {w.bankName || '—'} · {w.accountNumber}
                          {w.accountHolder ? ` · ${w.accountHolder}` : ''}
                        </Text>
                        {w.note && (
                          <Text className="text-[10px] text-slate-500 mt-0.5 italic line-clamp-1">
                            {w.note}
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 sm:min-w-[240px]">
                      <div className="text-left sm:text-right">
                        <Text className="text-sm font-bold text-slate-900 leading-tight">
                          {formatCurrency(w.amount)}
                        </Text>
                        <Caption className="text-[10px] text-slate-400">
                          {formatDateTime(w.completedAt || w.approvedAt || w.createdAt)}
                        </Caption>
                      </div>
                      {w.status === 'PENDING' ? (
                        <button
                          onClick={() => handleCancelWithdrawal(w.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline shrink-0"
                        >
                          <XmarkCircle className="w-3.5 h-3.5" /> Hủy
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300 shrink-0">—</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              className="mt-4"
              page={withdrawalsPage}
              totalPages={withdrawalsTotalPages}
              totalItems={withdrawalsTotalItems}
              pageSize={WITHDRAWALS_PAGE_SIZE}
              onChange={setWithdrawalsPage}
              idPrefix="withdrawals"
            />
          </>
        )}
      </Card>

      <Card className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <H2 className="text-xl font-bold text-slate-900">Lịch sử giao dịch</H2>
            <Text className="text-sm text-slate-500">
              Tất cả các giao dịch nạp, rút, ký quỹ và thanh toán
            </Text>
          </div>
          <Button variant="ghost" className="flex items-center gap-2 text-xs">
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
        </div>

        {ledgerLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : ledgerItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Chưa có giao dịch nào.
          </div>
        ) : (
          <>
            <ul
              className={`flex flex-col gap-2 transition-opacity ${ledgerFetching ? 'opacity-60' : 'opacity-100'}`}
            >
              {ledgerItems.map((entry) => {
                const meta = LEDGER_TYPE_META[entry.entryType]
                  || { label: entry.entryType, cls: 'bg-slate-100 text-slate-700' };
                const amount = Number(entry.amount);
                const amountClass = amount > 0
                  ? 'text-emerald-600'
                  : amount < 0
                    ? 'text-red-600'
                    : 'text-slate-500';
                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Text className="text-sm text-slate-700 truncate">
                          {entry.description || '—'}
                        </Text>
                        <Caption className="text-[10px] text-slate-400 font-mono">
                          TXN-{entry.id} · {formatDateTime(entry.createdAt)}
                        </Caption>
                      </div>
                    </div>
                    <div className={`text-left sm:text-right font-bold ${amountClass} shrink-0`}>
                      {amount > 0 ? '+' : ''}{formatCurrency(entry.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              className="mt-4"
              page={ledgerPage}
              totalPages={ledgerTotalPages}
              totalItems={ledgerTotalItems}
              pageSize={LEDGER_PAGE_SIZE}
              onChange={setLedgerPage}
              idPrefix="ledger"
            />
          </>
        )}
      </Card>

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
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDepositModal}
                className="flex-1"
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button variant="primary" type="submit" className="flex-1" isLoading={actionLoading}>
                Tạo mã QR Nạp Tiền
              </Button>
            </div>
          </form>
        ) : depositStatus === 'paid' ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <H2 className="text-2xl font-extrabold text-emerald-600">
              Nạp tiền thành công!
            </H2>
            <Text className="text-sm text-slate-600 px-4">
              Đã cộng <span className="font-bold text-slate-900">{formatCurrency(depositOrder.amount || Number(depositAmount))}</span> vào ví của bạn.
            </Text>
            <Text className="text-xs text-slate-400">Cửa sổ này sẽ tự đóng trong giây lát...</Text>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <img
                src={depositOrder.vietQrUrl || depositOrder.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(depositOrder.qrCode)}`}
                alt="QR Code Nạp Tiền"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
              />
            </div>
            <div>
              <H2 className="text-xl font-bold text-emerald-600 mb-2">
                Nạp {formatCurrency(depositOrder.amount || Number(depositAmount))}
              </H2>
              <Text className="text-sm text-slate-500 mb-4 px-4">
                Sử dụng ứng dụng ngân hàng để quét mã QR. Hệ thống sẽ tự động cộng tiền ngay sau khi nhận được thanh toán.
              </Text>
              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <Spinner className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Đang chờ bạn thanh toán... ví sẽ tự cập nhật ngay khi SePay xác nhận.
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadDepositQr}
              className="w-full flex items-center justify-center gap-2"
              disabled={actionLoading}
            >
              <Download className="w-4 h-4" />
              Tải QR về máy
            </Button>
          </div>
        )}
      </Modal>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={Number(wallet?.balance || 0)}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
};

export default WalletPage;
