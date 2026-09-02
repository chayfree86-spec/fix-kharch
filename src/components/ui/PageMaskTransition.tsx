import React from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';

interface PageMaskTransitionProps {
  pageKey: string;
  children: React.ReactNode;
}

const smoothEasing = [0.16, 1, 0.3, 1] as const;

const pageMaskVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.993,
    clipPath: 'inset(2.5% 0% 0% 0% round 16px)',
    filter: 'blur(2px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    clipPath: 'inset(0% 0% 0% 0% round 0px)',
    filter: 'blur(0px)',
    transition: {
      duration: 0.32,
      ease: smoothEasing,
      clipPath: { duration: 0.32, ease: smoothEasing },
      opacity: { duration: 0.24 },
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.996,
    clipPath: 'inset(0% 0% 2.5% 0% round 16px)',
    filter: 'blur(2px)',
    transition: {
      duration: 0.18,
      ease: smoothEasing,
    },
  },
};

export const PageMaskTransition: React.FC<PageMaskTransitionProps> = ({
  pageKey,
  children,
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        variants={pageMaskVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full will-change-transform transform-gpu"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
