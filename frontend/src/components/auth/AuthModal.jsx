import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import InlineErrorBlock from '../common/InlineErrorBlock';
import OtpInput from '../common/OtpInput';
import authApi from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { splitApiFormError } from '../../utils/formError';

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const tabModes = ['login', 'register'];
const layoutEase = [0.22, 1, 0.36, 1];
const getModeIndex = (value) => {
  if (value === 'register') {
    return 1;
  }

  if (value === 'verify') {
    return 2;
  }

  return 0;
};
const panelVariants = {
  initial: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? 18 : -18,
    y: 8,
    scale: 0.985,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
  exit: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? -18 : 18,
    y: -8,
    scale: 0.985,
  }),
};
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionForm = motion.form;

const formatCountdown = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const getTimerLabel = (seconds, locale) => {
  const countdown = formatCountdown(seconds);
  return locale === 'vi' ? `Gửi lại sau ${countdown}` : `Resend in ${countdown}`;
};

const getOtpExpiryLabel = (seconds, locale) => {
  const countdown = formatCountdown(seconds);
  return locale === 'vi' ? `OTP còn hiệu lực ${countdown}` : `OTP remains valid for ${countdown}`;
};

const getAutoVerifyHint = (locale) => (
  locale === 'vi'
    ? 'Nhập đủ 6 chữ số, hệ thống sẽ tự xác thực và đăng nhập nếu thông tin khớp.'
    : 'Enter all 6 digits and the system will verify, then sign you in automatically when possible.'
);

const createInitialRegisterForm = () => ({
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
});

const normalizeMode = (value) => (
  value === 'register' || value === 'verify' ? value : 'login'
);

const AuthModal = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialEmail = '',
  redirectTo = '/workspace',
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const { t, locale } = useI18n();
  const lastAutoSubmittedOtpRef = useRef('');
  const wasOpenRef = useRef(false);
  const modalShellRef = useRef(null);

  const [mode, setMode] = useState(() => normalizeMode(initialMode));
  const [panelDirection, setPanelDirection] = useState(1);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginFieldErrors, setLoginFieldErrors] = useState({});
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [registerForm, setRegisterForm] = useState(createInitialRegisterForm);
  const [registerFieldErrors, setRegisterFieldErrors] = useState({});
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const [verifyForm, setVerifyForm] = useState({ email: '', otp: '' });
  const [verifyFieldErrors, setVerifyFieldErrors] = useState({});
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  const [pendingCredential, setPendingCredential] = useState({ email: '', password: '' });

  const roleOptions = useMemo(
    () => [
      { value: 'customer', label: t('roles.customer') },
      { value: 'freelancer', label: t('roles.freelancer') },
    ],
    [t],
  );

  const activeTabMode = mode === 'register' ? 'register' : 'login';
  const isVerifyMode = mode === 'verify';
  const isPrimaryAuthSubmitting = loginSubmitting || registerSubmitting;

  useLayoutEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const nextMode = normalizeMode(initialMode);
    const resolvedEmail = `${initialEmail || ''}`.trim();

    setMode(nextMode);
    setPanelDirection(1);
    setLoginSubmitting(false);
    setRegisterSubmitting(false);
    setVerifySubmitting(false);
    setResendSubmitting(false);
    setLoginError('');
    setLoginFieldErrors({});
    setRegisterError('');
    setRegisterFieldErrors({});
    setVerifyError('');
    setVerifyFieldErrors({});
    setResendCooldown(0);
    setOtpExpiresIn(0);
    setPendingCredential({ email: '', password: '' });
    setLoginForm({ email: nextMode === 'login' ? resolvedEmail : '', password: '' });
    setRegisterForm({
      ...createInitialRegisterForm(),
      email: nextMode === 'register' ? resolvedEmail : '',
    });
    setVerifyForm({ email: resolvedEmail, otp: '' });
    lastAutoSubmittedOtpRef.current = '';
    wasOpenRef.current = true;
  }, [initialEmail, initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalShellRef.current) {
      return;
    }

    // GSAP animation for modal entrance
    gsap.fromTo(
      modalShellRef.current,
      {
        opacity: 0,
        scale: 0.92,
        y: 40,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: 'cubic.out',
      },
    );
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || (resendCooldown <= 0 && otpExpiresIn <= 0)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
      setOtpExpiresIn((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, otpExpiresIn, resendCooldown]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const switchMode = useCallback((nextMode, options = {}) => {
    const normalizedMode = normalizeMode(nextMode);
    const resolvedEmail = `${options.email ?? verifyForm.email ?? registerForm.email ?? loginForm.email ?? pendingCredential.email ?? ''}`.trim();

    setPanelDirection(getModeIndex(normalizedMode) >= getModeIndex(mode) ? 1 : -1);
    setMode(normalizedMode);
    setLoginError('');
    setLoginFieldErrors({});
    setRegisterError('');
    setRegisterFieldErrors({});
    setVerifyError('');
    setVerifyFieldErrors({});
    lastAutoSubmittedOtpRef.current = '';

    if (normalizedMode === 'login') {
      setLoginForm((prev) => ({ ...prev, email: resolvedEmail || prev.email }));
    }

    if (normalizedMode === 'register') {
      setRegisterForm((prev) => ({ ...prev, email: resolvedEmail || prev.email }));
    }

    if (normalizedMode === 'verify') {
      setVerifyForm((prev) => ({ ...prev, email: resolvedEmail || prev.email, otp: '' }));
    }
  }, [loginForm.email, mode, pendingCredential.email, registerForm.email, verifyForm.email]);

  const handleClose = useCallback(() => {
    if (isPrimaryAuthSubmitting) {
      return;
    }
    onClose();
  }, [isPrimaryAuthSubmitting, onClose]);

  const syncOtpStatus = useCallback(async (email) => {
    if (!email) {
      setResendCooldown(0);
      setOtpExpiresIn(0);
      return;
    }

    try {
      const response = await authApi.getVerificationOtpStatus(email);
      setResendCooldown(response.data?.resendCooldownSeconds || 0);
      setOtpExpiresIn(response.data?.expiresInSeconds || 0);
    } catch {
      setResendCooldown(0);
      setOtpExpiresIn(0);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || mode !== 'verify' || !verifyForm.email) {
      return;
    }

    void syncOtpStatus(verifyForm.email);
  }, [isOpen, mode, syncOtpStatus, verifyForm.email]);

  const completeAuthenticatedRedirect = useCallback(async (email, password) => {
    await login(email, password);
    addToast(t('toasts.auth.loginSuccess'), 'success');
    handleClose();
    navigate(redirectTo || '/workspace', { replace: true });
  }, [addToast, handleClose, login, navigate, redirectTo, t]);

  const submitVerification = useCallback(async () => {
    setVerifySubmitting(true);
    setVerifyFieldErrors({});
    setVerifyError('');

    try {
      await authApi.verifyEmailOtp({ email: verifyForm.email, otp: verifyForm.otp });
      addToast(t('toasts.auth.verifySuccess'), 'success');

      const canAutoLogin =
        pendingCredential.email
        && pendingCredential.password
        && pendingCredential.email.toLowerCase() === verifyForm.email.toLowerCase();

      if (canAutoLogin) {
        await completeAuthenticatedRedirect(pendingCredential.email, pendingCredential.password);
        return;
      }

      setLoginForm((previous) => ({ ...previous, email: verifyForm.email, password: '' }));
      switchMode('login', { email: verifyForm.email });
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.auth.verifyFormError'));
      setVerifyFieldErrors(fieldErrors);
      setVerifyError(formError);
    } finally {
      setVerifySubmitting(false);
    }
  }, [addToast, completeAuthenticatedRedirect, pendingCredential.email, pendingCredential.password, switchMode, t, verifyForm.email, verifyForm.otp]);

  useEffect(() => {
    if (!isOpen || mode !== 'verify' || verifySubmitting) {
      return;
    }

    const normalizedOtp = `${verifyForm.otp || ''}`.trim();
    const autoSubmitKey = `${verifyForm.email}:${normalizedOtp}`;
    if (normalizedOtp.length !== OTP_LENGTH || lastAutoSubmittedOtpRef.current === autoSubmitKey) {
      return;
    }

    lastAutoSubmittedOtpRef.current = autoSubmitKey;
    void submitVerification();
  }, [isOpen, mode, submitVerification, verifyForm.email, verifyForm.otp, verifySubmitting]);

  useEffect(() => {
    if ((verifyForm.otp || '').trim().length < OTP_LENGTH) {
      lastAutoSubmittedOtpRef.current = '';
    }
  }, [verifyForm.email, verifyForm.otp]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginFieldErrors({});
    setLoginError('');

    try {
      await completeAuthenticatedRedirect(loginForm.email, loginForm.password);
    } catch (error) {
      if (error?.code === 'ERR_AUTH_07') {
        setPendingCredential({ email: loginForm.email, password: loginForm.password });
        setVerifyForm({ email: loginForm.email, otp: '' });
        setVerifyFieldErrors({});
        setVerifyError('');
        switchMode('verify', { email: loginForm.email });
        void syncOtpStatus(loginForm.email);
        addToast(t('toasts.auth.unverifiedRedirect'), 'warning');
        return;
      }
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.auth.loginFormError'));
      setLoginFieldErrors(fieldErrors);
      setLoginError(formError);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterFieldErrors({});
    setRegisterError('');

    try {
      await authApi.register(registerForm);
      setPendingCredential({ email: registerForm.email, password: registerForm.password });
      setVerifyForm({ email: registerForm.email, otp: '' });
      setOtpExpiresIn(0);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      switchMode('verify', { email: registerForm.email });
      void syncOtpStatus(registerForm.email);
      addToast(t('toasts.auth.registerSuccess'), 'success');
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.auth.registerFormError'));
      setRegisterFieldErrors(fieldErrors);
      setRegisterError(formError);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    await submitVerification();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendSubmitting || !verifyForm.email) {
      return;
    }

    setResendSubmitting(true);
    setVerifyFieldErrors({});
    setVerifyError('');

    try {
      await authApi.resendVerificationOtp(verifyForm.email);
      await syncOtpStatus(verifyForm.email);
      addToast(t('toasts.auth.resendSuccess'), 'success');
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.auth.resendFormError'));
      setVerifyFieldErrors(fieldErrors);
      setVerifyError(formError);

      if (error?.code === 'ERR_AUTH_10') {
        await syncOtpStatus(verifyForm.email);
      }
    } finally {
      setResendSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence initial={false}>
      {isOpen && (
        <MotionDiv
          key="auth-modal-root"
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 sm:px-6"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: layoutEase }}
        >
          <MotionButton
            type="button"
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-[2px]"
            aria-label="Close modal"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: layoutEase }}
          />

          <MotionDiv
            ref={modalShellRef}
            layout
            className="auth-form-theme auth-modal-shell"
          >
            <div className="auth-modal-accent" />

            <div className="auth-modal-header">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="auth-modal-title">
                      {mode === 'login' ? t('authPages.login.title') : mode === 'register' ? t('authPages.register.title') : t('authPages.verify.title')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPrimaryAuthSubmitting}
                    className="auth-modal-close disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!isVerifyMode ? (
                  <div className="auth-modal-segmented">
                    <div className="auth-modal-tabs">
                      {tabModes.map((tabMode) => {
                        const isActive = activeTabMode === tabMode;
                        return (
                          <button
                            key={tabMode}
                            type="button"
                            disabled={isPrimaryAuthSubmitting}
                            onClick={() => switchMode(tabMode, { email: tabMode === 'login' ? (loginForm.email || verifyForm.email || registerForm.email) : (registerForm.email || loginForm.email || verifyForm.email) })}
                            className="auth-modal-tab disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isActive && (
                              <motion.div
                                layoutId="auth-modal-tab-indicator"
                                className="auth-modal-tab-indicator"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              />
                            )}
                            <span className={`auth-modal-tab-label ${isActive ? 'auth-modal-tab-label-active' : ''}`}>
                              {tabMode === 'login' ? t('authPages.login.submit') : t('authPages.login.navAction')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <MotionDiv
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="auth-modal-status"
                  >
                    <div>
                      <div className="auth-modal-status-kicker">
                        {t('authPages.verify.title')}
                      </div>
                      <div className="auth-modal-status-email">
                        {verifyForm.email || t('authPages.verify.emailPlaceholder')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="auth-modal-primary-link text-xs uppercase tracking-[0.16em]"
                      onClick={() => switchMode('login', { email: verifyForm.email || loginForm.email })}
                    >
                      {t('authPages.verify.loginAction')}
                    </button>
                  </MotionDiv>
                )}
              </div>
            </div>

            <MotionDiv
              className="auth-modal-content"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' && (
                  <MotionDiv
                    key="auth-login"
                    variants={panelVariants}
                    custom={panelDirection}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <form className="auth-modal-form" onSubmit={handleLoginSubmit}>
                  {loginError && (
                    <InlineErrorBlock title={t('authPages.login.errorTitle')}>
                      {loginError}
                    </InlineErrorBlock>
                  )}

                  <Input
                    label={t('authPages.login.emailLabel')}
                    type="email"
                    placeholder={t('authPages.login.emailPlaceholder')}
                    value={loginForm.email}
                    disabled={loginSubmitting}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                    error={loginFieldErrors.email}
                    autoComplete="email"
                  />

                  <Input
                    label={t('authPages.login.passwordLabel')}
                    type="password"
                    placeholder={t('authPages.login.passwordPlaceholder')}
                    value={loginForm.password}
                    disabled={loginSubmitting}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    error={loginFieldErrors.password}
                    autoComplete="current-password"
                  />

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      className="auth-modal-primary-link"
                      disabled={loginSubmitting}
                      onClick={() => {
                        setVerifyForm((prev) => ({ ...prev, email: loginForm.email }));
                        switchMode('verify', { email: loginForm.email });
                      }}
                    >
                      {t('authPages.login.unverifiedLink')}
                    </button>
                    <button
                      type="button"
                      className="auth-modal-secondary-link"
                      disabled={loginSubmitting}
                      onClick={() => switchMode('register', { email: loginForm.email })}
                    >
                      {t('authPages.login.navAction')}
                    </button>
                  </div>

                  <Button type="submit" disabled={loginSubmitting} className="mt-1 w-full py-3.5 text-[15px]">
                    {loginSubmitting ? (
                      <>
                        <Spinner size="sm" inline tone="current" className="text-white shrink-0" />
                        {t('authPages.login.submitting')}
                      </>
                    ) : t('authPages.login.submit')}
                  </Button>
                    </form>
                  </MotionDiv>
                )}

                {mode === 'register' && (
                  <MotionDiv
                    key="auth-register"
                    variants={panelVariants}
                    custom={panelDirection}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <form className="auth-modal-form" onSubmit={handleRegisterSubmit}>
                  {registerError && (
                    <InlineErrorBlock title={t('authPages.register.errorTitle')}>
                      {registerError}
                    </InlineErrorBlock>
                  )}

                  <Input
                    label={t('authPages.register.fullNameLabel')}
                    placeholder={t('authPages.register.fullNamePlaceholder')}
                    value={registerForm.fullName}
                    disabled={registerSubmitting}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    error={registerFieldErrors.fullName}
                    autoComplete="name"
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      label={t('authPages.register.emailLabel')}
                      type="email"
                      placeholder={t('authPages.register.emailPlaceholder')}
                      value={registerForm.email}
                      disabled={registerSubmitting}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                      error={registerFieldErrors.email}
                      autoComplete="email"
                    />
                    <Select
                      label={t('authPages.register.roleLabel')}
                      value={registerForm.role}
                      disabled={registerSubmitting}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value }))}
                      error={registerFieldErrors.role}
                      options={roleOptions}
                    />
                  </div>

                  <Input
                    label={t('authPages.register.passwordLabel')}
                    type="password"
                    placeholder={t('authPages.register.passwordPlaceholder')}
                    value={registerForm.password}
                    disabled={registerSubmitting}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                    error={registerFieldErrors.password}
                    autoComplete="new-password"
                  />

                  <Textarea
                    label={t('authPages.register.profileDescriptionLabel')}
                    placeholder={t('authPages.register.profileDescriptionPlaceholder')}
                    value={registerForm.profileDescription}
                    disabled={registerSubmitting}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, profileDescription: event.target.value }))}
                    error={registerFieldErrors.profileDescription}
                    rows={2}
                    className="[&_textarea]:min-h-0 [&_textarea]:h-[88px] [&_textarea]:resize-none"
                  />

                  <Button type="submit" disabled={registerSubmitting} className="mt-1 w-full py-3.5 text-[15px]">
                    {registerSubmitting ? (
                      <>
                        <Spinner size="sm" inline tone="current" className="text-white shrink-0" />
                        {t('authPages.register.submitting')}
                      </>
                    ) : t('authPages.register.submit')}
                  </Button>
                    </form>
                  </MotionDiv>
                )}

                {mode === 'verify' && (
                  <MotionDiv
                    key="auth-verify"
                    variants={panelVariants}
                    custom={panelDirection}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <form className="auth-modal-form" onSubmit={handleVerifySubmit}>
                  {verifyError && (
                    <InlineErrorBlock title={t('authPages.verify.errorTitle')}>
                      {verifyError}
                    </InlineErrorBlock>
                  )}

                  <Input
                    label={t('authPages.verify.emailLabel')}
                    type="email"
                    placeholder={t('authPages.verify.emailPlaceholder')}
                    value={verifyForm.email}
                    error={verifyFieldErrors.email}
                    onChange={(event) => {
                      lastAutoSubmittedOtpRef.current = '';
                      setVerifyForm((prev) => ({ ...prev, email: event.target.value }));
                    }}
                    autoComplete="email"
                  />

                  <OtpInput
                    value={verifyForm.otp}
                    error={verifyFieldErrors.otp}
                    onChange={(otp) => {
                      if (`${otp || ''}`.trim().length < OTP_LENGTH) {
                        lastAutoSubmittedOtpRef.current = '';
                      }
                      setVerifyForm((prev) => ({ ...prev, otp }));
                    }}
                  />

                  <div className="auth-modal-hint">
                    <div>{getAutoVerifyHint(locale)}</div>
                    {otpExpiresIn > 0 && (
                      <div className="auth-modal-hint-accent">
                        {getOtpExpiryLabel(otpExpiresIn, locale)}
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={verifySubmitting} className="mt-1 w-full py-3.5 text-[15px]">
                    {verifySubmitting ? t('authPages.verify.submitting') : t('authPages.verify.submit')}
                  </Button>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      className="auth-modal-primary-link disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleResendOtp}
                      disabled={resendSubmitting || resendCooldown > 0 || !verifyForm.email}
                    >
                      {resendSubmitting
                        ? t('authPages.verify.resending')
                        : resendCooldown > 0
                          ? getTimerLabel(resendCooldown, locale)
                          : t('authPages.verify.resend')}
                    </button>
                    <button
                      type="button"
                      className="auth-modal-secondary-link"
                      onClick={() => switchMode('login', { email: verifyForm.email })}
                    >
                      {t('authPages.verify.loginAction')}
                    </button>
                  </div>
                    </form>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </MotionDiv>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default AuthModal;
