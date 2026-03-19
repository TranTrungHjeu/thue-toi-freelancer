"use client";

import React from 'react';
import { motion } from 'motion/react';

const MotionDiv = motion.div;

/**
 * Toggle Group / Segmented Control.
 * Strictly sharp, sliding highlight effect.
 */
const ToggleGroup = ({ 
  options = [], 
  value, 
  onChange,
  className = "" 
}) => {
  return (
    <div className={`inline-flex bg-slate-100 p-1 relative border border-slate-200 ${className}`} style={{ borderRadius: '0px' }}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors
              ${isActive ? 'text-white' : 'text-slate-500 hover:text-secondary-900'}
            `}
          >
            {isActive && (
              <MotionDiv
                layoutId="toggle-highlight"
                className="absolute inset-0 bg-secondary-900 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                style={{ borderRadius: '0px' }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ToggleGroup;
