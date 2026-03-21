export const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Chua cap nhat';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatDate = (value) => {
  if (!value) {
    return 'Chua co';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Khong hop le';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value) => {
  if (!value) {
    return 'Chua co';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Khong hop le';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRole = (role) => {
  const normalizedRole = (role || '').toLowerCase();
  if (normalizedRole === 'customer') {
    return 'Khach hang';
  }
  if (normalizedRole === 'freelancer') {
    return 'Freelancer';
  }
  if (normalizedRole === 'admin') {
    return 'Admin';
  }
  return 'Nguoi dung';
};

export const getProjectStatusMeta = (status) => {
  const mapping = {
    open: { label: 'Dang mo', color: 'success' },
    in_progress: { label: 'Dang thuc hien', color: 'info' },
    completed: { label: 'Da hoan thanh', color: 'success' },
    cancelled: { label: 'Da huy', color: 'error' },
  };
  return mapping[status] || { label: status || 'Chua xac dinh', color: 'warning' };
};

export const getBidStatusMeta = (status) => {
  const mapping = {
    pending: { label: 'Dang cho', color: 'warning' },
    accepted: { label: 'Da chon', color: 'success' },
    rejected: { label: 'Bi tu choi', color: 'error' },
    withdrawn: { label: 'Da rut', color: 'info' },
  };
  return mapping[status] || { label: status || 'Chua xac dinh', color: 'warning' };
};

export const getContractStatusMeta = (status) => {
  const mapping = {
    in_progress: { label: 'Dang thuc hien', color: 'info' },
    completed: { label: 'Da hoan thanh', color: 'success' },
    cancelled: { label: 'Da huy', color: 'error' },
  };
  return mapping[status] || { label: status || 'Chua xac dinh', color: 'warning' };
};

export const buildBudgetRange = (project) => {
  if (!project) {
    return 'Dang cap nhat';
  }
  return `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}`;
};
