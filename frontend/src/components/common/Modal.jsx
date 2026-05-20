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
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    'full': 'max-w-[95vw]'
  };

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative bg-white w-full ${sizeClasses[size] || sizeClasses.md} border border-slate-200 shadow-2xl overflow-hidden rounded-none`}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <H2 className="!mb-0 text-xl">{title}</H2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-secondary-900 transition-colors"
                >
                  <Xmark className="w-6 h-6" />
                </button>
              </div>
            )}

            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-none text-white/70 hover:text-white transition-all shadow-lg border border-white/10"
              >
                <Xmark className="w-5 h-5" />
              </button>
            )}

            <div className={title ? 'p-6' : ''}>
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

