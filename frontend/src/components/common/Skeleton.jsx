"use client";

import React from 'react';

/**
 * Skeleton loading placeholder.
 * Strictly sharp edges with pulse animation.
 */
const Skeleton = ({ width = "w-full", height = "h-4", className = "" }) => {
  return (
    <div 
      className={`bg-slate-100 animate-pulse rounded-none ${width} ${height} ${className}`}
    />
  );
};

export default Skeleton;
