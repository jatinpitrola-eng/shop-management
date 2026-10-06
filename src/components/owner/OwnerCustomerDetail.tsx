// Owner — Customer Detail (running bill, calendar history, recent payments, vacation + rate change)
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatINR, formatDateTimeIST, currentMonth, istDate } from '@/lib/dates';
import { FooterCredit } from '../FooterCredit';
import { StatementModal } from '../StatementModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  defaultQty: number;
  defaultRate: number;
}
interface Entry {
  id: string;
  date: string;
  shift: string;
  qtyLiters: number;
  product: string;
  ratePerUnit: number;
  amount: number;
  status: string;
}
interface Payment {
  id: string;
  amount: number;
  method: string;
  approvedByName: string;
  approvedAt: string;
  note?: string | null;
}
interface Vacation {
  id: string;
  fromDate: string;
  toDate: string;
  status: string;
}
interface DetailResp {
  customer: Customer;
  thisMonth: { liters: number; amount: number; paid: number; pending: number };
  recentEntries: Entry[];
  recentPayments: Payment[];
  vacations: Vacation[];
  today: string;
}

export function OwnerCustomerDetail() {
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);
  const id = useApp(s => s.selectedCustomerId);
  const setView = useApp(s => s.setView);
  const pushToast = useApp(s => s.pushToast);
  const [data, setData] = useState<DetailResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [vacOpen, setVacOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [stmtOpen, setStmtOpen] = useState(false);

  const month = currentMonth();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  // Build calendar of current month
  const cal = useMemo(() => {
    const [yy, mm] = month.split('-').map(Number);
    const daysInMonth = new Date(yy, mm, 0).getDate();
    const days: { date: string; day: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yy}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d });
    }
    return days;
  }, [month]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const e of (data?.recentEntries || [])) {
      (map[e.date] = map[e.date] || []).push(e);
    }
    return map;
  }, [data]);

  const vacationDays = useMemo(() => {
    const set = new Set<string>();
    for (const v of (data?.vacations || [])) {
      if (v.status !== 'approved') continue;
      const [fy, fm, fd] = v.fromDate.split('-').map(Number);
      const [ty, tm, td] = v.toDate.split('-').map(Number);
      const start = new Date(fy, fm - 1, fd);
      const end = new Date(ty, tm - 1, td);
      const cur = new Date(start);
      while (cur <= end) {
        const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        set.add(ds);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [data]);

  if (loading || !data) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      </div>
    );
  }

  const { customer, thisMonth: tm } = data;

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setView('owner_customers')}
          className="clean-btn motion-fast"
          style={{ padding: '0 14px', background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 18 }}
          aria-label="Back"
        >‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)' }}>{customer.name}</div>
          <div className="tabular" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{customer.phone} • {customer.defaultQty}L × ₹{customer.defaultRate}</div>
        </div>
      </div>

      {/* This Month Running Bill */}
      <div className="clean-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 10 }}>
          {t(lang, 'this_month')} — {month}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Stat label={t(lang, 'total_liters')} value={`${tm.liters.toFixed(1)}L`} color="var(--ink-900)" />
          <Stat label={t(lang, 'total_amount')} value={formatINR(tm.amount)} color="var(--ink-900)" />
          <Stat label={t(lang, 'paid_amount')} value={formatINR(tm.paid)} color="var(--brand-700)" />
          <Stat label={t(lang, 'pending_amount')} value={formatINR(tm.pending)} color={tm.pending > 0 ? 'var(--red)' : 'var(--brand-700)'} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setStmtOpen(true)}
            className="clean-btn motion-fast"
            style={{ flex: 1, background: 'var(--brand-tint)', color: 'var(--brand-700)', border: '1px solid rgba(11,122,75,0.18)', fontSize: 13 }}
          >📄 {t(lang, 'download_pdf')}</button>
          <button
            onClick={() => setVacOpen(true)}
            className="clean-btn motion-fast"
            style={{ flex: 1, background: 'var(--surface)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 13 }}
          >🏖️ {t(lang, 'vacation')}</button>
        </div>
        {session?.role === 'owner' && (
          <button
            onClick={() => setRateOpen(true)}
            className="clean-btn motion-fast"
            style={{ marginTop: 8, width: '100%', background: 'var(--amber-tint)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.22)', fontSize: 13 }}
          >₹ {t(lang, 'rate_change')}</button>
        )}
      </div>

      {/* Calendar history */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>
          {t(lang, 'entry_history')} — {month}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cal.map(({ date, day }) => {
            const taken = !!entriesByDate[date];
            const isVac = vacationDays.has(date);
            const isToday = date === data.today;
            const isFuture = date > data.today;
            const bg = isVac ? 'var(--blue-tint)' : taken ? 'var(--brand-tint)' : 'var(--muted)';
            const fg = isVac ? 'var(--blue)' : taken ? 'var(--brand-700)' : 'var(--ink-500)';
            return (
              <button
                key={date}
                onClick={() => setExpandedDay(expandedDay === date ? null : date)}
                className="motion-fast"
                style={{
                  aspectRatio: '1 / 1',
                  background: bg,
                  color: fg,
                  border: isToday ? '2px solid var(--brand-600)' : '1px solid transparent',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  opacity: isFuture ? 0.4 : 1,
                }}
                aria-label={`${day} ${date}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--ink-500)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--brand-tint)', border: '1px solid var(--brand-600)' }} />
            {t(lang, 'taken')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--muted)', border: '1px solid var(--ink-300)' }} />
            {t(lang, 'not_taken_day')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--blue-tint)', border: '1px solid var(--blue)' }} />
            {t(lang, 'vacation_day')}
          </span>
        </div>

        {expandedDay && (
          <div style={{ marginTop: 10, padding: 10, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{expandedDay}</div>
            {(entriesByDate[expandedDay] || []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                {vacationDays.has(expandedDay) ? t(lang, 'vacation_day') : t(lang, 'not_taken_day')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {entriesByDate[expandedDay].map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="tabular">{e.shift} • {e.qtyLiters}L × ₹{e.ratePerUnit}</span>
                    <span className="tabular" style={{ fontWeight: 600 }}>{formatINR(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent payments */}
      <div className="clean-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t(lang, 'payments')}</div>
        {data.recentPayments.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{t(lang, 'no_data')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.recentPayments.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div className="tabular" style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: 13 }}>{formatINR(p.amount)}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>
                    {p.method.toUpperCase()} • {t(lang, 'approved_by')} {p.approvedByName}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-500)', textAlign: 'right' }}>
                  {formatDateTimeIST(new Date(p.approvedAt))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vacations list */}
      {data.vacations.length > 0 && (
        <div className="clean-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t(lang, 'vacation')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.vacations.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span className="tabular" style={{ color: 'var(--ink-700)' }}>{v.fromDate} → {v.toDate}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: v.status === 'approved' ? 'var(--brand-tint)' : v.status === 'requested' ? 'var(--amber-tint)' : 'var(--red-tint)',
                  color: v.status === 'approved' ? 'var(--brand-700)' : v.status === 'requested' ? 'var(--amber)' : 'var(--red)',
                }}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <FooterCredit />
      </div>

      {vacOpen && (
        <VacationSheet
          customerId={customer.id}
          onClose={() => setVacOpen(false)}
          onDone={() => { setVacOpen(false); pushToast({ text: t(lang, 't_vacation_request_sent') }); load(); }}
        />
      )}
      {rateOpen && session?.role === 'owner' && (
        <RateChangeSheet
          customerId={customer.id}
          defaultRate={customer.defaultRate}
          onClose={() => setRateOpen(false)}
          onDone={() => { setRateOpen(false); pushToast({ text: t(lang, 't_rate_changed') }); load(); }}
        />
      )}
      {stmtOpen && (
        <StatementModal
          customerId={customer.id}
          month={month}
          onClose={() => setStmtOpen(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 2 }}>{label}</div>
      <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function VacationSheet({ customerId, onClose, onDone }: { customerId: string; onClose: () => void; onDone: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const today = istDate();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!fromDate || !toDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, fromDate, toDate }),
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
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'vacation_request')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'from_date')}</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'to_date')}</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
        <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>{saving ? '...' : t(lang, 'save')}</button>
      </div>
    </Sheet>
  );
}

function RateChangeSheet({ customerId, defaultRate, onClose, onDone }: { customerId: string; defaultRate: number; onClose: () => void; onDone: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const today = istDate();
  const [product, setProduct] = useState('milk');
  const [newRate, setNewRate] = useState(String(defaultRate));
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const r = parseFloat(newRate);
    if (!r || !effectiveFrom) return;
    setSaving(true);
    try {
      const res = await fetch('/api/rate-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, product, newRate: r, effectiveFrom }),
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

  const products = ['milk', 'chhas', 'paneer', 'curd', 'ghee', 'custom'];

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'rate_change')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'method')}</span>
          <select value={product} onChange={e => setProduct(e.target.value)} style={inputStyle} className="clean-btn motion-fast">
            {products.map(p => <option key={p} value={p}>{t(lang, `product_${p}` as any)}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'new_rate')}</span>
            <input value={newRate} onChange={e => setNewRate(e.target.value)} inputMode="decimal" style={inputStyle} className="clean-btn motion-fast" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t(lang, 'effective_from')}</span>
            <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
        <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--amber)', color: '#fff', border: 'none' }}>{saving ? '...' : t(lang, 'save')}</button>
      </div>
    </Sheet>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--ink-900)', outline: 'none', width: '100%',
  minHeight: 48, boxSizing: 'border-box',
};
