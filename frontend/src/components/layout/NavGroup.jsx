"use client";

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavArrowDown } from 'iconoir-react';
import AnimatedIcon from '../common/AnimatedIcon';

const MotionDiv = motion.div;

/**
 * Nhóm điều hướng có thể thu gọn trong thanh bên.
 * Hỗ trợ nhiều cấp hiển thị theo phong cách giao diện góc cạnh.
 */
const NavGroup = ({ 
  icon: Icon, 
  label, 
  items = [], 
  isOpen: initialOpen = false,
  activePath = "" 
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors w-full
          ${isOpen ? 'bg-slate-50 text-secondary-900' : 'text-slate-600 hover:bg-slate-50 hover:text-secondary-900'}
        `}
      >
        <div className="flex items-center gap-3">
          {Icon && <AnimatedIcon icon={Icon} animation="scale" />}
          <span>{label}</span>
        </div>
        <MotionDiv
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <NavArrowDown className="w-4 h-4 text-slate-400" />
        </MotionDiv>
      </button>

      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50"
          >
            <div className="flex flex-col pl-11 pr-3 py-1">
              {items.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  className={`
                    block py-2 text-xs font-semibold uppercase tracking-wider transition-colors
                    ${activePath === item.path ? 'text-primary-600' : 'text-slate-400 hover:text-secondary-900'}
                  `}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavGroup;
