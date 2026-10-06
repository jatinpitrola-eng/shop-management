'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';

const SLIDES = ['slide_1', 'slide_2', 'slide_3'] as const;

export function IntroScreen() {
  const lang = useApp(s => s.lang);
  const setView = useApp(s => s.setView);
  const markSkipped = useApp(s => s.markIntroSkipped);
  const [phase, setPhase] = useState<'logo' | 'slides'>('logo');
  const [slide, setSlide] = useState(0);

  // Logo phase — 600ms then slides
  useEffect(() => {
    if (phase === 'logo') {
      const id = setTimeout(() => setPhase('slides'), 700);
      return () => clearTimeout(id);
    }
  }, [phase]);

  // Slides — 1.5s each
  useEffect(() => {
    if (phase !== 'slides') return;
    if (slide >= SLIDES.length) {
      // After all slides, go to login (or home if session exists)
      const session = useApp.getState().session;
      const target = session
        ? session.role === 'customer' ? 'cust_home' : 'owner_today'
        : 'login';
      markSkipped();
      setView(target);
      return;
    }
    const id = setTimeout(() => setSlide(s => s + 1), 1500);
    return () => clearTimeout(id);
  }, [phase, slide, setView, markSkipped]);

  const skip = () => {
    markSkipped();
    const session = useApp.getState().session;
    const target = session
      ? session.role === 'customer' ? 'cust_home' : 'owner_today'
      : 'login';
    setView(target);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
        position: 'relative',
      }}
    >
      {/* Skip top-right */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={skip}
          className="clean-btn motion-fast"
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: 'var(--ink-500)',
            fontSize: 14,
            fontWeight: 500,
            border: '1px solid var(--border)',
          }}
          aria-label="Skip intro"
        >
          {t(lang, 'skip')}
        </button>
      </div>

      {/* Logo + brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {phase === 'logo' ? (
          <div className="logo-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <NexoryosLogo size={96} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', opacity: 0.7, marginTop: 4, letterSpacing: '0.05em' }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
            <NexoryosLogo size={64} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', opacity: 0.7, marginTop: 2 }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>
            {/* Slides */}
            <div style={{ width: '100%', maxWidth: 340, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {slide < SLIDES.length ? (
                <div key={slide} className="slide-fade" style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--brand-700)',
                    background: 'var(--brand-tint)',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: '1px solid rgba(11,122,75,0.18)',
                  }}>
                    {t(lang, SLIDES[slide])}
                  </div>
                </div>
              ) : null}
            </div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 8 }}>
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i === slide ? 'var(--brand-600)' : 'var(--ink-300)',
                    transition: 'background 200ms',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer credit — always visible */}
      <FooterCredit />
    </div>
  );
}
