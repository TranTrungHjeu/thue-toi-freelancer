import axiosClient from './axiosClient';

export const marketplaceApi = {
  getAllProjects: () => axiosClient.get('/v1/projects'),
  getMyProjects: () => axiosClient.get('/v1/projects/my'),
  getProjectsByUser: (userId) => axiosClient.get(`/v1/projects/user/${userId}`),
  createProject: (payload) => axiosClient.post('/v1/projects', payload),
  updateProject: (projectId, payload) => axiosClient.put(`/v1/projects/${projectId}`, payload),
  getBidsByProject: (projectId) => axiosClient.get(`/v1/bids/project/${projectId}`),
  getMyBids: () => axiosClient.get('/v1/bids/my'),
  getBidsByFreelancer: (freelancerId) => axiosClient.get(`/v1/bids/freelancer/${freelancerId}`),
  createBid: (payload) => axiosClient.post('/v1/bids', payload),
  acceptBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/accept`),
  updateBidStatus: (bidId, status) => axiosClient.put(`/v1/bids/${bidId}/status`, { status }),
  getMyContracts: () => axiosClient.get('/v1/contracts/my'),
  getContractsByUser: (userId) => axiosClient.get(`/v1/contracts/user/${userId}`),
  updateContractStatus: (contractId, status) => axiosClient.put(`/v1/contracts/${contractId}/status`, null, {
    params: { status },
  }),
  createMilestone: (contractId, payload) => axiosClient.post(`/v1/contracts/${contractId}/milestones`, payload),
  getMilestonesByContract: (contractId) => axiosClient.get(`/v1/contracts/${contractId}/milestones`),
  getMessagesByContract: (contractId) => axiosClient.get(`/v1/messages/contract/${contractId}`),
  sendMessage: (payload) => axiosClient.post('/v1/messages', payload),
  getReviewsByContract: (contractId) => axiosClient.get(`/v1/reviews/contract/${contractId}`),
  createReview: (payload) => axiosClient.post('/v1/reviews', payload),
  getNotificationsMe: () => axiosClient.get('/v1/notifications/user/me'),
  markNotificationAsRead: (notificationId) => axiosClient.put(`/v1/notifications/${notificationId}/read`),
};

export default marketplaceApi;
