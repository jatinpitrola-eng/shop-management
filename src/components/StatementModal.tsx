// Reusable statement modal — fetches /api/statement, renders line items, totals, UPI QR, footer credit. Print via window.print().
'use client';
import { useEffect, useState } from 'react';
import { NexoryosLogo } from './Brand';
import { formatINR, formatDateTimeIST } from '@/lib/dates';

interface StatementResp {
  statement: {
    business: { name: string; upiId: string };
    customer: { id: string; name: string; phone: string };
    month: string;
    entries: {
      id: string;
      date: string;
      shift: string;
      qtyLiters: number;
      product: string;
      ratePerUnit: number;
      amount: number;
    }[];
    payments: {
      id: string;
      amount: number;
      method: string;
      approvedByName: string;
      approvedAt: string;
    }[];
    totalLiters: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
  footer: { by_nexoryos: string; credit: string };
}

export function StatementModal({
  customerId,
  month,
  onClose,
}: {
  customerId: string;
  month: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StatementResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/statement?customerId=${customerId}&month=${month}`);
        if (!res.ok) {
          setError('Failed');
          return;
        }
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setError('Failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerId, month]);

  const upiId = data?.statement.business.upiId || '';
  const upiDeepLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(data?.statement.business.name || '')}&am=${data?.statement.pendingAmount || 0}&cu=INR`
    : '';
  const qrUrl = upiDeepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDeepLink)}`
    : '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.55)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="clean-card slide-up"
        style={{
          width: '100%', maxWidth: 420, padding: 18, background: 'var(--surface)',
          borderRadius: 16, maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 32 }} />)}
          </div>
        ) : error || !data ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-500)' }}>
            {error || 'No data'}
            <button onClick={onClose} className="clean-btn motion-fast" style={{ marginTop: 12, width: '100%', background: 'var(--brand-600)', color: '#fff', border: 'none' }}>
              Close
            </button>
          </div>
        ) : (
          <div className="statement-print" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <NexoryosLogo size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{data.statement.business.name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>{data.footer.by_nexoryos}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{data.statement.month}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-300)' }}>v{new Date().getTime().toString(36).slice(-4).toUpperCase()}</div>
              </div>
            </div>

            {/* Customer */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-500)' }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{data.statement.customer.name}</div>
              <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{data.statement.customer.phone}</div>
            </div>

            {/* Entries */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>Entries</div>
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {data.statement.entries.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 }}>
                    <span className="tabular" style={{ color: 'var(--ink-700)' }}>
                      {i + 1}. {e.date.slice(8)} • {e.shift.slice(0,1).toUpperCase()} • {e.qtyLiters}L × ₹{e.ratePerUnit}
                    </span>
                    <span className="tabular" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{formatINR(e.amount)}</span>
                  </div>
                ))}
                {data.statement.entries.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', padding: '8px 0' }}>No entries</div>
                )}
              </div>
            </div>

            {/* Payments */}
            {data.statement.payments.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>Payments</div>
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {data.statement.payments.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-700)' }}>
                        {formatDateTimeIST(new Date(p.approvedAt)).split(',')[0]} • {p.method.toUpperCase()} • {p.approvedByName}
                      </span>
                      <span className="tabular" style={{ fontWeight: 600, color: 'var(--brand-700)' }}>{formatINR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
              <TotalRow label="Total liters" value={`${data.statement.totalLiters.toFixed(1)} L`} />
              <TotalRow label="Total amount" value={formatINR(data.statement.totalAmount)} bold />
              <TotalRow label="Paid" value={formatINR(data.statement.paidAmount)} color="var(--brand-700)" />
              <TotalRow label="Pending" value={formatINR(data.statement.pendingAmount)} color={data.statement.pendingAmount > 0 ? 'var(--red)' : 'var(--brand-700)'} bold />
            </div>

            {/* UPI QR */}
            {qrUrl && data.statement.pendingAmount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                <img src={qrUrl} alt="UPI QR" width={160} height={160} style={{ borderRadius: 8 }} />
                <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>UPI: {upiId}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-300)' }}>Scan to pay {formatINR(data.statement.pendingAmount)}</div>
              </div>
            )}

            {/* Footer credit — both lines */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 500 }}>{data.footer.by_nexoryos}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-300)' }}>{data.footer.credit}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => window.print()}
                className="clean-btn motion-fast"
                style={{ flex: 1, background: 'var(--brand-600)', color: '#fff', border: 'none', fontSize: 13 }}
              >🖨️ Print / Save PDF</button>
              <button
                onClick={onClose}
                className="clean-btn motion-fast"
                style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 13 }}
              >Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TotalRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{label}</span>
      <span className="tabular" style={{ fontSize: 14, fontWeight: bold ? 700 : 600, color: color || 'var(--ink-900)' }}>{value}</span>
    </div>
  );
}
