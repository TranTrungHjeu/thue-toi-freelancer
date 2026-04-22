import React from 'react';

const LoadingValue = ({ isLoading, value, fallback = '...' }) => {
  return isLoading ? fallback : value;
};

export default LoadingValue;
