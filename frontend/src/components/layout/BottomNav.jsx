"use client";

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Caption } from '../common/Typography';

const BottomNav = ({ items = [], currentPath = '', className = '' }) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] grid h-16 grid-cols-5 border-t border-slate-200 bg-white/90 backdrop-blur-md lg:hidden ${className}`}>
      {items.map((item) => {
        const isActive = currentPath === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-primary-600' : 'text-slate-400 hover:text-secondary-900'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <Caption className={`text-[9px] font-bold uppercase ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
              {item.label}
            </Caption>
            {isActive && <div className="absolute top-0 h-1 w-8 bg-primary-600" />}
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
