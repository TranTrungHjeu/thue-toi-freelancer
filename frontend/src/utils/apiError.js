import { getActiveLocale, t } from '../i18n';

const CODE_MESSAGE_OVERRIDES = {
  ERR_AUTH_01: 'errors.code.ERR_AUTH_01',
  ERR_AUTH_02: 'errors.code.ERR_AUTH_02',
  ERR_AUTH_03: 'errors.code.ERR_AUTH_03',
  ERR_AUTH_04: 'errors.code.ERR_AUTH_04',
  ERR_AUTH_05: 'errors.code.ERR_AUTH_05',
  ERR_AUTH_06: 'errors.code.ERR_AUTH_06',
  ERR_AUTH_07: 'errors.code.ERR_AUTH_07',
  ERR_AUTH_08: 'errors.code.ERR_AUTH_08',
  ERR_AUTH_09: 'errors.code.ERR_AUTH_09',
  ERR_AUTH_10: 'errors.code.ERR_AUTH_10',
  ERR_AUTH_11: 'errors.code.ERR_AUTH_11',
  ERR_AUTH_12: 'errors.code.ERR_AUTH_12',
  ERR_AUTH_14: 'errors.code.ERR_AUTH_14',
  ERR_AUTH_15: 'errors.code.ERR_AUTH_15',
  ERR_USER_01: 'errors.code.ERR_USER_01',
  ERR_PROJECT_01: 'errors.code.ERR_PROJECT_01',
  ERR_BID_01: 'errors.code.ERR_BID_01',
  ERR_CONTRACT_01: 'errors.code.ERR_CONTRACT_01',
  ERR_CONTRACT_02: 'errors.code.ERR_CONTRACT_02',
  ERR_MILESTONE_01: 'errors.code.ERR_MILESTONE_01',
  ERR_NOTIFICATION_01: 'errors.code.ERR_NOTIFICATION_01',
  ERR_FILE_01: 'errors.code.ERR_FILE_01',
  ERR_FILE_02: 'errors.code.ERR_FILE_02',
  ERR_FILE_03: 'errors.code.ERR_FILE_03',
  ERR_SYS_01: 'errors.code.ERR_SYS_01',
  ERR_SYS_02: 'errors.code.ERR_SYS_02',
  ERR_SYS_03: 'errors.code.ERR_SYS_03',
};

const RAW_MESSAGE_OVERRIDES = {
  'Sai email hoặc mật khẩu': 'errors.raw.invalidCredentials',
  'Tài khoản đã bị khoá': 'errors.raw.lockedAccount',
  'Tài khoản chưa xác thực email': 'errors.raw.unverifiedEmail',
  'Email đã tồn tại': 'errors.raw.emailExists',
  'Không thể đăng ký với vai trò admin': 'errors.raw.adminRegisterForbidden',
  'OTP không hợp lệ': 'errors.raw.otpInvalid',
  'OTP đã hết hạn': 'errors.raw.otpExpired',
  'Vui lòng chờ trước khi gửi lại OTP': 'errors.raw.otpResendWait',
  'Access token không hợp lệ': 'errors.raw.accessTokenInvalid',
  'Refresh token không hợp lệ hoặc đã bị thu hồi': 'errors.raw.refreshTokenInvalid',
  'Service unhealthy': 'errors.raw.serviceUnhealthy',
  'must not be blank': 'errors.raw.notBlank',
  'must not be null': 'errors.raw.notNull',
  'must not be empty': 'errors.raw.notEmpty',
  'must be a well-formed email address': 'errors.raw.invalidEmail',
  'must be greater than 0': 'errors.raw.greaterThanZero',
  'must be greater than or equal to 0': 'errors.raw.greaterThanOrEqualZero',
};

const GENERIC_AXIOS_MESSAGE_PATTERNS = [
  /^Request failed with status code \d+$/i,
  /^Network Error$/i,
  /^timeout of .* exceeded$/i,
];

const FALLBACK_MESSAGES_BY_STATUS = {
  400: 'errors.fallback.status.400',
  401: 'errors.fallback.status.401',
  403: 'errors.fallback.status.403',
  404: 'errors.fallback.status.404',
  409: 'errors.fallback.status.409',
  429: 'errors.fallback.status.429',
  500: 'errors.fallback.status.500',
  502: 'errors.fallback.status.502',
  503: 'errors.fallback.status.503',
  504: 'errors.fallback.status.504',
};

const buildTermReplacements = (locale) => {
  const replacements = [
    [/\bProject\b/g, t('errors.terms.projectUpper', {}, locale)],
    [/\bproject\b/g, t('errors.terms.projectLower', {}, locale)],
    [/\bBid\b/g, t('errors.terms.bidUpper', {}, locale)],
    [/\bbid\b/g, t('errors.terms.bidLower', {}, locale)],
    [/\bMilestone\b/g, t('errors.terms.milestoneUpper', {}, locale)],
    [/\bmilestone\b/g, t('errors.terms.milestoneLower', {}, locale)],
    [/\bCustomer\b/g, t('errors.terms.customerUpper', {}, locale)],
    [/\bcustomer\b/g, t('errors.terms.customerLower', {}, locale)],
    [/\bFreelancer\b/g, t('errors.terms.freelancerUpper', {}, locale)],
    [/\bfreelancer\b/g, t('errors.terms.freelancerLower', {}, locale)],
    [/\bFile\b/g, t('errors.terms.fileUpper', {}, locale)],
    [/\bfile\b/g, t('errors.terms.fileLower', {}, locale)],
    [/\bbackend\b/gi, t('errors.terms.systemLower', {}, locale)],
    [/\bserver\b/gi, t('errors.terms.systemLower', {}, locale)],
    [/\bOTP\b/g, t('errors.terms.otpLower', {}, locale)],
  ];

  if (locale === 'vi') {
    replacements.push([/\bkhoá\b/g, t('errors.terms.normalizedLocked', {}, locale)]);
    replacements.push([/\btuỳ\b/g, t('errors.terms.normalizedOptional', {}, locale)]);
  }

  return replacements;
};

const normalizeBusinessMessage = (message, locale = getActiveLocale()) => {
  if (typeof message !== 'string') {
    return '';
  }

  let nextMessage = message.trim();
  if (!nextMessage) {
    return '';
  }

  const overrideKey = RAW_MESSAGE_OVERRIDES[nextMessage];
  nextMessage = overrideKey ? t(overrideKey, {}, locale) : nextMessage;

  buildTermReplacements(locale).forEach(([pattern, replacement]) => {
    nextMessage = nextMessage.replace(pattern, replacement);
  });

  return nextMessage.replace(/\s+/g, ' ').trim();
};

const normalizeFieldErrors = (errors, locale = getActiveLocale()) => {
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, value]) => {
      if (Array.isArray(value)) {
        return [field, value.map((item) => normalizeBusinessMessage(item, locale) || item)];
      }

      if (typeof value === 'string') {
        return [field, normalizeBusinessMessage(value, locale) || value];
      }

      return [field, value];
    }),
  );
};

const extractStatus = (error) => error?.status || error?.response?.status || null;

const extractCode = (error) => error?.code || error?.response?.data?.code || null;

const extractRawMessage = (error) =>
  error?.message
  || error?.response?.data?.message
  || '';

const isGenericTransportMessage = (message) =>
  GENERIC_AXIOS_MESSAGE_PATTERNS.some((pattern) => pattern.test(message || ''));

export const createApiError = (error, fallbackMessage = '', locale = getActiveLocale()) => {
  const status = extractStatus(error);
  const code = extractCode(error);
  const rawMessage = extractRawMessage(error);
  const normalizedRawMessage = isGenericTransportMessage(rawMessage)
    ? ''
    : normalizeBusinessMessage(rawMessage, locale);
  const normalizedFallbackMessage = normalizeBusinessMessage(fallbackMessage, locale);
  const messageFromCodeKey = code ? CODE_MESSAGE_OVERRIDES[code] || '' : '';
  const messageFromCode = messageFromCodeKey ? t(messageFromCodeKey, {}, locale) : '';
  const messageFromStatusKey = status ? FALLBACK_MESSAGES_BY_STATUS[status] || '' : '';
  const messageFromStatus = messageFromStatusKey ? t(messageFromStatusKey, {}, locale) : '';

  const isNetworkError = error?.code === 'ERR_NETWORK' || (!status && !code && isGenericTransportMessage(rawMessage));

  return {
    code: code || (status ? `HTTP_${status}` : 'ERR_SYS_00'),
    status,
    errors: normalizeFieldErrors(error?.errors || error?.response?.data?.errors || null, locale),
    message: isNetworkError
      ? t('errors.fallback.network', {}, locale)
      : normalizedRawMessage
        || messageFromCode
        || normalizedFallbackMessage
        || messageFromStatus
        || t('errors.fallback.default', {}, locale),
  };
};

export const getUserFacingErrorMessage = (error, fallbackMessage = '', locale = getActiveLocale()) =>
  createApiError(error, fallbackMessage, locale).message;
