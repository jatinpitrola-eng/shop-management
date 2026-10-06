// Owner — Customers list with search + add + edit/deactivate
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, normalizePhone, currentMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  defaultQty: number;
  defaultRate: number;
  active: boolean;
}

interface MonthTotal {
  id: string;
  totalLiters: number;
  totalAmount: number;
  pending: number;
}

export function OwnerCustomersScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const setSelectedCustomerId = useApp(s => s.setSelectedCustomerId);
  const setView = useApp(s => s.setView);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totals, setTotals] = useState<Record<string, MonthTotal>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, kRes] = await Promise.all([
        fetch('/api/customers'),
        fetch(`/api/khata?month=${currentMonth()}`),
      ]);
      if (cRes.ok) {
        const d = await cRes.json();
        setCustomers(d.customers || []);
      }
      if (kRes.ok) {
        const d = await kRes.json();
        const map: Record<string, MonthTotal> = {};
        for (const c of (d.customers || [])) {
          map[c.id] = { id: c.id, totalLiters: c.totalLiters, totalAmount: c.totalAmount, pending: c.pending };
        }
        setTotals(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );
  // Active first
  const sorted = [...filtered].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  const openDetail = (id: string) => {
    setSelectedCustomerId(id);
    setView('owner_customer_detail');
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky search + add */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder={t(lang, 'search_customer')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="motion-fast"
          style={{
            flex: 1, padding: '12px 14px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 12, fontSize: 14,
            color: 'var(--ink-900)', outline: 'none', minHeight: 48,
          }}
        />
        <button
          onClick={() => setAddOpen(true)}
          className="clean-btn motion-fast"
          style={{
            background: 'var(--brand-600)', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 13, padding: '0 16px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          aria-label={t(lang, 'add_customer')}
        >
          <span style={{ fontSize: 18, lineHeight: 0 }}>+</span> {t(lang, 'add_customer')}
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 8 }}>
        {customers.length} {t(lang, 'customers')} • {t(lang, 'this_month')}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
          {t(lang, 'no_data')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(c => {
            const m = totals[c.id];
            return (
              <button
                key={c.id}
                onClick={() => openDetail(c.id)}
                className="clean-card motion-fast"
                style={{
                  padding: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  opacity: c.active ? 1 : 0.55,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'var(--brand-tint)', color: 'var(--brand-700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15, flexShrink: 0,
                    }}>
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name} {!c.active && <span style={{ fontSize: 10, color: 'var(--ink-500)' }}>• {t(lang, 'deactivate')}</span>}
                      </div>
                      <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{c.phone}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--ink-300)' }}>›</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-700)' }}>
                  <span className="tabular">{c.defaultQty}L × ₹{c.defaultRate}</span>
                  {m && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
                        {formatINR(m.totalAmount)}
                      </div>
                      {m.pending > 0 ? (
                        <div className="tabular" style={{ fontSize: 10, color: 'var(--red)' }}>
                          {t(lang, 'pending')}: {formatINR(m.pending)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: 'var(--brand-700)' }}>✓ {t(lang, 'paid')}</div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <FooterCredit />
      </div>

      {addOpen && (
        <AddCustomerSheet
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); pushToast({ text: t(lang, 't_customer_added') }); load(); }}
        />
      )}
    </div>
  );
}

function AddCustomerSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('50');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !phone) {
      pushToast({ text: t(lang, 't_phone_required') });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone: normalizePhone(phone), address,
          defaultQty: parseFloat(qty) || 1,
          defaultRate: parseFloat(rate) || 50,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        pushToast({ text: d?.error || t(lang, 'error') });
        return;
      }
      onAdded();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.45)', zIndex: 80,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="clean-card slide-up"
        style={{ width: '100%', maxWidth: 440, padding: 18, borderRadius: '16px 16px 0 0', background: 'var(--surface)' }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 12 }}>
          {t(lang, 'add_customer')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label={t(lang, 'name')}>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={t(lang, 'phone')}>
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={t(lang, 'address')}>
            <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t(lang, 'default_qty')}>
              <input value={qty} onChange={e => setQty(e.target.value)} inputMode="decimal" style={inputStyle} className="clean-btn motion-fast" />
            </Field>
            <Field label={t(lang, 'default_rate')}>
              <input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" style={inputStyle} className="clean-btn motion-fast" />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={onClose}
              className="clean-btn motion-fast"
              style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >{t(lang, 'cancel')}</button>
            <button
              onClick={submit}
              disabled={saving}
              className="clean-btn motion-fast"
              style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}
            >{saving ? '...' : t(lang, 'save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--ink-900)', outline: 'none', width: '100%',
  minHeight: 48, boxSizing: 'border-box',
};
