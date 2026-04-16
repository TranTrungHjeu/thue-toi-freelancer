import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageSearch } from 'iconoir-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Caption } from '../components/common/Typography';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
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
      setFormError(error?.message || t('toasts.auth.loginFormError'));
      addToast(error?.message || t('toasts.auth.loginError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="border-2 border-white bg-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            TT
          </div>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t('app.brand')}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/auth/register"
            className="border border-white/60 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t('authPages.login.navAction')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[480px] border border-slate-100 bg-white px-10 py-8 shadow-lg">
          <div className="mb-5 text-center">
            <h1 className="font-serif text-[2rem] font-bold leading-tight text-secondary-900">
              {t('authPages.login.title')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {t('authPages.login.description')}
            </p>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {formError && (
              <Callout type="danger" title={t('authPages.login.errorTitle')}>
                {formError}
              </Callout>
            )}

            <Input
              label={t('authPages.login.emailLabel')}
              type="email"
              placeholder={t('authPages.login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label={t('authPages.login.passwordLabel')}
              type="password"
              placeholder={t('authPages.login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer border border-slate-300 accent-primary-600"
                />
                <span className="text-sm text-slate-500">{t('authPages.login.rememberMe')}</span>
              </label>
              <Link
                to={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                className="text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                {t('authPages.login.unverifiedLink')}
              </Link>
            </div>

            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? t('authPages.login.submitting') : t('authPages.login.submit')}
            </Button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {t('authPages.divider')}
              </Caption>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <PageSearch className="h-5 w-5 text-primary-600" />
              {t('authPages.login.workspaceShortcut')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {t('authPages.login.footerPrompt')}{' '}
            <Link
              to="/auth/register"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              {t('authPages.login.footerAction')}
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 pb-3 text-center">
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          {t('authPages.footerBrand')}
        </Caption>
      </footer>
    </div>
  );
};

export default LoginPage;
