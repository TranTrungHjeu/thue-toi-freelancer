"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MotionDiv = motion.div;
import { Xmark } from 'iconoir-react';
import NavGroup from './NavGroup';
import { H2 } from '../common/Typography';

/**
 * Mobile-specific sliding drawer.
 * Replaces Sidebar on small screens.
 * Strictly sharp with backdrop blur.
 */
const MobileDrawer = ({ 
  isOpen, 
  onClose,
  navigation = [] 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] lg:hidden"
          />

          {/* Drawer Content */}
          <MotionDiv
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[160] lg:hidden flex flex-col border-r border-slate-200"
            style={{ borderRadius: '0px' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <H2 className="text-xl mb-0 font-black tracking-tighter">THUÊ TÔI</H2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 transition-colors">
                <Xmark className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="flex flex-col gap-1 px-4">
                {navigation.map((group, idx) => (
                  <NavGroup 
                    key={idx} 
                    title={group.title} 
                    icon={group.icon} 
                    items={group.items} 
                  />
                ))}
              </nav>
            </div>

            <div className="p-6 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                v1.0.0 Alpha
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
