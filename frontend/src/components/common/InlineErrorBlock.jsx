import React from 'react';
import { WarningTriangle } from 'iconoir-react';

/**
 * Reusable inline error block for form surfaces.
 * Keeps the message close to the failing action and aligned with the design system.
 */
const InlineErrorBlock = ({ title, children, className = '' }) => {
  if (!children) {
    return null;
  }

  return (
    <div className={`ui-inline-error-block ${className}`.trim()} role="alert" aria-live="polite">
      <WarningTriangle className="ui-inline-error-icon" aria-hidden="true" />
      <div className="ui-inline-error-content">
        {title ? <p className="ui-inline-error-title">{title}</p> : null}
        <p className="ui-inline-error-message">{children}</p>
      </div>
    </div>
  );
};

export default InlineErrorBlock;