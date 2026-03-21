import axios from 'axios';

const ACCESS_TOKEN_STORAGE_KEY = 'thuetoi_access_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

export const setAccessToken = (token) => {
    if (!token) {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        return;
    }
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    // Dùng để gửi cookie refresh token HttpOnly khi cần refresh access token
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshPromise = null;

axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        if (response.data?.data?.accessToken) {
            setAccessToken(response.data.data.accessToken);
        }
        if (response.config?.url?.includes('/v1/auth/logout')) {
            clearAccessToken();
        }
        if (response.data && response.data.success !== undefined) {
            return response.data;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        const isAuthRequest = originalRequest?.url?.includes('/v1/auth/login')
            || originalRequest?.url?.includes('/v1/auth/register')
            || originalRequest?.url?.includes('/v1/auth/refresh')
            || originalRequest?.url?.includes('/v1/auth/verify-email-otp')
            || originalRequest?.url?.includes('/v1/auth/resend-verification-otp');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;
            try {
                refreshPromise ??= refreshClient.post('/v1/auth/refresh');
                const refreshResponse = await refreshPromise;
                refreshPromise = null;

                const newAccessToken = refreshResponse.data?.data?.accessToken;
                setAccessToken(newAccessToken);
                originalRequest.headers = {
                    ...(originalRequest.headers || {}),
                    Authorization: `Bearer ${newAccessToken}`,
                };
                return axiosClient(originalRequest);
            } catch (refreshError) {
                refreshPromise = null;
                clearAccessToken();
                localStorage.removeItem('currentUser');
                return Promise.reject(refreshError.response?.data || refreshError);
            }
        }

        console.error('API Error', error.response?.data);
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
