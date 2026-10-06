// Brand header — big "Shop Management" + small "by Nexoryos"
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';

export function BrandHeader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const lang = useApp(s => s.lang);
  const titleSize = size === 'lg' ? 30 : size === 'sm' ? 18 : 22;
  const subSize = size === 'lg' ? 13 : 11;
  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      <div style={{ fontSize: titleSize, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
        {t(lang, 'app_name')}
      </div>
      <div style={{ fontSize: subSize, color: 'var(--ink-500)', opacity: 0.7, letterSpacing: '0.04em' }}>
        {t(lang, 'by_nexoryos')}
      </div>
    </div>
  );
}

// Nexoryos N logo — inline SVG, sized to spec
export function NexoryosLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nexoryos logo"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="bg-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B7A4B" />
          <stop offset="100%" stopColor="#085E3A" />
        </linearGradient>
        <linearGradient id="n-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D7F0E1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg-g)" />
      <path
        d="M348 366V146H308L192 286V146H164V366H204L320 226V366H348Z"
        fill="url(#n-stroke)"
      />
      <path
        d="M384 178c0 22-14 38-30 38s-30-16-30-38c0-12 6-22 12-30 6-8 14-18 18-22 4 4 12 14 18 22 6 8 12 18 12 30z"
        fill="#FFFFFF"
        opacity={0.95}
      />
      <ellipse cx="362" cy="170" rx="4" ry="6" fill="#085E3A" opacity={0.5} />
    </svg>
  );
}
