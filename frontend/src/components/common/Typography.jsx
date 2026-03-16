import React from 'react';

/**
 * Component Typography (Định dạng văn bản) của nền tảng Thuê Tôi.
 * Chuẩn hoá các Thẻ Tiêu đề (H1-H6) và Đoạn văn (P) theo Font và Màu sắc của Design System.
 */
const Typography = ({
    variant = 'p',
    children,
    className = '',
    color = 'text-gray-900',
    weight = ''
}) => {
    const Component = variant.startsWith('h') ? variant : 'p';

    const variants = {
        h1: "text-3xl sm:text-4xl font-extrabold tracking-tight",
        h2: "text-2xl sm:text-3xl font-bold tracking-tight",
        h3: "text-xl sm:text-2xl font-semibold",
        h4: "text-lg sm:text-xl font-semibold",
        subtitle: "text-base sm:text-lg font-medium text-gray-600",
        p: "text-base leading-relaxed text-gray-700",
        small: "text-sm text-gray-500",
        caption: "text-xs text-gray-400"
    };

    return (
        <Component className={`${variants[variant] || variants.p} ${color} ${weight} ${className}`}>
            {children}
        </Component>
    );
};

export default Typography;
