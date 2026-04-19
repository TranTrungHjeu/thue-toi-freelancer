"use client";

import React, { useState } from 'react';
import { Star, StarSolid } from 'iconoir-react';
import { Caption } from './Typography';
import { getFieldErrorMessage } from '../../utils/formError';

/**
 * Interactive Rating component for reviews.
 * Strictly sharp, supports hover states and selection.
 */
const InteractiveRating = ({ 
  label,
  max = 5, 
  initialRating = 0, 
  onChange,
  error,
  className = "" 
}) => {
  const normalizedError = getFieldErrorMessage(error);
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleClick = (val) => {
    setRating(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <Caption className="font-bold text-secondary-900 uppercase tracking-tighter">{label}</Caption>}
      <div className="flex items-center gap-1.5">
        {[...Array(max)].map((_, i) => {
          const val = i + 1;
          const isFilled = (hover || rating) >= val;
            return (
              <button
                key={val}
                type="button"
                onMouseEnter={() => setHover(val)}
                onMouseLeave={() => setHover(0)}
                onClick={() => handleClick(val)}
              className="p-1 transition-transform active:scale-90"
            >
              {isFilled ? (
                <StarSolid className={`w-8 h-8 ${val <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'}`} />
              ) : (
                <Star className="w-8 h-8 text-slate-200" />
              )}
            </button>
          );
        })}
        <span className="ml-2 text-lg font-bold text-secondary-900">{rating}.0</span>
      </div>
      {normalizedError && <span className="ui-error-text">{normalizedError}</span>}
    </div>
  );
};

export default InteractiveRating;
