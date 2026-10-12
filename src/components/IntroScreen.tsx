'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { RealCow } from './RealCow';
import { VideoLikeBackground } from './VideoLikeBackground';

const SLIDES = ['slide_1', 'slide_2', 'slide_3'] as const;
const SLIDE_ICONS = ['🥛', '🧾', '✅'] as const;

export function IntroScreen() {
  const lang = useApp(s => s.lang);
  const setView = useApp(s => s.setView);
  const markSkipped = useApp(s => s.markIntroSkipped);
  const [phase, setPhase] = useState<'logo' | 'slides'>('logo');
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (phase === 'logo') {
      const id = setTimeout(() => setPhase('slides'), 1400);
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
    const id = setTimeout(() => setSlide(s => s + 1), 1800);
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
        padding: '28px 24px',
        overflow: 'hidden',
      }}
    >
      <VideoLikeBackground density={1.2} />

      {/* Skip top-right */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={skip}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass"
          style={{
            padding: '10px 22px',
            color: 'var(--brand-700)',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 24,
            letterSpacing: '0.04em',
            minHeight: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
          }}
          aria-label="Skip intro"
        >
          {t(lang, 'skip')}
        </motion.button>
      </div>

      {/* Logo + brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, position: 'relative', zIndex: 2 }}>
        {phase === 'logo' ? (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="logo-pulse"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <NexoryosLogo size={108} />
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginTop: 8 }}
            >
              <RealCow size={220} parallax={false} />
            </motion.div>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.025em', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-500)', opacity: 0.8, marginTop: 6, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <NexoryosLogo size={64} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.02em', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {t(lang, 'app_name')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', opacity: 0.7, marginTop: 4, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {t(lang, 'by_nexoryos')}
              </div>
            </div>

            {/* Real cow + slides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, maxWidth: 400, width: '100%' }}>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RealCow size={140} parallax={false} />
              </motion.div>

              <AnimatePresence mode="wait">
                {slide < SLIDES.length && (
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ flex: 1 }}
                  >
                    <div
                      className="glass-strong"
                      style={{
                        padding: '18px 22px',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: 'var(--shadow-card-3d)',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{SLIDE_ICONS[slide]}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-700)', fontFamily: 'Playfair Display, Georgia, serif', letterSpacing: '-0.01em' }}>
                        {t(lang, SLIDES[slide])}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress indicators — elegant line, not dots */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {SLIDES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === slide ? 40 : 12,
                    backgroundColor: i === slide ? 'var(--brand-600)' : 'rgba(31, 26, 18, 0.15)',
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: 3, borderRadius: 2 }}
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
