import axios from 'axios';
import { createApiError } from '../utils/apiError';

const ACCESS_TOKEN_STORAGE_KEY = 'thuetoi_access_token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const setAccessToken = (token) => {
    if (typeof window === 'undefined') return;
    if (!token) {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        return;
    }
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = () => {
    if (typeof window === 'undefined') return;
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

const REFRESH_EXCLUDED_PATHS = [
    '/v1/auth/login',
    '/v1/auth/register',
    '/v1/auth/refresh',
    '/v1/auth/logout',
    '/v1/auth/verify-email-otp',
    '/v1/auth/resend-verification-otp',
    '/v1/auth/verification-otp-status',
];

const isRefreshExcludedRequest = (url = '') =>
    REFRESH_EXCLUDED_PATHS.some((path) => url.includes(path));

const isAccessTokenError = (error) => {
    const code = error?.response?.data?.code;
    return code === 'ERR_AUTH_01' || code === 'ERR_AUTH_12';
};

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
        // Trường hợp login/refresh: response data chứa accessToken
        if (response.data?.data?.accessToken) {
            setAccessToken(response.data.data.accessToken);
        }
        // Token rotation khi đổi mật khẩu: backend trả JWT mới thẳng vào data
        // Nhận biết qua URL chứa /me/password và data là chuỗi JWT (bắt đầu bằng eyJ)
        if (
            response.config?.url?.includes('/me/password') &&
            typeof response.data?.data === 'string' &&
            response.data.data.startsWith('eyJ')
        ) {
            setAccessToken(response.data.data);
        }
        if (response.config?.url?.includes('/v1/auth/logout')) {
            clearAccessToken();
        }
        if (response.data?.success === false) {
            return Promise.reject(createApiError(response.data));
        }
        if (response.data && response.data.success !== undefined) {
            return response.data;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401
            && isAccessTokenError(error)
            && originalRequest
            && !originalRequest._retry
            && !isRefreshExcludedRequest(originalRequest.url)
        ) {
            originalRequest._retry = true;
            try {
                refreshPromise ??= refreshClient.post('/v1/auth/refresh');
                const refreshResponse = await refreshPromise;
                refreshPromise = null;

                const newAccessToken = refreshResponse.data?.data?.accessToken;
                setAccessToken(newAccessToken);
                // Chú ý: Bảo toàn đối tượng class AxiosHeaders gốc để tránh crash ngầm trên Axios v1.x
                if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                } else {
                    originalRequest.headers = {
                        Authorization: `Bearer ${newAccessToken}`,
                    };
                }
                return axiosClient(originalRequest);
            } catch (refreshError) {
                refreshPromise = null;
                clearAccessToken();
                localStorage.removeItem('currentUser');
                return Promise.reject(createApiError(refreshError.response?.data || refreshError));
            }
        }


        return Promise.reject(createApiError(error.response?.data || error));
    }
);

export default axiosClient;
