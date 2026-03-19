"use client";

import React from 'react';
import { motion } from 'motion/react';

const MotionDiv = motion.div;

/**
 * Full-width Segmented Control for mobile.
 */
const SegmentedControl = ({ 
  options = [], 
  value, 
  onChange,
  className = "" 
}) => {
  return (
    <div className={`flex bg-slate-100 p-1 border-2 border-slate-950 lg:hidden ${className}`} style={{ borderRadius: '0px' }}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors z-10
              ${isActive ? 'text-white' : 'text-slate-500'}
            `}
          >
            {isActive && (
              <MotionDiv
                layoutId="segmented-highlight"
                className="absolute inset-0 bg-secondary-900 -z-10"
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
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

export default SegmentedControl;
