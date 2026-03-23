"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Refresh } from 'iconoir-react';

const MotionDiv = motion.div;

/**
 * Simple Pull To Refresh visual indicator.
 * Displays when a certain scroll threshold is met.
 */
const PullToRefresh = ({ isRefreshing }) => {
  return (
    <AnimatePresence>
      {isRefreshing && (
        <MotionDiv
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="flex items-center justify-center py-4 absolute top-0 left-0 right-0 z-50 bg-white border-b-2 border-slate-950"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Refresh className="w-5 h-5 text-primary-600" />
            </motion.div>
            <span className="text-xs font-black uppercase tracking-widest text-secondary-900">
              Đang làm mới...
            </span>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default PullToRefresh;
