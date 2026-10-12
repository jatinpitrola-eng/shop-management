'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { CuteCow } from './CuteCow';
import { DairyBackground } from './DairyBackground';

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
    const id = setTimeout(() => setSlide(s => s + 1), 1600);
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
        background:
          'linear-gradient(180deg, #F6F8F7 0%, #EAF5EE 60%, #F6F8F7 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated dairy-themed background */}
      <DairyBackground density={10} />

      {/* Skip top-right */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={skip}
          whileTap={{ scale: 0.92 }}
          className="clean-btn motion-fast"
          style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(4px)',
            color: 'var(--brand-700)',
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid rgba(11,122,75,0.18)',
            borderRadius: 20,
          }}
          aria-label="Skip intro"
        >
          {t(lang, 'skip')}
        </motion.button>
      </div>

      {/* Logo + brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 2 }}>
        {phase === 'logo' ? (
          <motion.div
            className="logo-pulse"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <NexoryosLogo size={104} />
            {/* Cute cow below the logo */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <CuteCow size={110} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}
              >
                {t(lang, 'app_name')}
              </motion.div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', opacity: 0.7, marginTop: 4, letterSpacing: '0.05em' }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <NexoryosLogo size={64} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', opacity: 0.7, marginTop: 2 }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>

            {/* Cute cow + slides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 380, width: '100%' }}>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CuteCow size={84} />
              </motion.div>

              <AnimatePresence mode="wait">
                {slide < SLIDES.length && (
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35 }}
                    style={{ flex: 1 }}
                  >
                    <div style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: 'var(--brand-700)',
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(6px)',
                      padding: '14px 18px',
                      borderRadius: 14,
                      border: '1px solid rgba(11,122,75,0.15)',
                      boxShadow: '0 4px 12px rgba(11,122,75,0.10)',
                    }}>
                      {t(lang, SLIDES[slide])}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 8 }}>
              {SLIDES.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    width: i === slide ? 22 : 6,
                    backgroundColor: i === slide ? 'var(--brand-600)' : 'var(--ink-300)',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: 6, borderRadius: 3,
                    background: 'var(--ink-300)',
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
