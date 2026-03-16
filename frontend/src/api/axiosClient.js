import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    // Quan trọng: Bắt buộc để gửi thông tin Session/Cookie lên Backend
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptors để xử lý các luồng Request/Response ở cấp độ toàn cục
axiosClient.interceptors.request.use(
    (config) => {
        // Có thể đính kèm JWT token ở đây nếu hệ thống không dùng Spring Sessions nữa
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        // Bóc tách lớp vỏ ApiResponse từ Spring Boot trả về
        if (response.data && response.data.success !== undefined) {
             return response.data;
        }
        return response.data;
    },
    (error) => {
        // Xử lý các mã lỗi hệ thống toàn cục (Ví dụ: 401 Unauthorized - Hết hạn đăng nhập)
        if (error.response && error.response.status === 401) {
            // Ví dụ: window.location.href = '/login';
        }
        console.error("API Error", error.response?.data);
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
