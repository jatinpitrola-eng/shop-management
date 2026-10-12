'use client';
// MilkButton — primary action button with spring physics + milk splash on press.
// Use for entry actions, payment approvals, etc.

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { triggerMilkSplash } from './MilkSplash';

interface MilkButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'soft' | 'danger';
  style?: React.CSSProperties;
  className?: string;
  type?: 'button' | 'submit';
  /** trigger milk splash on click (default true) */
  splash?: boolean;
  ariaLabel?: string;
}

export function MilkButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  style,
  className,
  type = 'button',
  splash = true,
  ariaLabel,
}: MilkButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (splash) {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        triggerMilkSplash(e.clientX, e.clientY);
      }
    }
    onClick?.(e);
  };

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-btn)',
    minHeight: 48,
    padding: '12px 16px',
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 150ms cubic-bezier(.34, 1.56, .64, 1)',
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary' ? {
      background: 'var(--gradient-brand)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(11,122,75,0.30), inset 0 1px 0 rgba(255,255,255,0.30)',
    } :
    variant === 'soft' ? {
      background: 'var(--brand-tint)',
      color: 'var(--brand-700)',
      border: '1px solid rgba(11,122,75,0.18)',
    } :
    variant === 'danger' ? {
      background: 'var(--red)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(220,38,38,0.25), inset 0 1px 0 rgba(255,255,255,0.20)',
    } :
    {
      background: 'transparent',
      color: 'var(--brand-600)',
      border: '1px solid var(--brand-600)',
    };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={handlePress}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={ariaLabel}
      className={className}
      style={{
        ...baseStyle,
        ...variantStyle,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {/* Top edge shine */}
      <span
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </motion.button>
  );
}
