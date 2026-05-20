import React from 'react';

/**
 * Modern Badge component for status tags.
 * Rounded edges, subtle background colors, and optional pulsing dots.
 */
const Badge = ({ children, color = 'info', className = '', showDot = false, ...props }) => {
  const colors = {
    info: 'ui-badge-info',
    success: 'ui-badge-success',
    warning: 'ui-badge-warning',
    error: 'ui-badge-error',
    primary: 'border-primary-200/50 bg-primary-50/60 text-primary-700 backdrop-blur-xs',
    secondary: 'border-slate-200/50 bg-slate-50/60 text-slate-700 backdrop-blur-xs',
  };

  const dotColors = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    primary: 'bg-primary-500',
    secondary: 'bg-slate-400',
  };

  // Only animate pulsing for dynamic states like 'warning' (pending) or 'info' (in_progress)
  const isPulsing = color === 'info' || color === 'warning';

  return (
    <span
      className={`ui-badge ${colors[color] || colors.info} ${className}`}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
          {isPulsing && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[color] || dotColors.info}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[color] || dotColors.info}`}></span>
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;

