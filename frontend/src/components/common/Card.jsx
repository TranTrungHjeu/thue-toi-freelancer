import React from 'react';

/**
 * Thành phần thẻ nội dung dùng chung theo phong cách giao diện góc cạnh.
 * Không bo tròn và dùng đường viền mảnh.
 */
const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`sharp-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
