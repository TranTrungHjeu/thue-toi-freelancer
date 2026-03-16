import React from 'react';

/**
 * Component Ô nhập liệu (Input) của nền tảng Thuê Tôi.
 * Được cấu hình CSS đầy đủ theo Design System với hiệu ứng viền sáng khi được trỏ chuột vào (Focus rings).
 */
const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    required = false,
    className = ''
}) => {

    const id = `input-${name}`;

    return (
        <div className={`mb-5 w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label} {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'
                }`}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
            )}
        </div>
    );
};

export default Input;
