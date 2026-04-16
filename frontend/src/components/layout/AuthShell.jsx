import React from 'react';
import { Link } from 'react-router-dom';
import { H1, H2, Text, Caption } from '../common/Typography';
import Card from '../common/Card';
import Badge from '../common/Badge';

const AuthShell = ({ eyebrow, title, description, children, tips = [] }) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_55%,#ecfccb_100%)]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="border-2 border-secondary-900 bg-secondary-900 px-3 py-1 text-sm font-black uppercase tracking-[0.24em] text-white">
              TT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-[0.18em] text-secondary-900">
                Thuê Tôi
              </span>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Xác thực tài khoản
              </Caption>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <Link to="/gallery" className="border-2 border-transparent px-3 py-2 hover:border-slate-200 hover:bg-white">
              Thư viện
            </Link>
            <Link to="/api-lab" className="border-2 border-transparent px-3 py-2 hover:border-slate-200 hover:bg-white">
              Phòng thử API
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <section className="flex flex-col gap-6">
          <Badge color="success" className="w-fit px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {eyebrow}
          </Badge>
          <H1 className="max-w-2xl text-4xl leading-tight md:text-5xl">
            {title}
          </H1>
          <Text className="max-w-2xl text-lg text-slate-600">
            {description}
          </Text>

          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((tip) => (
              <Card key={tip.title} className="border-2 border-slate-200 bg-white/90 p-5">
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                  {tip.eyebrow}
                </Caption>
                <H2 className="mt-2 text-xl">
                  {tip.title}
                </H2>
                <Text className="mt-3 text-sm text-slate-600">
                  {tip.description}
                </Text>
              </Card>
            ))}
          </div>
        </section>

        <section>
          {children}
        </section>
      </main>
    </div>
  );
};

export default AuthShell;
