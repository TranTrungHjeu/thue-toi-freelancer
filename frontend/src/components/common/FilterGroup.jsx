"use client";

import React from 'react';
import { Caption } from '../common/Typography';

/**
 * Professional Filter Group for sidebars or search pages.
 * Supports checkbox and radio style interactions.
 */
const FilterGroup = ({ 
  title, 
  options = [], 
  selectedValues = [],
  onChange,
  type = "checkbox",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <Caption className="text-xs font-bold text-secondary-900 border-b border-slate-100 pb-2 uppercase tracking-widest">
        {title}
      </Caption>
      
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <label 
            key={option.value} 
            className="flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-4 h-4 border-2 transition-all flex items-center justify-center
                ${selectedValues.includes(option.value) 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-slate-300 group-hover:border-slate-400 bg-white'}
                ${type === 'radio' ? 'rounded-full' : 'rounded-none'}
              `}>
                {selectedValues.includes(option.value) && (
                  <div className={`w-1.5 h-1.5 bg-white ${type === 'radio' ? 'rounded-full' : 'rounded-none'}`} />
                )}
              </div>
              <span className={`text-sm transition-colors ${selectedValues.includes(option.value) ? 'font-bold text-secondary-900' : 'text-slate-600'}`}>
                {option.label}
              </span>
            </div>
            {option.count && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 border border-slate-100">
                {option.count}
              </span>
            )}
            <input 
              type={type} 
              className="hidden"
              checked={selectedValues.includes(option.value)}
              onChange={() => onChange(option.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default FilterGroup;
