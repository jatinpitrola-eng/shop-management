// Customer — Khata: month picker, daily line items, summary, prev months, PDF statement
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth, parseMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';
import { StatementModal } from '../StatementModal';

interface CustResp {
  customer: { id: string; name: string; phone: string };
  business: { name: string; upiId: string };
  month: string;
  todayEntries: any[];
  totalLiters: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  agingColor: string;
  activities: any[];
  vacations: any[];
  recentPayments: any[];
}

export function CustKhataScreen() {
  const lang = useApp(s => s.lang);
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<CustResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [stmtOpen, setStmtOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?month=${month}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [month]);

  const changeMonth = (delta: number) => {
    const { year: y, month: m } = parseMonth(month);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fmtMonth = (m: string) => {
    const [y, mm] = m.split('-').map(Number);
    const d = new Date(y, mm - 1, 1);
    return d.toLocaleDateString(lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });
  };

  // Previous 6 months
  const prevMonths = Array.from({ length: 6 }, (_, i) => {
    const { year: y, month: m } = parseMonth(month);
    const d = new Date(y, m - 1 - (i + 1), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  if (loading || !data) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  // We don't have direct entries list with dates from /api/customer (only todayEntries + totals). Use activities + recentPayments to show items.
  // The actual customer entries by month aren't returned separately — but we can show today + payments + vacations as a "timeline".
  const timeline: { date: string; text: string; amount?: number }[] = [];
  for (const e of data.todayEntries) {
    timeline.push({ date: e.date, text: `${e.shift} • ${e.qtyLiters}L × ₹${e.ratePerUnit}`, amount: e.amount });
  }
  for (const p of data.recentPayments) {
    timeline.push({ date: p.approvedAt.slice(0, 10), text: `${t(lang, 'paid_amount')} • ${p.method.toUpperCase()} • ${p.approvedByName}`, amount: -p.amount });
  }
  timeline.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Dispute shield */}
      <div style={{ padding: '6px 10px', background: 'var(--blue-tint)', borderRadius: 8, fontSize: 11, color: 'var(--blue)' }}>
        🔒 {t(lang, 'cust_no_edit_dispute_shield')}
      </div>

      {/* Month picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => changeMonth(-1)} className="clean-btn motion-fast" style={{ padding: '0 14px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{fmtMonth(month)}</div>
        <button onClick={() => changeMonth(1)} className="clean-btn motion-fast" style={{ padding: '0 14px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>›</button>
      </div>

      {/* Summary */}
      <div className="clean-card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'total_liters')}</div>
          <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)' }}>{data.totalLiters.toFixed(1)}L</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'total_amount')}</div>
          <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)' }}>{formatINR(data.totalAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'paid_amount')}</div>
          <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-700)' }}>{formatINR(data.paidAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'pending_amount')}</div>
          <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: data.pendingAmount > 0 ? 'var(--red)' : 'var(--brand-700)' }}>{formatINR(data.pendingAmount)}</div>
        </div>
      </div>

      {/* Daily line list (timeline) */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          {t(lang, 'entry_history')}
        </div>
        {timeline.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: 12, textAlign: 'center' }}>{t(lang, 'no_data')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {timeline.slice(0, 30).map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{it.date}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-700)' }}>{it.text}</div>
                </div>
                {it.amount !== undefined && (
                  <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: it.amount > 0 ? 'var(--ink-900)' : 'var(--brand-700)' }}>
                    {it.amount > 0 ? formatINR(it.amount) : '+' + formatINR(-it.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prev months */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          {lang === 'gu' ? 'પહેલાના મહિના' : lang === 'hi' ? 'पिछले महीने' : 'Previous months'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {prevMonths.map(m => (
            <button
              key={m}
              onClick={() => setMonth(m)}
              className="motion-fast"
              style={{
                padding: '8px 12px', background: 'var(--bg)', color: 'var(--ink-700)',
                border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer', minHeight: 36,
              }}
            >{fmtMonth(m)}</button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setStmtOpen(true)}
        className="clean-btn motion-fast"
        style={{ background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 13, marginTop: 4 }}
      >📄 {t(lang, 'download_pdf')}</button>

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>

      {stmtOpen && data.customer.id && (
        <StatementModal customerId={data.customer.id} month={month} onClose={() => setStmtOpen(false)} />
      )}
    </div>
  );
}
