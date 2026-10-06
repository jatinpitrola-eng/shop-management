// Customer — Notifications (activities): list of activity items
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatDateTimeIST } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface Activity {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  createdAt: string;
}

export function CustNotificationsScreen() {
  const lang = useApp(s => s.lang);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const d = await res.json();
        setActivities(d.activities || []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const icon = (type: string) => {
    if (type === 'bill_generated') return '📄';
    if (type === 'payment_confirmed') return '✅';
    if (type === 'payment_pending') return '⏳';
    if (type?.includes('vacation')) return '🏖️';
    if (type?.includes('rate')) return '₹';
    return '🔔';
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minHeight: '100%' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
        {t(lang, 'cust_notif')}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>{t(lang, 'no_data')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map(a => (
            <div key={a.id} className="clean-card" style={{ padding: 12, display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{icon(a.type)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{a.title}</div>
                {a.body && <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{a.body}</div>}
                <div className="tabular" style={{ fontSize: 10, color: 'var(--ink-300)', marginTop: 4 }}>
                  {formatDateTimeIST(new Date(a.createdAt))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <FooterCredit />
      </div>
    </div>
  );
}
