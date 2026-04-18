import React from 'react';
import Card from './Card';
import LoadingValue from './LoadingValue';

const StatMetricCard = ({
  label,
  value,
  isLoading = false,
  className = '',
  labelClassName = 'text-slate-500',
}) => {
  return (
    <Card className={`border-2 border-slate-200 bg-white p-5 ${className}`}>
      <div className={`text-[11px] uppercase tracking-[0.18em] ${labelClassName}`}>
        {label}
      </div>
      <div className="mt-4 text-4xl font-black text-secondary-900">
        <LoadingValue isLoading={isLoading} value={value} />
      </div>
    </Card>
  );
};

export default StatMetricCard;
