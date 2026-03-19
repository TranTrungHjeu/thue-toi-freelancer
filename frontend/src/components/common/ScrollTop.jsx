"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavArrowUp } from 'iconoir-react';

/**
 * Scroll to Top button.
 * Strictly sharp, glass effect, subtle floating animation.
 */
const ScrollTop = ({ className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ y: -5 }}
          onClick={scrollToTop}
          className={`
            fixed bottom-8 right-8 z-[60] w-12 h-12 glass border border-slate-200 
            flex items-center justify-center text-secondary-900 shadow-xl
            ${className}
          `}
          style={{ borderRadius: '0px' }}
        >
          <NavArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollTop;
