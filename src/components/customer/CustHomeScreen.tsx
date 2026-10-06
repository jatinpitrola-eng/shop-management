// Customer — Home: today's milk, running total, pending, "I have paid"
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface CustomerResp {
  customer: { id: string; name: string; phone: string };
  business: { name: string; upiId: string };
  month: string;
  today: string;
  todayEntries: {
    id: string;
    shift: string;
    qtyLiters: number;
    product: string;
    ratePerUnit: number;
    amount: number;
  }[];
  totalLiters: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  agingColor: 'green' | 'amber' | 'red';
}

export function CustHomeScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [data, setData] = useState<CustomerResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [paidOpen, setPaidOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?month=${currentMonth()}`);
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
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  const morningEntries = data.todayEntries.filter(e => e.shift === 'morning');
  const eveningEntries = data.todayEntries.filter(e => e.shift === 'evening');

  const agingBg = data.agingColor === 'green' ? 'var(--brand-tint)' : data.agingColor === 'amber' ? 'var(--amber-tint)' : 'var(--red-tint)';
  const agingFg = data.agingColor === 'green' ? 'var(--brand-700)' : data.agingColor === 'amber' ? 'var(--amber)' : 'var(--red)';
  const agingLabel = data.agingColor === 'green' ? t(lang, 'paid') : data.agingColor === 'amber' ? t(lang, 'within_grace') : t(lang, 'overdue');

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Dispute shield banner */}
      <div style={{ padding: '8px 12px', background: 'var(--blue-tint)', borderRadius: 10, border: '1px solid rgba(37,99,235,0.18)', fontSize: 11, color: 'var(--blue)' }}>
        🔒 {t(lang, 'cust_no_edit_dispute_shield')} • {t(lang, 'cust_other_customers_hidden')}
      </div>

      {/* Pending amount card with aging color */}
      <div className="clean-card" style={{ padding: 16, background: agingBg, border: `1px solid ${agingFg}33` }}>
        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'pending_amount')}</div>
        <div className="tabular" style={{ fontSize: 28, fontWeight: 700, color: agingFg }}>{formatINR(data.pendingAmount)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--ink-500)' }}>{agingLabel}</span>
          <span className="tabular" style={{ color: 'var(--ink-500)' }}>{data.totalLiters.toFixed(1)}L • {formatINR(data.totalAmount)}</span>
        </div>
      </div>

      {/* Today's milk */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          🥛 {t(lang, 'cust_today_milk')} — {data.today.slice(8)}/{data.today.slice(5, 7)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>🌅 {t(lang, 'morning')}</div>
            {morningEntries.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-300)' }}>—</div>
            ) : morningEntries.map(e => (
              <div key={e.id} className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                {e.qtyLiters}L × ₹{e.ratePerUnit} = {formatINR(e.amount)}
              </div>
            ))}
          </div>
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>🌆 {t(lang, 'evening')}</div>
            {eveningEntries.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-300)' }}>—</div>
            ) : eveningEntries.map(e => (
              <div key={e.id} className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                {e.qtyLiters}L × ₹{e.ratePerUnit} = {formatINR(e.amount)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month running total */}
      <div className="clean-card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'total_liters')}</div>
          <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{data.totalLiters.toFixed(1)}L</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'total_amount')}</div>
          <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{formatINR(data.totalAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{t(lang, 'paid_amount')}</div>
          <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-700)' }}>{formatINR(data.paidAmount)}</div>
        </div>
      </div>

      <button
        onClick={() => setPaidOpen(true)}
        className="clean-btn motion-fast"
        style={{ background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 14, marginTop: 'auto' }}
      >
        ✓ {t(lang, 'cust_i_paid')}
      </button>

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>

      {paidOpen && (
        <IPaidSheet
          pending={data.pendingAmount}
          upiId={data.business.upiId}
          onClose={() => setPaidOpen(false)}
          onDone={() => { setPaidOpen(false); pushToast({ text: t(lang, 'cust_waiting_owner') }); load(); }}
        />
      )}
    </div>
  );
}

function IPaidSheet({ pending, upiId, onClose, onDone }: { pending: number; upiId: string; onClose: () => void; onDone: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [amount, setAmount] = useState(String(Math.round(pending)));
  const [method, setMethod] = useState<'cash' | 'upi' | 'online'>('upi');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      pushToast({ text: t(lang, 'error') });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method }),
      });
      if (!res.ok) {
        pushToast({ text: t(lang, 'error') });
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

  const methods: { id: typeof method; label: string }[] = [
    { id: 'upi', label: t(lang, 'method_upi') },
    { id: 'cash', label: t(lang, 'method_cash') },
    { id: 'online', label: t(lang, 'method_online') },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="clean-card slide-up" style={{ width: '100%', maxWidth: 440, padding: 18, borderRadius: '16px 16px 0 0', background: 'var(--surface)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'cust_i_paid')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'amount')}</span>
            <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" style={inputStyle} className="clean-btn motion-fast" />
          </label>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'method')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="clean-btn motion-fast"
                  style={{
                    padding: '8px 4px', background: method === m.id ? 'var(--brand-tint)' : 'var(--bg)',
                    color: method === m.id ? 'var(--brand-700)' : 'var(--ink-700)',
                    border: method === m.id ? '1px solid var(--brand-600)' : '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >{m.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
            <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>{saving ? '...' : t(lang, 'save')}</button>
          </div>
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
