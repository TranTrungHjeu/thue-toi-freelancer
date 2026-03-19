import React from 'react';

/**
 * Common Spinner component.
 * Strict Sharpness: Using a linear progress approach instead of a circle.
 */
const Spinner = ({ className = '' }) => {
  return (
    <div className={`w-full h-1 bg-slate-100 overflow-hidden ${className}`}>
      <div className="h-full bg-primary-500 animate-[progress_1s_infinite_linear] origin-left w-1/3 shadow-[0_0_10px_var(--primary)]" />
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(333%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
