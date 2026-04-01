import { getActiveLocale, t } from '../i18n';

const LOCALE_FORMATS = {
  vi: 'vi-VN',
  en: 'en-US',
};

const resolveFormatLocale = (locale) => LOCALE_FORMATS[locale] || LOCALE_FORMATS.vi;

export const formatCurrency = (value, locale = getActiveLocale()) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return t('values.notUpdated', {}, locale);
  }

  return new Intl.NumberFormat(resolveFormatLocale(locale), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatDate = (value, locale = getActiveLocale()) => {
  if (!value) {
    return t('values.notAvailable', {}, locale);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t('values.invalid', {}, locale);
  }

  return new Intl.DateTimeFormat(resolveFormatLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value, locale = getActiveLocale()) => {
  if (!value) {
    return t('values.notAvailable', {}, locale);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t('values.invalid', {}, locale);
  }

  return new Intl.DateTimeFormat(resolveFormatLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRole = (role, locale = getActiveLocale()) => {
  const normalizedRole = (role || '').toLowerCase();
  if (normalizedRole === 'customer') {
    return t('roles.customer', {}, locale);
  }
  if (normalizedRole === 'freelancer') {
    return t('roles.freelancer', {}, locale);
  }
  if (normalizedRole === 'admin') {
    return t('roles.admin', {}, locale);
  }
  return t('roles.user', {}, locale);
};

export const getProjectStatusMeta = (status, locale = getActiveLocale()) => {
  const mapping = {
    open: { label: t('status.project.open', {}, locale), color: 'success' },
    in_progress: { label: t('status.project.in_progress', {}, locale), color: 'info' },
    completed: { label: t('status.project.completed', {}, locale), color: 'success' },
    cancelled: { label: t('status.project.cancelled', {}, locale), color: 'error' },
  };
  return mapping[status] || { label: status || t('values.unknown', {}, locale), color: 'warning' };
};

export const getBidStatusMeta = (status, locale = getActiveLocale()) => {
  const mapping = {
    pending: { label: t('status.bid.pending', {}, locale), color: 'warning' },
    accepted: { label: t('status.bid.accepted', {}, locale), color: 'success' },
    rejected: { label: t('status.bid.rejected', {}, locale), color: 'error' },
    withdrawn: { label: t('status.bid.withdrawn', {}, locale), color: 'info' },
  };
  return mapping[status] || { label: status || t('values.unknown', {}, locale), color: 'warning' };
};

export const getContractStatusMeta = (status, locale = getActiveLocale()) => {
  const mapping = {
    in_progress: { label: t('status.contract.in_progress', {}, locale), color: 'info' },
    completed: { label: t('status.contract.completed', {}, locale), color: 'success' },
    cancelled: { label: t('status.contract.cancelled', {}, locale), color: 'error' },
  };
  return mapping[status] || { label: status || t('values.unknown', {}, locale), color: 'warning' };
};

export const getMilestoneStatusMeta = (status, locale = getActiveLocale()) => {
  const mapping = {
    pending: { label: t('status.milestone.pending', {}, locale), color: 'warning' },
    completed: { label: t('status.milestone.completed', {}, locale), color: 'success' },
    cancelled: { label: t('status.milestone.cancelled', {}, locale), color: 'error' },
  };
  return mapping[status] || { label: status || t('values.unknown', {}, locale), color: 'warning' };
};

export const getNotificationTypeMeta = (type, locale = getActiveLocale()) => {
  const mapping = {
    project: { label: t('status.notificationType.project', {}, locale), color: 'info' },
    bid: { label: t('status.notificationType.bid', {}, locale), color: 'warning' },
    contract: { label: t('status.notificationType.contract', {}, locale), color: 'success' },
    system: { label: t('status.notificationType.system', {}, locale), color: 'info' },
  };
  return mapping[type] || { label: type || t('values.unknown', {}, locale), color: 'warning' };
};

export const buildBudgetRange = (project, locale = getActiveLocale()) => {
  if (!project) {
    return t('values.notUpdated', {}, locale);
  }
  return `${formatCurrency(project.budgetMin, locale)} - ${formatCurrency(project.budgetMax, locale)}`;
};
