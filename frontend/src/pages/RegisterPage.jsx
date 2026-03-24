import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState(initialFormState);
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
      navigate(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      setFieldErrors(error?.errors || {});
      setFormError(error?.message || t('toasts.auth.registerFormError'));
      addToast(error?.message || t('toasts.auth.registerError'), 'error');
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
            to="/auth/login"
            className="border border-white/60 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t('authPages.register.navAction')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-[520px] border border-slate-100 bg-white px-8 py-6 shadow-lg">
          <div className="mb-4 text-center">
            <h1 className="font-serif text-2xl font-bold leading-tight text-secondary-900">
              {t('authPages.register.title')}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {t('authPages.register.description')}
            </p>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {formError && (
              <Callout type="danger" title={t('authPages.register.errorTitle')}>
                {formError}
              </Callout>
            )}

            <Input
              label={t('authPages.register.fullNameLabel')}
              placeholder={t('authPages.register.fullNamePlaceholder')}
              value={form.fullName}
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
                onChange={handleChange('email')}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Select
                label={t('authPages.register.roleLabel')}
                value={form.role}
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
              onChange={handleChange('password')}
              error={fieldErrors.password}
              autoComplete="new-password"
            />

            <Textarea
              label={t('authPages.register.profileDescriptionLabel')}
              placeholder={t('authPages.register.profileDescriptionPlaceholder')}
              value={form.profileDescription}
              onChange={handleChange('profileDescription')}
              error={fieldErrors.profileDescription}
              rows={2}
              className="[&_textarea]:min-h-0 [&_textarea]:h-[68px]"
            />

            <Button type="submit" disabled={submitting} className="mt-1 w-full py-3.5 text-[15px]">
              {submitting ? t('authPages.register.submitting') : t('authPages.register.submit')}
            </Button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <Caption className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {t('authPages.divider')}
              </Caption>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-400">
              {t('authPages.register.footerPrompt')}{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                {t('authPages.register.footerAction')}
              </Link>
            </p>
          </form>
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

export default RegisterPage;
