import React from 'react';

/**
 * Common Card component following "Strict Sharpness".
 * No rounded corners, thin borders.
 */
const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`sharp-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
