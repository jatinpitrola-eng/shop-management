// Owner — Khata: month-wise line items, totals, vacation exclusions, PDF + WhatsApp share
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, currentMonth, parseMonth, normalizePhone } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';
import { StatementModal } from '../StatementModal';

interface KhataEntry {
  id: string;
  date: string;
  shift: string;
  qtyLiters: number;
  product: string;
  ratePerUnit: number;
  amount: number;
}
interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  entries: KhataEntry[];
  totalLiters: number;
  totalAmount: number;
  paid: number;
  pending: number;
}

export function OwnerKhataScreen() {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [month, setMonth] = useState(currentMonth());
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [stmtFor, setStmtFor] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/khata?month=${month}`);
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers || []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [month]);

  const totalLiters = customers.reduce((s, c) => s + c.totalLiters, 0);
  const totalAmount = customers.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = customers.reduce((s, c) => s + c.paid, 0);
  const totalPending = customers.reduce((s, c) => s + c.pending, 0);

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

  const shareWhatsapp = (c: KhataCustomer) => {
    const text = t(lang, 'wa_bill', {
      amount: String(c.totalAmount),
      liters: c.totalLiters.toFixed(1),
      upi: 'raju@upi',
    });
    const phone = c.phone.replace(/[^\d]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Month picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => changeMonth(-1)} className="clean-btn motion-fast" style={{ padding: '0 14px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{fmtMonth(month)}</div>
        <button onClick={() => changeMonth(1)} className="clean-btn motion-fast" style={{ padding: '0 14px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>›</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>{t(lang, 'no_data')}</div>
      ) : (
        <>
          {customers.map(c => {
            const open = !!expanded[c.id];
            const vacDays = c.entries.length === 0 ? 0 : Math.max(0, 30 - c.entries.length); // crude vacation-days estimate
            return (
              <div key={c.id} className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [c.id]: !p[c.id] }))}
                  className="motion-fast"
                  style={{
                    width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    cursor: 'pointer', textAlign: 'left', minHeight: 64,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{c.name}</div>
                    <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>
                      {c.totalLiters.toFixed(1)}L • {c.entries.length} {t(lang, 'entry_history').toLowerCase()}
                      {vacDays > 0 && (
                        <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: 'var(--blue-tint)', color: 'var(--blue)', fontSize: 10 }}>
                          {t(lang, 'vacation')}: {vacDays}d
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{formatINR(c.totalAmount)}</div>
                    {c.pending > 0 && (
                      <div className="tabular" style={{ fontSize: 10, color: 'var(--red)' }}>{t(lang, 'pending')}: {formatINR(c.pending)}</div>
                    )}
                  </div>
                  <span style={{ color: 'var(--ink-300)', fontSize: 16 }}>{open ? '⌃' : '⌄'}</span>
                </button>
                {open && (
                  <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, maxHeight: 320, overflowY: 'auto' }}>
                      {c.entries.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: 8 }}>{t(lang, 'no_data')}</div>
                      ) : c.entries.map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span className="tabular" style={{ color: 'var(--ink-700)' }}>
                            {e.date.slice(8)} • {e.shift.slice(0, 1).toUpperCase()} • {e.qtyLiters}L × ₹{e.ratePerUnit}
                          </span>
                          <span className="tabular" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{formatINR(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => setStmtFor({ id: c.id, name: c.name })}
                        className="clean-btn motion-fast"
                        style={{ flex: 1, background: 'var(--brand-tint)', color: 'var(--brand-700)', border: '1px solid rgba(11,122,75,0.18)', fontSize: 12 }}
                      >📄 {t(lang, 'download_pdf')}</button>
                      <button
                        onClick={() => shareWhatsapp(c)}
                        className="clean-btn motion-fast"
                        style={{ flex: 1, background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 12 }}
                      >💬 {t(lang, 'share_whatsapp')}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Running total */}
          <div className="clean-card" style={{ padding: 14, background: 'var(--brand-tint)', border: '1px solid rgba(11,122,75,0.18)' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-700)', marginBottom: 8 }}>{t(lang, 'running_total')} — {fmtMonth(month)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <Stat label={t(lang, 'total_liters')} value={`${totalLiters.toFixed(1)}L`} color="var(--ink-900)" />
              <Stat label={t(lang, 'total_amount')} value={formatINR(totalAmount)} color="var(--ink-900)" />
              <Stat label={t(lang, 'paid_amount')} value={formatINR(totalPaid)} color="var(--brand-700)" />
              <Stat label={t(lang, 'pending_amount')} value={formatINR(totalPending)} color={totalPending > 0 ? 'var(--red)' : 'var(--brand-700)'} />
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <FooterCredit />
      </div>

      {stmtFor && (
        <StatementModal customerId={stmtFor.id} month={month} onClose={() => setStmtFor(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-500)', marginBottom: 2 }}>{label}</div>
      <div className="tabular" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
