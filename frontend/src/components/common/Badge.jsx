import React from 'react';

/**
 * Common Badge component for status tags.
 * Sharp edges, subtle background colors.
 */
const Badge = ({ children, color = 'info', className = '', ...props }) => {
  const colors = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border ${colors[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
