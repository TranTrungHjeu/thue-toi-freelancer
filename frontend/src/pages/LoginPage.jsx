import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageSearch } from 'iconoir-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import bgImage from '../assets/pexels-luna-lovegood-4087177.webp';


const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { login } = useAuth();
  const nextPath = location.state?.from?.pathname || '/workspace';

  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await login(email, password);
      addToast('Đăng nhập thành công.', 'success');
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error?.code === 'ERR_AUTH_07') {
        addToast('Tài khoản chưa xác thực email. Hãy nhập OTP trước.', 'warning');
        navigate(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setFormError(error?.message || 'Không thể đăng nhập lúc này.');
      addToast(error?.message || 'Đăng nhập thất bại', 'error');
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

      {/* ── Dark overlay để card/text dễ đọc ── */}
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
          to="/auth/register"
          className="border border-white/60 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Đăng ký
        </Link>
      </header>

      {/* ══ CENTER CARD ══ */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[480px] border border-slate-100 bg-white px-10 py-8 shadow-lg">

          {/* Figma: "Welcome to Float Wallet" heading */}
          <div className="mb-5 text-center">
            <h1 className="font-serif text-[2rem] font-bold leading-tight text-secondary-900">
              Chào mừng trở lại
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Đăng nhập để quản lý dự án, nhận báo giá và kết nối với freelancer chuyên nghiệp trên Thuê Tôi.
            </p>
          </div>

          {/* ── Form ── */}
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {formError && (
              <Callout type="danger" title="Không thể đăng nhập">
                {formError}
              </Callout>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="example@thuetoi.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {/* Remember me + OTP link */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer border border-slate-300 accent-primary-600"
                />
                <span className="text-sm text-slate-500">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                className="text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Chưa verify OTP?
              </Link>
            </div>

            {/* Figma: teal "Connect wallet" CTA → project: primary Button */}
            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Hoặc
              </Caption>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Secondary: Figma "I already have an account" → project: workspace shortcut */}
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <PageSearch className="h-5 w-5 text-primary-600" />
              Tiếp tục vào Workspace
            </button>
          </form>

          {/* Sign-up footer link */}
          <p className="mt-5 text-center text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link
              to="/auth/register"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              Tạo ngay
            </Link>
          </p>
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

export default LoginPage;
