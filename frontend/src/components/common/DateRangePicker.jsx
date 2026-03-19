"use client";

import React from 'react';
import { Calendar, ArrowRight } from 'iconoir-react';
import { Caption } from './Typography';

/**
 * Specialized Date Range Picker (Mockup UI).
 * Strictly sharp, displays start and end dates with a connector.
 */
const DateRangePicker = ({ 
  label,
  startDate = "2024-03-20",
  endDate = "2024-04-20",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <Caption className="font-bold text-secondary-900 uppercase tracking-tighter">{label}</Caption>}
      <div className="flex items-center bg-white border-2 border-slate-950 p-1">
        <div className="flex-1 flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors border-r border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</span>
            <span className="text-sm font-bold">{startDate}</span>
          </div>
        </div>
        <div className="px-2 text-slate-300">
          <ArrowRight className="w-4 h-4" />
        </div>
        <div className="flex-1 flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</span>
            <span className="text-sm font-bold">{endDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
