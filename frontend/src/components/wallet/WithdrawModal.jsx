import React, { useEffect, useMemo, useState } from 'react';
import {
  Bank,
  CheckCircle,
  Plus,
  Upload,
  Star,
  StarSolid,
  Xmark,
  InfoCircle,
} from 'iconoir-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Spinner from '../common/Spinner';
import BankSelect from '../common/BankSelect';
import { Text, Caption } from '../common/Typography';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { useCreateWithdrawal } from '../../hooks/useWithdrawals';
import marketplaceApi from '../../api/marketplaceApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

const MIN_AMOUNT = 50000;

const initialManualForm = () => ({
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountHolder: '',
  qrImageUrl: '',
});

/**
 * Modal tạo yêu cầu rút tiền:
 *  - Chọn tài khoản ngân hàng đã lưu (nếu có) HOẶC nhập thủ công.
 *  - Có thể tick "Lưu tài khoản này" để lần sau chọn nhanh.
 *  - Cho phép upload ảnh QR (Cloudinary) để admin có thể quét chuyển khoản.
 */
const WithdrawModal = ({ isOpen, onClose, balance = 0, onSuccess }) => {
  const { addToast } = useToast();
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts({ enabled: isOpen });
  const createWithdrawal = useCreateWithdrawal();

  const [mode, setMode] = useState('saved'); // 'saved' | 'manual'
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [manualForm, setManualForm] = useState(initialManualForm());
  const [saveAccount, setSaveAccount] = useState(true);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const numericAmount = Number(amount) || 0;
  const hasAccounts = bankAccounts.length > 0;
  const defaultAccount = useMemo(
    () => bankAccounts.find((acc) => acc.isDefault) || bankAccounts[0] || null,
    [bankAccounts]
  );

  useEffect(() => {
    if (!isOpen) {
      setMode('saved');
      setAmount('');
      setSelectedAccountId(null);
      setManualForm(initialManualForm());
      setSaveAccount(true);
      setQrFile(null);
      setQrPreview(null);
      setUploadingQr(false);
      setSubmitting(false);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!loadingAccounts) {
      if (hasAccounts) {
        setMode('saved');
        if (selectedAccountId == null && defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      } else {
        setMode('manual');
      }
    }
  }, [isOpen, loadingAccounts, hasAccounts, defaultAccount, selectedAccountId]);

  useEffect(() => {
    if (!qrFile) {
      setQrPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(qrFile);
    setQrPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [qrFile]);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      addToast('QR phải là ảnh PNG/JPG/WEBP', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Ảnh QR tối đa 5MB', 'warning');
      return;
    }
    setQrFile(file);
    setUploadingQr(true);
    try {
      const res = await marketplaceApi.uploadBankAccountQr(file);
      const data = res?.data;
      const list = Array.isArray(data) ? data : [data];
      const url = list?.[0]?.url || list?.[0]?.fileUrl;
      if (!url) {
        throw new Error('Phản hồi upload không hợp lệ');
      }
      setManualForm((prev) => ({ ...prev, qrImageUrl: url }));
      addToast('Đã tải lên ảnh QR', 'success');
    } catch (err) {
      addToast(err?.message || err?.response?.data?.message || 'Tải ảnh QR thất bại', 'error');
      setQrFile(null);
    } finally {
      setUploadingQr(false);
    }
  };

  const handleClearQr = () => {
    setQrFile(null);
    setManualForm((prev) => ({ ...prev, qrImageUrl: '' }));
  };

  const validate = () => {
    const next = {};
    if (!numericAmount || numericAmount < MIN_AMOUNT) {
      next.amount = `Số tiền rút tối thiểu ${formatCurrency(MIN_AMOUNT)}`;
    }
    if (numericAmount > balance) {
      next.amount = 'Số dư khả dụng không đủ';
    }
    if (mode === 'saved') {
      if (!selectedAccountId) {
        next.account = 'Vui lòng chọn tài khoản ngân hàng';
      }
    } else {
      if (!manualForm.bankName.trim() || !manualForm.bankCode.trim()) {
        next.bankName = 'Vui lòng chọn ngân hàng';
      }
      if (!manualForm.accountNumber.trim()) next.accountNumber = 'Bắt buộc';
      if (!manualForm.accountHolder.trim()) next.accountHolder = 'Bắt buộc';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { amount: numericAmount };
      if (mode === 'saved') {
        payload.bankAccountId = selectedAccountId;
      } else {
        payload.bankName = manualForm.bankName.trim();
        payload.bankCode = manualForm.bankCode.trim() || null;
        payload.accountNumber = manualForm.accountNumber.trim();
        payload.accountHolder = manualForm.accountHolder.trim();
        payload.qrImageUrl = manualForm.qrImageUrl?.trim() || null;
        payload.saveBankAccount = saveAccount;
      }
      const res = await createWithdrawal.mutateAsync(payload);
      addToast(res?.message || 'Đã gửi yêu cầu rút tiền', 'success');
      onSuccess?.(res?.data);
      onClose?.();
    } catch (err) {
      addToast(err?.message || err?.response?.data?.message || 'Gửi yêu cầu rút tiền thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAmount = () => (
    <div className="space-y-2">
      <Input
        label="Số tiền muốn rút (VND)"
        type="number"
        placeholder="Ví dụ: 500,000"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        min={MIN_AMOUNT}
        max={balance}
        error={errors.amount}
        required
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Số dư khả dụng: <span className="font-semibold text-slate-800">{formatCurrency(balance)}</span></span>
        <span>Tối thiểu: {formatCurrency(MIN_AMOUNT)}</span>
      </div>
    </div>
  );

  const renderSavedAccounts = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Caption className="text-slate-600 font-semibold uppercase tracking-wider">
          Tài khoản đã lưu
        </Caption>
        <button
          type="button"
          onClick={() => {
            setMode('manual');
            setManualForm(initialManualForm());
          }}
          className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Nhập thủ công
        </button>
      </div>

      {loadingAccounts ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : !hasAccounts ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <Bank className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <Text className="text-sm text-slate-500">Chưa có tài khoản đã lưu</Text>
        </div>
      ) : (
        <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
          {bankAccounts.map((acc) => {
            const active = selectedAccountId === acc.id;
            return (
              <button
                type="button"
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Bank className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Text className="font-bold text-slate-900 text-sm truncate">{acc.bankName}</Text>
                    {acc.isDefault && <StarSolid className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <Text className="text-xs text-slate-500 font-mono">
                    {acc.accountNumber} · {acc.accountHolder}
                  </Text>
                </div>
                {active && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {errors.account && <Text className="text-xs text-red-600">{errors.account}</Text>}
    </div>
  );

  const renderManualForm = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Caption className="text-slate-600 font-semibold uppercase tracking-wider">
          Nhập tài khoản thủ công
        </Caption>
        {hasAccounts && (
          <button
            type="button"
            onClick={() => setMode('saved')}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            ← Quay lại tài khoản đã lưu
          </button>
        )}
      </div>

      <BankSelect
        label="Ngân hàng"
        value={manualForm.bankCode}
        onChange={(bank) =>
          setManualForm((prev) => ({
            ...prev,
            bankCode: bank?.code || '',
            bankName: bank?.shortName || '',
          }))
        }
        error={errors.bankName}
        required
      />
      <Input
        label="Số tài khoản"
        placeholder="Nhập số tài khoản"
        value={manualForm.accountNumber}
        onChange={(e) => setManualForm({ ...manualForm, accountNumber: e.target.value })}
        error={errors.accountNumber}
        required
      />
      <Input
        label="Tên chủ tài khoản"
        placeholder="NGUYEN VAN A"
        value={manualForm.accountHolder}
        onChange={(e) => setManualForm({ ...manualForm, accountHolder: e.target.value.toUpperCase() })}
        error={errors.accountHolder}
        required
      />

      <div>
        <Caption className="text-slate-500 font-semibold uppercase mb-2 tracking-wider">
          Ảnh QR ngân hàng (tùy chọn)
        </Caption>
        {qrPreview || manualForm.qrImageUrl ? (
          <div className="relative inline-block">
            <img
              src={qrPreview || manualForm.qrImageUrl}
              alt="QR"
              className="w-32 h-32 object-contain border border-slate-200 rounded-lg bg-white"
            />
            <button
              type="button"
              onClick={handleClearQr}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <Xmark className="w-4 h-4" />
            </button>
            {uploadingQr && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleSelectFile}
            />
            <div className="text-center text-slate-400">
              <Upload className="w-6 h-6 mx-auto mb-1" />
              <Text className="text-xs">Tải QR</Text>
            </div>
          </label>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={saveAccount}
          onChange={(e) => setSaveAccount(e.target.checked)}
          className="w-4 h-4 accent-emerald-600"
        />
        <span className="text-sm text-slate-700 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          Lưu tài khoản này vào hồ sơ để dùng lần sau
        </span>
      </label>
    </div>
  );

  const formId = 'withdraw-modal-form';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rút tiền từ ví"
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            className="flex-1"
            isLoading={submitting || uploadingQr}
            disabled={submitting || uploadingQr}
          >
            Gửi yêu cầu rút {numericAmount > 0 ? formatCurrency(numericAmount) : ''}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {renderAmount()}

        <div className="border-t border-slate-100 pt-4">
          {mode === 'saved' ? renderSavedAccounts() : renderManualForm()}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
          <InfoCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <Text className="text-xs text-amber-800 leading-relaxed">
            Yêu cầu sẽ được gửi tới Quản trị viên. Sau khi duyệt, tiền sẽ được chuyển khoản thủ công vào tài khoản của bạn (thường trong vòng 24h). Số tiền sẽ tạm giữ khỏi số dư khả dụng đến khi hoàn tất.
          </Text>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawModal;
