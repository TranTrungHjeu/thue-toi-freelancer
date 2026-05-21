import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  XmarkCircle,
  Clock,
  User,
  Wallet,
  Filter,
  Eye,
  WarningTriangle,
  Copy,
  ClipboardCheck,
  Bank,
  ScanQrCode,
  Download,
} from 'iconoir-react';
import { H1, H2, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadImage } from '../../utils/downloadImage';
import Spinner from '../../components/common/Spinner';
import { buildVietQrImageUrl, findBankByName } from '../../constants/vietnameseBanks';

const STATUS_BADGE = {
  PENDING: { color: 'warning', icon: Clock, label: 'Chờ duyệt' },
  APPROVED: { color: 'info', icon: ClipboardCheck, label: 'Đã duyệt' },
  COMPLETED: { color: 'success', icon: CheckCircle, label: 'Hoàn tất' },
  REJECTED: { color: 'error', icon: XmarkCircle, label: 'Từ chối' },
};

const AdminWithdrawalsPage = () => {
  const { t } = useI18n();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processStatus, setProcessStatus] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await adminApi.getWithdrawals();
      if (response.success) {
        setWithdrawals(response.data);
      }
    } catch {
      addToast(t('toasts.contracts.loadListError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Realtime: nhận "ping" mỗi khi có yêu cầu rút tiền mới / được hủy / hoàn tất.
  // Backend chỉ phát metadata (không có dữ liệu nhạy cảm); FE refetch qua REST đã auth.
  const adminWithdrawalTopics = useMemo(() => ['/topic/withdrawals/admin'], []);
  const handleAdminWithdrawalRealtime = useCallback(
    ({ payload }) => {
      if (!payload?.type) return;
      fetchWithdrawals();
      if (payload.type === 'created') {
        addToast('Có yêu cầu rút tiền mới', 'info');
      }
    },
    [fetchWithdrawals, addToast]
  );
  useWebSocket(handleAdminWithdrawalRealtime, adminWithdrawalTopics);

  const handleOpenAction = (request, status) => {
    setSelectedRequest(request);
    setProcessStatus(status);
    setNote('');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || submitting) return;
    setSubmitting(true);
    try {
      // VERIFY = tra cứu SePay, chỉ đóng đơn nếu có giao dịch thực tế khớp mã đơn.
      if (processStatus === 'COMPLETED') {
        await adminApi.verifyWithdrawal(selectedRequest.id, note);
        addToast('SePay đã xác nhận giao dịch — đơn rút tiền đã hoàn tất', 'success');
      } else {
        await adminApi.processWithdrawal(selectedRequest.id, processStatus, note);
        addToast('Đã từ chối yêu cầu, tiền đã hoàn về ví user', 'success');
      }
      setIsModalOpen(false);
      fetchWithdrawals();
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message;
      if (code === 'ERR_WITHDRAWAL_07') {
        addToast(msg || 'Bạn chưa thực hiện chuyển khoản', 'warning');
      } else {
        addToast(msg || t('errors.code.ERR_SYS_01'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (row) => {
    setDetailRequest(row);
    setIsDetailOpen(true);
  };

  const handleCopy = (text, msg = 'Đã sao chép') => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    addToast(msg, 'success');
  };

  const handleDownloadQr = async (url, filename, label = 'Đã tải mã QR') => {
    if (!url) {
      addToast('Không có ảnh QR để tải', 'warning');
      return;
    }
    const ok = await downloadImage(url, filename);
    addToast(ok ? label : 'Trình duyệt đã mở ảnh QR ở tab mới', ok ? 'success' : 'info');
  };

  const filteredData = useMemo(() => {
    return withdrawals.filter((w) => {
      const matchesFilter = filterStatus === 'ALL' || w.status === filterStatus;
      const normalizedTerm = searchTerm.toLowerCase();
      const userId = String(w.user?.id || '');
      const userName = (w.user?.fullName || '').toLowerCase();
      const userEmail = (w.user?.email || '').toLowerCase();
      const bankInfo = `${w.bankName || ''} ${w.accountNumber || ''} ${w.accountHolder || ''} ${w.bankInfo || ''}`.toLowerCase();
      const orderCode = (w.orderCode || '').toLowerCase();
      const matchesSearch =
        userId.includes(searchTerm)
        || userName.includes(normalizedTerm)
        || userEmail.includes(normalizedTerm)
        || bankInfo.includes(normalizedTerm)
        || orderCode.includes(normalizedTerm);
      return matchesFilter && matchesSearch;
    });
  }, [withdrawals, filterStatus, searchTerm]);

  const headers = [
    {
      key: 'user',
      label: 'Người dùng',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 flex items-center justify-center border border-slate-800">
            <User className="w-4 h-4 text-primary-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.user?.fullName || `#${row.user?.id || 'N/A'}`}</span>
            <span className="text-[10px] text-slate-400 font-bold tracking-tight">{row.user?.email || `ID: #${row.user?.id || 'N/A'}`}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Số tiền',
      sortable: true,
      render: (amount, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tracking-tighter text-base">{formatCurrency(amount)}</span>
          {row.orderCode && (
            <button
              onClick={() => handleCopy(row.orderCode)}
              className="text-[9px] text-primary-600 font-mono mt-0.5 hover:underline flex items-center gap-1"
              title="Sao chép mã đơn để dán vào nội dung chuyển khoản"
            >
              <Copy className="w-2.5 h-2.5" />
              {row.orderCode}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'bankInfo',
      label: 'Tài khoản đích',
      render: (_, row) => (
        <div className="max-w-xs space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Bank className="w-3.5 h-3.5 text-slate-400" />
            <Text className="text-xs font-bold text-slate-800">{row.bankName || '—'}</Text>
          </div>
          <button
            onClick={() => handleCopy(row.accountNumber, 'Đã sao chép số tài khoản')}
            className="text-[11px] font-mono text-slate-700 hover:text-primary-600 hover:underline"
          >
            {row.accountNumber || '—'}
          </button>
          <Text className="text-[10px] text-slate-500 uppercase tracking-wide">{row.accountHolder || '—'}</Text>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      render: (status) => {
        const config = STATUS_BADGE[status] || { color: 'info', label: status, icon: Clock };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="w-3 h-3 text-slate-500" />
            <Badge color={config.color} className="uppercase text-[9px] tracking-widest">
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Thời gian',
      sortable: true,
      render: (date) => (
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 font-bold">{formatDateTime(date).split(' ')[0]}</span>
          <span className="text-[9px] text-slate-400 font-medium">{formatDateTime(date).split(' ')[1]}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_, row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenDetail(row)}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 hover:bg-slate-50"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4 text-slate-500" />
          </button>
          {(row.status === 'PENDING' || row.status === 'APPROVED') && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="px-3"
                onClick={() => handleOpenAction(row, 'COMPLETED')}
                title="Tra cứu SePay & xác nhận đã chuyển khoản"
              >
                Xác nhận đã chuyển
              </Button>
              {row.status === 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 text-red-500 border-red-100 hover:bg-red-50"
                  onClick={() => handleOpenAction(row, 'REJECTED')}
                >
                  Từ chối
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">Tài chính</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">Yêu cầu rút tiền</H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            Duyệt yêu cầu, chuyển khoản thủ công ngoài đời và dán mã đơn vào nội dung. SePay webhook sẽ tự động đóng đơn khi tiền ra.
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 h-12 bg-white border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors appearance-none min-w-[160px] shadow-premium"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Tìm user / STK / mã đơn..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-premium"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Đang tải...</Text>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: bảng đầy đủ. AdvancedTable đã có overflow-x-auto. */}
          <div className="hidden md:block bg-white shadow-premium overflow-hidden border border-slate-100">
            <AdvancedTable headers={headers} data={filteredData} pageSize={10} className="[&_table]:border-0" />
          </div>

          {/* Mobile: dạng list cards để tránh scroll ngang khó dùng trên màn nhỏ. */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredData.length === 0 ? (
              <div className="bg-white border border-slate-100 p-6 text-center">
                <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Không có yêu cầu nào
                </Text>
              </div>
            ) : (
              filteredData.map((row) => {
                const config = STATUS_BADGE[row.status] || { color: 'info', label: row.status, icon: Clock };
                const Icon = config.icon;
                return (
                  <div key={row.id} className="bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Text className="font-bold text-slate-900 leading-tight truncate">
                          {row.user?.fullName || `#${row.user?.id || 'N/A'}`}
                        </Text>
                        <Text className="text-[11px] text-slate-500 truncate">
                          {row.user?.email || `ID #${row.user?.id || 'N/A'}`}
                        </Text>
                      </div>
                      <Badge color={config.color} className="uppercase text-[9px] tracking-widest shrink-0">
                        <span className="inline-flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-y border-slate-100 py-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Số tiền</span>
                      <span className="font-bold text-slate-900 text-base">{formatCurrency(row.amount)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Bank className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{row.bankName || '—'}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(row.accountNumber, 'Đã sao chép số tài khoản')}
                        className="font-mono text-slate-700 hover:text-primary-600 hover:underline text-left truncate"
                      >
                        {row.accountNumber || '—'}
                      </button>
                      <Text className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                        {row.accountHolder || '—'}
                      </Text>
                    </div>

                    {row.orderCode && (
                      <button
                        onClick={() => handleCopy(row.orderCode)}
                        className="text-[10px] text-primary-600 font-mono hover:underline flex items-center gap-1 self-start"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        {row.orderCode}
                      </button>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-slate-400">{formatDateTime(row.createdAt)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(row)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 hover:bg-slate-50"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        {(row.status === 'PENDING' || row.status === 'APPROVED') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="px-3 text-[11px]"
                            onClick={() => handleOpenAction(row, 'COMPLETED')}
                          >
                            Xác nhận
                          </Button>
                        )}
                        {row.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3 text-[11px] text-red-500 border-red-100 hover:bg-red-50"
                            onClick={() => handleOpenAction(row, 'REJECTED')}
                          >
                            Từ chối
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={
          processStatus === 'COMPLETED' ? 'Xác nhận đã chuyển khoản'
            : 'Từ chối yêu cầu rút tiền'
        }
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              variant={processStatus === 'REJECTED' ? 'danger' : 'primary'}
              className="flex-1"
              onClick={handleConfirmAction}
              disabled={submitting || (processStatus === 'REJECTED' && !note.trim())}
            >
              {submitting
                ? <Spinner size="sm" tone="current" inline />
                : processStatus === 'COMPLETED'
                  ? 'Tra cứu SePay & đóng đơn'
                  : 'Xác nhận từ chối'}
            </Button>
          </div>
        }
      >
        {selectedRequest && (() => {
          const matchedBank = findBankByName(selectedRequest.bankName);
          const vietQrBankCode = selectedRequest.bankCode || matchedBank?.code;
          const vietQrUrl = buildVietQrImageUrl({
            bankCode: vietQrBankCode,
            accountNumber: selectedRequest.accountNumber,
            amount: selectedRequest.amount,
            addInfo: selectedRequest.orderCode || '',
            accountName: selectedRequest.accountHolder,
          });
          return (
          <div className="flex flex-col gap-5">
            <div
              className={`p-5 flex gap-4 border ${
                processStatus === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              {processStatus === 'REJECTED' ? (
                <WarningTriangle className="w-6 h-6 text-red-600 shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
              <div>
                <Text className="font-bold text-slate-900 mb-1 leading-tight">
                  {processStatus === 'REJECTED' ? 'Từ chối' : 'Xác nhận đã chuyển'}{' '}
                  {formatCurrency(selectedRequest.amount)} cho {selectedRequest.user?.fullName}
                </Text>
                <Text className="text-[11px] text-slate-600 leading-normal">
                  {processStatus === 'REJECTED'
                    ? 'Tiền đang giữ sẽ được hoàn lại vào ví khả dụng của user.'
                    : 'Hệ thống sẽ gọi SePay API để tra cứu giao dịch chuyển ra khớp mã đơn này. Chỉ khi SePay xác nhận có giao dịch thực tế, đơn rút mới được đóng và tiền hold sẽ được trừ vĩnh viễn.'}
                </Text>
              </div>
            </div>

            {processStatus === 'COMPLETED' && vietQrUrl && (
              <div className="bg-white border-2 border-emerald-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex justify-center sm:justify-start shrink-0">
                  <div className="p-2 bg-white border border-slate-200 shadow-sm rounded-lg">
                    <img
                      src={vietQrUrl}
                      alt="VietQR chuyển khoản"
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ScanQrCode className="w-5 h-5 text-emerald-600" />
                    <Text className="font-bold text-emerald-700">Quét QR để chuyển khoản nhanh</Text>
                  </div>
                  <Text className="text-xs text-slate-600 leading-relaxed">
                    Mở app ngân hàng (VCB, Techcombank, MB, ...) → quét mã QR này. Số tiền, người nhận
                    và nội dung chuyển khoản (đã chứa mã đơn) sẽ tự động được điền sẵn — không cần
                    nhập tay.
                  </Text>
                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                    <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <span className="text-slate-400 uppercase font-semibold block">Số tiền</span>
                      <span className="font-bold text-slate-800">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                    <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <span className="text-slate-400 uppercase font-semibold block">Nội dung</span>
                      <span className="font-mono font-bold text-slate-800 truncate">{selectedRequest.orderCode || '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadQr(
                        vietQrUrl,
                        `vietqr-${selectedRequest.orderCode || selectedRequest.id}.png`,
                        'Đã tải VietQR'
                      )}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải QR về máy
                    </button>
                    <a
                      href={vietQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary-600 hover:underline font-semibold"
                    >
                      Mở ở tab mới
                    </a>
                  </div>
                </div>
              </div>
            )}

            {selectedRequest.orderCode && (
              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <Caption className="text-slate-400 uppercase tracking-widest mb-1">Mã đơn (nội dung chuyển khoản)</Caption>
                  <Text className="font-mono font-bold text-lg tracking-wider">{selectedRequest.orderCode}</Text>
                </div>
                <button
                  onClick={() => handleCopy(selectedRequest.orderCode)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold"
                >
                  <Copy className="w-3.5 h-3.5" /> Sao chép
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 border border-slate-100">
                <Caption className="text-slate-400 font-bold uppercase mb-1">Ngân hàng</Caption>
                <Text className="text-sm font-bold text-slate-800">
                  {selectedRequest.bankName || '—'}
                  {vietQrBankCode && (
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">
                      {vietQrBankCode}
                    </span>
                  )}
                </Text>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-100">
                <Caption className="text-slate-400 font-bold uppercase mb-1">Số tài khoản</Caption>
                <button
                  onClick={() => handleCopy(selectedRequest.accountNumber, 'Đã sao chép số tài khoản')}
                  className="text-sm font-bold text-slate-800 font-mono hover:text-primary-600 hover:underline"
                >
                  {selectedRequest.accountNumber || '—'}
                </button>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-100 sm:col-span-2">
                <Caption className="text-slate-400 font-bold uppercase mb-1">Chủ tài khoản</Caption>
                <Text className="text-sm font-bold text-slate-800 uppercase">{selectedRequest.accountHolder || '—'}</Text>
              </div>
              {selectedRequest.qrImageUrl && (
                <div className="bg-slate-50 p-4 border border-slate-100 sm:col-span-2 flex flex-col sm:flex-row items-start gap-3">
                  <div className="flex-1">
                    <Caption className="text-slate-400 font-bold uppercase mb-1">QR do user cung cấp</Caption>
                    <Text className="text-[11px] text-slate-500">Backup nếu QR động phía trên không khớp tài khoản</Text>
                    <button
                      type="button"
                      onClick={() => handleDownloadQr(
                        selectedRequest.qrImageUrl,
                        `user-qr-${selectedRequest.orderCode || selectedRequest.id}.png`
                      )}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:underline mt-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải QR về máy
                    </button>
                  </div>
                  <a href={selectedRequest.qrImageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={selectedRequest.qrImageUrl} alt="QR" className="w-28 h-28 object-contain border border-slate-200 bg-white" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ghi chú (tùy chọn)</Text>
                <Caption className="text-slate-400">Sẽ gửi tới user</Caption>
              </div>
              <textarea
                className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 outline-none transition-colors text-sm font-medium"
                placeholder={
                  processStatus === 'REJECTED'
                    ? 'Lý do từ chối (bắt buộc)...'
                    : 'Ghi chú (vd: đã chuyển vào lúc X, ngân hàng Y)'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Chi tiết yêu cầu rút tiền"
        size="lg"
      >
        {detailRequest && (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <Caption className="text-emerald-700 uppercase tracking-widest mb-1">Số tiền</Caption>
              <H2 className="text-3xl font-extrabold text-emerald-700 !mb-0">{formatCurrency(detailRequest.amount)}</H2>
              {detailRequest.orderCode && (
                <Text className="text-xs text-slate-500 mt-2 font-mono">{detailRequest.orderCode}</Text>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label="User" value={`${detailRequest.user?.fullName} (#${detailRequest.user?.id})`} />
              <Field label="Email" value={detailRequest.user?.email} />
              <Field label="Ngân hàng" value={detailRequest.bankName} />
              <Field label="Mã NH" value={detailRequest.bankCode || '—'} />
              <Field label="Số TK" value={detailRequest.accountNumber} mono onCopy={() => handleCopy(detailRequest.accountNumber, 'Đã sao chép STK')} />
              <Field label="Chủ TK" value={detailRequest.accountHolder} upper />
              <Field label="Trạng thái" value={STATUS_BADGE[detailRequest.status]?.label || detailRequest.status} />
              <Field label="Tạo lúc" value={formatDateTime(detailRequest.createdAt)} />
              {detailRequest.approvedAt && <Field label="Duyệt lúc" value={formatDateTime(detailRequest.approvedAt)} />}
              {detailRequest.completedAt && <Field label="Hoàn tất lúc" value={formatDateTime(detailRequest.completedAt)} />}
              {detailRequest.sepayTransactionId && <Field label="SePay tx" value={detailRequest.sepayTransactionId} mono />}
            </div>

            {detailRequest.qrImageUrl && (
              <div>
                <Caption className="text-slate-400 font-bold uppercase mb-2">QR ngân hàng (user cung cấp)</Caption>
                <div className="flex items-start gap-3">
                  <a href={detailRequest.qrImageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={detailRequest.qrImageUrl} alt="QR" className="w-40 h-40 object-contain border border-slate-200 bg-white" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(
                      detailRequest.qrImageUrl,
                      `user-qr-${detailRequest.orderCode || detailRequest.id}.png`
                    )}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải QR về máy
                  </button>
                </div>
              </div>
            )}

            {detailRequest.note && (
              <div className="bg-slate-50 p-4 border border-slate-100 rounded">
                <Caption className="text-slate-500 font-bold uppercase mb-1">Ghi chú</Caption>
                <Text className="text-sm text-slate-700 italic">{detailRequest.note}</Text>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Field = ({ label, value, mono, upper, onCopy }) => (
  <div className="bg-white border border-slate-100 p-3 rounded">
    <Caption className="text-slate-400 font-bold uppercase mb-0.5">{label}</Caption>
    {onCopy ? (
      <button
        onClick={onCopy}
        className={`text-sm font-bold text-slate-800 hover:text-primary-600 hover:underline ${mono ? 'font-mono' : ''} ${upper ? 'uppercase' : ''}`}
      >
        {value || '—'}
      </button>
    ) : (
      <Text className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono' : ''} ${upper ? 'uppercase' : ''}`}>
        {value || '—'}
      </Text>
    )}
  </div>
);

export default AdminWithdrawalsPage;
