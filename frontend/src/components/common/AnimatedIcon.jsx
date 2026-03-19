"use client";

import React from 'react';
import { motion, useAnimation } from "motion/react";

/**
 * A wrapper to add "itshover" style animations to any icon.
 * @param {React.ElementType} icon - The Icon component to animate.
 * @param {string} animation - Type of animation: 'float', 'rotate', 'scale', 'swing'.
 */
const AnimatedIcon = ({ icon: Icon, animation = 'float', size = 20, className = "" }) => {
  const controls = useAnimation();

  const handleMouseEnter = () => {
    switch (animation) {
      case 'float':
        controls.start({ y: [0, -4, 0], transition: { duration: 0.3 } });
        break;
      case 'rotate':
        controls.start({ rotate: [0, 90], transition: { duration: 0.5 } });
        break;
      case 'scale':
        controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
        break;
      case 'swing':
        controls.start({ rotate: [0, -15, 15, -10, 10, 0], transition: { duration: 0.5 } });
        break;
      default:
        controls.start({ scale: [1, 1.1, 1], transition: { duration: 0.2 } });
    }
  };

  return (
    <motion.div 
      onMouseEnter={handleMouseEnter}
      animate={controls}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <Icon width={size} height={size} strokeWidth={1.5} />
    </motion.div>
  );
};

export default AnimatedIcon;
