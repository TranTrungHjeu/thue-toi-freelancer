"use client";

import { useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { createApiError } from '../utils/apiError';

/**
 * Custom hook quản lý các giao dịch API bất đồng bộ.
 * Xử lý các trạng thái: Đang tải (loading), dữ liệu trả về (data), và lỗi (error).
 * Tự động xử lý trạng thái Loading, Data và Error
 * bắt định dạng ApiResponse tiêu chuẩn.
 *
 * @returns {Object} { data, loading, error, execute }
 */
export const useFetch = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (method, url, payload = null, options = {}) => {
        setLoading(true);
        setError(null);
        try {
            const config = { method, url, ...options };
            if (payload) {
                if (method.toLowerCase() === 'get') {
                    config.params = payload;
                } else {
                    config.data = payload;
                }
            }
            
            const response = await axiosClient(config);
            const result = response;
            if (result.success) {
                setData(result.data);
                return result.data;
            } else {
                throw createApiError(result, 'Không thể hoàn thành yêu cầu.');
            }
            
        } catch (err) {
            const errorObj = createApiError(err, 'Không thể kết nối tới hệ thống.');
            
            setError(errorObj);
            throw errorObj; // Ném lỗi ra ngoài để component giao diện xử lý (VD: Hiện thông báo Toast)
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, execute };
};

export default useFetch;
