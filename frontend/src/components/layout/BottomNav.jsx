"use client";

import Link from 'next/link';


import React from 'react';

import { Caption } from '../common/Typography';

const BottomNav = ({ items = [], currentPath = '', className = '' }) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] grid h-16 grid-cols-5 border-t border-slate-200 bg-white/90 backdrop-blur-md lg:hidden ${className}`}>
      {items.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-primary-600' : 'text-slate-400 hover:text-secondary-900'
            }`}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span
                  className="absolute -right-3 -top-2 min-w-4 border border-white bg-red-500 px-1 text-[9px] font-black leading-4 text-white"
                  aria-label={item.badgeLabel}
                >
                  {item.badge}
                </span>
              )}
            </span>
            <Caption className={`text-[9px] font-bold uppercase ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
              {item.label}
            </Caption>
            {isActive && <div className="absolute top-0 h-1 w-8 bg-primary-600" />}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
