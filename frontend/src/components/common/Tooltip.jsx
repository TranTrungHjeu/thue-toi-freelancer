"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Sharp Tooltip for micro-explanations.
 * Strictly sharp borders, minimal animation.
 */
const Tooltip = ({ 
  children, 
  text, 
  position = "top",
  className = "" 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute z-50 px-2 py-1 bg-secondary-900 text-white text-[10px] font-bold 
              uppercase tracking-widest whitespace-nowrap pointer-events-none
              ${positions[position]}
            `}
            style={{ borderRadius: '0px' }}
          >
            {text}
            {/* Minimal square arrow would be better than nothing, but keeping it strictly sharp */}
            <div className={`
              absolute w-2 h-2 bg-secondary-900 transform rotate-45
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
