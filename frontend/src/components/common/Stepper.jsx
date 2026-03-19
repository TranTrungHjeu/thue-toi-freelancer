"use client";

import React from 'react';
import { motion } from "motion/react";
import { Check } from "iconoir-react";

/**
 * Stepper component for multi-step processes.
 */
const Stepper = ({ steps, currentStep, className = "" }) => {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          {/* Step Circle/Box */}
          <div className="relative flex flex-col items-center group">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: idx <= currentStep ? "var(--color-primary-500)" : "var(--color-slate-100)",
                borderColor: idx <= currentStep ? "var(--color-primary-600)" : "var(--color-slate-200)",
              }}
              className={`
                w-10 h-10 border-2 flex items-center justify-center font-bold text-sm
                transition-colors duration-300 z-10
                ${idx < currentStep ? 'text-white' : idx === currentStep ? 'text-white' : 'text-slate-400'}
              `}
              style={{ borderRadius: '0px' }} // Explicitly square
            >
              {idx < currentStep ? (
                <Check className="w-6 h-6" strokeWidth={2.5} />
              ) : (
                idx + 1
              )}
            </motion.div>
            
            {/* Label */}
            <div className="absolute top-12 whitespace-nowrap">
              <span className={`text-[10px] uppercase font-bold tracking-widest ${idx === currentStep ? 'text-secondary-900' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
          </div>

          {/* Connector Line */}
          {idx < steps.length - 1 && (
            <div className="flex-1 h-[2px] bg-slate-100 mx-2 relative overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: idx < currentStep ? "100%" : "0%" }}
                className="absolute inset-0 bg-primary-500"
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
