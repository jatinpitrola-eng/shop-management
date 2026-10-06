// Toasts container — sticky-bottom area
'use client';
import { useApp } from '@/lib/store';

export function Toasts() {
  const toasts = useApp(s => s.toasts);
  const dismiss = useApp(s => s.dismissToast);
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0 12px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="slide-up clean-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--ink-900)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(20,24,31,0.18)',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t.text}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {t.undo && (
              <button
                onClick={() => { t.undo!(); dismiss(t.id); }}
                style={{
                  padding: '4px 10px',
                  background: 'var(--brand-600)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 28,
                }}
              >
                Undo
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                color: 'var(--ink-300)',
                border: 'none',
                borderRadius: 6,
                fontSize: 16,
                cursor: 'pointer',
                minHeight: 28,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
