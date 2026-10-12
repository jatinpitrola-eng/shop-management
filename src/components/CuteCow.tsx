'use client';
// Cute animated dairy cow — sweet SVG with blinking eyes, swishing tail, chewing mouth.
// Used on the intro screen + login screen + dashboard hero area.

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function CuteCow({ size = 120 }: { size?: number }) {
  const [blink, setBlink] = useState(false);

  // Blink every 3-4s
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3000 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
      }}
    >
      {/* Gentle bobbing motion */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
          {/* Shadow under cow */}
          <ellipse cx="60" cy="110" rx="32" ry="4" fill="#0B7A4B" opacity="0.12" />

          {/* Tail — swishing */}
          <motion.g
            style={{ transformOrigin: '88px 70px' }}
            animate={{ rotate: [0, 25, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M88 70Q98 78 96 92Q94 100 90 100" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="91" cy="102" r="4" fill="#FFD8E0" />
          </motion.g>

          {/* Body */}
          <ellipse cx="60" cy="74" rx="30" ry="22" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2" />

          {/* Body spots */}
          <ellipse cx="50" cy="68" rx="7" ry="5" fill="#2C3E50" />
          <ellipse cx="72" cy="78" rx="9" ry="6" fill="#2C3E50" />
          <ellipse cx="44" cy="80" rx="4" ry="3" fill="#2C3E50" opacity="0.7" />

          {/* Legs */}
          <rect x="44" y="92" width="6" height="14" rx="2" fill="#2C3E50" />
          <rect x="56" y="94" width="6" height="14" rx="2" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="1.5" />
          <rect x="68" y="94" width="6" height="14" rx="2" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="1.5" />
          <rect x="80" y="92" width="6" height="14" rx="2" fill="#2C3E50" />

          {/* Udder */}
          <ellipse cx="60" cy="92" rx="8" ry="5" fill="#FFB3C1" />
          <circle cx="56" cy="93" r="1.5" fill="#E8808F" />
          <circle cx="60" cy="94" r="1.5" fill="#E8808F" />
          <circle cx="64" cy="93" r="1.5" fill="#E8808F" />

          {/* Head */}
          <ellipse cx="32" cy="56" rx="18" ry="16" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2" />

          {/* Head spots */}
          <ellipse cx="26" cy="52" rx="5" ry="3" fill="#2C3E50" />

          {/* Ears */}
          <ellipse cx="14" cy="46" rx="6" ry="4" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="1.5" transform="rotate(-30 14 46)" />
          <ellipse cx="14" cy="46" rx="3" ry="2" fill="#FFB3C1" transform="rotate(-30 14 46)" />
          <ellipse cx="48" cy="46" rx="6" ry="4" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="1.5" transform="rotate(30 48 46)" />
          <ellipse cx="48" cy="46" rx="3" ry="2" fill="#FFB3C1" transform="rotate(30 48 46)" />

          {/* Horns */}
          <path d="M22 42Q18 38 20 32" stroke="#FFE08A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M42 42Q46 38 44 32" stroke="#FFE08A" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Muzzle / nose */}
          <ellipse cx="22" cy="62" rx="8" ry="6" fill="#FFB3C1" stroke="#2C3E50" strokeWidth="1.5" />
          <ellipse cx="19" cy="62" rx="1.5" ry="2" fill="#2C3E50" />
          <ellipse cx="25" cy="62" rx="1.5" ry="2" fill="#2C3E50" />

          {/* Mouth — chewing */}
          <motion.g
            style={{ transformOrigin: '22px 66px' }}
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ellipse cx="22" cy="66" rx="3" ry="1.5" fill="#2C3E50" />
          </motion.g>

          {/* Eyes */}
          {blink ? (
            <>
              <line x1="28" y1="54" x2="34" y2="54" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="38" y1="54" x2="44" y2="54" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="30" cy="54" r="2.5" fill="#2C3E50" />
              <circle cx="30.5" cy="53.5" r="0.8" fill="#FFFFFF" />
              <circle cx="41" cy="54" r="2.5" fill="#2C3E50" />
              <circle cx="41.5" cy="53.5" r="0.8" fill="#FFFFFF" />
            </>
          )}

          {/* Cute cheeks */}
          <circle cx="20" cy="60" r="2" fill="#FFB3C1" opacity="0.6" />
          <circle cx="50" cy="60" r="2" fill="#FFB3C1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Floating milk drop on top */}
      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [-30, -45, -30], opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          right: 8,
          top: 10,
        }}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path d="M7 0c3 5 5 7 5 11a5 5 0 0 1-10 0c0-4 2-6 5-11z" fill="#FFFFFF" stroke="#0B7A4B" strokeWidth="0.8" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
