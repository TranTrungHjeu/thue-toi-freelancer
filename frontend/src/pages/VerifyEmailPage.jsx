import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Callout from '../components/common/Callout';
import { Caption } from '../components/common/Typography';
import authApi from '../api/authApi';
import { useToast } from '../hooks/useToast';

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
      addToast('Xác thực email thành công. Bạn có thể đăng nhập ngay.', 'success');
      navigate(`/auth/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(error?.message || 'Không thể xác thực OTP.');
      addToast(error?.message || 'Xác thực thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setFormError('');

    try {
      await authApi.resendVerificationOtp(email);
      addToast('Đã gửi lại OTP xác thực email.', 'success');
    } catch (error) {
      setFormError(error?.message || 'Không thể gửi lại OTP.');
      addToast(error?.message || 'Gửi lại OTP thất bại', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Xác thực OTP"
      title="Xác thực email để mở khoá đăng nhập và workspace."
      description="Backend chỉ cho phép login khi tài khoản đã verified. Bước này đảm bảo frontend theo đúng workflow nghiệp vụ vừa được chốt."
      tips={[
        {
          eyebrow: 'Cooldown',
          title: 'Resend có giới hạn',
          description: 'Nếu backend trả về ERR_AUTH_10, frontend sẽ giữ thông báo và để bạn chờ hết cooldown trước khi gửi lại.',
        },
        {
          eyebrow: 'Luồng hộp thư',
          title: 'OTP đi qua email thật',
          description: 'Frontend không đọc OTP từ endpoint debug. Người dùng xác thực bằng mã nhận trong hộp thư đã đăng ký.',
        },
      ]}
    >
      <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Xác thực email
            </span>
            <h2 className="text-2xl font-serif font-semibold text-secondary-900">
              Kích hoạt tài khoản
            </h2>
            <Caption className="text-sm text-slate-500">
              OTP chỉ có hiệu lực trong thời gian ngắn, vì vậy bạn nên xác thực ngay sau khi đăng ký.
            </Caption>
          </div>

          {formError && (
            <Callout type="danger" title="Không thể xác thực">
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
            label="Mã OTP"
            placeholder="Nhập 6 chữ số"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            inputMode="numeric"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
            </Button>
            <Button type="button" variant="outline" onClick={handleResend} disabled={resending}>
              {resending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Link to="/auth/register" className="font-semibold text-slate-600 hover:text-secondary-900">
              Quay lại đăng ký
            </Link>
            <Link to={`/auth/login?email=${encodeURIComponent(email)}`} className="font-semibold text-primary-700 hover:text-primary-800">
              Đã verified? Đăng nhập
            </Link>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
};

export default VerifyEmailPage;
