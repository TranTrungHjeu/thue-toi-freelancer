"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, Settings, Page, Bell } from 'iconoir-react';
import { Caption } from '../common/Typography';
import Avatar from '../common/Avatar';

/**
 * Professional User Dropdown menu for Header.
 * Strictly sharp, follows the design system's interactive rules.
 */
const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: 'Hồ sơ cá nhân', path: '#profile' },
    { icon: Page, label: 'Dự án của tôi', path: '#my-projects' },
    { icon: Bell, label: 'Thông báo', path: '#notifications' },
    { icon: Settings, label: 'Cài đặt', path: '#settings' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
      >
        <Avatar size="sm" src={user?.avatar} />
        <div className="hidden md:flex flex-col items-start leading-none pr-2">
          <span className="text-sm font-bold text-secondary-900">{user?.name || 'Tài khoản'}</span>
          <Caption className="text-[10px] uppercase font-bold text-primary-600">Freelancer</Caption>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl z-50 p-2"
          >
            <div className="px-3 py-4 border-b border-slate-100 mb-2">
              <span className="block text-sm font-bold text-secondary-900">{user?.email}</span>
              <Caption>ID: #291024</Caption>
            </div>

            <div className="flex flex-col gap-1">
              {menuItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-secondary-900 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-slate-400" />
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  window.location.reload();
                }}
              >
                <LogOut className="w-5 h-5" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
