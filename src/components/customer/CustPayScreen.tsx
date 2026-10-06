// Customer — Pay: UPI deep-link + QR, cash info, "I have paid"
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface CustResp {
  customer: { id: string; name: string; phone: string };
  business: { name: string; upiId: string };
  pendingAmount: number;
  agingColor: 'green' | 'amber' | 'red';
}

export function CustPayScreen() {
  const lang = useApp(s => s.lang);
  const [data, setData] = useState<CustResp | null>(null);
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

  const pending = data.pendingAmount;
  const upiId = data.business.upiId;
  const businessName = data.business.name;
  const upiDeepLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${pending.toFixed(2)}&cu=INR`
    : '';
  const qrUrl = upiDeepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDeepLink)}`
    : '';

  const agingBg = data.agingColor === 'green' ? 'var(--brand-tint)' : data.agingColor === 'amber' ? 'var(--amber-tint)' : 'var(--red-tint)';
  const agingFg = data.agingColor === 'green' ? 'var(--brand-700)' : data.agingColor === 'amber' ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Pending */}
      <div className="clean-card" style={{ padding: 16, background: agingBg, border: `1px solid ${agingFg}33`, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 4 }}>{t(lang, 'pending_amount')}</div>
        <div className="tabular" style={{ fontSize: 32, fontWeight: 700, color: agingFg }}>{formatINR(pending)}</div>
      </div>

      {pending <= 0 ? (
        <div className="clean-card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-700)' }}>{t(lang, 'paid')}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
            {lang === 'gu' ? 'બધું બાકી રકમ ચૂકવાયેલ છે' : lang === 'hi' ? 'सभी बकाया राशि भुगतान हो गई' : 'All dues cleared'}
          </div>
        </div>
      ) : upiId ? (
        <>
          {/* UPI QR */}
          <div className="clean-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{t(lang, 'cust_pay_upi')}</div>
            {qrUrl && (
              <img src={qrUrl} alt="UPI QR" width={200} height={200} style={{ borderRadius: 10, border: '1px solid var(--border)' }} />
            )}
            <div className="tabular" style={{ fontSize: 12, color: 'var(--ink-500)' }}>UPI: {upiId}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>{businessName}</div>
            <button
              onClick={() => { window.location.href = upiDeepLink; }}
              className="clean-btn motion-fast"
              style={{ width: '100%', background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 14, marginTop: 4 }}
            >
              ⚡ {t(lang, 'pay_now')}
            </button>
          </div>

          {/* Cash info */}
          <div className="clean-card" style={{ padding: 12, background: 'var(--amber-tint)', border: '1px solid rgba(245,166,35,0.22)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>💵 {t(lang, 'cust_pay_cash')}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-700)' }}>
              {lang === 'gu' ? 'રોકડમાં ચૂકવ્યા પછી "હું ચૂકવી ચૂક્યો" બટન દબાવો — માલિક પુષ્ટિ કરશે.' : lang === 'hi' ? 'नकद भुगतान के बाद "मैंने भुगतान किया" दबाएँ।' : 'After cash payment, tap "I have paid" — owner will confirm.'}
            </div>
          </div>

          <button
            onClick={() => setPaidOpen(true)}
            className="clean-btn motion-fast"
            style={{ background: 'var(--surface)', color: 'var(--brand-700)', border: '1px solid var(--brand-600)', fontSize: 14, marginTop: 'auto' }}
          >
            ✓ {t(lang, 'cust_i_paid')}
          </button>
        </>
      ) : (
        <div className="clean-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {lang === 'gu' ? 'માલિકે UPI ID સેટ નથી કરી. રોકડમાં ચૂકવો અને "હું ચૂકવ્યો" દબાવો.' : 'UPI not configured. Pay cash and tap "I have paid".'}
          </div>
          <button
            onClick={() => setPaidOpen(true)}
            className="clean-btn motion-fast"
            style={{ marginTop: 10, width: '100%', background: 'var(--brand-600)', color: '#fff', border: 'none' }}
          >✓ {t(lang, 'cust_i_paid')}</button>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>

      {paidOpen && (
        <IPaidSheet
          pending={pending}
          onClose={() => setPaidOpen(false)}
          onDone={() => { setPaidOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function IPaidSheet({ pending, onClose, onDone }: { pending: number; onClose: () => void; onDone: () => void }) {
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
      pushToast({ text: t(lang, 'cust_waiting_owner') });
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
