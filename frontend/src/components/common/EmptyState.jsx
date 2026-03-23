"use client";

import React from 'react';
import { H2, Text } from '../common/Typography';
import Button from '../common/Button';
import { Package } from 'iconoir-react';

/**
 * Empty State component for scenarios with no data.
 * Sharp iconography and clear calls to action.
 */
const EmptyState = ({ 
  icon: IconComponent = Package, 
  title = "Không tìm thấy dữ liệu", 
  description = "Thử thay đổi bộ lọc hoặc tìm kiếm theo từ khóa khác.",
  actionLabel,
  onAction,
  className = "" 
}) => {
  const iconElement = React.createElement(IconComponent, {
    className: "w-12 h-12 text-slate-300",
    strokeWidth: 1.5,
  });

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-slate-100 ${className}`}>
      <div className="bg-slate-50 p-6 border border-slate-200 mb-6">
        {iconElement}
      </div>
      <H2 className="text-2xl mb-2">{title}</H2>
      <Text className="text-slate-500 max-w-sm mb-8">{description}</Text>
      {actionLabel && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;
