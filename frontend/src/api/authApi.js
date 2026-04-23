import axiosClient from './axiosClient';

export const authApi = {
  register: (payload) => axiosClient.post('/v1/auth/register', payload),
  login: (payload) => axiosClient.post('/v1/auth/login', payload),
  logout: () => axiosClient.post('/v1/auth/logout'),
  getProfile: () => axiosClient.get('/v1/auth/profile'),
  updateMyProfile: (payload) => axiosClient.put('/v1/users/me/profile', payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/v1/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  requestPasswordChangeOtp: () => axiosClient.post('/v1/users/me/password/otp'),
  changePassword: (payload) => axiosClient.put('/v1/users/me/password', payload),
  requestEmailChangeOtp: (payload) => axiosClient.post('/v1/users/me/email/otp', payload),
  changeEmail: (payload) => axiosClient.put('/v1/users/me/email', payload),
  verifyEmailOtp: (payload) => axiosClient.post('/v1/auth/verify-email-otp', payload),
  resendVerificationOtp: (email) => axiosClient.post('/v1/auth/resend-verification-otp', { email }),
  getVerificationOtpStatus: (email) => axiosClient.get('/v1/auth/verification-otp-status', { params: { email } }),
};

export default authApi;
