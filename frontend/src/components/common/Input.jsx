import React from 'react';
import { getFieldErrorMessage } from '../../utils/formError';

/**
 * Thành phần ô nhập liệu dùng chung, hỗ trợ nhãn và hiển thị lỗi.
 * Giữ phong cách giao diện góc cạnh, không bo tròn.
 */
const Input = ({ label, error, className = '', type, ...props }) => {
  const isDateInput = type === 'date';
  const normalizedError = getFieldErrorMessage(error);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`ui-field ${isDateInput ? 'ui-field-date' : ''} ${normalizedError ? 'ui-field-error' : ''}`}
        {...props}
      />
      {normalizedError && (
        <span className="ui-error-text">
          {normalizedError}
        </span>
      )}
    </div>
  );
};

export default Input;
