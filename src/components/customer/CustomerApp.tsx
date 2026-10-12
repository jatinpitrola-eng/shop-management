// Customer App shell — premium 3D theme with glass-morphism, page transitions
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from '../Brand';
import { FooterCredit } from '../FooterCredit';
import { OfflineBanner } from '../OfflineBanner';
import { Toasts } from '../Toasts';
import { DairyBackground3D } from '../DairyBackground3D';
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
      <DairyBackground3D density={4} variant="cream" />
      <GlobalMilkSplashLayer />

      {/* Header — glass */}
      <header
        className="glass-strong"
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <NexoryosLogo size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
              {session?.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', opacity: 0.7, letterSpacing: '0.06em' }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
          background: 'var(--blue-tint)', color: 'var(--blue)',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          border: '1px solid rgba(37,99,235,0.18)',
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
            className="motion-spring"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 4px',
              background: view === tb.id ? 'var(--brand-tint)' : 'transparent',
              color: view === tb.id ? 'var(--brand-700)' : 'var(--ink-500)',
              border: 'none',
              borderBottom: view === tb.id ? '3px solid var(--brand-600)' : '3px solid transparent',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', minHeight: 58,
              transform: view === tb.id ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            <span style={{ fontSize: 20, transform: view === tb.id ? 'scale(1.1)' : 'scale(1)', transition: 'transform 250ms cubic-bezier(.34,1.56,.64,1)' }}>{tb.icon}</span>
            <span style={{ fontSize: 10 }}>{tb.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
