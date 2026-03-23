import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageSearch } from 'iconoir-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';

/* Geometric hexagon background — inspired by Figma crypto-wallet kit */
/* viewBox 1440x900 covers standard desktop viewport; coords are absolute pixels */
const HexPattern = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Top-left cluster */}
    <polygon points="100,10 160,44 160,112 100,146 40,112 40,44"   stroke="#cbd5e1" strokeWidth="1" fill="none" opacity="0.5" />
    <polygon points="210,10 270,44 270,112 210,146 150,112 150,44"  stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.4" />
    <polygon points="40,115 100,149 100,217 40,251 -20,217 -20,149" stroke="#cbd5e1" strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="160,120 220,154 220,222 160,256 100,222 100,154" stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.4" />
    <polygon points="270,55 330,89 330,157 270,191 210,157 210,89"  stroke="#cbd5e1" strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="320,10 380,44 380,112 320,146 260,112 260,44"  stroke="#f1f5f9" strokeWidth="1" fill="none" opacity="0.5" />

    {/* Top-right cluster — converted from % to px (viewBox 1440×900) */}
    <polygon points="1123,18 1210,49 1210,112 1123,144 1037,112 1037,49" stroke="#cbd5e1" strokeWidth="1" fill="none" opacity="0.4" />
    <polygon points="1238,72 1325,103 1325,167 1238,198 1152,167 1152,103" stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="1325,18 1411,49 1411,112 1325,144 1238,112 1238,49" stroke="#f1f5f9" strokeWidth="1" fill="none" opacity="0.5" />

    {/* Bottom-right cluster — teal tones match Figma gradient */}
    <polygon points="1066,648 1181,688 1181,770 1066,810 950,770 950,688"  stroke="#a7f3d0" strokeWidth="1" fill="none" opacity="0.45" />
    <polygon points="1181,720 1296,760 1296,842 1181,882 1066,842 1066,760" stroke="#6ee7b7" strokeWidth="1" fill="none" opacity="0.35" />
    <polygon points="1296,666 1411,706 1411,788 1296,828 1181,788 1181,706" stroke="#a7f3d0" strokeWidth="1" fill="none" opacity="0.4" />
    <polygon points="950,738 1066,778 1066,860 950,900 835,860 835,778"    stroke="#d1fae5" strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="1181,810 1296,850 1296,927 1181,963 1066,927 1066,850" stroke="#6ee7b7" strokeWidth="1" fill="none" opacity="0.3" />

    {/* Center faint hexes */}
    <polygon points="662,342 749,374 749,436 662,468 576,436 576,374" stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="806,495 893,526 893,590 806,621 720,590 720,526"  stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.25" />
  </svg>
);

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
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">

      {/* ── Geometric background (Figma: polygon honeycomb) ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <HexPattern />
      </div>

      {/* ── Bottom-right teal gradient glow (Figma: radial teal wash) ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 55% at 90% 95%, rgba(16,185,129,0.14) 0%, transparent 65%)',
        }}
      />

      {/* ══ TOP NAV (Figma: logo left · Sign up right) ══ */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="border-2 border-secondary-900 bg-secondary-900 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-white">
            TT
          </div>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">
            Thuê Tôi
          </span>
        </Link>

        {/* Figma: "Sign up" outline pill → project: sharp outline button */}
        <Link
          to="/auth/register"
          className="border border-primary-600 px-6 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
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
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          © 2025 Thuê Tôi Platform
        </Caption>
      </footer>
    </div>
  );
};

export default LoginPage;
