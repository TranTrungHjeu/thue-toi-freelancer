"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Flash, Suitcase, User, Settings, Xmark } from 'iconoir-react';

/**
 * Enterprise Command Palette (Ctrl+K) for quick navigation.
 * Strictly sharp, centered overlay with blur.
 */
const CommandPalette = ({ isOpen, onClose, actions = [] }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Parent handles open usually
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white border-2 border-slate-950 shadow-2xl overflow-hidden"
            style={{ borderRadius: '0px' }}
          >
            <div className="flex items-center px-4 py-4 border-b-2 border-slate-100">
              <Search className="w-6 h-6 text-slate-400 mr-4" />
              <input 
                autoFocus
                type="text"
                placeholder="Tìm kiếm hành động hoặc dự án... (ESC để thoát)"
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-secondary-900 placeholder-slate-300"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200">
                ESC
              </div>
            </div>

            <div className="max-height-[60vh] overflow-y-auto py-2">
              {filteredActions.length > 0 ? (
                filteredActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        {action.icon || <Flash className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-secondary-900 uppercase tracking-tighter">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.description}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 group-hover:text-primary-600">
                      ENTER
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Flash className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Không tìm thấy kết quả phù hợp</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <span className="bg-white border p-1">↑↓</span> Di chuyển
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <span className="bg-white border p-1">ENTER</span> Chọn
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
