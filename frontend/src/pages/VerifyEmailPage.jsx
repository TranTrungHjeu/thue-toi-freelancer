import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailOut } from 'iconoir-react';
import Input from '../components/common/Input';
import OtpInput from '../components/common/OtpInput';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../hooks/useToast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      await authApi.verifyEmailOtp({ email, otp });
      addToast('Xác thực email thành công. Bạn có thể đăng nhập ngay.', 'success');
      navigate(`/auth/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(error?.message || 'Không thể xác thực OTP.');
      addToast(error?.message || 'Xác thực thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setFormError('');

    try {
      await authApi.resendVerificationOtp(email);
      addToast('Đã gửi lại OTP xác thực email.', 'success');
    } catch (error) {
      setFormError(error?.message || 'Không thể gửi lại OTP.');
      addToast(error?.message || 'Gửi lại OTP thất bại', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">

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
        <div className="w-full max-w-[480px] border border-slate-100 bg-white px-10 py-8 shadow-lg">

          <div className="mb-5 text-center">
            <h1 className="font-serif text-[2rem] font-bold leading-tight text-secondary-900">
              Xác thực email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Kiểm tra hộp thư và nhập mã OTP 6 chữ số để kích hoạt tài khoản Thuê Tôi.
            </p>
          </div>

          {/* ── Form ── */}
          <form className="flex flex-col gap-3.5" onSubmit={handleVerify}>
            {formError && (
              <Callout type="danger" title="Không thể xác thực">
                {formError}
              </Callout>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="ban@thuetoi.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <OtpInput value={otp} onChange={setOtp} />

            <Button type="submit" disabled={loading} className="mt-1 w-full py-3.5 text-[15px]">
              {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Chưa nhận được?
              </Caption>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MailOut className="h-5 w-5 text-primary-600" />
              {resending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 flex items-center justify-between text-sm">
            <Link
              to="/auth/register"
              className="text-slate-400 hover:text-slate-600"
            >
              Quay lại đăng ký
            </Link>
            <Link
              to={`/auth/login?email=${encodeURIComponent(email)}`}
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              Đã verified? Đăng nhập
            </Link>
          </div>
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

export default VerifyEmailPage;
