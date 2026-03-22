import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../components/common/Toast';

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
};

const roleOptions = [
  { value: 'customer', label: 'Khach hang' },
  { value: 'freelancer', label: 'Freelancer' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');

    try {
      await authApi.register(form);
      addToast('Dang ky thanh cong. Hay xac thuc OTP de kich hoat tai khoan.', 'success');
      navigate(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      setFieldErrors(error?.errors || {});
      setFormError(error?.message || 'Khong the tao tai khoan luc nay.');
      addToast(error?.message || 'Dang ky that bai', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Register"
      title="Tao tai khoan dung vai tro de vao dung workflow freelancer."
      description="Frontend nay buoc role ngay tu luc tao tai khoan, gui OTP email, va chi mo login sau khi verify thanh cong."
      tips={[
        {
          eyebrow: 'Role discipline',
          title: 'Customer hoac freelancer',
          description: 'Role admin khong duoc dang ky cong khai tu frontend, dung voi business rule cua backend.',
        },
        {
          eyebrow: 'Profile first',
          title: 'Mo ta ban than ngay khi onboarding',
          description: 'Profile description giup freelancer dien nang luc, customer dien mo ta doanh nghiep de ben con lai co them context.',
        },
      ]}
    >
      <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Dang ky
            </span>
            <h2 className="text-2xl font-serif font-semibold text-secondary-900">
              Khoi tao tai khoan
            </h2>
            <Caption className="text-sm text-slate-500">
              Sau buoc nay he thong se gui OTP xac thuc email de ban kich hoat tai khoan.
            </Caption>
          </div>

          {formError && (
            <Callout type="danger" title="Khong the tiep tuc">
              {formError}
            </Callout>
          )}

          <Input
            label="Ho va ten"
            placeholder="Nguyen Van A"
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={fieldErrors.fullName}
            autoComplete="name"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              placeholder="ban@thuetoi.vn"
              value={form.email}
              onChange={handleChange('email')}
              error={fieldErrors.email}
              autoComplete="email"
            />
            <Select
              label="Vai tro"
              value={form.role}
              onChange={handleChange('role')}
              error={fieldErrors.role}
              options={roleOptions}
            />
          </div>

          <Input
            label="Mat khau"
            type="password"
            placeholder="Nhap mat khau toi thieu 8 ky tu"
            value={form.password}
            onChange={handleChange('password')}
            error={fieldErrors.password}
            autoComplete="new-password"
          />

          <Textarea
            label="Mo ta ngan"
            placeholder="Gioi thieu ngan ve nhu cau du an hoac nang luc chuyen mon."
            value={form.profileDescription}
            onChange={handleChange('profileDescription')}
            error={fieldErrors.profileDescription}
          />

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Dang tao tai khoan...' : 'Dang ky va gui OTP'}
          </Button>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Caption>Da co tai khoan?</Caption>
            <Link to="/auth/login" className="font-semibold text-primary-700 hover:text-primary-800">
              Dang nhap ngay
            </Link>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
};

export default RegisterPage;
