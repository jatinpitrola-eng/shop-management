'use client';
// Premium 3D Cow — multi-layer SVG with depth, parallax, breathing, blinking eyes
// with lashes, swishing tail, chewing mouth, walking legs, golden horns, floating
// milk drop above, sparkle particles around. Designed for dairy-themed PWA.

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
interface Cow3DProps {
  size?: number;
  /** enable parallax based on mouse/touch position (default true on desktop, false on touch) */
  parallax?: boolean;
  /** sparkle particles around cow */
  sparkles?: boolean;
  /** milk drop floating above */
  milkDrop?: boolean;
  /** walk in place (legs moving) */
  walk?: boolean;
  className?: string;
}

export function Cow3D({
  size = 140,
  parallax = true,
  sparkles = true,
  milkDrop = true,
  walk = true,
}: Cow3DProps) {
  const [blink, setBlink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax motion values
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 18 });
  const headX = useSpring(useTransform(mx, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 18 });
  const headY = useSpring(useTransform(my, [-0.5, 0.5], [-3, 3]), { stiffness: 120, damping: 18 });

  // Blink every 3-5s
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 2800 + Math.random() * 2200);
    return () => clearInterval(id);
  }, []);

  // Track pointer for parallax
  useEffect(() => {
    if (!parallax) return;
    const handler = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mx.set(e.clientX / w - 0.5);
      my.set(e.clientY / h - 0.5);
    };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, [parallax, mx, my]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ scale: 0.7, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
        perspective: 800,
      }}
    >
      {/* Breathing motion + 3D rotation */}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          rotateY: parallax ? rotateY : 0,
          rotateX: parallax ? rotateX : 0,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 140 140" fill="none">
          {/* Soft glow shadow under cow */}
          <motion.ellipse
            cx="70" cy="128" rx="38" ry="5"
            fill="#0B7A4B" opacity="0.18"
            animate={{ rx: [38, 36, 38], opacity: [0.18, 0.14, 0.18] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'blur(2px)' }}
          />

          {/* BACK LEGS — behind body */}
          <motion.g
            style={{ transformOrigin: '50px 100px' }}
            animate={walk ? { rotate: [0, -8, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="46" y="92" width="7" height="22" rx="3.5" fill="#2C3E50" />
            <ellipse cx="49.5" cy="114" rx="4.5" ry="2.5" fill="#1A2530" />
          </motion.g>
          <motion.g
            style={{ transformOrigin: '92px 100px' }}
            animate={walk ? { rotate: [0, 8, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          >
            <rect x="88" y="92" width="7" height="22" rx="3.5" fill="#2C3E50" />
            <ellipse cx="91.5" cy="114" rx="4.5" ry="2.5" fill="#1A2530" />
          </motion.g>

          {/* TAIL — swishing */}
          <motion.g
            style={{ transformOrigin: '102px 80px' }}
            animate={{ rotate: [0, 28, -12, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M102 80Q114 86 112 102Q110 114 104 118" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <motion.circle
              cx="104" cy="120" r="5"
              fill="#FFB3C1"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <ellipse cx="102" cy="119" rx="2" ry="1" fill="#E8808F" opacity="0.6" />
          </motion.g>

          {/* BODY — main oval with gradient depth */}
          <defs>
            <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#FBF7F0" />
              <stop offset="100%" stopColor="#E8DEC8" />
            </radialGradient>
            <radialGradient id="headGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#FBF7F0" />
              <stop offset="100%" stopColor="#E8DEC8" />
            </radialGradient>
            <linearGradient id="hornGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="100%" stopColor="#D9A82E" />
            </linearGradient>
            <radialGradient id="udderGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFD1DC" />
              <stop offset="100%" stopColor="#FFB3C1" />
            </radialGradient>
            <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD1DC" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFD1DC" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="70" cy="84" rx="36" ry="26" fill="url(#bodyGrad)" stroke="#2C3E50" strokeWidth="2" />

          {/* Body spots — with subtle inner shadow for depth */}
          <ellipse cx="54" cy="76" rx="9" ry="6.5" fill="#2C3E50" />
          <ellipse cx="54" cy="74" rx="9" ry="6.5" fill="url(#bodyGrad)" opacity="0.15" />
          <ellipse cx="84" cy="90" rx="11" ry="7" fill="#2C3E50" />
          <ellipse cx="84" cy="88" rx="11" ry="7" fill="url(#bodyGrad)" opacity="0.15" />
          <ellipse cx="46" cy="92" rx="5" ry="3.5" fill="#2C3E50" opacity="0.85" />

          {/* Highlight on body (3D depth) */}
          <ellipse cx="60" cy="70" rx="14" ry="6" fill="#FFFFFF" opacity="0.4" />

          {/* UDDER */}
          <ellipse cx="70" cy="104" rx="11" ry="6.5" fill="url(#udderGrad)" stroke="#2C3E50" strokeWidth="1.2" />
          <circle cx="64" cy="106" r="2" fill="#E8808F" />
          <circle cx="70" cy="107" r="2" fill="#E8808F" />
          <circle cx="76" cy="106" r="2" fill="#E8808F" />
          {/* Milk drops dripping from udder */}
          <motion.circle
            cx="70"
            cy="112"
            r="1.8"
            fill="#FFFFFF"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, 14], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeIn', repeatDelay: 1.2 }}
          />

          {/* FRONT LEGS */}
          <motion.g
            style={{ transformOrigin: '58px 102px' }}
            animate={walk ? { rotate: [0, 8, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            <rect x="54.5" y="96" width="7" height="22" rx="3.5" fill="url(#bodyGrad)" stroke="#2C3E50" strokeWidth="1.5" />
            <ellipse cx="58" cy="118" rx="4.5" ry="2.5" fill="#1A2530" />
          </motion.g>
          <motion.g
            style={{ transformOrigin: '82px 102px' }}
            animate={walk ? { rotate: [0, -8, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          >
            <rect x="78.5" y="96" width="7" height="22" rx="3.5" fill="url(#bodyGrad)" stroke="#2C3E50" strokeWidth="1.5" />
            <ellipse cx="82" cy="118" rx="4.5" ry="2.5" fill="#1A2530" />
          </motion.g>

          {/* HEAD — separate layer with parallax */}
          <motion.g
            style={{ x: parallax ? headX : 0, y: parallax ? headY : 0 }}
          >
            {/* Ears (behind head) */}
            <motion.g
              style={{ transformOrigin: '22px 54px' }}
              animate={{ rotate: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ellipse cx="14" cy="48" rx="7" ry="4.5" fill="url(#headGrad)" stroke="#2C3E50" strokeWidth="1.5" transform="rotate(-30 14 48)" />
              <ellipse cx="14" cy="48" rx="4" ry="2.5" fill="#FFB3C1" transform="rotate(-30 14 48)" />
            </motion.g>
            <motion.g
              style={{ transformOrigin: '54px 54px' }}
              animate={{ rotate: [0, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <ellipse cx="56" cy="48" rx="7" ry="4.5" fill="url(#headGrad)" stroke="#2C3E50" strokeWidth="1.5" transform="rotate(30 56 48)" />
              <ellipse cx="56" cy="48" rx="4" ry="2.5" fill="#FFB3C1" transform="rotate(30 56 48)" />
            </motion.g>

            {/* Horns — golden */}
            <motion.path
              d="M24 42Q18 36 20 28"
              stroke="url(#hornGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round"
              animate={{ strokeWidth: [3.5, 3.8, 3.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M46 42Q52 36 50 28"
              stroke="url(#hornGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round"
              animate={{ strokeWidth: [3.5, 3.8, 3.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Head */}
            <ellipse cx="35" cy="60" rx="20" ry="18" fill="url(#headGrad)" stroke="#2C3E50" strokeWidth="2" />

            {/* Head spot */}
            <ellipse cx="28" cy="54" rx="6" ry="4" fill="#2C3E50" />
            <ellipse cx="28" cy="53" rx="6" ry="4" fill="url(#headGrad)" opacity="0.15" />

            {/* Highlight on head (3D depth) */}
            <ellipse cx="28" cy="50" rx="8" ry="4" fill="#FFFFFF" opacity="0.5" />

            {/* Eyes — with lashes when not blinking */}
            {blink ? (
              <>
                <motion.path
                  d="M28 58 Q32 60 36 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.1 }}
                />
                <motion.path
                  d="M40 58 Q44 60 48 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.1 }}
                />
              </>
            ) : (
              <>
                {/* Eye whites */}
                <ellipse cx="32" cy="58" rx="3.5" ry="4" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="0.6" />
                <ellipse cx="44" cy="58" rx="3.5" ry="4" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="0.6" />
                {/* Pupils with sparkle */}
                <motion.circle
                  cx="32.5" cy="58.5" r="2.2" fill="#2C3E50"
                  animate={{ cy: [58.5, 58.8, 58.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="44.5" cy="58.5" r="2.2" fill="#2C3E50"
                  animate={{ cy: [58.5, 58.8, 58.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Sparkle in eyes */}
                <circle cx="33.5" cy="57.5" r="0.8" fill="#FFFFFF" />
                <circle cx="45.5" cy="57.5" r="0.8" fill="#FFFFFF" />
                {/* Eyelashes */}
                <line x1="29" y1="55" x2="28" y2="53" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="32" y1="54.5" x2="32" y2="52.5" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="35" y1="55" x2="36" y2="53" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="41" y1="55" x2="40" y2="53" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="44" y1="54.5" x2="44" y2="52.5" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="47" y1="55" x2="48" y2="53" stroke="#2C3E50" strokeWidth="0.8" strokeLinecap="round" />
              </>
            )}

            {/* Cheeks — blush */}
            <circle cx="22" cy="64" r="2.5" fill="url(#cheekGrad)" />
            <circle cx="54" cy="64" r="2.5" fill="url(#cheekGrad)" />

            {/* Muzzle / nose */}
            <ellipse cx="24" cy="68" rx="10" ry="7.5" fill="url(#udderGrad)" stroke="#2C3E50" strokeWidth="1.5" />
            <ellipse cx="20" cy="68" rx="1.8" ry="2.5" fill="#2C3E50" />
            <ellipse cx="28" cy="68" rx="1.8" ry="2.5" fill="#2C3E50" />

            {/* Mouth — chewing */}
            <motion.g
              style={{ transformOrigin: '24px 74px' }}
              animate={{ scaleY: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ellipse cx="24" cy="74" rx="4" ry="2" fill="#2C3E50" />
              <ellipse cx="24" cy="74" rx="3" ry="1.2" fill="#E8808F" />
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Floating milk drop above cow */}
      {milkDrop && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: [-20, -28, -20], opacity: [0, 1, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            position: 'absolute',
            right: 14,
            top: 6,
            filter: 'drop-shadow(0 2px 4px rgba(11,122,75,0.18))',
          }}
        >
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
            <path d="M8 0c4 6 8 10 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="#FFFFFF" stroke="#0B7A4B" strokeWidth="0.8" />
            <ellipse cx="5" cy="13" rx="1.5" ry="3" fill="#D7F0E1" opacity="0.9" />
          </svg>
        </motion.div>
      )}

      {/* Sparkle particles around cow */}
      {sparkles && (
        <>
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="sparkle"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                x: [Math.cos(i * 1.2) * 30, Math.cos(i * 1.2 + Math.PI) * 30],
                y: [Math.sin(i * 1.2) * 30, Math.sin(i * 1.2 + Math.PI) * 30],
                scale: [0.3, 1, 0.3],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.7,
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 6,
                height: 6,
                background: i % 2 === 0 ? '#FFD166' : '#FFFFFF',
                borderRadius: '50%',
                boxShadow: '0 0 6px currentColor',
                pointerEvents: 'none',
              }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6">
                <path d="M3 0L3 6M0 3L6 3" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}
