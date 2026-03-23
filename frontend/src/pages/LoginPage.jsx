import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, PageSearch, ShieldCheck, ViewGrid } from 'iconoir-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

const FEATURE_CARDS = [
  {
    icon: ViewGrid,
    title: 'Bảng dự án',
    desc: 'Đăng project, nhận báo giá và chọn freelancer phù hợp chỉ trong một workspace.',
  },
  {
    icon: ShieldCheck,
    title: 'Xác thực an toàn',
    desc: 'JWT + OTP đảm bảo tài khoản của bạn chỉ được mở khi đã xác thực email.',
  },
  {
    icon: Lock,
    title: 'Phiên tự gia hạn',
    desc: 'Access token hết hạn sẽ được refresh tự động qua HttpOnly cookie.',
  },
];

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
    <div className="flex min-h-screen">
      <div className="flex w-full">

        {/* ── LEFT: Form panel — 50% ── */}
        <div className="flex w-1/2 min-h-screen flex-col bg-slate-50 px-10 py-10 md:px-16 lg:px-20">

          {/* Logo — Figma: top-left brand mark */}
          <Link to="/" className="flex items-center gap-3">
            <div className="border-2 border-secondary-900 bg-secondary-900 px-3 py-1 text-sm font-black uppercase tracking-[0.24em] text-white">
              TT
            </div>
            <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">Thuê Tôi</span>
          </Link>

          {/* Form area — centered vertically & horizontally */}
          <div className="flex flex-1 flex-col items-center justify-center py-10">
            <div className="w-full max-w-[440px]">

              {/* Heading — Figma: large "Sign in" + subtitle */}
              <h1 className="text-5xl font-bold text-secondary-900 leading-none">
                Đăng nhập
              </h1>
              <p className="mt-4 text-base text-slate-500">
                Chưa có tài khoản?{' '}
                <Link
                  to="/auth/register"
                  className="font-semibold text-primary-700 underline decoration-solid transition-colors hover:text-primary-800"
                >
                  Tạo ngay
                </Link>
              </p>

              {/* Form */}
              <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
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
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />

                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />

                {/* Remember me + Forgot — Figma: checkbox left, link right */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 cursor-pointer border border-slate-300 bg-slate-50 accent-primary-600"
                    />
                    <span className="text-[15px] text-slate-500">Ghi nhớ đăng nhập</span>
                  </label>
                  <Link
                    to={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                    className="text-[15px] font-semibold text-primary-700 underline decoration-solid transition-colors hover:text-primary-800"
                  >
                    Chưa verify OTP?
                  </Link>
                </div>

                {/* Submit — Figma: full-width dark button */}
                <Button type="submit" disabled={submitting} className="mt-1 w-full py-4 text-base">
                  {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>

                {/* OR divider — Figma: two lines with "OR" in between */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Hoặc
                  </Caption>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Secondary action — Figma: social buttons replaced by workspace link */}
                <button
                  type="button"
                  onClick={() => navigate('/workspace')}
                  className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-6 py-4 text-[15px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <PageSearch className="h-5 w-5 text-primary-700" />
                  Tiếp tục vào Workspace
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Dark panel — 50% ── */}
        <div className="relative hidden w-1/2 min-h-screen flex-col bg-secondary-900 p-12 lg:flex">

          {/* Decorative circle blur — Figma: ellipse glow effect */}
          <div
            className="pointer-events-none absolute right-[-120px] top-[-120px] h-[500px] w-[500px] opacity-20"
            style={{
              background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
            }}
          />

          {/* Support label — Figma: top right "Support" link */}
          <div className="flex justify-end">
            <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/40">
              thuetoi.vn
            </span>
          </div>

          {/* Main content — centered */}
          <div className="flex flex-1 flex-col justify-center gap-6">

            {/* Headline — Figma: large white heading */}
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-300">
                Nền tảng Freelancer
              </Caption>
              <h2 className="mt-3 font-serif text-4xl font-bold leading-tight text-white">
                Kết nối tài năng,<br />tạo ra giá trị.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                Workflow chuyên nghiệp từ đăng dự án, báo giá, hợp đồng
                đến milestone — tất cả trong một nền tảng.
              </p>
            </div>

            {/* Feature cards — Figma: LargeCtaContent + SmallEarnings cards */}
            <div className="flex flex-col gap-3">
              {FEATURE_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-4 border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div className="mt-0.5 border border-primary-400/40 bg-primary-900/30 p-2 shrink-0">
                    <card.icon className="h-4 w-4 text-primary-300" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold uppercase tracking-widest text-white">
                      {card.title}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom caption */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-white/20">
              © 2025 Thuê Tôi Platform
            </Caption>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 ${i === 1 ? 'bg-primary-400' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
