"use client";

import React from 'react';
import { NavArrowRight, Home } from 'iconoir-react';

/**
 * Professional Breadcrumbs for hierarchical navigation.
 * Strictly sharp, minimal design.
 */
const Breadcrumbs = ({ 
  items = [], 
  className = "" 
}) => {
  return (
    <nav className={`flex items-center gap-2 ${className}`}>
      <a 
        href="#" 
        className="text-slate-400 hover:text-primary-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </a>
      
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <NavArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          {item.path ? (
            <a 
              href={item.path}
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-secondary-900 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-secondary-900">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
