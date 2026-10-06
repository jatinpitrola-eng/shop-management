// Customer — Vacation: request form + list of existing requests
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { istDate, formatDateTimeIST } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface CustResp {
  customer: { id: string; name: string; phone: string };
  vacations: Vacation[];
}
interface Vacation {
  id: string;
  fromDate: string;
  toDate: string;
  status: string;
  createdAt: string;
}

export function CustVacationScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [data, setData] = useState<CustResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(istDate());
  const [toDate, setToDate] = useState(istDate());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?month=${new Date().toISOString().slice(0, 7)}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!data?.customer.id || !fromDate || !toDate) return;
    if (fromDate > toDate) {
      pushToast({ text: t(lang, 'error') });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: data.customer.id, fromDate, toDate }),
      });
      if (!res.ok) {
        pushToast({ text: t(lang, 'error') });
        setSaving(false);
        return;
      }
      pushToast({ text: t(lang, 't_vacation_request_sent') });
      setFromDate(istDate());
      setToDate(istDate());
      load();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Dispute shield */}
      <div style={{ padding: '6px 10px', background: 'var(--blue-tint)', borderRadius: 8, fontSize: 11, color: 'var(--blue)' }}>
        🔒 {t(lang, 'cust_no_edit_dispute_shield')}
      </div>

      {/* Form */}
      <div className="clean-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{t(lang, 'vacation_request')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'from_date')}</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'to_date')}</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </label>
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="clean-btn motion-fast"
          style={{ background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 14 }}
        >{saving ? '...' : t(lang, 'save')}</button>
      </div>

      {/* Existing requests */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          {lang === 'gu' ? 'હાલની વિનંતીઓ' : lang === 'hi' ? 'मौजूदा अनुरोध' : 'Existing requests'}
        </div>
        {data.vacations.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: 12, textAlign: 'center' }}>{t(lang, 'no_data')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.vacations.map(v => {
              const c = v.status === 'approved' ? 'var(--brand-700)' : v.status === 'requested' ? 'var(--amber)' : 'var(--red)';
              const bg = v.status === 'approved' ? 'var(--brand-tint)' : v.status === 'requested' ? 'var(--amber-tint)' : 'var(--red-tint)';
              return (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div>
                    <div className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{v.fromDate} → {v.toDate}</div>
                    <div className="tabular" style={{ fontSize: 10, color: 'var(--ink-500)' }}>{formatDateTimeIST(new Date(v.createdAt))}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: bg, color: c, alignSelf: 'center' }}>{v.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <FooterCredit />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--ink-900)', outline: 'none', width: '100%',
  minHeight: 48, boxSizing: 'border-box',
};
