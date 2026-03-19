"use client";

import React from 'react';
import Avatar from './Avatar';

/**
 * Avatar Group for teams or multiple collaborators.
 * Overlapping square avatars, strictly sharp.
 */
const AvatarGroup = ({ 
  users = [], 
  size = "md", 
  max = 4,
  className = "" 
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex items-center -space-x-3 ${className}`}>
      {visibleUsers.map((user, idx) => (
        <div key={idx} className="relative transition-transform hover:-translate-y-1 hover:z-20">
          <Avatar 
            src={user.avatar} 
            alt={user.name} 
            size={size}
            className="border-2 border-white shadow-sm"
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className={`
          ${sizeClasses[size]}
          bg-slate-100 border-2 border-white flex items-center justify-center
          text-[10px] font-bold text-slate-500 z-10 transition-transform hover:-translate-y-1
        `} style={{ borderRadius: '0px' }}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
