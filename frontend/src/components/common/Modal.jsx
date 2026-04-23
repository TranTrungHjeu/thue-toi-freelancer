import React from 'react';
import { createPortal } from 'react-dom';
import { Xmark } from 'iconoir-react';
import { AnimatePresence, motion } from 'motion/react';
import Button from './Button';
import { H2 } from './Typography';

/**
 * Thành phần hộp thoại dùng chung theo phong cách giao diện góc cạnh.
 * Animation spring mượt, không vỡ layout.
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 320, damping: 26 } 
    },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <H2 className="!mb-0 text-xl">{title}</H2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-secondary-900 transition-colors"
              >
                <Xmark className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
