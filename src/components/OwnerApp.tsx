// Owner app shell — sticky bottom nav (Today / Customers / Khata / Payments / Dashboard / Settings / Reports)
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { OfflineBanner } from './OfflineBanner';
import { Toasts } from './Toasts';
import { DairyBackground } from './DairyBackground';
import { DynamicTheme } from './DynamicTheme';
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

  // Apply dynamic branding from business
  const businessId = session?.bid || undefined;
  if (businessId) {
    // Render DynamicTheme inline to apply theme before paint
  }

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
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <DynamicTheme businessId={businessId} />
      <DairyBackground density={6} />

      {/* Top header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 14px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NexoryosLogo size={28} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.1 }}>{t(lang, 'app_name')}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', opacity: 0.7 }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--ink-500)' }}>{session?.name}</span>
          <span style={{
            padding: '2px 8px',
            background: session?.role === 'owner' ? 'var(--brand-tint)' : 'var(--amber-tint)',
            color: session?.role === 'owner' ? 'var(--brand-700)' : 'var(--amber)',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {session?.role}
          </span>
        </div>
      </header>

      <OfflineBanner />

      <main style={{ flex: 1, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        {view === 'owner_today' && <OwnerTodayScreen />}
        {view === 'owner_customers' && <OwnerCustomersScreen />}
        {view === 'owner_customer_detail' && <OwnerCustomerDetail />}
        {view === 'owner_khata' && <OwnerKhataScreen />}
        {view === 'owner_payments' && <OwnerPaymentsScreen />}
        {view === 'owner_dashboard' && <OwnerDashboardScreen />}
        {view === 'owner_settings' && <OwnerSettingsScreen />}
        {view === 'owner_reports' && <OwnerReportsScreen />}
      </main>

      <FooterCredit />

      <Toasts />

      {/* Bottom nav */}
      <nav
        className="sticky-bottom"
        style={{
          display: 'flex',
          borderTop: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {[...tabs, ...tabs2].map(tb => (
          <button
            key={tb.id}
            onClick={() => setView(tb.id as any)}
            className="motion-fast"
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
              borderBottom: view === tb.id ? '2px solid var(--brand-600)' : '2px solid transparent',
              fontSize: 10,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 18 }}>{tb.icon}</span>
            <span style={{ fontSize: 10 }}>{tb.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
