import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Page, ProfileCircle, ShieldCheck, UserBag } from 'iconoir-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Callout from '../components/common/Callout';
import Badge from '../components/common/Badge';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useI18n } from '../hooks/useI18n';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const iconMap = {
    lock: Lock,
    page: Page,
    profileCircle: ProfileCircle,
    shieldCheck: ShieldCheck,
    userBag: UserBag,
  };

  const steps = t('landing.steps');
  const roleCards = t('landing.roleCards');
  const featureCards = t('landing.featureCards');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_45%,#ecfccb_100%)]">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="border-2 border-secondary-900 bg-secondary-900 px-3 py-1 text-sm font-black uppercase tracking-[0.24em] text-white">
              TT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">{t('app.brand')}</span>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {t('landing.tagline')}
              </Caption>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Button variant="ghost" onClick={() => navigate('/gallery')}>
              {t('landing.gallery')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth/login')}>
              {t('landing.login')}
            </Button>
            <Button onClick={() => navigate('/auth/register')}>
              {t('landing.getStarted')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge color="success" className="w-fit px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              {t('landing.heroBadge')}
            </Badge>
            <H1 className="max-w-3xl text-5xl leading-tight">
              {t('landing.heroTitle')}
            </H1>
            <Text className="max-w-2xl text-lg text-slate-600">
              {t('landing.heroDescription')}
            </Text>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/auth/register')}>
                {t('landing.createAccount')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth/login')}>
                {t('landing.enterWorkspace')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/api-lab')}>
                {t('landing.apiLab')}
              </Button>
            </div>
          </div>

          <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
              {t('landing.processTitle')}
            </Caption>
            <div className="mt-4 flex flex-col gap-4">
              {steps.map((step, index) => (
                <div key={step.title} className="border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="border border-primary-400 p-2">
                      {React.createElement(iconMap[step.icon], { className: 'h-5 w-5 text-primary-300' })}
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-primary-200">
                      {t('landing.stepLabel', { index: index + 1 })}
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

        <Callout type="info" title={t('landing.calloutTitle')}>
          {t('landing.calloutDescription')}
        </Callout>

        <section className="grid gap-4 lg:grid-cols-2">
          {roleCards.map((card) => (
            <Card key={`${card.eyebrow}-${card.title}`} className="border-2 border-slate-200 bg-white p-6">
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
          {featureCards.map((card) => (
            <Card key={card.title} className="border-2 border-slate-200 bg-white p-6">
              {React.createElement(iconMap[card.icon], { className: 'h-7 w-7 text-primary-700' })}
              <H2 className="mt-4 text-xl">{card.title}</H2>
              <Text className="mt-3 text-sm">{card.description}</Text>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
