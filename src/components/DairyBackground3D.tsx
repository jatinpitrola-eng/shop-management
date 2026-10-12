'use client';
// Premium 3D dairy background — cream gradient, pouring milk at top, floating 3D
// milk bottles / cheese / butter / ghee with depth shadows, milk drops with ripple,
// sparkle particles, parallax layers. Performance-friendly via transforms.

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ---- 3D SVG icons with depth (gradient + shadow) ----
function MilkBottle3D({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="mb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FBF7F0" />
          <stop offset="100%" stopColor="#E8DEC8" />
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="33" rx="10" ry="1.5" fill="#0B7A4B" opacity="0.15" />
      <path d="M13 4h10v3l3 5v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V12l3-5V4z" fill="url(#mb-g)" stroke="#0B7A4B" strokeWidth="1.4" />
      <rect x="12" y="6" width="12" height="4" fill="#0B7A4B" rx="0.6" />
      <path d="M11 18h14v8a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3v-8z" fill="#D7F0E1" />
      <ellipse cx="18" cy="20" rx="6" ry="1.4" fill="#FFFFFF" opacity="0.85" />
      <path d="M13 6h2v2h-2zM21 6h2v2h-2z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}
function CheeseWedge3D({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="cw-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#E8B547" />
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="33" rx="10" ry="1.4" fill="#0B7A4B" opacity="0.12" />
      <path d="M4 24L18 8l14 6v10H4z" fill="url(#cw-g)" stroke="#B88A1F" strokeWidth="0.8" />
      <path d="M4 24h28v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" fill="#FFC93C" stroke="#B88A1F" strokeWidth="0.8" />
      <circle cx="14" cy="22" r="1.6" fill="#FFFFFF" opacity="0.85" />
      <circle cx="22" cy="20" r="1.3" fill="#FFFFFF" opacity="0.75" />
      <circle cx="18" cy="26" r="1" fill="#FFFFFF" opacity="0.65" />
      <path d="M18 8L4 24h28z" fill="#FFFFFF" opacity="0.18" />
    </svg>
  );
}
function ButterCube3D({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="bc-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8DD" />
          <stop offset="100%" stopColor="#E8D27A" />
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="33" rx="9" ry="1.3" fill="#0B7A4B" opacity="0.10" />
      <path d="M6 12h24v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12z" fill="url(#bc-g)" stroke="#B89845" strokeWidth="1.2" />
      <path d="M6 12l6-6h12l6 6" fill="#FFFEF0" stroke="#B89845" strokeWidth="1.2" />
      <path d="M6 12h24M18 6v24" stroke="#B89845" strokeWidth="0.6" opacity="0.4" />
      <circle cx="14" cy="20" r="1.6" fill="#FFD166" opacity="0.5" />
    </svg>
  );
}
function GheeJar3D({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="gj-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#D9A82E" />
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="33" rx="9" ry="1.3" fill="#0B7A4B" opacity="0.12" />
      <rect x="9" y="10" width="18" height="22" rx="2.5" fill="url(#gj-g)" stroke="#B88A1F" strokeWidth="1.2" />
      <rect x="11" y="4" width="14" height="6" rx="1.2" fill="#8B6F2C" />
      <rect x="11" y="14" width="14" height="14" rx="1.2" fill="#FFD166" opacity="0.75" />
      <ellipse cx="18" cy="18" rx="5" ry="1.4" fill="#FFFFFF" opacity="0.6" />
      <path d="M13 4l2-2h6l2 2z" fill="#6B4F2C" />
    </svg>
  );
}
function MilkDrop3D({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <defs>
        <radialGradient id="md-g" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#F5EFE3" />
        </radialGradient>
      </defs>
      <path d="M11 0c4 6 8 10 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="url(#md-g)" stroke="#0B7A4B" strokeWidth="0.8" opacity="0.95" />
      <ellipse cx="8" cy="12" rx="1.5" ry="3" fill="#D7F0E1" opacity="0.9" />
    </svg>
  );
}
function Leaf3D({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <defs>
        <linearGradient id="lf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B070" />
          <stop offset="100%" stopColor="#0B7A4B" />
        </linearGradient>
      </defs>
      <path d="M3 11C3 5 8 2 19 2c0 11-3 17-9 17-3 0-7-3-7-8z" fill="url(#lf-g)" />
      <path d="M5 17L17 5" stroke="#0B7A4B" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

const ITEMS = [
  { Component: MilkBottle3D, size: 40 },
  { Component: CheeseWedge3D, size: 36 },
  { Component: ButterCube3D, size: 34 },
  { Component: GheeJar3D, size: 38 },
  { Component: MilkDrop3D, size: 24 },
  { Component: Leaf3D, size: 22 },
  { Component: MilkBottle3D, size: 30 },
  { Component: MilkDrop3D, size: 18 },
];

interface FloatingItem {
  Component: typeof MilkBottle3D;
  size: number;
  x: number;
  startY: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
  scale: number;
}

function makeItems(count: number): FloatingItem[] {
  const items: FloatingItem[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137;
    const r = (n: number) => ((Math.sin(seed + n) + 1) / 2);
    const Item = ITEMS[i % ITEMS.length];
    items.push({
      Component: Item.Component,
      size: Item.size + (r(3) * 8 - 4),
      x: r(1) * 100,
      startY: 30 + r(2) * 60,
      duration: 9 + r(3) * 9,
      delay: r(4) * 5,
      drift: 25 + r(5) * 35,
      rotate: 8 + r(6) * 14,
      scale: 0.7 + r(7) * 0.5,
    });
  }
  return items;
}

interface DairyBackground3DProps {
  density?: number;
  /** show pouring milk at top */
  pouringMilk?: boolean;
  /** intensity of background gradient */
  variant?: 'cream' | 'soft' | 'subtle';
}

export function DairyBackground3D({
  density = 10,
  pouringMilk = false,
  variant = 'cream',
}: DairyBackground3DProps) {
  const items = useMemo(() => makeItems(density), [density]);
  const particles = useMemo(() => makeItems(density * 2), [density]);

  const bgGradient =
    variant === 'cream' ? 'var(--gradient-cream)' :
    variant === 'soft' ? 'linear-gradient(180deg, #FBF7F0 0%, #FAF5EA 100%)' :
    'linear-gradient(180deg, #FBF7F0 0%, #F5EFE3 100%)';

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        background: bgGradient,
      }}
    >
      {/* Soft pastel radial highlights */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 15%, rgba(215,240,225,0.55) 0%, transparent 45%),' +
            'radial-gradient(circle at 80% 75%, rgba(255,224,138,0.30) 0%, transparent 40%),' +
            'radial-gradient(circle at 50% 100%, rgba(11,122,75,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Pouring milk at top */}
      {pouringMilk && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 140,
          }}
        >
          <svg width="60" height="140" viewBox="0 0 60 140" fill="none">
            <defs>
              <linearGradient id="pour-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#F5EFE3" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M28 0 Q30 80 28 140 L32 140 Q30 80 32 0 Z"
              fill="url(#pour-g)"
              animate={{ d: [
                'M28 0 Q30 80 28 140 L32 140 Q30 80 32 0 Z',
                'M27 0 Q34 80 28 140 L33 140 Q26 80 32 0 Z',
                'M28 0 Q30 80 28 140 L32 140 Q30 80 32 0 Z',
              ] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      )}

      {/* Floating dairy items */}
      {items.map((it, i) => {
        const I = it.Component;
        return (
          <motion.div
            key={`item-${i}`}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: it.scale }}
            animate={{
              y: [0, -60 - i * 0.5, -20, 0],
              x: [0, it.drift, -it.drift / 2, 0],
              rotate: [0, it.rotate, -it.rotate / 2, 0],
              opacity: [0, 0.85, 0.6, 0],
              scale: [it.scale * 0.9, it.scale, it.scale * 0.95, it.scale * 0.9],
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
              filter: 'drop-shadow(0 6px 12px rgba(44,62,80,0.10))',
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
            y: [0, -120 - i, 0],
            x: [0, p.drift / 2, -p.drift / 4, 0],
            opacity: [0, 0.55, 0.7, 0],
            scale: [0.6, 1.1, 0.85, 0.6],
          }}
          transition={{
            duration: 11 + (i % 5),
            delay: p.delay * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.startY}%`,
            width: 4 + (i % 5),
            height: 4 + (i % 5),
            borderRadius: '50%',
            background: i % 3 === 0 ? 'var(--brand-600)' : i % 3 === 1 ? 'var(--butter)' : '#FFFFFF',
            boxShadow: '0 0 8px currentColor',
          }}
        />
      ))}

      {/* Subtle wave at bottom for depth */}
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          left: 0,
          right: 0,
          height: 80,
          background: 'linear-gradient(180deg, transparent 0%, rgba(11,122,75,0.04) 100%)',
        }}
      />
    </div>
  );
}
