import React from 'react';

/**
 * Common Typography components to ensure correct font pairing (Lora/Manrope).
 */
export const H1 = ({ children, className = '', ...props }) => (
  <h1 className={`font-serif text-4xl font-bold tracking-tight text-secondary-900 ${className}`} {...props}>
    {children}
  </h1>
);

export const H2 = ({ children, className = '', ...props }) => (
  <h2 className={`font-serif text-2xl font-semibold text-secondary-900 ${className}`} {...props}>
    {children}
  </h2>
);

export const Text = ({ children, className = '', ...props }) => (
  <p className={`font-sans text-base leading-relaxed text-slate-700 ${className}`} {...props}>
    {children}
  </p>
);

export const Caption = ({ children, className = '', ...props }) => (
  <span className={`font-sans text-sm text-slate-500 ${className}`} {...props}>
    {children}
  </span>
);
