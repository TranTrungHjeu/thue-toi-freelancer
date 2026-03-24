import React from 'react';

/**
 * Thành phần nút dùng chung theo quy chuẩn giao diện góc cạnh.
 * @param {string} variant - 'primary' | 'outline' | 'ghost' | 'danger'
 * @param {string} className - Lớp CSS bổ sung
 */
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
  
  const variants = {
    primary: 'border-2 border-primary-600 bg-primary-600 text-white hover:border-primary-700 hover:bg-primary-700',
    outline: 'border-2 border-secondary-900 bg-white text-secondary-900 hover:bg-secondary-900 hover:text-white',
    ghost: 'border-2 border-transparent bg-transparent text-secondary-900 hover:border-slate-200 hover:bg-slate-100',
    danger: 'border-2 border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
