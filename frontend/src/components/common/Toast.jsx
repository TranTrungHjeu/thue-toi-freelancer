"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Xmark, CheckCircle, WarningTriangle, InfoCircle } from "iconoir-react";
import { ToastContext } from '../../contexts/ToastContext';

const MotionDiv = motion.div;
const TOAST_REMOVE_DELAY_MS = 5000;

const getToastId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toastIcons = {
  info: InfoCircle,
  success: CheckCircle,
  error: WarningTriangle,
  warning: WarningTriangle,
};

const toastClasses = {
  info: 'ui-toast-info',
  success: 'ui-toast-success',
  error: 'ui-toast-error',
  warning: 'ui-toast-warning',
};

const toastIconClasses = {
  info: 'ui-toast-icon-info',
  success: 'ui-toast-icon-success',
  error: 'ui-toast-icon-error',
  warning: 'ui-toast-icon-warning',
};

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
    const id = getToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), TOAST_REMOVE_DELAY_MS);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="ui-toast-container">
        <AnimatePresence>
          {toasts.map((toast) => {
            const toastType = toastClasses[toast.type] ? toast.type : 'info';
            const IconComponent = toastIcons[toastType];

            return (
              <MotionDiv
                key={toast.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className={`ui-toast ${toastClasses[toastType]}`}
              >
                <div className="ui-toast-content">
                  <IconComponent className={toastIconClasses[toastType]} />
                  <span className="ui-toast-message">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ui-toast-close"
                  aria-label="Close notification"
                >
                  <Xmark className="h-4 w-4" />
                </button>
              </MotionDiv>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
