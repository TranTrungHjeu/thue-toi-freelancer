import React from 'react';

/**
 * Common Badge component for status tags.
 * Sharp edges, subtle background colors.
 */
const Badge = ({ children, color = 'info', className = '', ...props }) => {
  const colors = {
    info: 'ui-badge-info',
    success: 'ui-badge-success',
    warning: 'ui-badge-warning',
    error: 'ui-badge-error',
  };

  return (
    <span
      className={`ui-badge ${colors[color] || colors.info} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
