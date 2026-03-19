"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { H2 } from './Typography';

const MotionDiv = motion.div;

/**
 * Mobile-specific Bottom Drawer (Action Sheet).
 * Strictly sharp with backdrop.
 */
const ActionSheet = ({ 
  isOpen, 
  onClose, 
  title, 
  actions = [] 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          {/* Backdrop */}
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Content */}
          <MotionDiv 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-4 left-4 right-4 bg-white border-2 border-slate-950 p-6 flex flex-col gap-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            style={{ borderRadius: '0px' }}
          >
            {title && (
              <div className="mb-4">
                <H2 className="text-lg uppercase tracking-widest text-slate-400 mb-0 font-black">{title}</H2>
              </div>
            )}
            
            <div className="flex flex-col">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => { action.onClick(); onClose(); }}
                  className={`
                    flex items-center gap-4 w-full p-4 border-b last:border-b-0 border-slate-100 
                    active:bg-slate-50 transition-colors text-left
                    ${action.destructive ? 'text-red-500' : 'text-secondary-900'}
                  `}
                >
                  {action.icon && <action.icon className="w-5 h-5 flex-shrink-0" />}
                  <span className="text-sm font-bold uppercase tracking-tight">{action.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="mt-4 w-full p-4 bg-slate-950 text-white font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActionSheet;
