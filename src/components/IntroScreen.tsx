'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { Cow3D } from './Cow3D';
import { DairyBackground3D } from './DairyBackground3D';

const SLIDES = ['slide_1', 'slide_2', 'slide_3'] as const;

export function IntroScreen() {
  const lang = useApp(s => s.lang);
  const setView = useApp(s => s.setView);
  const markSkipped = useApp(s => s.markIntroSkipped);
  const [phase, setPhase] = useState<'logo' | 'slides'>('logo');
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (phase === 'logo') {
      const id = setTimeout(() => setPhase('slides'), 1000);
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
    const id = setTimeout(() => setSlide(s => s + 1), 1700);
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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        overflow: 'hidden',
      }}
    >
      <DairyBackground3D density={10} pouringMilk variant="cream" />

      {/* Skip top-right */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={skip}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          className="glass motion-spring"
          style={{
            padding: '8px 18px',
            color: 'var(--brand-700)',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 24,
            border: '1px solid rgba(11,122,75,0.18)',
            minHeight: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          aria-label="Skip intro"
        >
          {t(lang, 'skip')}
        </motion.button>
      </div>

      {/* Logo + brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative', zIndex: 2 }}>
        {phase === 'logo' ? (
          <motion.div
            className="logo-pulse"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <NexoryosLogo size={108} />
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ marginTop: 4 }}
            >
              <Cow3D size={140} parallax={false} sparkles milkDrop />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', opacity: 0.7, marginTop: 4, letterSpacing: '0.06em' }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <NexoryosLogo size={68} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', opacity: 0.7, marginTop: 2 }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>

            {/* 3D Cow + slides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 380, width: '100%' }}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Cow3D size={96} parallax={false} sparkles milkDrop />
              </motion.div>

              <AnimatePresence mode="wait">
                {slide < SLIDES.length && (
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 40, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.92 }}
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ flex: 1 }}
                  >
                    <div
                      className="glass-strong"
                      style={{
                        padding: '16px 20px',
                        borderRadius: 16,
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--brand-700)',
                        border: '1px solid rgba(11,122,75,0.18)',
                        boxShadow: 'var(--shadow-card-3d)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{slide === 0 ? '🥛' : slide === 1 ? '🧾' : '✅'}</span>
                      {t(lang, SLIDES[slide])}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress dots — animated */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {SLIDES.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    width: i === slide ? 28 : 6,
                    backgroundColor: i === slide ? 'var(--brand-600)' : 'var(--ink-300)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  style={{
                    height: 6,
                    borderRadius: 3,
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
