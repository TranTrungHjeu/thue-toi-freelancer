"use client";

import React from 'react';
import { H2, Caption, Text } from '../common/Typography';
import { CheckCircle, Lock, Wallet, Hourglass } from 'iconoir-react';

/**
 * Milestone Tracker for project payments and stages.
 * Strictly sharp, displays status and escrow locking.
 */
const MilestoneTracker = ({ milestones = [], className = "" }) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {milestones.map((ms, idx) => (
        <div key={idx} className="flex gap-4 group">
          <div className="flex flex-col items-center">
            <div className={`
              z-10 w-8 h-8 flex items-center justify-center bg-white border-2 transition-all duration-300
              ${ms.status === 'completed' ? 'border-primary-500 text-primary-500' : 
                ms.status === 'pending' ? 'border-amber-500 text-amber-500' : 'border-slate-200 text-slate-300'}
            `} style={{ borderRadius: '0px' }}>
              {ms.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
               ms.status === 'pending' ? <Hourglass className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            {idx !== milestones.length - 1 && (
              <div className={`w-0.5 h-full ${ms.status === 'completed' ? 'bg-primary-500' : 'bg-slate-200'}`} />
            )}
          </div>

          <div className={`
            flex-1 pb-6 group-last:pb-0
          `}>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 hover:border-primary-300 transition-colors">
              <div className="flex flex-col gap-1">
                <span className={`text-sm font-bold uppercase tracking-tighter ${ms.status === 'locked' ? 'text-slate-400' : 'text-secondary-900'}`}>
                  {ms.title}
                </span>
                <Text className="text-xs text-slate-500">{ms.description}</Text>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 font-bold text-secondary-900">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span>${ms.amount}</span>
                </div>
                <Caption className={`text-[9px] font-bold uppercase ${ms.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>
                  {ms.status === 'completed' ? 'Đã thanh toán' : ms.status === 'pending' ? 'Đang thực hiện' : 'Chưa mở khóa'}
                </Caption>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestoneTracker;
