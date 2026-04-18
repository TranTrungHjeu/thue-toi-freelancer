import React from 'react';

const InfoPanel = ({ className = '', children }) => {
  return (
    <div className={`border border-slate-200 bg-slate-50 p-4 ${className}`}>
      {children}
    </div>
  );
};

export default InfoPanel;
