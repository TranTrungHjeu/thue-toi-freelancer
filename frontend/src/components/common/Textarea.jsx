import React from 'react';

const Textarea = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
        </label>
      )}
      <textarea
        className={`ui-field ui-textarea ${error ? 'ui-field-error' : ''}`}
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

export default Textarea;
