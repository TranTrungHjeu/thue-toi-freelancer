"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Xmark, CheckCircle, WarningTriangle, InfoCircle } from "iconoir-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

/**
 * Global Toast Notification System.
 * Strictly sharp, semantic colors, motion-driven.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const icons = {
    info: <InfoCircle className="text-blue-500" />,
    success: <CheckCircle className="text-green-500" />,
    error: <WarningTriangle className="text-red-500" />,
    warning: <WarningTriangle className="text-amber-500" />,
  };

  const borders = {
    info: 'border-blue-500',
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-amber-500',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`
                pointer-events-auto bg-white border-l-4 p-4 shadow-xl flex items-center justify-between gap-4
                ${borders[toast.type]}
              `}
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-3">
                {icons[toast.type]}
                <span className="text-sm font-semibold text-secondary-900">{toast.message}</span>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-slate-300 hover:text-slate-600 transition-colors"
              >
                <Xmark className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
