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
import { useToast } from '../hooks/useToast';

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  profileDescription: '',
};

const roleOptions = [
  { value: 'customer', label: 'Khách hàng' },
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
      addToast('Đăng ký thành công. Hãy xác thực OTP để kích hoạt tài khoản.', 'success');
      navigate(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      setFieldErrors(error?.errors || {});
      setFormError(error?.message || 'Không thể tạo tài khoản lúc này.');
      addToast(error?.message || 'Đăng ký thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Đăng ký"
      title="Tạo tài khoản đúng vai trò để vào đúng workflow freelancer."
      description="Frontend này buộc role ngay từ lúc tạo tài khoản, gửi OTP email, và chỉ mở login sau khi verify thành công."
      tips={[
        {
          eyebrow: 'Kỷ luật vai trò',
          title: 'Khách hàng hoặc freelancer',
          description: 'Role admin không được đăng ký công khai từ frontend, đúng với business rule của backend.',
        },
        {
          eyebrow: 'Hồ sơ trước',
          title: 'Mô tả bản thân ngay khi onboarding',
          description: 'Profile description giúp freelancer điền năng lực, khách hàng điền mô tả doanh nghiệp để bên còn lại có thêm context.',
        },
      ]}
    >
      <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Đăng ký
            </span>
            <h2 className="text-2xl font-serif font-semibold text-secondary-900">
              Khởi tạo tài khoản
            </h2>
            <Caption className="text-sm text-slate-500">
              Sau bước này hệ thống sẽ gửi OTP xác thực email để bạn kích hoạt tài khoản.
            </Caption>
          </div>

          {formError && (
            <Callout type="danger" title="Không thể tiếp tục">
              {formError}
            </Callout>
          )}

          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
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
              label="Vai trò"
              value={form.role}
              onChange={handleChange('role')}
              error={fieldErrors.role}
              options={roleOptions}
            />
          </div>

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu tối thiểu 8 ký tự"
            value={form.password}
            onChange={handleChange('password')}
            error={fieldErrors.password}
            autoComplete="new-password"
          />

          <Textarea
            label="Mô tả ngắn"
            placeholder="Giới thiệu ngắn về nhu cầu dự án hoặc năng lực chuyên môn."
            value={form.profileDescription}
            onChange={handleChange('profileDescription')}
            error={fieldErrors.profileDescription}
          />

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký và gửi OTP'}
          </Button>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Caption>Đã có tài khoản?</Caption>
            <Link to="/auth/login" className="font-semibold text-primary-700 hover:text-primary-800">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
};

export default RegisterPage;
