import axiosClient from './axiosClient';

export const marketplaceApi = {
  getAllProjects: () => axiosClient.get('/v1/projects'),
  getMyProjects: () => axiosClient.get('/v1/projects/my'),
  getProjectsByUser: (userId) => axiosClient.get(`/v1/projects/user/${userId}`),
  createProject: (payload) => axiosClient.post('/v1/projects', payload),
  getBidsByProject: (projectId) => axiosClient.get(`/v1/bids/project/${projectId}`),
  getMyBids: () => axiosClient.get('/v1/bids/my'),
  getBidsByFreelancer: (freelancerId) => axiosClient.get(`/v1/bids/freelancer/${freelancerId}`),
  createBid: (payload) => axiosClient.post('/v1/bids', payload),
  acceptBid: (bidId) => axiosClient.post(`/v1/bids/${bidId}/accept`),
  getMyContracts: () => axiosClient.get('/v1/contracts/my'),
  getContractsByUser: (userId) => axiosClient.get(`/v1/contracts/user/${userId}`),
  getMilestonesByContract: (contractId) => axiosClient.get(`/v1/contracts/${contractId}/milestones`),
  getNotificationsMe: () => axiosClient.get('/v1/notifications/user/me'),
  markNotificationAsRead: (notificationId) => axiosClient.put(`/v1/notifications/${notificationId}/read`),
};

export default marketplaceApi;
