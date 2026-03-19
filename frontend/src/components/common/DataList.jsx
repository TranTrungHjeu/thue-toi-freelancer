"use client";

import React from 'react';
import { Caption, Text } from './Typography';

/**
 * Data List for structured metadata.
 * Strictly sharp, displays Key-Value pairs in a grid or list.
 */
const DataList = ({ 
  items = [], 
  columns = 1,
  className = "" 
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4 hover:border-primary-500 transition-colors">
          <Caption className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
            {item.label}
          </Caption>
          <div className="flex items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4 text-slate-400" />}
            <Text className="font-bold text-secondary-900">{item.value}</Text>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataList;
