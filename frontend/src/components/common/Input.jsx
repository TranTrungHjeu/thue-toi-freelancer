import React from 'react';

/**
 * Thành phần ô nhập liệu dùng chung, hỗ trợ nhãn và hiển thị lỗi.
 * Giữ phong cách giao diện góc cạnh, không bo tròn.
 */
const Input = ({ label, error, className = '', type, ...props }) => {
  const isDateInput = type === 'date';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`ui-field ${isDateInput ? 'ui-field-date' : ''} ${error ? 'ui-field-error' : ''}`}
        {...props}
      />
      {error && (
        <span className="ui-error-text">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
