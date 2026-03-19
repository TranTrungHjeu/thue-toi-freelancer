import React from 'react';

/**
 * Common Avatar component.
 * Strict Sharpness: No rounded corners.
 */
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`${sizes[size]} bg-slate-200 border border-slate-300 flex-shrink-0 overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">
          {alt ? alt.charAt(0) : '?'}
        </div>
      )}
    </div>
  );
};

export default Avatar;
