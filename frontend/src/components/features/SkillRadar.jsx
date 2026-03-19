"use client";

import React from 'react';
import { Caption } from '../common/Typography';

/**
 * Skill Radar Chart (SVG) for comparing skills.
 * Strictly sharp, professional look.
 */
const SkillRadar = ({ 
  data = [80, 70, 90, 60, 85], 
  labels = ["Design", "Dev", "Soft Skills", "Business", "Management"],
  size = 300,
  className = "" 
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((val, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * (val / 100) * Math.cos(angle);
    const y = center + radius * (val / 100) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div className="relative bg-white border-2 border-slate-100 p-4 overflow-visible">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Grid lines */}
          {gridLevels.map((lvl, idx) => (
            <polygon
              key={idx}
              points={data.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = center + radius * lvl * Math.cos(angle);
                const y = center + radius * lvl * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          ))}

          {/* Label lines */}
          {data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line 
                key={i} 
                x1={center} y1={center} x2={x} y2={y} 
                stroke="#f1f5f9" strokeWidth="1" 
              />
            );
          })}

          {/* Area */}
          <polygon
            points={points}
            fill="#2563eb15"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinejoin="miter"
          />

          {/* Points */}
          {data.map((val, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * (val / 100) * Math.cos(angle);
            const y = center + radius * (val / 100) * Math.sin(angle);
            return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
          })}

          {/* Labels */}
          {labels.map((label, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + (radius + 25) * Math.cos(angle);
            const y = center + (radius + 20) * Math.sin(angle);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-500 uppercase tracking-tighter"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
      <Caption className="text-secondary-900 font-bold uppercase tracking-widest">Năng lực ứng viên</Caption>
    </div>
  );
};

export default SkillRadar;
