"use client";

import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import Avatar from '../components/common/Avatar';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { formatDateTime, formatRole } from '../utils/formatters';

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('profilePage');
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleRefreshProfile = async () => {
    setIsSyncing(true);
    try {
      await refreshProfile();
      addToast(t('toasts.profile.refreshSuccess'), 'success');
    } catch (error) {
      addToast(error?.message || t('toasts.profile.refreshError'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <Callout type="warning" title={copy.empty.title}>
          {copy.empty.description}
        </Callout>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.hero.caption}
          </Caption>
          <H1 className="mt-3 text-4xl">
            {copy.hero.title}
          </H1>
          <Text className="mt-4 text-slate-600">
            {copy.hero.description}
          </Text>
          <div className="mt-6">
            <Button variant="outline" onClick={handleRefreshProfile} disabled={isSyncing}>
              {isSyncing ? copy.hero.refreshing : copy.hero.refresh}
            </Button>
          </div>
        </Card>

        <Callout type="info" title={copy.roleCallout.title}>
          {user.role === 'customer'
            ? copy.roleCallout.customerDescription
            : copy.roleCallout.freelancerDescription}
        </Callout>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.identity.caption}
          </Caption>
          <H2 className="mt-2 text-2xl">
            {copy.identity.title}
          </H2>

          <div className="mt-5 flex items-start gap-4 border border-slate-200 bg-slate-50 p-4">
            <Avatar src={user.avatarUrl} alt={user.fullName} size="xl" />
            <div className="flex flex-col gap-1">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.identity.avatarLabel}
              </Caption>
              <Text className="text-sm break-all text-slate-600">
                {user.avatarUrl || copy.identity.avatarFallback}
              </Text>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.identity.fullNameLabel}</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user.fullName || t('values.notUpdated')}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.identity.emailLabel}</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{user.email || t('values.notAvailable')}</div>
            </div>
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.identity.roleLabel}</Caption>
              <div className="mt-1 text-base font-semibold text-secondary-900">{formatRole(user.role, locale)}</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.account.caption}
          </Caption>
          <H2 className="mt-2 text-2xl">
            {copy.account.title}
          </H2>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge color={user.verified ? 'success' : 'warning'}>
              {user.verified ? copy.account.verified : copy.account.unverified}
            </Badge>
            <Badge color={user.isActive ? 'success' : 'error'}>
              {user.isActive ? copy.account.active : copy.account.locked}
            </Badge>
          </div>
          <Text className="mt-5 text-sm text-slate-600">
            {user.profileDescription || copy.account.descriptionFallback}
          </Text>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.account.createdAtLabel}
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user.createdAt, locale)}
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.account.updatedAtLabel}
              </Caption>
              <div className="mt-2 text-sm font-semibold text-secondary-900">
                {formatDateTime(user.updatedAt, locale)}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ProfilePage;
