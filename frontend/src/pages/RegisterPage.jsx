import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/pexels-luna-lovegood-4087177.webp';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../components/common/Toast';

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
};

const roleOptions = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'freelancer', label: 'Freelancer' },
];


const RegisterPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');

    try {
      await authApi.register(form);
      addToast('Đăng ký thành công. Hãy xác thực OTP để kích hoạt tài khoản.', 'success');
      navigate(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      setFieldErrors(error?.errors || {});
      setFormError(error?.message || 'Không thể tạo tài khoản lúc này.');
      addToast(error?.message || 'Đăng ký thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">

      {/* ── Background image ── */}
      <img
        src={bgImage}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* ── Dark overlay ── */}
      <div className="pointer-events-none absolute inset-0 bg-slate-900/60" />

      {/* ══ TOP NAV ══ */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="border-2 border-white bg-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            TT
          </div>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Thuê Tôi
          </span>
        </Link>
        <Link
          to="/auth/login"
          className="border border-white/60 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Đăng nhập
        </Link>
      </header>

      {/* ══ CENTER CARD ══ */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[520px] border border-slate-100 bg-white px-8 py-6 shadow-lg">

          {/* Heading */}
          <div className="mb-4 text-center">
            <h1 className="font-serif text-2xl font-bold leading-tight text-secondary-900">
              Tạo tài khoản mới
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Chọn vai trò phù hợp — hệ thống gửi OTP xác thực email để kích hoạt.
            </p>
          </div>

          {/* ── Form ── */}
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {formError && (
              <Callout type="danger" title="Không thể tiếp tục">
                {formError}
              </Callout>
            )}

            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={handleChange('fullName')}
              error={fieldErrors.fullName}
              autoComplete="name"
            />

            {/* Email + Role side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email"
                type="email"
                placeholder="ban@thuetoi.vn"
                value={form.email}
                onChange={handleChange('email')}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Select
                label="Vai trò"
                value={form.role}
                onChange={handleChange('role')}
                error={fieldErrors.role}
                options={roleOptions}
              />
            </div>

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={form.password}
              onChange={handleChange('password')}
              error={fieldErrors.password}
              autoComplete="new-password"
            />

            {/* Override min-h-32 hardcoded in Textarea component */}
            <Textarea
              label="Mô tả ngắn"
              placeholder="Giới thiệu ngắn về nhu cầu dự án hoặc năng lực chuyên môn."
              value={form.profileDescription}
              onChange={handleChange('profileDescription')}
              error={fieldErrors.profileDescription}
              rows={2}
              className="[&_textarea]:min-h-0 [&_textarea]:h-[68px]"
            />

            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký và gửi OTP'}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Hoặc
              </Caption>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-400">
              Đã có tài khoản?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 pb-3 text-center">
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          © 2025 Thuê Tôi Platform
        </Caption>
      </footer>
    </div>
  );
};

export default RegisterPage;
