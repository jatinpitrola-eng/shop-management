// Owner app shell — premium 3D theme with glass-morphism, page transitions, milk splash
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { OfflineBanner } from './OfflineBanner';
import { Toasts } from './Toasts';
import { DairyBackground3D } from './DairyBackground3D';
import { DynamicTheme } from './DynamicTheme';
import { GlobalMilkSplashLayer } from './MilkSplash';
import { PageTransition } from './PageTransition';
import { OwnerTodayScreen } from './owner/OwnerTodayScreen';
import { OwnerCustomersScreen } from './owner/OwnerCustomersScreen';
import { OwnerKhataScreen } from './owner/OwnerKhataScreen';
import { OwnerPaymentsScreen } from './owner/OwnerPaymentsScreen';
import { OwnerDashboardScreen } from './owner/OwnerDashboardScreen';
import { OwnerSettingsScreen } from './owner/OwnerSettingsScreen';
import { OwnerReportsScreen } from './owner/OwnerReportsScreen';
import { OwnerCustomerDetail } from './owner/OwnerCustomerDetail';

export function OwnerApp() {
  const view = useApp(s => s.view);
  const setView = useApp(s => s.setView);
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);

  const tabs: { id: typeof view; icon: string; label: string }[] = [
    { id: 'owner_today', icon: '📅', label: t(lang, 'today') },
    { id: 'owner_customers', icon: '👥', label: t(lang, 'customers') },
    { id: 'owner_khata', icon: '📒', label: t(lang, 'khata') },
    { id: 'owner_payments', icon: '💵', label: t(lang, 'payments') },
    { id: 'owner_dashboard', icon: '📊', label: t(lang, 'dashboard') },
  ];
  const tabs2: { id: typeof view; icon: string; label: string }[] = [
    { id: 'owner_reports', icon: '📈', label: t(lang, 'reports') },
    { id: 'owner_settings', icon: '⚙️', label: t(lang, 'settings') },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gradient-cream)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <DynamicTheme businessId={session?.bid} />
      <DairyBackground3D density={5} variant="cream" />
      <GlobalMilkSplashLayer />

      {/* Top header — glass */}
      <header
        className="glass-strong"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NexoryosLogo size={32} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{t(lang, 'app_name')}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', opacity: 0.7, letterSpacing: '0.06em' }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--ink-500)' }}>{session?.name}</span>
          <span style={{
            padding: '3px 10px',
            background: session?.role === 'owner' ? 'var(--brand-tint)' : 'var(--amber-tint)',
            color: session?.role === 'owner' ? 'var(--brand-700)' : 'var(--amber)',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: session?.role === 'owner' ? '1px solid rgba(11,122,75,0.18)' : '1px solid rgba(245,166,35,0.22)',
          }}>
            {session?.role}
          </span>
        </div>
      </header>

      <OfflineBanner />

      <main style={{ flex: 1, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <PageTransition viewKey={view}>
          {view === 'owner_today' && <OwnerTodayScreen />}
          {view === 'owner_customers' && <OwnerCustomersScreen />}
          {view === 'owner_customer_detail' && <OwnerCustomerDetail />}
          {view === 'owner_khata' && <OwnerKhataScreen />}
          {view === 'owner_payments' && <OwnerPaymentsScreen />}
          {view === 'owner_dashboard' && <OwnerDashboardScreen />}
          {view === 'owner_settings' && <OwnerSettingsScreen />}
          {view === 'owner_reports' && <OwnerReportsScreen />}
        </PageTransition>
      </main>

      <FooterCredit />

      <Toasts />

      {/* Bottom nav — glass with subtle bounce on active */}
      <nav
        className="glass-strong"
        style={{
          display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {[...tabs, ...tabs2].map(tb => (
          <button
            key={tb.id}
            onClick={() => setView(tb.id as any)}
            className="motion-spring"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 4px',
              background: view === tb.id ? 'var(--brand-tint)' : 'transparent',
              color: view === tb.id ? 'var(--brand-700)' : 'var(--ink-500)',
              border: 'none',
              borderBottom: view === tb.id ? '3px solid var(--brand-600)' : '3px solid transparent',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 58,
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
