"use client";

import React from 'react';
import { Caption, Text } from '../common/Typography';
import { CheckCircle, Clock, InfoCircle, WarningTriangle } from 'iconoir-react';

/**
 * Vertical Activity Timeline for project/user history.
 * Strictly sharp, semantic iconography.
 */
const ActivityTimeline = ({ 
  activities = [], 
  className = "" 
}) => {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    info: <InfoCircle className="w-4 h-4 text-blue-500" />,
    warning: <WarningTriangle className="w-4 h-4 text-amber-500" />,
    pending: <Clock className="w-4 h-4 text-slate-400" />,
  };

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      {activities.map((activity, idx) => (
        <div key={idx} className="flex gap-4 group">
          <div className="flex flex-col items-center">
            <div className={`
              z-10 p-1.5 bg-white border border-slate-200 transition-all duration-300
              group-hover:border-primary-500 group-hover:shadow-lg
            `} style={{ borderRadius: '0px' }}>
              {icons[activity.status] || icons.info}
            </div>
            {idx !== activities.length - 1 && (
              <div className="w-px h-full bg-slate-200" />
            )}
          </div>
          
          <div className={`
            flex-1 pb-8 group-last:pb-2 transition-transform duration-300
            group-hover:translate-x-1
          `}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-secondary-900">{activity.title}</span>
              <Caption className="text-[10px] font-bold text-slate-400">{activity.time}</Caption>
            </div>
            <Text className="text-xs text-slate-500">{activity.description}</Text>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
