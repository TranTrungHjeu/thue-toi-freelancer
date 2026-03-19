"use client";

import React from 'react';
import { Home, Suitcase, ChatBubble, Settings, User } from 'iconoir-react';
import { Caption } from '../common/Typography';

/**
 * Navigation bar fixed to bottom on mobile.
 * Strictly sharp with glass effect.
 */
const BottomNav = ({ className = "" }) => {
  const items = [
    { label: "Trang chủ", icon: Home, active: true },
    { label: "Dự án", icon: Suitcase },
    { label: "Tin nhắn", icon: ChatBubble },
    { label: "Cài đặt", icon: Settings },
    { label: "Tôi", icon: User },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-slate-200 z-[100] grid grid-cols-5 lg:hidden ${className}`}>
      {items.map((item, idx) => (
        <button 
          key={idx}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${item.active ? 'text-primary-600' : 'text-slate-400 hover:text-secondary-900'}`}
        >
          <item.icon className="w-5 h-5" />
          <Caption className={`text-[9px] font-bold uppercase transition-colors ${item.active ? 'text-primary-600' : 'text-slate-400'}`}>
            {item.label}
          </Caption>
          {item.active && (
            <div className="absolute top-0 w-8 h-1 bg-primary-600" />
          )}
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
