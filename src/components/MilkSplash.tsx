'use client';
// Milk splash burst — used on button press / entry add for delightful feedback.
// Renders radial particles in white/cream color, fades out.

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Splash {
  id: number;
  x: number;
  y: number;
}

let splashId = 0;

interface MilkSplashHostProps {
  children: React.ReactNode;
  /** trigger splash from a click — auto-detected if children support onClick */
  onSplash?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

/** Wrap a clickable element to trigger milk splash on click */
export function MilkSplashHost({ children, onSplash, style, className }: MilkSplashHostProps) {
  const [splashes, setSplashes] = useState<Splash[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++splashId;
    setSplashes(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setSplashes(prev => prev.filter(s => s.id !== id));
    }, 800);
    onSplash?.(e);
  };

  return (
    <span
      onClick={handleClick}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      className={className}
    >
      {children}
      <AnimatePresence>
        {splashes.map(s => (
          <MilkSplash key={s.id} x={s.x} y={s.y} />
        ))}
      </AnimatePresence>
    </span>
  );
}

/** Single milk splash burst at (x, y) */
export function MilkSplash({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 20 + (i % 3) * 10;
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      size: 4 + (i % 3) * 2,
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Center milk drop */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1.4, 0], opacity: [1, 0.6, 0] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: -8,
          top: -10,
          width: 16,
          height: 20,
          background: '#FFFFFF',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          boxShadow: '0 0 4px rgba(0,0,0,0.1)',
          transformOrigin: 'center bottom',
        }}
      />
      {/* Particles flying outward */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            background: i_getColor(p.id),
            borderRadius: '50%',
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </div>
  );
}

function i_getColor(i: number) {
  return i % 2 === 0 ? '#FFFFFF' : '#FFF4D6';
}

/** Global splash trigger — call from anywhere to spawn a splash at coordinates */
export function triggerMilkSplash(x: number, y: number) {
  // Dispatches a custom event that a GlobalMilkSplashLayer (mounted at root) listens to
  window.dispatchEvent(new CustomEvent('shopm:milk-splash', { detail: { x, y } }));
}

/** Global milk splash layer — mount once at root to listen for triggerMilkSplash events */
export function GlobalMilkSplashLayer() {
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { x: number; y: number };
      const id = ++splashId;
      setSplashes(prev => [...prev, { id, x: detail.x, y: detail.y }]);
      setTimeout(() => setSplashes(prev => prev.filter(s => s.id !== id)), 800);
    };
    window.addEventListener('shopm:milk-splash', handler);
    return () => window.removeEventListener('shopm:milk-splash', handler);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {splashes.map(s => <MilkSplash key={s.id} x={s.x} y={s.y} />)}
      </AnimatePresence>
    </div>
  );
}
