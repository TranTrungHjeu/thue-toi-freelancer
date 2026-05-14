import axiosClient from './axiosClient';

export const marketplaceApi = {
  getAllProjects: () => axiosClient.get('/v1/projects'),
  searchProjects: (params = {}) => axiosClient.get('/v1/projects/search', {
    params,
    paramsSerializer: (nextParams) => {
      const searchParams = new URLSearchParams();
      Object.entries(nextParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value
            .filter((item) => item !== undefined && item !== null && item !== '')
            .forEach((item) => searchParams.append(key, item));
          return;
        }

        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      return searchParams.toString();
    },
  }),
  getMyProjects: () => axiosClient.get('/v1/projects/my'),
  getProjectsByUser: (userId) => axiosClient.get(`/v1/projects/user/${userId}`),
  createProject: (payload) => axiosClient.post('/v1/projects', payload),
  updateProject: (projectId, payload) => axiosClient.put(`/v1/projects/${projectId}`, payload),
  uploadFiles: (context, files, params = {}) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return axiosClient.post(`/v1/files/${context}`, formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSkillCatalog: () => axiosClient.get('/v1/skills'),
  getBidsByProject: (projectId) => axiosClient.get(`/v1/bids/project/${projectId}`),
  getMyBids: () => axiosClient.get('/v1/bids/my'),
  getBidsByFreelancer: (freelancerId) => axiosClient.get(`/v1/bids/freelancer/${freelancerId}`),
  createBid: (payload) => axiosClient.post('/v1/bids', payload),
  checkoutBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/checkout`),
  acceptBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/accept`),
  getPaymentByOrderCode: (orderCode) => axiosClient.get(`/v1/payments/${orderCode}`),
  cancelPaymentByOrderCode: (orderCode) => axiosClient.post(`/v1/payments/${orderCode}/cancel`),
  updateBidStatus: (bidId, status) => axiosClient.put(`/v1/bids/${bidId}/status`, { status }),
  getMyContracts: () => axiosClient.get('/v1/contracts/my'),
  getContractsByUser: (userId) => axiosClient.get(`/v1/contracts/user/${userId}`),
  updateContractStatus: (contractId, status) => axiosClient.put(`/v1/contracts/${contractId}/status`, null, {
    params: { status },
  }),
  createMilestone: (contractId, payload) => axiosClient.post(`/v1/contracts/${contractId}/milestones`, payload),
  getMilestonesByContract: (contractId) => axiosClient.get(`/v1/contracts/${contractId}/milestones`),
  updateMilestoneStatus: (milestoneId, status) => axiosClient.put(`/v1/milestones/${milestoneId}/status`, { status }),
  getTransactionsByContract: (contractId) => axiosClient.get(`/v1/contracts/${contractId}/transactions`),
  getMessagesByContract: (contractId) => axiosClient.get(`/v1/messages/contract/${contractId}`),
  sendMessage: (payload) => axiosClient.post('/v1/messages', payload),
  getReviewsByContract: (contractId) => axiosClient.get(`/v1/reviews/contract/${contractId}`),
  createReview: (payload) => axiosClient.post('/v1/reviews', payload),
  getNotificationsMe: () => axiosClient.get('/v1/notifications/user/me'),
  getNotificationsPage: (params = {}) => axiosClient.get('/v1/notifications/user/me/page', { params }),
  markNotificationAsRead: (notificationId) => axiosClient.put(`/v1/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => axiosClient.put('/v1/notifications/read-all'),
  archiveNotification: (notificationId) => axiosClient.put(`/v1/notifications/${notificationId}/archive`),
  deleteNotification: (notificationId) => axiosClient.delete(`/v1/notifications/${notificationId}`),
  getNotificationPreferences: () => axiosClient.get('/v1/notifications/preferences'),
  updateNotificationPreference: (type, payload) => axiosClient.put(`/v1/notifications/preferences/${type}`, payload),

  // --- Reports ---
  submitReport: (payload) => axiosClient.post('/v1/reports', payload),

  // --- KYC (User-side) ---
  requestKyc: () => axiosClient.post('/v1/kyc/request'),
  getKycStatus: () => axiosClient.get('/v1/kyc/my-status'),

  // --- Wallet (SePay-funded escrow + balance) ---
  getWalletMe: () => axiosClient.get('/v1/wallet/me'),
  getWalletLedger: () => axiosClient.get('/v1/wallet/me/ledger'),
};

export default marketplaceApi;
