'use client';
// Dynamic theme — fetches business branding and injects as CSS var override.
// Used at root level. Default theme (dairy green) is used until branding loads.
// Listens for 'shopm:branding-updated' window events so the OwnerSettingsScreen save
// immediately reflects across the whole app.

import { useEffect, useState } from 'react';

interface Branding {
  businessId?: string;
  businessName?: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  themeColorDark?: string | null;
  tagline?: string | null;
  accentEmoji?: string | null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyTheme(themeColor?: string | null, themeColorDark?: string | null) {
  const root = document.documentElement;
  const brand = themeColor || '#0B7A4B';
  const brandDark = themeColorDark || shade(brand, -20);
  const brandTint = rgba(brand, 0.08);

  root.style.setProperty('--brand-600', brand);
  root.style.setProperty('--brand-700', brandDark);
  root.style.setProperty('--brand-tint', brandTint);
  root.style.setProperty('--primary', brand);
  root.style.setProperty('--primary-foreground', '#ffffff');
  root.style.setProperty('--secondary', brandTint);
  root.style.setProperty('--secondary-foreground', brandDark);
  root.style.setProperty('--accent', brandTint);
  root.style.setProperty('--accent-foreground', brandDark);
  root.style.setProperty('--ring', brand);
  root.style.setProperty('--chart-1', brand);
  root.style.setProperty('--sidebar-primary', brand);
  root.style.setProperty('--sidebar-ring', brand);
}

function shade(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = (c: number) => Math.max(0, Math.min(255, c + (c * percent) / 100));
  const [r, g, b] = rgb.map(f) as number[];
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

export function useBranding(businessId?: string): { branding: Branding | null; ready: boolean } {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  // Re-fetch when businessId changes OR when branding is updated externally
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = businessId
          ? `/api/business/public-branding?businessId=${encodeURIComponent(businessId)}`
          : null;
        if (!url) {
          setReady(true);
          return;
        }
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setBranding(data);
            applyTheme(data.themeColor, data.themeColorDark);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId, version]);

  // Listen for branding-updated events from settings screen
  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener('shopm:branding-updated', handler);
    return () => window.removeEventListener('shopm:branding-updated', handler);
  }, []);

  return { branding, ready };
}

// Component that just applies the theme — useful when we already have businessId from session
export function DynamicTheme({ businessId }: { businessId?: string }) {
  useBranding(businessId);
  return null;
}
