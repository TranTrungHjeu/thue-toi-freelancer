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
      title: 'Dang ky dung vai tro',
      description: 'Khach hang dang du an, freelancer gui bao gia. Backend da khoa public register voi role admin.',
      icon: UserBag,
    },
    {
      title: 'Xac thuc OTP email',
      description: 'Tai khoan chi duoc phep login sau khi verify email thanh cong theo dung workflow JWT + OTP.',
      icon: ShieldCheck,
    },
    {
      title: 'Dang nhap + refresh an toan',
      description: 'Access token di qua bearer header, refresh token duoc giu bang HttpOnly cookie.',
      icon: Lock,
    },
  ];

  const roleCards = [
    {
      eyebrow: 'Customer',
      title: 'Dang du an va xu ly bao gia',
      bullets: ['Tao project', 'Xem freelancer bid', 'Theo doi hop dong va milestone'],
    },
    {
      eyebrow: 'Freelancer',
      title: 'Tiep can du an phu hop',
      bullets: ['Duyet project dang mo', 'Gui bid co gia va thoi gian', 'Lam viec trong workspace da duoc giao'],
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
              <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">Thue Toi</span>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Freelancer Platform
              </Caption>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/gallery')}>
              Gallery
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth/login')}>
              Dang nhap
            </Button>
            <Button onClick={() => navigate('/auth/register')}>
              Bat dau
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge color="success" className="w-fit px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              Frontend aligned with JWT + OTP backend
            </Badge>
            <H1 className="max-w-3xl text-5xl leading-tight">
              Workspace sach, ro luong nghiep vu, va bam sat backend hien tai.
            </H1>
            <Text className="max-w-2xl text-lg text-slate-600">
              Frontend nay da duoc chot lai theo workflow dang ky, verify OTP, dang nhap, quan ly du an,
              bao gia, hop dong va thong bao cho ca customer lan freelancer.
            </Text>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/auth/register')}>
                Tao tai khoan moi
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth/login')}>
                Dang nhap workspace
              </Button>
              <Button variant="ghost" onClick={() => navigate('/api-lab')}>
                API Lab
              </Button>
            </div>
          </div>

          <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
              Workflow
            </Caption>
            <div className="mt-4 flex flex-col gap-4">
              {steps.map((step, index) => (
                <div key={step.title} className="border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="border border-primary-400 p-2">
                      <step.icon className="h-5 w-5 text-primary-300" />
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-primary-200">
                      Buoc {index + 1}
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

        <Callout type="info" title="Email verification la bat buoc">
          He thong chi cho phep dang nhap sau khi tai khoan da nhan OTP qua email va xac thuc thanh cong.
          Frontend va backend deu bam sat mot luong nghiep vu duy nhat, khong co debug OTP endpoint trong runtime thong thuong.
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
            <H2 className="mt-4 text-xl">Project board</H2>
            <Text className="mt-3 text-sm">Customer tao project, freelancer xem project dang mo va gui bid tu cung mot workspace.</Text>
          </Card>
          <Card className="border-2 border-slate-200 bg-white p-6">
            <ProfileCircle className="h-7 w-7 text-primary-700" />
            <H2 className="mt-4 text-xl">Profile & ownership</H2>
            <Text className="mt-3 text-sm">Frontend lay profile truc tiep tu access token, khong dung local auth gia lap lam source of truth.</Text>
          </Card>
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Lock className="h-7 w-7 text-primary-700" />
            <H2 className="mt-4 text-xl">Secure auth transport</H2>
            <Text className="mt-3 text-sm">Access token tu dong duoc gan vao request, 401 duoc refresh thong qua HttpOnly cookie.</Text>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
