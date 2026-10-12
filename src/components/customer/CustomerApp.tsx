// Customer App shell — clean minimal fresh theme
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { NexoryosLogo } from '../Brand';
import { FooterCredit } from '../FooterCredit';
import { OfflineBanner } from '../OfflineBanner';
import { Toasts } from '../Toasts';
import { DynamicTheme } from '../DynamicTheme';
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
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <DynamicTheme businessId={session?.bid} />

      {/* Header — clean */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <NexoryosLogo size={28} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session?.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>
        <span style={{
          padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600,
          background: 'var(--blue-tint)', color: 'var(--blue)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }} title={t(lang, 'cust_no_edit_dispute_shield')}>
          🔒 read-only
        </span>
      </header>

      <OfflineBanner />

      <main style={{ flex: 1, paddingBottom: 70 }}>
        {view === 'cust_home' && <CustHomeScreen />}
        {view === 'cust_khata' && <CustKhataScreen />}
        {view === 'cust_pay' && <CustPayScreen />}
        {view === 'cust_vacation' && <CustVacationScreen />}
        {view === 'cust_notifications' && <CustNotificationsScreen />}
      </main>

      <FooterCredit />
      <Toasts />

      {/* Bottom nav — clean */}
      <nav className="sticky-bottom" style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setView(tb.id as any)}
            className="motion-fast"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 4px',
              background: 'transparent',
              color: view === tb.id ? 'var(--brand-700)' : 'var(--ink-500)',
              border: 'none',
              borderBottom: view === tb.id ? '2px solid var(--brand-600)' : '2px solid transparent',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', minHeight: 56,
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
