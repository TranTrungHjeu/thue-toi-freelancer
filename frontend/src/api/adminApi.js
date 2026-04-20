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
  }
};

export default adminApi;
