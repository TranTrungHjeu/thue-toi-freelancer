import axiosClient from "./axiosClient";

const serializeQueryParams = (nextParams) => {
  const searchParams = new URLSearchParams();
  Object.entries(nextParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .forEach((item) => searchParams.append(key, item));
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

export const marketplaceApi = {
  getAllProjects: (params = {}) =>
    axiosClient.get("/v1/projects", {
      params,
      paramsSerializer: serializeQueryParams,
    }),
  getProject: (projectId) => axiosClient.get(`/v1/projects/${projectId}`),
  searchProjects: (params = {}) =>
    axiosClient.get("/v1/projects/search", {
      params,
      paramsSerializer: serializeQueryParams,
    }),
  getMyProjects: (params = {}) =>
    axiosClient.get("/v1/projects/my", {
      params,
      paramsSerializer: serializeQueryParams,
    }),
  getProjectsByUser: (userId) => axiosClient.get(`/v1/projects/user/${userId}`),
  createProject: (payload) => axiosClient.post("/v1/projects", payload),
  updateProject: (projectId, payload) =>
    axiosClient.put(`/v1/projects/${projectId}`, payload),
  uploadFiles: (context, files, params = {}) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return axiosClient.post(`/v1/files/${context}`, formData, {
      params,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getSkillCatalog: () => axiosClient.get("/v1/skills"),
  getBidsByProject: (projectId) =>
    axiosClient.get(`/v1/bids/project/${projectId}`),
  getMyBids: () => axiosClient.get("/v1/bids/my"),
  getBidsByFreelancer: (freelancerId) =>
    axiosClient.get(`/v1/bids/freelancer/${freelancerId}`),
  createBid: (payload) => axiosClient.post("/v1/bids", payload),
  checkoutBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/checkout`),
  acceptBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/accept`),
  payBidWithWallet: (bidId) =>
    axiosClient.post(`/v1/payments/wallet/pay-bid/${bidId}`),
  getPaymentByOrderCode: (orderCode) =>
    axiosClient.get(`/v1/payments/${orderCode}`),
  cancelPaymentByOrderCode: (orderCode) =>
    axiosClient.post(`/v1/payments/${orderCode}/cancel`),
  updateBidStatus: (bidId, status) =>
    axiosClient.put(`/v1/bids/${bidId}/status`, { status }),
  getMyContracts: () => axiosClient.get("/v1/contracts/my"),
  getContractsByUser: (userId) =>
    axiosClient.get(`/v1/contracts/user/${userId}`),
  updateContractStatus: (contractId, status) =>
    axiosClient.put(`/v1/contracts/${contractId}/status`, null, {
      params: { status },
    }),
  createMilestone: (contractId, payload) =>
    axiosClient.post(`/v1/contracts/${contractId}/milestones`, payload),
  getMilestonesByContract: (contractId) =>
    axiosClient.get(`/v1/contracts/${contractId}/milestones`),
  updateMilestoneStatus: (milestoneId, status) =>
    axiosClient.put(`/v1/milestones/${milestoneId}/status`, { status }),
  getTransactionsByContract: (contractId) =>
    axiosClient.get(`/v1/contracts/${contractId}/transactions`),
  getMessagesByContract: (contractId) =>
    axiosClient.get(`/v1/messages/contract/${contractId}`),
  sendMessage: (payload) => axiosClient.post("/v1/messages", payload),
  getReviewsByContract: (contractId) =>
    axiosClient.get(`/v1/reviews/contract/${contractId}`),
  createReview: (payload) => axiosClient.post("/v1/reviews", payload),
  getNotificationsMe: () => axiosClient.get("/v1/notifications/user/me"),
  getNotificationsPage: (params = {}) =>
    axiosClient.get("/v1/notifications/user/me/page", { params }),
  markNotificationAsRead: (notificationId) =>
    axiosClient.put(`/v1/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () =>
    axiosClient.put("/v1/notifications/read-all"),
  archiveNotification: (notificationId) =>
    axiosClient.put(`/v1/notifications/${notificationId}/archive`),
  deleteNotification: (notificationId) =>
    axiosClient.delete(`/v1/notifications/${notificationId}`),
  getNotificationPreferences: () =>
    axiosClient.get("/v1/notifications/preferences"),
  updateNotificationPreference: (type, payload) =>
    axiosClient.put(`/v1/notifications/preferences/${type}`, payload),

  // --- Reports ---
  submitReport: (payload) => axiosClient.post("/v1/reports", payload),

  // --- KYC (User-side) ---
  requestKyc: () => axiosClient.post("/v1/kyc/request"),
  autoVerifyKyc: (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return axiosClient.post("/v1/kyc/auto-verify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getKycStatus: () => axiosClient.get("/v1/kyc/my-status"),

  // --- Wallet (SePay-funded escrow + balance) ---
  getWalletMe: () => axiosClient.get("/v1/wallet/me"),
  getWalletLedger: (params) =>
    axiosClient.get("/v1/wallet/me/ledger", { params }),
  depositWallet: (amount) => axiosClient.post("/v1/wallet/deposit", { amount }),

  // --- Withdrawals (user-side) ---
  getMyWithdrawals: (params) =>
    axiosClient.get("/v1/wallet/withdrawals", { params }),
  createWithdrawal: (payload) =>
    axiosClient.post("/v1/wallet/withdrawals", payload),
  cancelWithdrawal: (id) =>
    axiosClient.post(`/v1/wallet/withdrawals/${id}/cancel`),

  // --- Bank accounts (user-side) ---
  getMyBankAccounts: () => axiosClient.get("/v1/users/me/bank-accounts"),
  createBankAccount: (payload) =>
    axiosClient.post("/v1/users/me/bank-accounts", payload),
  updateBankAccount: (id, payload) =>
    axiosClient.put(`/v1/users/me/bank-accounts/${id}`, payload),
  deleteBankAccount: (id) =>
    axiosClient.delete(`/v1/users/me/bank-accounts/${id}`),
  setDefaultBankAccount: (id) =>
    axiosClient.post(`/v1/users/me/bank-accounts/${id}/default`),
  uploadBankAccountQr: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/v1/files/bank-accounts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // --- Support Chat ---
  getSupportMessages: () => axiosClient.get("/v1/admin/support/messages/me"),
  sendSupportMessage: (payload) =>
    axiosClient.post("/v1/admin/support/messages", payload),
};

export default marketplaceApi;
