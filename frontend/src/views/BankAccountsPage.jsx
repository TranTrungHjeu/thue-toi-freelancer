import React, { useState } from 'react';
import {
  Bank,
  Plus,
  Edit,
  Trash,
  StarSolid,
  Star,
  Upload,
  Xmark,
  Download,
} from 'iconoir-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import BankSelect from '../components/common/BankSelect';
import { findBankByName } from '../constants/vietnameseBanks';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useSetDefaultBankAccount,
} from '../hooks/useBankAccounts';
import marketplaceApi from '../api/marketplaceApi';
import { downloadImage } from '../utils/downloadImage';
import { useToast } from '../hooks/useToast';

const emptyForm = () => ({
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountHolder: '',
  qrImageUrl: '',
  isDefault: false,
});

const BankAccountsPage = () => {
  const { addToast } = useToast();
  const { data: accounts = [], isLoading } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();
  const setDefaultMutation = useSetDefaultBankAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setQrFile(null);
    setQrPreview(null);
    setIsOpen(true);
  };

  const openEdit = (account) => {
    setEditingId(account.id);
    let bankCode = account.bankCode || '';
    let bankName = account.bankName || '';
    if (!bankCode && bankName) {
      const matched = findBankByName(bankName);
      if (matched) {
        bankCode = matched.code;
        bankName = matched.shortName;
      }
    }
    setForm({
      bankName,
      bankCode,
      accountNumber: account.accountNumber || '',
      accountHolder: account.accountHolder || '',
      qrImageUrl: account.qrImageUrl || '',
      isDefault: !!account.isDefault,
    });
    setQrFile(null);
    setQrPreview(null);
    setIsOpen(true);
  };

  const handleUploadQr = async (event) => {
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
    setQrPreview(URL.createObjectURL(file));
    setUploadingQr(true);
    try {
      const res = await marketplaceApi.uploadBankAccountQr(file);
      const data = res?.data;
      const list = Array.isArray(data) ? data : [data];
      const url = list?.[0]?.url || list?.[0]?.fileUrl;
      if (!url) throw new Error('Phản hồi upload không hợp lệ');
      setForm((prev) => ({ ...prev, qrImageUrl: url }));
      addToast('Đã tải lên ảnh QR', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Tải QR thất bại', 'error');
      setQrFile(null);
      setQrPreview(null);
    } finally {
      setUploadingQr(false);
    }
  };

  const handleClearQr = () => {
    setQrFile(null);
    setQrPreview(null);
    setForm((prev) => ({ ...prev, qrImageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.bankCode.trim()) {
      addToast('Vui lòng chọn ngân hàng', 'warning');
      return;
    }
    if (!form.accountNumber.trim() || !form.accountHolder.trim()) {
      addToast('Vui lòng nhập số tài khoản và chủ tài khoản', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        bankName: form.bankName.trim(),
        bankCode: form.bankCode.trim() || null,
        accountNumber: form.accountNumber.trim(),
        accountHolder: form.accountHolder.trim(),
        qrImageUrl: form.qrImageUrl?.trim() || null,
        isDefault: form.isDefault,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        addToast('Đã cập nhật tài khoản', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        addToast('Đã thêm tài khoản', 'success');
      }
      setIsOpen(false);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Đã xóa tài khoản', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Không thể xóa', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      addToast('Đã đặt làm tài khoản mặc định', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Không thể đặt mặc định', 'error');
    }
  };

  const handleDownloadAccountQr = async (account) => {
    if (!account?.qrImageUrl) {
      addToast('Tài khoản này chưa có ảnh QR', 'warning');
      return;
    }
    const safeBank = (account.bankCode || account.bankName || 'bank').replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const ok = await downloadImage(account.qrImageUrl, `qr-${safeBank}-${account.accountNumber || account.id}.png`);
    addToast(ok ? 'Đã tải QR ngân hàng' : 'Trình duyệt đã mở ảnh QR ở tab mới', ok ? 'success' : 'info');
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-8 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tài khoản ngân hàng</H1>
          <Text className="text-slate-500 text-sm">
            Quản lý các tài khoản ngân hàng để dùng nhanh khi rút tiền
          </Text>
        </div>
        <Button variant="primary" onClick={openCreate} className="flex items-center gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" /> Thêm tài khoản
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner className="w-10 h-10 text-primary-600" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-slate-50 p-12 rounded-2xl text-center">
          <Bank className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <H2 className="text-lg font-bold text-slate-700 mb-1">Chưa có tài khoản nào</H2>
          <Text className="text-sm text-slate-500 mb-6">
            Thêm tài khoản ngân hàng để chọn nhanh khi rút tiền
          </Text>
          <Button variant="primary" onClick={openCreate} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm tài khoản đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={`border p-5 rounded-2xl bg-white relative ${
                account.isDefault
                  ? 'border-emerald-300 ring-2 ring-emerald-200 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {account.isDefault && (
                <span className="absolute -top-2 right-4 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white rounded">
                  <StarSolid className="w-3 h-3" /> Mặc định
                </span>
              )}
              <div className="flex items-start gap-4">
                {account.qrImageUrl ? (
                  <img
                    src={account.qrImageUrl}
                    alt="QR"
                    className="w-16 h-16 object-contain border border-slate-200 rounded bg-white shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Bank className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <H2 className="text-lg font-bold text-slate-900 mb-1">{account.bankName}</H2>
                  <Text className="font-mono text-sm text-slate-700 mb-0.5">{account.accountNumber}</Text>
                  <Text className="text-xs text-slate-500 uppercase tracking-wide">{account.accountHolder}</Text>
                  {account.bankCode && (
                    <Caption className="text-[10px] text-slate-400 mt-1 font-mono">Code: {account.bankCode}</Caption>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                {!account.isDefault && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-amber-600 flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" /> Đặt mặc định
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {account.qrImageUrl && (
                    <button
                      onClick={() => handleDownloadAccountQr(account)}
                      className="p-1.5 rounded hover:bg-emerald-50 text-slate-500 hover:text-emerald-600"
                      title="Tải QR về máy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(account)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                    title="Sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                    title="Xóa"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => !submitting && setIsOpen(false)}
        title={editingId ? 'Sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1" disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="bank-account-form"
              variant="primary"
              className="flex-1"
              isLoading={submitting || uploadingQr}
            >
              {editingId ? 'Lưu thay đổi' : 'Thêm tài khoản'}
            </Button>
          </div>
        }
      >
        <form id="bank-account-form" onSubmit={handleSubmit} className="space-y-3">
          <BankSelect
            label="Ngân hàng"
            value={form.bankCode}
            onChange={(bank) =>
              setForm((prev) => ({
                ...prev,
                bankCode: bank?.code || '',
                bankName: bank?.shortName || '',
              }))
            }
            required
          />
          <Input
            label="Số tài khoản"
            placeholder="Nhập số tài khoản"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            required
          />
          <Input
            label="Tên chủ tài khoản"
            placeholder="NGUYEN VAN A"
            value={form.accountHolder}
            onChange={(e) => setForm({ ...form, accountHolder: e.target.value.toUpperCase() })}
            required
          />

          <div>
            <Caption className="text-slate-500 font-semibold uppercase mb-2 tracking-wider">
              Ảnh QR ngân hàng (tùy chọn)
            </Caption>
            {qrPreview || form.qrImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={qrPreview || form.qrImageUrl}
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
                  onChange={handleUploadQr}
                />
                <div className="text-center text-slate-400">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <Text className="text-xs">Tải QR</Text>
                </div>
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="text-sm text-slate-700 flex items-center gap-1">
              <StarSolid className="w-3.5 h-3.5 text-amber-500" />
              Đặt làm tài khoản mặc định
            </span>
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default BankAccountsPage;
