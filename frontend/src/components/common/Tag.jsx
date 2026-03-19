"use client";

import React from 'react';
import { Xmark } from 'iconoir-react';

/**
 * Tag component for skills or categories.
 * Strictly sharp, fits the platform's color system.
 */
const Tag = ({ 
  children, 
  color = 'slate', 
  onRemove, 
  className = "" 
}) => {
  const colors = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider
      border rounded-none transition-colors
      ${colors[color] || colors.slate}
      ${className}
    `}>
      {children}
      {onRemove && (
        <button 
          onClick={onRemove}
          className="hover:text-secondary-900 transition-colors"
        >
          <Xmark className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Tag;
