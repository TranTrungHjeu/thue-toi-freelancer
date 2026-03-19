"use client";

import React from 'react';
import { Caption } from '../common/Typography';

/**
 * Enterprise Activity Charts (using SVG).
 * Simple line chart for business analytics.
 * Strictly sharp, professional layout.
 */
const ActivityCharts = ({ 
  title = "Doanh thu dự kiến",
  data = [40, 65, 52, 85, 71, 95, 88], 
  labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  className = "" 
}) => {
  const width = 400;
  const height = 150;
  const padding = 20;
  const maxVal = Math.max(...data);
  
  const points = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`bg-white border-2 border-slate-100 p-6 flex flex-col gap-6 ${className}`}>
      <div className="flex items-center justify-between">
        <Caption className="font-bold text-secondary-900 border-l-4 border-primary-500 pl-3 uppercase tracking-widest">
          {title}
        </Caption>
        <div className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5">
          +12.4% tháng này
        </div>
      </div>

      <div className="relative w-full h-[150px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" />
          
          {/* Gradient area */}
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <path 
            d={`M ${padding},${height-padding} L ${points} L ${width-padding},${height-padding} Z`}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinejoin="miter"
            points={points}
          />

          {/* Points */}
          {data.map((val, i) => {
            const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
            const y = height - padding - (val / maxVal) * (height - 2 * padding);
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="4" 
                fill="white" 
                stroke="#2563eb" 
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer" 
              />
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between px-2">
        {labels.map((label, idx) => (
          <Caption key={idx} className="font-bold text-slate-400">{label}</Caption>
        ))}
      </div>
    </div>
  );
};

export default ActivityCharts;
