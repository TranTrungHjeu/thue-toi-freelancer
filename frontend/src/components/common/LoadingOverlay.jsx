"use client";

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Caption } from '../common/Typography';
import Spinner from './Spinner';

/**
 * Full container or screen loading overlay.
 * Backdrop blur, strictly sharp.
 */
const LoadingOverlay = ({ 
  isActive, 
  message = "Hệ thống đang xử lý...",
  className = "" 
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center ${className}`}
        >
          <div className="flex flex-col items-center gap-4 bg-white p-8 border-2 border-slate-950 shadow-2xl min-w-[200px]">
            <Spinner />
            <Caption className="font-bold text-secondary-900 uppercase tracking-widest">{message}</Caption>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
