// Offline banner — visible when offline or queued entries > 0
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';

export function OfflineBanner() {
  const online = useApp(s => s.online);
  const queue = useApp(s => s.offlineQueue);
  const lang = useApp(s => s.lang);

  if (online && queue.length === 0) return null;

  return (
    <div
      style={{
        background: queue.length > 0 ? 'var(--brand-tint)' : 'var(--amber-tint)',
        borderBottom: `1px solid ${queue.length > 0 ? 'rgba(11,122,75,0.18)' : 'rgba(245,166,35,0.22)'}`,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: queue.length > 0 ? 'var(--brand-700)' : 'var(--amber)',
      }}
    >
      <span style={{ fontSize: 14 }}>{!online ? '📴' : '⏳'}</span>
      <span style={{ flex: 1 }}>
        {!online
          ? t(lang, 'offline')
          : t(lang, 'waiting_sync', { n: String(queue.length) })}
      </span>
      {queue.length > 0 && online && (
        <button
          onClick={async () => {
            // Trigger SW sync if registered
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if ('sync' in reg) {
                // @ts-ignore
                await reg.sync.register('flush-entries');
              } else {
                // Manual fallback — ping a fetch
                navigator.serviceWorker.controller?.postMessage({ type: 'FLUSH' });
              }
            }
          }}
          style={{
            padding: '4px 10px',
            background: 'var(--brand-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            minHeight: 28,
            cursor: 'pointer',
          }}
        >
          {t(lang, 'sync_now')}
        </button>
      )}
    </div>
  );
}
