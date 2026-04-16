import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailOut } from 'iconoir-react';
import Input from '../components/common/Input';
import OtpInput from '../components/common/OtpInput';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useI18n();
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
      addToast(t('toasts.auth.verifySuccess'), 'success');
      navigate(`/auth/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(error?.message || t('toasts.auth.verifyFormError'));
      addToast(error?.message || t('toasts.auth.verifyError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setFormError('');

    try {
      await authApi.resendVerificationOtp(email);
      addToast(t('toasts.auth.resendSuccess'), 'success');
    } catch (error) {
      setFormError(error?.message || t('toasts.auth.resendFormError'));
      addToast(error?.message || t('toasts.auth.resendError'), 'error');
    } finally {
      setResending(false);
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
            to="/auth/login"
            className="border border-white/60 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t('authPages.verify.navAction')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[480px] border border-slate-100 bg-white px-10 py-8 shadow-lg">

          <div className="mb-5 text-center">
            <h1 className="font-serif text-[2rem] font-bold leading-tight text-secondary-900">
              {t('authPages.verify.title')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {t('authPages.verify.description')}
            </p>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleVerify}>
            {formError && (
              <Callout type="danger" title={t('authPages.verify.errorTitle')}>
                {formError}
              </Callout>
            )}

            <Input
              label={t('authPages.verify.emailLabel')}
              type="email"
              placeholder={t('authPages.verify.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <OtpInput value={otp} onChange={setOtp} />

            <Button type="submit" disabled={loading} className="mt-1 w-full py-3.5 text-[15px]">
              {loading ? t('authPages.verify.submitting') : t('authPages.verify.submit')}
            </Button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {t('authPages.verify.resendLabel')}
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
              {resending ? t('authPages.verify.resending') : t('authPages.verify.resend')}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link
              to="/auth/register"
              className="text-slate-400 hover:text-slate-600"
            >
              {t('authPages.verify.backToRegister')}
            </Link>
            <Link
              to={`/auth/login?email=${encodeURIComponent(email)}`}
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              {t('authPages.verify.loginAction')}
            </Link>
          </div>
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

export default VerifyEmailPage;
