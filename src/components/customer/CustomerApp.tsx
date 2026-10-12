// Customer App shell — premium realistic dairy theme
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from '../Brand';
import { FooterCredit } from '../FooterCredit';
import { OfflineBanner } from '../OfflineBanner';
import { Toasts } from '../Toasts';
import { RealisticDairyBackground } from '../RealisticDairyBackground';
import { DynamicTheme } from '../DynamicTheme';
import { GlobalMilkSplashLayer } from '../MilkSplash';
import { PageTransition } from '../PageTransition';
import { CustHomeScreen } from './CustHomeScreen';
import { CustKhataScreen } from './CustKhataScreen';
import { CustPayScreen } from './CustPayScreen';
import { CustVacationScreen } from './CustVacationScreen';
import { CustNotificationsScreen } from './CustNotificationsScreen';

export function CustomerApp() {
  const view = useApp(s => s.view);
  const setView = useApp(s => s.setView);
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);

  const tabs: { id: typeof view; icon: string; label: string }[] = [
    { id: 'cust_home', icon: '🏠', label: t(lang, 'today') },
    { id: 'cust_khata', icon: '📒', label: t(lang, 'cust_my_khata') },
    { id: 'cust_pay', icon: '💵', label: t(lang, 'cust_pay') },
    { id: 'cust_vacation', icon: '🏖️', label: t(lang, 'cust_vacation') },
    { id: 'cust_notifications', icon: '🔔', label: t(lang, 'cust_notif') },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-cream)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <DynamicTheme businessId={session?.bid} />
      <RealisticDairyBackground variant="cream" density={3} />
      <GlobalMilkSplashLayer />

      {/* Header — glass */}
      <header
        className="glass-strong"
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          padding: '14px 18px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <NexoryosLogo size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em', fontFamily: 'Playfair Display, Georgia, serif' }}>
              {session?.name}
            </div>
            <div style={{ fontSize: 9, color: 'var(--ink-500)', opacity: 0.8, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {t(lang, 'by_nexoryos')}
            </div>
          </div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 10, fontSize: 9, fontWeight: 700,
          background: 'var(--blue-tint)', color: 'var(--blue)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          border: '1px solid rgba(30,90,153,0.18)',
        }} title={t(lang, 'cust_no_edit_dispute_shield')}>
          🔒 read-only
        </span>
      </header>

      <OfflineBanner />

      <main style={{ flex: 1, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <PageTransition viewKey={view}>
          {view === 'cust_home' && <CustHomeScreen />}
          {view === 'cust_khata' && <CustKhataScreen />}
          {view === 'cust_pay' && <CustPayScreen />}
          {view === 'cust_vacation' && <CustVacationScreen />}
          {view === 'cust_notifications' && <CustNotificationsScreen />}
        </PageTransition>
      </main>

      <FooterCredit />
      <Toasts />

      {/* Bottom nav — glass */}
      <nav
        className="glass-strong"
        style={{
          display: 'flex', borderTop: '1px solid rgba(255,255,255,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setView(tb.id as any)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '10px 4px',
              background: view === tb.id ? 'var(--brand-tint)' : 'transparent',
              color: view === tb.id ? 'var(--brand-700)' : 'var(--ink-500)',
              border: 'none',
              borderBottom: view === tb.id ? '2px solid var(--brand-600)' : '2px solid transparent',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', minHeight: 58,
              transition: 'all 350ms cubic-bezier(.4, 0, .2, 1)',
              transform: view === tb.id ? 'translateY(-2px)' : 'translateY(0)',
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontSize: 18, transition: 'transform 350ms cubic-bezier(.4, 0, .2, 1)', transform: view === tb.id ? 'scale(1.08)' : 'scale(1)' }}>{tb.icon}</span>
            <span style={{ fontSize: 10 }}>{tb.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
