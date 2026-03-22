import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';

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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await login(email, password);
      addToast('Dang nhap thanh cong.', 'success');
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error?.code === 'ERR_AUTH_07') {
        addToast('Tai khoan chua xac thuc email. Hay nhap OTP truoc.', 'warning');
        navigate(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      setFormError(error?.message || 'Khong the dang nhap luc nay.');
      addToast(error?.message || 'Dang nhap that bai', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Login"
      title="Dang nhap vao workspace va tiep tuc dung vai tro nghiep vu cua ban."
      description="Frontend tu dong giu access token, refresh lai phien khi can, va dong bo profile hien tai tu backend JWT."
      tips={[
        {
          eyebrow: 'Verified only',
          title: 'Chi cho phep user da verify',
          description: 'Neu backend tra ve ERR_AUTH_07, frontend se dua ban thang den man xac thuc OTP thay vi de ket o form dang nhap.',
        },
        {
          eyebrow: 'Auto refresh',
          title: 'Phien dang nhap duoc gia han an toan',
          description: '401 se duoc thu refresh mot lan bang HttpOnly cookie truoc khi frontend xoa auth state.',
        },
      ]}
    >
      <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Dang nhap
            </span>
            <h2 className="text-2xl font-serif font-semibold text-secondary-900">
              Tiep tuc vao workspace
            </h2>
            <Caption className="text-sm text-slate-500">
              Sau khi dang nhap thanh cong, frontend se lay profile hien tai va dieu huong vao khu vuc lam viec.
            </Caption>
          </div>

          {formError && (
            <Callout type="danger" title="Khong the dang nhap">
              {formError}
            </Callout>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="ban@thuetoi.vn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <Input
            label="Mat khau"
            type="password"
            placeholder="Nhap mat khau"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Dang dang nhap...' : 'Dang nhap'}
          </Button>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Link to="/auth/register" className="font-semibold text-slate-600 hover:text-secondary-900">
              Tao tai khoan moi
            </Link>
            <Link to={`/auth/verify-email?email=${encodeURIComponent(email)}`} className="font-semibold text-primary-700 hover:text-primary-800">
              Chua verify OTP?
            </Link>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
};

export default LoginPage;
