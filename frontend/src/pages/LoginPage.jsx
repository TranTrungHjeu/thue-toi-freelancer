import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import InlineErrorBlock from '../components/common/InlineErrorBlock';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import { splitApiFormError } from '../utils/formError';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { login } = useAuth();
  const { t } = useI18n();
  const nextPath = location.state?.from?.pathname || '/workspace';

  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');

    try {
      await login(email, password);
      addToast(t('toasts.auth.loginSuccess'), 'success');
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error?.code === 'ERR_AUTH_07') {
        addToast(t('toasts.auth.unverifiedRedirect'), 'warning');
        navigate(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitApiFormError(error, t('toasts.auth.loginFormError'));
      setFieldErrors(nextFieldErrors);
      setFormError(nextFormError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black/30 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.2),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.88),rgba(2,6,23,0.72))]" />
      <div className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.2]" />

      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="border border-primary-400/50 bg-primary-500/12 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary-200 backdrop-blur-sm">
            TT
          </div>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-primary-100">
            {t('app.brand')}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/auth/register"
            className="border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white/90 transition-colors hover:border-white/35 hover:bg-white/10"
          >
            {t('authPages.login.navAction')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[500px] border border-white/15 bg-slate-950/72 px-8 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.42)] backdrop-blur-md md:px-10">
          <div className="mb-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-200/85">
              {t('layout.workspace')}
            </p>
            <h1 className="mt-2 font-serif text-[2rem] font-bold leading-tight text-white">
              {t('authPages.login.title')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {t('authPages.login.description')}
            </p>
          </div>

          <form className="auth-form-theme flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {formError && (
              <InlineErrorBlock title={t('authPages.login.errorTitle')}>
                {formError}
              </InlineErrorBlock>
            )}

            <Input
              label={t('authPages.login.emailLabel')}
              type="email"
              placeholder={t('authPages.login.emailPlaceholder')}
              value={email}
              disabled={submitting}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoComplete="email"
            />

            <Input
              label={t('authPages.login.passwordLabel')}
              type="password"
              placeholder={t('authPages.login.passwordPlaceholder')}
              value={password}
              disabled={submitting}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={submitting}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer border border-white/30 bg-transparent accent-primary-600"
                />
                <span className="text-sm text-slate-300">{t('authPages.login.rememberMe')}</span>
              </label>
              <Link
                to={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                className={`text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100 ${submitting ? 'pointer-events-none opacity-60' : ''}`}
              >
                {t('authPages.login.unverifiedLink')}
              </Link>
            </div>

            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? (
                <>
                  <Spinner size="sm" inline tone="current" className="text-white shrink-0" />
                  {t('authPages.login.submitting')}
                </>
              ) : t('authPages.login.submit')}
            </Button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/12" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400/85">
                {t('authPages.divider')}
              </Caption>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <Link
              to="/auth/register"
              className={`flex w-full items-center justify-center gap-2 border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-medium text-slate-100 transition-colors hover:border-white/35 hover:bg-white/10 ${submitting ? 'pointer-events-none opacity-60' : ''}`}
            >
              {t('authPages.login.navAction')}
            </Link>
          </form>

          <p className="mt-5 text-center text-sm text-slate-300/85">
            {t('authPages.login.footerPrompt')}{' '}
            <Link
              to="/auth/register"
              className={`font-semibold text-primary-200 transition-colors hover:text-primary-100 ${submitting ? 'pointer-events-none opacity-60' : ''}`}
            >
              {t('authPages.login.footerAction')}
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 pb-3 text-center">
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-white/50">
          {t('authPages.footerBrand')}
        </Caption>
      </footer>
    </div>
  );
};

export default LoginPage;
