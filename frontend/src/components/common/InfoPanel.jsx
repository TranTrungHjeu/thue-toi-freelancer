import React from 'react';

const InfoPanel = ({ className = '', children }) => {
  return (
    <div className={`border border-slate-200 bg-white p-4 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default InfoPanel;
