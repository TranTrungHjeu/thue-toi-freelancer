import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Page, ProfileCircle, ShieldCheck, UserBag } from 'iconoir-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Callout from '../components/common/Callout';
import Badge from '../components/common/Badge';
import { H1, H2, Text, Caption } from '../components/common/Typography';

const LandingPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Đăng ký đúng vai trò',
      description: 'Khách hàng đăng dự án, freelancer gửi báo giá. Backend đã khoá đăng ký công khai với role admin.',
      icon: UserBag,
    },
    {
      title: 'Xác thực OTP email',
      description: 'Tài khoản chỉ được phép đăng nhập sau khi verify email thành công theo đúng workflow JWT + OTP.',
      icon: ShieldCheck,
    },
    {
      title: 'Đăng nhập + refresh an toàn',
      description: 'Access token đi qua bearer header, refresh token được giữ bằng HttpOnly cookie.',
      icon: Lock,
    },
  ];

  const roleCards = [
    {
      eyebrow: 'Khách hàng',
      title: 'Đăng dự án và xử lý báo giá',
      bullets: ['Tạo project', 'Xem báo giá từ freelancer', 'Theo dõi hợp đồng và milestone'],
    },
    {
      eyebrow: 'Freelancer',
      title: 'Tiếp cận dự án phù hợp',
      bullets: ['Duyệt project đang mở', 'Gửi bid có giá và thời gian', 'Làm việc trong workspace đã được giao'],
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_45%,#ecfccb_100%)]">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="border-2 border-secondary-900 bg-secondary-900 px-3 py-1 text-sm font-black uppercase tracking-[0.24em] text-white">
              TT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">Thuê Tôi</span>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Nền tảng Freelancer
              </Caption>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/gallery')}>
              Thư viện
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth/login')}>
              Đăng nhập
            </Button>
            <Button onClick={() => navigate('/auth/register')}>
              Bắt đầu
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge color="success" className="w-fit px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              Frontend đồng bộ với backend JWT + OTP
            </Badge>
            <H1 className="max-w-3xl text-5xl leading-tight">
              Workspace sạch, rõ luồng nghiệp vụ, và bám sát backend hiện tại.
            </H1>
            <Text className="max-w-2xl text-lg text-slate-600">
              Frontend này đã được chốt lại theo workflow đăng ký, verify OTP, đăng nhập, quản lý dự án,
              báo giá, hợp đồng và thông báo cho cả khách hàng lẫn freelancer.
            </Text>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/auth/register')}>
                Tạo tài khoản mới
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth/login')}>
                Đăng nhập workspace
              </Button>
              <Button variant="ghost" onClick={() => navigate('/api-lab')}>
                API Lab
              </Button>
            </div>
          </div>

          <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
              Quy trình
            </Caption>
            <div className="mt-4 flex flex-col gap-4">
              {steps.map((step, index) => (
                <div key={step.title} className="border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="border border-primary-400 p-2">
                      <step.icon className="h-5 w-5 text-primary-300" />
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-primary-200">
                      Bước {index + 1}
                    </div>
                  </div>
                  <H2 className="mt-4 text-xl text-white">
                    {step.title}
                  </H2>
                  <Text className="mt-2 text-sm text-slate-300">
                    {step.description}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Callout type="info" title="Xác thực email là bắt buộc">
          Hệ thống chỉ cho phép đăng nhập sau khi tài khoản đã nhận OTP qua email và xác thực thành công.
          Frontend và backend đều bám sát một luồng nghiệp vụ duy nhất, không có debug OTP endpoint trong runtime thông thường.
        </Callout>

        <section className="grid gap-4 lg:grid-cols-2">
          {roleCards.map((card) => (
            <Card key={card.eyebrow} className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {card.eyebrow}
              </Caption>
              <H2 className="mt-3 text-2xl">
                {card.title}
              </H2>
              <div className="mt-4 flex flex-col gap-3">
                {card.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <Bell className="h-4 w-4 text-primary-600" />
                    {bullet}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Page className="h-7 w-7 text-primary-700" />
            <H2 className="mt-4 text-xl">Bảng dự án</H2>
            <Text className="mt-3 text-sm">Khách hàng tạo project, freelancer xem project đang mở và gửi bid từ cùng một workspace.</Text>
          </Card>
          <Card className="border-2 border-slate-200 bg-white p-6">
            <ProfileCircle className="h-7 w-7 text-primary-700" />
            <H2 className="mt-4 text-xl">Hồ sơ & quyền sở hữu</H2>
            <Text className="mt-3 text-sm">Frontend lấy profile trực tiếp từ access token, không dùng local auth giả lập làm source of truth.</Text>
          </Card>
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Lock className="h-7 w-7 text-primary-700" />
            <H2 className="mt-4 text-xl">Truyền tải auth an toàn</H2>
            <Text className="mt-3 text-sm">Access token tự động được gắn vào request, 401 được refresh thông qua HttpOnly cookie.</Text>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
