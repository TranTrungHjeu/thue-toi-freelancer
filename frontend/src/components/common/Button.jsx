import React from 'react';

/**
 * Component Nút bấm (Button) của nền tảng Thuê Tôi.
 * Đáp ứng đầy đủ các tiêu chuẩn giao diện cao cấp trong tài liệu hướng dẫn Design System.
 */
const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    size = 'md',
    isLoading = false, 
    disabled = false, 
    className = '',
    fullWidth = false 
}) => {
    
    const baseClass = "inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Các biến thể màu sắc cốt lõi dựa theo tài liệu thiết kế (design_system.md)
    const variants = {
        primary: "bg-green-600 text-white hover:bg-green-700 hover:shadow-md focus:ring-green-500",
        secondary: "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md focus:ring-slate-900",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-green-500",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseClass} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;
