"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MotionDiv = motion.div;

/**
 * Success Animation using motion/react.
 * Confetti effects for meaningful moments.
 * Strictly sharp shapes.
 */
const SuccessAnimation = ({ 
  isActive, 
  onComplete,
  className = "" 
}) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 40,
        rotation: Math.random() * 360,
        color: ['#2563eb', '#1e1b4b', '#60a5fa', '#fbbf24', '#10b981'][Math.floor(Math.random() * 5)],
        size: 5 + Math.random() * 10,
        delay: Math.random() * 0.5,
        duration: 2.5 + Math.random(),
        drift: Math.random() * 10 - 5
      }));
      setTimeout(() => setPieces(newPieces), 0);
      
      const timer = setTimeout(() => {
        setPieces([]);
        if (onComplete) onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[200] overflow-hidden ${className}`}>
      <AnimatePresence>
        {pieces.map((p) => (
          <MotionDiv
            key={p.id}
            initial={{ y: -50, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
            animate={{ 
              y: '120vh', 
              x: `${p.x + p.drift}vw`,
              rotate: p.rotation + 720,
              opacity: 0
            }}
            transition={{ 
              duration: p.duration, 
              ease: "circIn",
              delay: p.delay 
            }}
            className="absolute"
            style={{ 
              width: p.size, 
              height: p.size, 
              backgroundColor: p.color,
              borderRadius: '0px'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SuccessAnimation;
