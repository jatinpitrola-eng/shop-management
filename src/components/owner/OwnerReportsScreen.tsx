// Owner — Reports: 12-month bar chart, customer-wise summary, CSV export, bill generation
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface MonthRow {
  month: string;
  liters: number;
  amount: number;
  paid: number;
  pending: number;
}
interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  liters: number;
  amount: number;
}

export function OwnerReportsScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [summary, setSummary] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'amount' | 'liters' | 'name'>('amount');
  const [billFor, setBillFor] = useState<CustomerSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const d = await res.json();
        setMonths(d.months || []);
        setSummary(d.customerSummary || []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const maxAmount = Math.max(1, ...months.map(m => m.amount));

  const sortedSummary = [...summary].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return (b[sortKey] as number) - (a[sortKey] as number);
  });

  const exportCsv = () => {
    window.location.href = '/api/reports?format=csv';
  };

  const fmtMonth = (m: string) => {
    const [y, mm] = m.split('-').map(Number);
    const d = new Date(y, mm - 1, 1);
    return d.toLocaleDateString(lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Bar chart — 12 months */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 12 }}>
          {t(lang, 'reports')} — 12 {lang === 'gu' ? 'મહિના' : 'months'}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, overflowX: 'auto' }}>
          {months.map(m => {
            const h = Math.max(4, (m.amount / maxAmount) * 100);
            const isThis = m.month === currentMonth();
            return (
              <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 32, height: '100%', justifyContent: 'flex-end', gap: 4 }}>
                <div className="tabular" style={{ fontSize: 8, color: 'var(--ink-500)' }}>{formatINR(m.amount).replace('₹', '₹')}</div>
                <div
                  className="motion-fast"
                  style={{
                    width: '100%', maxWidth: 18, height: `${h}%`,
                    background: isThis ? 'var(--brand-600)' : 'var(--brand-tint)',
                    border: isThis ? '1px solid var(--brand-700)' : '1px solid rgba(11,122,75,0.18)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
                <div style={{ fontSize: 8, color: 'var(--ink-500)' }}>{fmtMonth(m.month)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Year summary */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
            {lang === 'gu' ? 'ગ્રાહક-વાઇઝ સારાંશ' : 'Customer-wise summary'}
          </div>
          <button onClick={exportCsv} className="clean-btn motion-fast" style={{ padding: '6px 10px', background: 'var(--surface)', color: 'var(--brand-700)', border: '1px solid var(--brand-600)', fontSize: 11, minHeight: 36 }}>
            ⬇ {t(lang, 'export_csv')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {(['amount', 'liters', 'name'] as const).map(k => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className="motion-fast"
              style={{
                padding: '4px 8px', borderRadius: 6, border: 'none',
                background: sortKey === k ? 'var(--brand-tint)' : 'transparent',
                color: sortKey === k ? 'var(--brand-700)' : 'var(--ink-500)',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {k === 'amount' ? t(lang, 'total_amount') : k === 'liters' ? t(lang, 'total_liters') : t(lang, 'name')}
            </button>
          ))}
        </div>
        {sortedSummary.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: 12, textAlign: 'center' }}>{t(lang, 'no_data')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedSummary.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-300)', fontWeight: 700 }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div className="tabular" style={{ fontSize: 10, color: 'var(--ink-500)' }}>{c.liters.toFixed(1)}L</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="tabular" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{formatINR(c.amount)}</div>
                  <button
                    onClick={() => setBillFor(c)}
                    className="motion-fast"
                    style={{ padding: '4px 8px', background: 'var(--amber-tint)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.22)', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', minHeight: 28 }}
                  >
                    {t(lang, 'regen_bill')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>

      {billFor && (
        <BillSheet
          customer={billFor}
          onClose={() => setBillFor(null)}
          onDone={() => { setBillFor(null); pushToast({ text: t(lang, 't_bill_generated') }); load(); }}
        />
      )}
    </div>
  );
}

function BillSheet({ customer, onClose, onDone }: { customer: CustomerSummary; onClose: () => void; onDone: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [billMonth, setBillMonth] = useState(currentMonth());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!billMonth) return;
    setSaving(true);
    try {
      const res = await fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, billMonth }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        pushToast({ text: d?.error || t(lang, 'error') });
        setSaving(false);
        return;
      }
      onDone();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="clean-card slide-up" style={{ width: '100%', maxWidth: 440, padding: 18, borderRadius: '16px 16px 0 0', background: 'var(--surface)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t(lang, 'regen_bill')}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 12 }}>{customer.name} • {customer.liters.toFixed(1)}L • {formatINR(customer.amount)}</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'bill_month')}</span>
          <input type="month" value={billMonth} onChange={e => setBillMonth(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
          <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>{saving ? '...' : t(lang, 'save')}</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--ink-900)', outline: 'none', width: '100%',
  minHeight: 48, boxSizing: 'border-box',
};
