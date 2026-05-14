"use client";

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

  return context;
};

export default useToast;
