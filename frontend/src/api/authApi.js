import axiosClient from './axiosClient';

export const authApi = {
  register: (payload) => axiosClient.post('/v1/auth/register', payload),
  login: (payload) => axiosClient.post('/v1/auth/login', payload),
  logout: () => axiosClient.post('/v1/auth/logout'),
  getProfile: () => axiosClient.get('/v1/auth/profile'),
  verifyEmailOtp: (payload) => axiosClient.post('/v1/auth/verify-email-otp', payload),
  resendVerificationOtp: (email) => axiosClient.post('/v1/auth/resend-verification-otp', { email }),
};

export default authApi;
