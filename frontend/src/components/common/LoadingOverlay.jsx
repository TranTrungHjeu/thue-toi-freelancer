"use client";

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Spinner from './Spinner';

const MotionDiv = motion.div;

/**
 * Full container or screen loading overlay.
 * Backdrop blur, strictly sharp.
 */
const LoadingOverlay = ({
  isActive,
  className = "",
  spinnerSize = 'lg',
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-50 backdrop-blur-md flex items-center justify-center ${className}`}
        >
          <Spinner size={spinnerSize} />
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
