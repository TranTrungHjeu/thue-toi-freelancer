"use client";

import React from 'react';
import { InfoCircle, WarningTriangle, CheckCircle, Flash } from 'iconoir-react';
import { Text } from './Typography';

/**
 * Enterprise Callout component for high-visibility inline messages.
 * Strictly sharp with sidebar accent.
 */
const Callout = ({ 
  type = "info", 
  title,
  children,
  className = "" 
}) => {
  const configs = {
    info: {
      bg: "bg-blue-50/50",
      border: "border-blue-100",
      accent: "bg-blue-500",
      icon: <InfoCircle className="w-5 h-5 text-blue-500" />
    },
    warning: {
      bg: "bg-amber-50/50",
      border: "border-amber-100",
      accent: "bg-amber-500",
      icon: <WarningTriangle className="w-5 h-5 text-amber-500" />
    },
    success: {
      bg: "bg-green-50/50",
      border: "border-green-100",
      accent: "bg-green-500",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    danger: {
      bg: "bg-red-50/50",
      border: "border-red-100",
      accent: "bg-red-500",
      icon: <Flash className="w-5 h-5 text-red-500" />
    }
  };

  const config = configs[type];

  return (
    <div className={`flex ${config.bg} border ${config.border} p-4 relative ${className}`} style={{ borderRadius: '0px' }}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />
      <div className="mr-4 mt-0.5">
        {config.icon}
      </div>
      <div className="flex flex-col gap-1">
        {title && (
          <span className="text-sm font-bold text-secondary-900 uppercase tracking-tighter">
            {title}
          </span>
        )}
        <Text className="text-sm text-slate-600">
          {children}
        </Text>
      </div>
    </div>
  );
};

export default Callout;
