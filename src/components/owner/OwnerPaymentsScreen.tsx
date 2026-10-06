// Owner — Payments: Pending / Approval Log / All tabs
'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, formatDateTimeIST, currentMonth, parseMonth } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';

interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  totalAmount: number;
  paid: number;
  pending: number;
  entries: { date: string }[];
}
interface Payment {
  id: string;
  amount: number;
  method: string;
  note?: string | null;
  proofPhotoUrl?: string | null;
  approvedByName: string;
  approvedByPhone?: string | null;
  approvedAt: string;
  customer: { id: string; name: string; phone: string };
}
interface Owner {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export function OwnerPaymentsScreen() {
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);
  const [tab, setTab] = useState<'pending' | 'log' | 'all'>('pending');
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState<KhataCustomer | null>(null);
  const [filterMonth, setFilterMonth] = useState(currentMonth());
  const [filterOwner, setFilterOwner] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [kRes, pRes, oRes] = await Promise.all([
        fetch(`/api/khata?month=${currentMonth()}`),
        fetch(`/api/payments${filterMonth ? `?month=${filterMonth}` : ''}${filterOwner ? `${filterMonth ? '&' : '?'}ownerId=${filterOwner}` : ''}${filterMethod ? `${filterMonth || filterOwner ? '&' : '?'}method=${filterMethod}` : ''}`),
        fetch('/api/owners'),
      ]);
      if (kRes.ok) {
        const d = await kRes.json();
        setCustomers(d.customers || []);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setPayments(d.payments || []);
      }
      if (oRes.ok) {
        const d = await oRes.json();
        setOwners(d.users || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterMonth, filterOwner, filterMethod]);

  // Sort pending by aging (oldest first)
  const pendingSorted = [...customers]
    .filter(c => c.pending > 0)
    .sort((a, b) => a.entries.length - b.entries.length || b.pending - a.pending);

  const changeMonth = (delta: number) => {
    const { year: y, month: m } = parseMonth(filterMonth);
    const d = new Date(y, m - 1 + delta, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fmtMonth = (m: string) => {
    const [y, mm] = m.split('-').map(Number);
    const d = new Date(y, mm - 1, 1);
    return d.toLocaleDateString(lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' });
  };

  const exportCsv = async () => {
    const url = `/api/reports?format=csv`;
    window.location.href = url;
  };

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'pending', label: t(lang, 'pending') },
    { id: 'log', label: t(lang, 'approval_log') },
    { id: 'all', label: lang === 'gu' ? 'બધું' : lang === 'hi' ? 'सभी' : 'All' },
  ];

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--muted)', padding: 4, borderRadius: 10 }}>
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className="motion-fast"
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none',
              background: tab === tb.id ? 'var(--surface)' : 'transparent',
              color: tab === tb.id ? 'var(--brand-700)' : 'var(--ink-500)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', minHeight: 40,
              boxShadow: tab === tb.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            }}
          >{tb.label}</button>
        ))}
      </div>

      {tab === 'pending' && (
        <>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {pendingSorted.length} {t(lang, 'pending')}
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : pendingSorted.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--brand-700)', padding: 40, background: 'var(--brand-tint)', borderRadius: 12, fontWeight: 600 }}>
              ✅ {t(lang, 'no_data')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingSorted.map(c => {
                const days = c.entries.length > 0 ? Math.max(1, 30 - c.entries.length) : 30;
                const color = c.entries.length >= 25 ? 'var(--amber)' : 'var(--red)';
                const badge = c.entries.length >= 25 ? t(lang, 'within_grace') : t(lang, 'overdue');
                return (
                  <div key={c.id} className="clean-card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{c.name}</div>
                        <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{c.phone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
                          {formatINR(c.pending)}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: color === 'var(--amber)' ? 'var(--amber-tint)' : 'var(--red-tint)', color }}>
                          {badge}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayFor(c)}
                      className="clean-btn motion-fast"
                      style={{ width: '100%', background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 13 }}
                    >✓ {t(lang, 'mark_paid')}</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'log' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => changeMonth(-1)} className="clean-btn motion-fast" style={{ padding: '0 12px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 14 }}>‹</button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{fmtMonth(filterMonth)}</div>
              <button onClick={() => changeMonth(1)} className="clean-btn motion-fast" style={{ padding: '0 12px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 14 }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="clean-btn motion-fast" style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--ink-900)', minHeight: 44 }}>
                <option value="">{t(lang, 'filter_owner')}: All</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="clean-btn motion-fast" style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--ink-900)', minHeight: 44 }}>
                <option value="">{t(lang, 'filter_method')}: All</option>
                <option value="cash">{t(lang, 'method_cash')}</option>
                <option value="upi">{t(lang, 'method_upi')}</option>
                <option value="online">{t(lang, 'method_online')}</option>
              </select>
            </div>
            <button onClick={exportCsv} className="clean-btn motion-fast" style={{ background: 'var(--surface)', color: 'var(--brand-700)', border: '1px solid var(--brand-600)', fontSize: 12 }}>
              ⬇ {t(lang, 'export_csv')}
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>{t(lang, 'no_data')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {payments.map(p => (
                <div key={p.id} className="clean-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{p.customer?.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>
                        {t(lang, 'approved_by')} <b>{p.approvedByName}</b>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular" style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-700)' }}>{formatINR(p.amount)}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--brand-tint)', color: 'var(--brand-700)' }}>
                        {p.method.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-500)' }}>
                    <span>{formatDateTimeIST(new Date(p.approvedAt))}</span>
                    {p.note && <span>• {p.note}</span>}
                    {p.proofPhotoUrl && <span>• 📷</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'all' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>{t(lang, 'no_data')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customers.map(c => {
                const status = c.pending === 0 ? 'paid' : c.paid > 0 ? 'partial' : 'pending';
                const color = status === 'paid' ? 'var(--brand-700)' : status === 'partial' ? 'var(--amber)' : 'var(--red)';
                return (
                  <div key={c.id} className="clean-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{c.name}</div>
                      <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{formatINR(c.totalAmount)} • {t(lang, 'paid_amount')} {formatINR(c.paid)}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: status === 'paid' ? 'var(--brand-tint)' : status === 'partial' ? 'var(--amber-tint)' : 'var(--red-tint)', color }}>
                      {t(lang, status as any)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <FooterCredit />
      </div>

      {payFor && (
        <MarkPaidSheet
          customer={payFor}
          owners={owners}
          defaultApproverId={session?.uid}
          defaultApproverName={session?.name}
          onClose={() => setPayFor(null)}
          onDone={() => { setPayFor(null); load(); }}
        />
      )}
    </div>
  );
}

function MarkPaidSheet({
  customer, owners, defaultApproverId, defaultApproverName, onClose, onDone,
}: {
  customer: KhataCustomer;
  owners: Owner[];
  defaultApproverId?: string;
  defaultApproverName?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);
  const pushToast = useApp(s => s.pushToast);
  const [amount, setAmount] = useState(String(Math.round(customer.pending)));
  const [method, setMethod] = useState<'cash' | 'upi' | 'online'>('cash');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');
  const [approverId, setApproverId] = useState(defaultApproverId || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      pushToast({ text: t(lang, 'error') });
      return;
    }
    setSaving(true);
    const approver = owners.find(o => o.id === approverId);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: amt,
          method,
          note,
          proofPhotoUrl: proof || undefined,
          approvedById: approverId,
          approvedByName: approver?.name || defaultApproverName,
          approvedByPhone: approver?.phone || session?.phone,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        pushToast({ text: d?.error || t(lang, 'error') });
        setSaving(false);
        return;
      }
      pushToast({ text: t(lang, 't_payment_approved') });
      onDone();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSaving(false);
    }
  };

  const methods: { id: typeof method; label: string; icon: string }[] = [
    { id: 'cash', label: t(lang, 'method_cash'), icon: '💵' },
    { id: 'upi', label: t(lang, 'method_upi'), icon: '📱' },
    { id: 'online', label: t(lang, 'method_online'), icon: '🏦' },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="clean-card slide-up" style={{ width: '100%', maxWidth: 440, padding: 18, borderRadius: '16px 16px 0 0', background: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t(lang, 'mark_paid')}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 12 }}>
          {customer.name} • {t(lang, 'pending_amount')}: <b className="tabular">{formatINR(customer.pending)}</b>
        </div>
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
                    fontSize: 12, flexDirection: 'column', gap: 2,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'note')}</span>
            <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'proof_photo')}</span>
            <input value={proof} onChange={e => setProof(e.target.value)} placeholder="https://…" style={inputStyle} className="clean-btn motion-fast" />
          </label>
          {owners.length > 1 && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'approving_owner')}</span>
              <select value={approverId} onChange={e => setApproverId(e.target.value)} style={inputStyle} className="clean-btn motion-fast">
                {owners.filter(o => o.role === 'owner').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
            <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>{saving ? '...' : '✓ ' + t(lang, 'approve')}</button>
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
