import React from 'react';

/**
 * Component Khối nội dung (Card) của nền tảng Thuê Tôi.
 * Cung cấp một khung giao diện đồng nhất để chứa các thành phần khác nhau (Gói dịch vụ, Biểu mẫu, Khối thông tin).
 */
const Card = ({
    children,
    className = '',
    onClick,
    hoverable = false
}) => {

    const baseClass = "bg-white rounded-xl border border-gray-100 overflow-hidden";
    const shadowClass = hoverable 
        ? "shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer" 
        : "shadow-sm";

    return (
        <div 
            className={`${baseClass} ${shadowClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
