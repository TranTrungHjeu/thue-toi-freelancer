"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'iconoir-react';

const MotionButton = motion.button;

/**
 * Floating Action Button for mobile.
 * Strictly sharp, high visibility.
 */
const FloatingActionButton = ({ 
  icon: Icon = Plus, 
  onClick, 
  className = "" 
}) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        fixed bottom-20 right-6 w-16 h-16 bg-primary-600 text-white 
        shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center 
        z-[90] lg:hidden border-2 border-slate-950 transition-all ${className}
      `}
      style={{ borderRadius: '0px' }}
    >
      <Icon className="w-8 h-8 stroke-2" />
    </MotionButton>
  );
};

export default FloatingActionButton;
