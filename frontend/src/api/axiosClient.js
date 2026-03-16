import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    // Important: required to send Session/Cookie details to Backend
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptors for handling global request/response patterns
axiosClient.interceptors.request.use(
    (config) => {
        // We can append JWT token here if we move away from Spring Sessions
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        // Unwrap the ApiResponse class from Spring Boot
        if (response.data && response.data.success !== undefined) {
             return response.data;
        }
        return response.data;
    },
    (error) => {
        // Handle global error codes (e.g. 401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // e.g. window.location.href = '/login';
        }
        console.error("API Error", error.response?.data);
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
