import axiosClient from './axiosClient';

const adminApi = {
  /**
   * Lấy thống kê hệ thống (GMV, User count, v.v.)
   */
  getSystemStats: () => {
    return axiosClient.get('/v1/admin/stats');
  },

  /**
   * Lấy danh sách toàn bộ người dùng
   */
  getAllUsers: () => {
    return axiosClient.get('/v1/admin/users');
  },

  getUserPage: (params = {}) => {
    return axiosClient.get('/v1/admin/users/page', { params });
  },

  getUserDetail: (userId) => {
    return axiosClient.get(`/v1/admin/users/${userId}`);
  },

  /**
   * Khóa hoặc mở khóa tài khoản
   * @param {number} userId ID người dùng
   * @param {string} reason Lý do (tùy chọn)
   */
  toggleUserStatus: (userId, reason) => {
    return axiosClient.put(`/v1/admin/users/${userId}/toggle-status`, null, {
      params: { reason }
    });
  },

  bulkToggleUserStatus: (userIds, active, reason) => {
    return axiosClient.post('/v1/admin/users/bulk-status', { userIds, active, reason });
  },
  
  updateUserRole: (userId, role) => {
    return axiosClient.put(`/v1/admin/users/${userId}/role`, null, {
      params: { role }
    });
  },

  /**
   * Lấy danh sách dự án để kiểm duyệt
   */
  getAllProjects: () => {
    return axiosClient.get('/v1/admin/projects');
  },

  /**
   * Cập nhật trạng thái dự án (Duyệt, từ chối, v.v.)
   * @param {number} projectId ID dự án
   * @param {string} status Trạng thái mới
   */
  updateProjectStatus: (projectId, status) => {
    return axiosClient.put(`/v1/admin/projects/${projectId}/status`, null, {
      params: { status }
    });
  },

  bulkUpdateProjectStatus: (projectIds, status) => {
    return axiosClient.post('/v1/admin/projects/bulk-status', { projectIds, status });
  },

  // --- Skills ---
  createSkill: (skill) => {
    return axiosClient.post('/v1/admin/skills', skill);
  },
  updateSkill: (id, skill) => {
    return axiosClient.put(`/v1/admin/skills/${id}`, skill);
  },
  deleteSkill: (id) => {
    return axiosClient.delete(`/v1/admin/skills/${id}`);
  },

  // --- Broadcast ---
  broadcast: (payload) => {
    return axiosClient.post('/v1/admin/broadcast', payload);
  },

  // --- KYC ---
  getKycRequests: () => {
    return axiosClient.get('/v1/admin/kyc');
  },
  approveKyc: (id) => {
    return axiosClient.put(`/v1/admin/kyc/${id}/approve`);
  },
  rejectKyc: (id, reason) => {
    return axiosClient.put(`/v1/admin/kyc/${id}/reject`, null, {
      params: { reason }
    });
  },

  // --- Reports ---
  getReports: () => {
    return axiosClient.get('/v1/admin/reports');
  },
  updateReportStatus: (id, status) => {
    return axiosClient.put(`/v1/admin/reports/${id}/status`, null, {
      params: { status }
    });
  },

  // --- Finance & Withdrawals ---
  getWithdrawals: () => {
    return axiosClient.get('/v1/admin/withdrawals');
  },
  
  processWithdrawal: (id, status, note) => {
    return axiosClient.post(`/v1/admin/withdrawals/${id}/process`, null, {
      params: { status, note }
    });
  },

  // --- System Settings ---
  getSettings: () => {
    return axiosClient.get('/v1/admin/settings');
  },

  updateSetting: (key, value) => {
    return axiosClient.post('/v1/admin/settings', { key, value });
  },

  /**
   * Lấy nhật ký hệ thống
   */
  getAuditLogs: () => {
    return axiosClient.get('/v1/admin/logs');
  },

  getHealthDetailed: () => {
    return axiosClient.get('/v1/admin/health-detailed');
  }
};

export default adminApi;
