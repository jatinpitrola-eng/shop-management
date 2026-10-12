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

  useEffect(() => {
    if (phase === 'logo') {
      const id = setTimeout(() => setPhase('slides'), 800);
      return () => clearTimeout(id);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'slides') return;
    if (slide >= SLIDES.length) {
      const session = useApp.getState().session;
      const target = session
        ? session.role === 'customer' ? 'cust_home' : 'owner_today'
        : 'login';
      markSkipped();
      setView(target);
      return;
    }
    const id = setTimeout(() => setSlide(s => s + 1), 1400);
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
            padding: '8px 16px',
            background: 'transparent',
            color: 'var(--ink-500)',
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid var(--border)',
            minHeight: 36,
          }}
          aria-label="Skip intro"
        >
          {t(lang, 'skip')}
        </button>
      </div>

      {/* Logo + brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {phase === 'logo' ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <NexoryosLogo size={88} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, letterSpacing: '0.04em' }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%', maxWidth: 360 }}>
            <NexoryosLogo size={56} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.015em' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>

            {/* Slides — clean text cards */}
            <div style={{ width: '100%', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {slide < SLIDES.length && (
                <div key={slide} className="fade-in" style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--ink-900)',
                    background: 'var(--surface)',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    {t(lang, SLIDES[slide])}
                  </div>
                </div>
              )}
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6 }}>
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

      <FooterCredit />
    </div>
  );
}
