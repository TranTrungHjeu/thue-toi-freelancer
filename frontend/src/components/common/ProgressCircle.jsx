"use client";

import React from 'react';
import { Caption } from '../common/Typography';

/**
 * Circular Progress indicator for profile completion or project status.
 * Strictly sharp implementation of a circle using SVG.
 */
const ProgressCircle = ({ 
  value = 0, 
  size = 64, 
  strokeWidth = 6,
  label,
  className = "" 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Circle */}
          <circle
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Circle */}
          <circle
            className="text-primary-500 transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="square"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-secondary-900">{value}%</span>
        </div>
      </div>
      {label && (
        <Caption className="text-[10px] uppercase font-bold text-slate-500">{label}</Caption>
      )}
    </div>
  );
};

export default ProgressCircle;
