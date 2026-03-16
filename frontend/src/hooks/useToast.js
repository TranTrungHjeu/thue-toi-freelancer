import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Custom hook hỗ trợ hiển thị Thông báo toàn cục.
 * Gói gọn ToastContext để dễ dàng import và sử dụng.
 * 
 * Usage:
 * const toast = useToast();
 * toast.success('Login successful');
 * toast.error('Payment failed');
 */
export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast } = context;

    return {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        warn: (msg) => addToast(msg, 'warn')
    };
};

export default useToast;
