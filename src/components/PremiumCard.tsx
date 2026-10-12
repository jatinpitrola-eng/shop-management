'use client';
// Premium card with 3D depth — soft long shadows, gradient surface, hover lift, glass edge.

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'glass' | 'gradient';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  /** tilt amount on hover (degrees) */
  tilt?: number;
}

export function PremiumCard({
  children,
  variant = 'default',
  hover = true,
  onClick,
  style,
  className,
  tilt = 4,
}: PremiumCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMove = (e: React.MouseEvent) => {
    if (!hover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;
    setRotateY(px * tilt * 2);
    setRotateX(-py * tilt);
  };

  const handleLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const bg =
    variant === 'glass' ? 'var(--surface-glass)' :
    variant === 'gradient' ? 'var(--gradient-milk)' :
    variant === 'flat' ? 'var(--surface)' :
    'var(--gradient-card)';

  const border =
    variant === 'glass' ? '1px solid rgba(255,255,255,0.4)' :
    variant === 'flat' ? '1px solid var(--border)' :
    '1px solid rgba(255,255,255,0.6)';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      initial={false}
      animate={{
        rotateX,
        rotateY,
        ...(hover ? { scale: 1 } : {}),
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{
        background: bg,
        borderRadius: 'var(--radius)',
        border,
        boxShadow: variant === 'glass' ? 'var(--shadow)' : 'var(--shadow-card-3d)',
        transformStyle: 'preserve-3d',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: variant === 'glass' ? 'blur(12px) saturate(180%)' : undefined,
        WebkitBackdropFilter: variant === 'glass' ? 'blur(12px) saturate(180%)' : undefined,
        ...style,
      }}
      className={className}
    >
      {/* Top edge highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 30%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
      <div style={{ position: 'relative', transform: 'translateZ(1px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
