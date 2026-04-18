import React from 'react';

const Select = ({ label, error, options = [], className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
        </label>
      )}
      <div className="ui-select-wrap">
        <select
          className={`ui-field ui-select ${error ? 'ui-field-error' : ''}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="ui-select-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {error && (
        <span className="ui-error-text">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
