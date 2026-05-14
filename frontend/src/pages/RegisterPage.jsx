"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import InlineErrorBlock from '../components/common/InlineErrorBlock';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { splitApiFormError } from '../utils/formError';

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
};

const RegisterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { t } = useI18n();
  const initialRole = searchParams.get('role') === 'freelancer' ? 'freelancer' : 'customer';
  const [form, setForm] = useState(() => ({ ...initialFormState, role: initialRole }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = [
    { value: 'customer', label: t('roles.customer') },
    { value: 'freelancer', label: t('roles.freelancer') },
  ];

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
      addToast(t('toasts.auth.registerSuccess'), 'success');
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitApiFormError(error, t('toasts.auth.registerFormError'));
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
        <Link href="/" className="flex items-center gap-2.5">
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
            href="/auth/login"
            className="border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white/90 transition-colors hover:border-white/35 hover:bg-white/10"
          >
            {t('authPages.register.navAction')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[540px] border border-white/15 bg-slate-950/72 px-7 py-7 shadow-[0_25px_80px_rgba(0,0,0,0.42)] backdrop-blur-md md:px-8">
          <div className="mb-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-200/85">
              {t('layout.workspace')}
            </p>
            <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-white">
              {t('authPages.register.title')}
            </h1>
            <p className="mt-1.5 text-sm text-slate-300">
              {t('authPages.register.description')}
            </p>
          </div>

          <form className="auth-form-theme flex flex-col gap-3" onSubmit={handleSubmit}>
            {formError && (
              <InlineErrorBlock title={t('authPages.register.errorTitle')}>
                {formError}
              </InlineErrorBlock>
            )}

            <Input
              label={t('authPages.register.fullNameLabel')}
              placeholder={t('authPages.register.fullNamePlaceholder')}
              value={form.fullName}
              disabled={submitting}
              onChange={handleChange('fullName')}
              error={fieldErrors.fullName}
              autoComplete="name"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('authPages.register.emailLabel')}
                type="email"
                placeholder={t('authPages.register.emailPlaceholder')}
                value={form.email}
                disabled={submitting}
                onChange={handleChange('email')}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Select
                label={t('authPages.register.roleLabel')}
                value={form.role}
                disabled={submitting}
                onChange={handleChange('role')}
                error={fieldErrors.role}
                options={roleOptions}
              />
            </div>

            <Input
              label={t('authPages.register.passwordLabel')}
              type="password"
              placeholder={t('authPages.register.passwordPlaceholder')}
              value={form.password}
              disabled={submitting}
              onChange={handleChange('password')}
              error={fieldErrors.password}
              autoComplete="new-password"
            />

            <Textarea
              label={t('authPages.register.profileDescriptionLabel')}
              placeholder={t('authPages.register.profileDescriptionPlaceholder')}
              value={form.profileDescription}
              disabled={submitting}
              onChange={handleChange('profileDescription')}
              error={fieldErrors.profileDescription}
              rows={2}
              className="[&_textarea]:min-h-0 [&_textarea]:h-[68px] [&_textarea]:resize-none [&_textarea]:overflow-hidden"
            />

            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? (
                <>
                  <Spinner size="sm" inline tone="current" className="text-white shrink-0" />
                  {t('authPages.register.submitting')}
                </>
              ) : t('authPages.register.submit')}
            </Button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/12" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400/85">
                {t('authPages.divider')}
              </Caption>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <p className="text-center text-sm text-slate-300/85">
              {t('authPages.register.footerPrompt')}{' '}
              <Link
                href="/auth/login"
                className={`font-semibold text-primary-200 transition-colors hover:text-primary-100 ${submitting ? 'pointer-events-none opacity-60' : ''}`}
              >
                {t('authPages.register.footerAction')}
              </Link>
            </p>
          </form>
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

export default RegisterPage;
