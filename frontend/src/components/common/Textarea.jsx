import React from 'react';
import { getFieldErrorMessage } from '../../utils/formError';

const Textarea = ({ label, error, className = '', ...props }) => {
  const normalizedError = getFieldErrorMessage(error);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
        </label>
      )}
      <textarea
        className={`ui-field ui-textarea ${normalizedError ? 'ui-field-error' : ''}`}
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

export default Textarea;
