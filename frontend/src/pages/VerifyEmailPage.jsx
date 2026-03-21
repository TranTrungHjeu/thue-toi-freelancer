import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../components/common/Toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
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
      addToast('Xac thuc email thanh cong. Ban co the dang nhap ngay.', 'success');
      navigate(`/auth/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(error?.message || 'Khong the xac thuc OTP.');
      addToast(error?.message || 'Xac thuc that bai', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setFormError('');

    try {
      await authApi.resendVerificationOtp(email);
      addToast('Da gui lai OTP xac thuc email.', 'success');
    } catch (error) {
      setFormError(error?.message || 'Khong the gui lai OTP.');
      addToast(error?.message || 'Gui lai OTP that bai', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verify OTP"
      title="Xac thuc email de mo khoa dang nhap va workspace."
      description="Backend chi cho phep login khi tai khoan da verified. Buoc nay dam bao frontend theo dung workflow nghiep vu vua duoc chot."
      tips={[
        {
          eyebrow: 'Cooldown',
          title: 'Resend co gioi han',
          description: 'Neu backend tra ve ERR_AUTH_10, frontend se giu thong bao va de ban cho het cooldown truoc khi gui lai.',
        },
        {
          eyebrow: 'Mailbox flow',
          title: 'OTP di qua email that',
          description: 'Frontend khong doc OTP tu endpoint debug. Nguoi dung xac thuc bang ma nhan trong hop thu da dang ky.',
        },
      ]}
    >
      <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Verify email
            </span>
            <h2 className="text-2xl font-serif font-semibold text-secondary-900">
              Kich hoat tai khoan
            </h2>
            <Caption className="text-sm text-slate-500">
              OTP chi co hieu luc trong thoi gian ngan, vi vay ban nen xac thuc ngay sau khi dang ky.
            </Caption>
          </div>

          {formError && (
            <Callout type="danger" title="Khong the xac thuc">
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
            label="Ma OTP"
            placeholder="Nhap 6 chu so"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            inputMode="numeric"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Dang xac thuc...' : 'Xac thuc tai khoan'}
            </Button>
            <Button type="button" variant="outline" onClick={handleResend} disabled={resending}>
              {resending ? 'Dang gui lai...' : 'Gui lai OTP'}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Link to="/auth/register" className="font-semibold text-slate-600 hover:text-secondary-900">
              Quay lai dang ky
            </Link>
            <Link to={`/auth/login?email=${encodeURIComponent(email)}`} className="font-semibold text-primary-700 hover:text-primary-800">
              Da verified? Dang nhap
            </Link>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
};

export default VerifyEmailPage;
