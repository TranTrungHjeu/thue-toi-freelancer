import React from 'react';

/**
 * Common Button component following "Strict Sharpness" rules.
 * @param {string} variant - 'primary' | 'outline'
 * @param {string} className - Additional classes
 */
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
  
  const variants = {
    primary: 'btn-primary',
    outline: 'btn-outline',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
