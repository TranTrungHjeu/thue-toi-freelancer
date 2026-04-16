"use client";

import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Xmark } from 'iconoir-react';
import { H2 } from '../common/Typography';
import Button from '../common/Button';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useI18n } from '../../hooks/useI18n';

const MotionDiv = motion.div;

const MobileDrawer = ({
  isOpen,
  onClose,
  navigation = [],
  currentPath = '',
  onLogout,
}) => {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />

          <MotionDiv
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 top-0 z-[160] flex w-[280px] flex-col border-r border-slate-200 bg-white lg:hidden"
            style={{ borderRadius: '0px' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <H2 className="mb-0 text-xl font-black tracking-tighter uppercase">{t('app.brand')}</H2>
              <button onClick={onClose} className="p-2 transition-colors hover:bg-slate-100">
                <Xmark className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="flex flex-col gap-1 px-4">
                {navigation.map((group) => (
                  <div key={group.title} className="mb-4 border-b border-slate-100 pb-4 last:border-b-0">
                    <div className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {group.title}
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      {group.items.map((item) => {
                        const isActive = currentPath === item.to;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`flex items-center gap-3 border-l-4 px-3 py-3 text-sm font-semibold ${
                              isActive
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-secondary-900'
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 p-6">
              <LanguageSwitcher className="w-full" />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:border-red-100 hover:bg-red-50"
                onClick={async () => {
                  await onLogout?.();
                  onClose();
                }}
              >
                <LogOut className="h-5 w-5" />
                {t('layout.logout')}
              </Button>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t('layout.version')}
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
