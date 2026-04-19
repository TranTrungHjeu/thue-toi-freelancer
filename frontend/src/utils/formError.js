export const getFieldErrorMessage = (value) => {
  if (Array.isArray(value)) {
    return `${value.find((item) => typeof item === 'string' && item.trim()) || ''}`.trim();
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
};

export const normalizeFieldErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .map(([field, value]) => [field, getFieldErrorMessage(value)])
      .filter(([, value]) => Boolean(value)),
  );
};

export const splitApiFormError = (error, fallbackMessage = '') => {
  const fieldErrors = normalizeFieldErrors(error?.errors || {});
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return {
    fieldErrors,
    hasFieldErrors,
    formError: hasFieldErrors ? '' : (error?.message || fallbackMessage),
  };
};
