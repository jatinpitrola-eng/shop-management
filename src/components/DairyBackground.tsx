'use client';
// Dairy-themed animated background — floating milk bottles, cheese wedges, butter cubes,
// ghee jars, milk drops, and soft particles. Uses framer-motion for smooth, GPU-friendly motion.
// Performance-optimized: cheap transforms only, no heavy blur on cheap Androids.

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// SVG icons — small, cute, dairy-themed
function MilkBottle({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M13 4h10v3l3 5v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V12l3-5V4z" fill="#FFFFFF" stroke="#0B7A4B" strokeWidth="1.5" />
      <rect x="12" y="6" width="12" height="4" fill="#0B7A4B" rx="0.5" />
      <path d="M11 18h14v8a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3v-8z" fill="#D7F0E1" />
      <ellipse cx="18" cy="20" rx="6" ry="1.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}
function CheeseWedge({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M4 24L18 8l14 6v10H4z" fill="#FFD166" stroke="#E8B547" strokeWidth="1" />
      <path d="M4 24h28v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" fill="#FFC93C" stroke="#E8B547" strokeWidth="1" />
      <circle cx="14" cy="22" r="1.5" fill="#FFFFFF" opacity="0.8" />
      <circle cx="22" cy="20" r="1.2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="18" cy="26" r="1" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}
function ButterCube({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M6 12h24v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12z" fill="#FFF4D6" stroke="#E8D27A" strokeWidth="1.5" />
      <path d="M6 12l6-6h12l6 6" fill="#FFF4D6" stroke="#E8D27A" strokeWidth="1.5" />
      <path d="M6 12h24M18 6v24" stroke="#E8D27A" strokeWidth="0.8" opacity="0.6" />
      <circle cx="14" cy="20" r="1.5" fill="#FFD166" opacity="0.5" />
    </svg>
  );
}
function GheeJar({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="9" y="10" width="18" height="22" rx="2" fill="#FFE08A" stroke="#E8B547" strokeWidth="1.5" />
      <rect x="11" y="4" width="14" height="6" rx="1" fill="#8B6F47" />
      <rect x="11" y="14" width="14" height="14" rx="1" fill="#FFD166" opacity="0.7" />
      <ellipse cx="18" cy="18" rx="5" ry="1.5" fill="#FFFFFF" opacity="0.5" />
    </svg>
  );
}
function MilkDrop({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2c4 6 8 10 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="#FFFFFF" stroke="#0B7A4B" strokeWidth="1" opacity="0.9" />
      <ellipse cx="9" cy="14" rx="1.5" ry="3" fill="#D7F0E1" opacity="0.8" />
    </svg>
  );
}
function Leaf({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12C3 6 9 3 21 3c0 12-3 18-9 18-3 0-6-3-9-9z" fill="#14B070" opacity="0.8" />
      <path d="M5 19L19 5" stroke="#0B7A4B" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

const ITEMS = [
  { Component: MilkBottle, size: 38 },
  { Component: CheeseWedge, size: 34 },
  { Component: ButterCube, size: 32 },
  { Component: GheeJar, size: 36 },
  { Component: MilkDrop, size: 22 },
  { Component: Leaf, size: 22 },
  { Component: MilkBottle, size: 28 },
  { Component: MilkDrop, size: 18 },
];

interface FloatingItem {
  Component: typeof MilkBottle;
  size: number;
  x: number; // % position
  startY: number; // % position
  duration: number; // seconds for full float cycle
  delay: number;
  drift: number; // horizontal drift amplitude in px
  rotate: number; // rotation amplitude in degrees
}

function makeItems(count: number): FloatingItem[] {
  // Deterministic pseudo-random for SSR/CSR match
  const items: FloatingItem[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137;
    const r = (n: number) => ((Math.sin(seed + n) + 1) / 2);
    const Item = ITEMS[i % ITEMS.length];
    items.push({
      Component: Item.Component,
      size: Item.size,
      x: r(1) * 100,
      startY: 60 + r(2) * 40,
      duration: 8 + r(3) * 8,
      delay: r(4) * 4,
      drift: 20 + r(5) * 30,
      rotate: 8 + r(6) * 12,
    });
  }
  return items;
}

export function DairyBackground({ density = 12 }: { density?: number }) {
  const items = useMemo(() => makeItems(density), [density]);
  const particles = useMemo(() => makeItems(density * 2), [density]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Soft pastel gradient backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 15%, rgba(215,240,225,0.55) 0%, transparent 45%),' +
            'radial-gradient(circle at 80% 75%, rgba(255,224,138,0.35) 0%, transparent 40%),' +
            'radial-gradient(circle at 60% 30%, rgba(20,176,112,0.10) 0%, transparent 35%)',
        }}
      />

      {/* Floating dairy items */}
      {items.map((it, i) => {
        const I = it.Component;
        return (
          <motion.div
            key={`item-${i}`}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
            animate={{
              y: [0, -60 - i, -20, 0],
              x: [0, it.drift, -it.drift / 2, 0],
              rotate: [0, it.rotate, -it.rotate / 2, 0],
              opacity: [0, 0.7, 0.5, 0],
            }}
            transition={{
              duration: it.duration,
              delay: it.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${it.x}%`,
              top: `${it.startY}%`,
              filter: 'drop-shadow(0 4px 8px rgba(11,122,75,0.10))',
            }}
          >
            <I size={it.size} />
          </motion.div>
        );
      })}

      {/* Soft particles — tiny floating dots */}
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            y: [0, -100 - i, 0],
            x: [0, p.drift / 2, -p.drift / 4, 0],
            opacity: [0, 0.5, 0.7, 0],
          }}
          transition={{
            duration: 10 + (i % 5),
            delay: p.delay * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.startY}%`,
            width: 4 + (i % 4),
            height: 4 + (i % 4),
            borderRadius: '50%',
            background: i % 3 === 0 ? '#0B7A4B' : i % 3 === 1 ? '#FFD166' : '#FFFFFF',
            opacity: 0.4,
            boxShadow: '0 0 4px rgba(255,255,255,0.4)',
          }}
        />
      ))}
    </div>
  );
}
