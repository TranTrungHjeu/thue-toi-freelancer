"use client";

import React from 'react';
import Card from './Card';
import { H2, Text } from './Typography';
import AnimatedIcon from './AnimatedIcon';
import { motion } from "motion/react";

const MotionDiv = motion.div;

/**
 * StatCard component for dashboard metrics.
 * Follows "Strict Sharpness" with interactive icon.
 */
const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  animation = 'float',
  className = "" 
}) => {
  const isPositive = trend === 'up';

  return (
    <Card className={`relative overflow-hidden group hover:border-primary-500 transition-colors ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
          {Icon && <AnimatedIcon icon={Icon} animation={animation} size={24} className="text-secondary-900 group-hover:text-primary-600" />}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div>
        <Text className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</Text>
        <MotionDiv
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <H2 className="!mb-0 text-3xl font-bold tracking-tighter text-secondary-900">
            {value}
          </H2>
        </MotionDiv>
      </div>

      {/* Subtle background accent */}
      <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {Icon && <Icon width={80} height={80} strokeWidth={1} />}
      </div>
    </Card>
  );
};

export default StatCard;
