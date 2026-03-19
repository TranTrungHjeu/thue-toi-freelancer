"use client";

import React from 'react';
import Table from './Table';
import { Text, Caption } from './Typography';

/**
 * Responsive Table that collapses into cards on mobile.
 */
const ResponsiveTable = ({ 
  headers = [], 
  data = [], 
  renderCard, 
  className = "" 
}) => {
  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table headers={headers} data={data} />
      </div>

      {/* Mobile Card List */}
      <div className="flex flex-col gap-4 lg:hidden">
        {data.map((item, idx) => (
          <div key={idx} className="bg-white border-2 border-slate-950 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {renderCard ? renderCard(item) : (
              <div className="flex flex-col gap-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-slate-50 last:border-b-0 py-1">
                    <Caption className="font-bold uppercase tracking-widest text-[9px] text-slate-400">
                      {h}
                    </Caption>
                    <Text className="text-sm font-bold text-secondary-900">
                      {typeof item[Object.keys(item)[i]] === 'object' ? '...' : item[Object.keys(item)[i]]}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
