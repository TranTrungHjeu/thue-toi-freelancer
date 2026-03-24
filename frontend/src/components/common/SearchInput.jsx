"use client";

import React, { useState } from 'react';
import { Search, Xmark } from 'iconoir-react';

/**
 * Professional Search Input with icon and clear button.
 */
const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Tìm dự án, kỹ năng...", 
  className = "" 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative flex items-center group ${className}`}>
      <div className={`
        absolute left-4 transition-colors
        ${isFocused ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-500'}
      `}>
        <Search className="w-5 h-5" strokeWidth={2} />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-10 py-3 bg-white border outline-none font-sans text-sm transition-all
          ${isFocused ? 'border-primary-500 ring-4 ring-primary-50' : 'border-slate-200 hover:border-slate-300'}
          rounded-none
        `}
      />

      {value && (
        <button
          onClick={() => onChange({ target: { value: '' } })}
          className="absolute right-4 text-slate-400 hover:text-secondary-900 transition-colors"
        >
          <Xmark className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
