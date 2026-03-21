import React from 'react';

const Textarea = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-secondary-900 font-sans">
          {label}
        </label>
      )}
      <textarea
        className={`
          min-h-32 border-2 px-4 py-3 bg-white resize-y
          focus:border-primary-500 focus:ring-0 outline-none
          transition-colors font-sans
          ${error ? 'border-error' : 'border-slate-300'}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-error font-sans italic">
          {error}
        </span>
      )}
    </div>
  );
};

export default Textarea;
