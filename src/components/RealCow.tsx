'use client';
// RealCow — uses AI-generated realistic dairy cow photograph with slow elegant
// animations (breathing, gentle head tilt, soft fade-in). NO cartoon bouncy springs.
// Premium dairy brand feel like Amul Gold / Organic Valley.

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface RealCowProps {
  size?: number;
  parallax?: boolean;
  variant?: 'head' | 'full';
  className?: string;
}

export function RealCow({
  size = 200,
  parallax = true,
  variant = 'head',
}: RealCowProps) {
  const [loaded, setLoaded] = useState(false);
  const [blink, setBlink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slow elegant parallax (low stiffness for premium feel)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [4, -4]), { stiffness: 40, damping: 20 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [-3, 3]), { stiffness: 40, damping: 20 });
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [6, -6]), { stiffness: 50, damping: 20 });

  // Slow blink every 5-7s
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 220);
    }, 5000 + Math.random() * 2500);
    return () => clearInterval(id);
  }, []);

  // Track pointer for parallax
  useEffect(() => {
    if (!parallax) return;
    let raf = 0;
    const handler = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        mx.set(e.clientX / w - 0.5);
        my.set(e.clientY / h - 0.5);
      });
    };
    window.addEventListener('pointermove', handler);
    return () => {
      window.removeEventListener('pointermove', handler);
      cancelAnimationFrame(raf);
    };
  }, [parallax, mx, my]);

  const imageSrc = variant === 'head' ? '/dairy-images/real-cow.png' : '/dairy-images/real-cow.png';

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: loaded ? 1 : 0, scale: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
        perspective: 1200,
      }}
    >
      {/* Soft glow halo behind cow */}
      <motion.div
        animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: '8%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 244, 214, 0.7) 0%, rgba(212, 162, 78, 0.2) 50%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />

      {/* Breathing motion + parallax tilt */}
      <motion.div
        className="breathe"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          rotateY: parallax ? rotateY : 0,
          rotateX: parallax ? rotateX : 0,
          x: parallax ? translateX : 0,
        }}
      >
        <img
          src={imageSrc}
          alt="Dairy cow"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            boxShadow: '0 12px 36px rgba(31, 26, 18, 0.18), 0 4px 12px rgba(31, 26, 18, 0.10)',
            display: 'block',
          }}
        />
        {/* Eye blink overlay (subtle dark sweep) */}
        {blink && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.15 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              top: '38%',
              left: '30%',
              width: '40%',
              height: '4%',
              background: 'linear-gradient(90deg, transparent, rgba(31,26,18,0.6), transparent)',
              borderRadius: '50%',
              filter: 'blur(1px)',
            }}
          />
        )}
      </motion.div>

      {/* Elegant floating gold sparkle */}
      <motion.div
        animate={{ y: [-10, -18, -10], opacity: [0, 0.7, 0], scale: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          width: 8,
          height: 8,
          background: 'var(--butter)',
          borderRadius: '50%',
          boxShadow: '0 0 8px var(--butter), 0 0 16px rgba(212, 162, 78, 0.4)',
        }}
      />
      <motion.div
        animate={{ y: [0, -12, 0], opacity: [0, 0.5, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '4%',
          width: 6,
          height: 6,
          background: 'var(--milk)',
          borderRadius: '50%',
          boxShadow: '0 0 6px rgba(255,255,255,0.6)',
        }}
      />
    </motion.div>
  );
}
