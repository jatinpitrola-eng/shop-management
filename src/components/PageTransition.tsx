'use client';
// Page transitions — spring slide between views. Wrap any view with this.
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  viewKey: string; // unique per view (e.g. the view name)
  children: React.ReactNode;
}

export function PageTransition({ viewKey, children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, x: 24, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.96 }}
        transition={{
          duration: 0.32,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
