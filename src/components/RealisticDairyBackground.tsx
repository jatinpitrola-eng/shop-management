'use client';
// RealisticDairyBackground — uses AI-generated dairy farm + cream texture images with
// slow elegant parallax (no bouncy cartoon). Inspired by premium dairy brands.

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

interface RealisticDairyBackgroundProps {
  variant?: 'farm' | 'cream' | 'subtle';
  density?: number; // particle density
  pourMilk?: boolean;
}

export function RealisticDairyBackground({
  variant = 'cream',
  density = 8,
  pourMilk = false,
}: RealisticDairyBackgroundProps) {
  const [farmLoaded, setFarmLoaded] = useState(false);
  const [textureLoaded, setTextureLoaded] = useState(false);

  const particles = useMemo(() => {
    const items: { x: number; y: number; size: number; duration: number; delay: number; drift: number }[] = [];
    for (let i = 0; i < density * 2; i++) {
      const seed = i * 137;
      const r = (n: number) => ((Math.sin(seed + n) + 1) / 2);
      items.push({
        x: r(1) * 100,
        y: 20 + r(2) * 80,
        size: 3 + (i % 4) * 2,
        duration: 14 + r(3) * 8,
        delay: r(4) * 6,
        drift: 15 + r(5) * 25,
      });
    }
    return items;
  }, [density]);

  // Real cream/milk drops floating
  const drops = useMemo(() => {
    const items: { x: number; y: number; size: number; duration: number; delay: number; drift: number }[] = [];
    for (let i = 0; i < density; i++) {
      const seed = i * 73;
      const r = (n: number) => ((Math.sin(seed + n) + 1) / 2);
      items.push({
        x: 5 + r(1) * 90,
        y: 20 + r(2) * 70,
        size: 14 + r(3) * 16,
        duration: 18 + r(4) * 6,
        delay: r(5) * 5,
        drift: 25 + r(6) * 20,
      });
    }
    return items;
  }, [density]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        background: 'var(--gradient-cream)',
      }}
    >
      {/* Layered backgrounds — farm (very blurred) + cream texture overlay */}
      {variant === 'farm' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: farmLoaded ? 0.35 : 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <img
            src="/dairy-images/farm-bg.png"
            alt=""
            onLoad={() => setFarmLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px) saturate(120%)', transform: 'scale(1.1)' }}
          />
          {/* Warm overlay tint */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(244,238,226,0.4) 0%, rgba(244,238,226,0.7) 100%)' }} />
        </motion.div>
      )}

      {/* Cream texture overlay (always present, subtle) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: textureLoaded ? 0.45 : 0 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <img
          src="/dairy-images/cream-texture.png"
          alt=""
          onLoad={() => setTextureLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, mixBlendMode: 'soft-light' }}
        />
      </motion.div>

      {/* Soft radial highlights */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 25% 20%, rgba(255, 244, 214, 0.4) 0%, transparent 45%),' +
            'radial-gradient(circle at 75% 80%, rgba(212, 162, 78, 0.18) 0%, transparent 40%),' +
            'radial-gradient(circle at 50% 50%, rgba(15, 81, 50, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* Pouring milk (optional, top of intro) */}
      {pourMilk && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 180,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/dairy-images/milk-pour.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(31,26,18,0.18))',
              mixBlendMode: 'multiply',
            }}
          />
        </motion.div>
      )}

      {/* Floating real milk drops */}
      {drops.map((d, i) => (
        <motion.div
          key={`drop-${i}`}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: [0, -d.drift, -d.drift / 2, 0],
            x: [0, d.drift / 3, -d.drift / 4, 0],
            opacity: [0, 0.55, 0.4, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size * 1.3,
            background: 'radial-gradient(circle at 40% 35%, #FFFFFF 0%, #FAF5EA 80%, #EDE4D2 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            boxShadow: '0 4px 12px rgba(31,26,18,0.10)',
          }}
        />
      ))}

      {/* Tiny gold/cream particles */}
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: [0, -80 - i, 0],
            x: [0, p.drift / 2, -p.drift / 4, 0],
            opacity: [0, 0.4, 0.5, 0],
            scale: [0.5, 1, 0.8, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 3 === 0 ? 'var(--butter)' : i % 3 === 1 ? 'var(--milk)' : 'var(--brand-600)',
            boxShadow: '0 0 8px currentColor',
            opacity: 0.3,
          }}
        />
      ))}

      {/* Subtle vignette for cinematic depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(31, 26, 18, 0.08) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
