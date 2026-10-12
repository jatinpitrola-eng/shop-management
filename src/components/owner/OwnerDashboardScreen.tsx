// Owner — Dashboard: this month vs last, collection rate, top 5 overdue, on vacation, countdowns
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';
import { RealCow } from '../RealCow';

interface DashboardResp {
  thisMonth: { amount: number; liters: number; paid: number };
  lastMonth: { amount: number; liters: number };
  delta: number;
  collectionRate: number;
  top5Overdue: { id: string; name: string; pending: number }[];
  onVacationToday: { id: string; name: string; phone: string; from: string; to: string }[];
  monthEndCountdown: { daysLeft: number; lastDay: number };
  graceCountdown: { daysLeft: number; ends: string };
}

export function OwnerDashboardScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const setView = useApp(s => s.setView);
  const setSelectedCustomerId = useApp(s => s.setSelectedCustomerId);
  const [data, setData] = useState<DashboardResp | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  const { thisMonth, lastMonth, delta, collectionRate, top5Overdue, onVacationToday, monthEndCountdown, graceCountdown } = data;
  const deltaPositive = delta >= 0;

  const openCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setView('owner_customer_detail');
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Hero mascot */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <RealCow size={160} parallax />
      </div>

      {/* Top stat cards — wrapped in a gradient container for the "wow" feel */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-tint), rgba(255,224,138,0.15))',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="clean-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'this_month')}</div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)' }}>{formatINR(thisMonth.amount)}</div>
            <div className="tabular" style={{ fontSize: 11, color: 'var(--brand-700)', marginTop: 2 }}>{thisMonth.liters.toFixed(1)}L • {t(lang, 'paid_amount')} {formatINR(thisMonth.paid)}</div>
          </div>
          <div className="clean-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'last_month')}</div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-700)' }}>{formatINR(lastMonth.amount)}</div>
            <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{lastMonth.liters.toFixed(1)}L</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="clean-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'delta')}</div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 700, color: deltaPositive ? 'var(--brand-700)' : 'var(--red)' }}>
              {deltaPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
              {deltaPositive ? '+' : ''}{formatINR(thisMonth.amount - lastMonth.amount)}
            </div>
          </div>
          <div className="clean-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'collection_rate')}</div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 700, color: collectionRate >= 80 ? 'var(--brand-700)' : collectionRate >= 50 ? 'var(--amber)' : 'var(--red)' }}>
              {collectionRate.toFixed(0)}%
            </div>
            <div style={{ height: 4, background: 'var(--muted)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${collectionRate}%`, height: '100%', background: 'var(--brand-600)', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Month-end + grace countdowns inside the gradient container */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="clean-card" style={{ padding: 14, background: 'var(--amber-tint)', border: '1px solid rgba(245,166,35,0.22)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'month_end_countdown')}</div>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
              {t(lang, 'days_left', { n: String(monthEndCountdown.daysLeft) })}
            </div>
          </div>
          <div className="clean-card" style={{ padding: 14, background: 'var(--red-tint)', border: '1px solid rgba(220,38,38,0.18)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'grace_countdown')}</div>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>
              {t(lang, 'days_left', { n: String(graceCountdown.daysLeft) })}
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 overdue */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          🔴 {t(lang, 'top_overdue')}
        </div>
        {top5Overdue.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--brand-700)', padding: '12px 0', textAlign: 'center' }}>
            ✅ {t(lang, 'no_data')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {top5Overdue.map((c, i) => (
              <button
                key={c.id}
                onClick={() => openCustomer(c.id)}
                className="motion-fast"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-300)' }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'pending_amount')}</div>
                  </div>
                </div>
                <div className="tabular" style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>
                  {formatINR(c.pending)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* On vacation today */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          🏖️ {t(lang, 'on_vacation_today')} ({onVacationToday.length})
        </div>
        {onVacationToday.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: '8px 0' }}>{t(lang, 'no_data')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onVacationToday.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--blue-tint)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{v.name}</div>
                  <div className="tabular" style={{ fontSize: 10, color: 'var(--blue)' }}>{v.from} → {v.to}</div>
                </div>
                <button
                  onClick={() => openCustomer(v.id)}
                  className="motion-fast"
                  style={{ padding: '6px 10px', background: 'transparent', color: 'var(--blue)', border: '1px solid var(--blue)', borderRadius: 6, fontSize: 11, minHeight: 32, cursor: 'pointer' }}
                >›</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>
    </div>
  );
}
