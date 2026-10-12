'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { istDate, formatINR } from '@/lib/dates';
import { v4 as uuidv4 } from 'uuid';
import { Cow3D } from '../Cow3D';
import { triggerMilkSplash } from '../MilkSplash';

interface Entry {
  id: string;
  customerId: string;
  date: string;
  shift: string;
  qtyLiters: number;
  product: string;
  ratePerUnit: number;
  amount: number;
  status: string;
  enteredBy: string;
  enteredByRole: string;
  offline?: boolean;
  customer?: { id: string; name: string; phone: string };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  defaultQty: number;
  defaultRate: number;
  active: boolean;
}

export function OwnerTodayScreen() {
  const lang = useApp(s => s.lang);
  const session = useApp(s => s.session);
  const pushToast = useApp(s => s.pushToast);
  const enqueueEntry = useApp(s => s.enqueueEntry);
  const dequeueEntry = useApp(s => s.dequeueEntry);
  const offlineQueue = useApp(s => s.offlineQueue);
  const online = useApp(s => s.online);

  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customQty, setCustomQty] = useState<Record<string, string>>({});
  const [voiceOpen, setVoiceOpen] = useState(false);

  const today = istDate();
  const dayName = new Date().toLocaleDateString(lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
  });

  const loadCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers((data.customers || []).filter((c: Customer) => c.active));
  };

  const loadEntries = async () => {
    setLoading(true);
    const res = await fetch(`/api/entries?date=${today}&shift=${shift}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { loadEntries(); }, [shift]);

  // Sync offline queue when online
  useEffect(() => {
    if (!online) return;
    const toSync = [...offlineQueue];
    toSync.forEach(async (e) => {
      try {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...e, enteredById: session?.uid }),
        });
        if (res.ok) {
          dequeueEntry(e.clientUuid);
        } else if (res.status === 409) {
          // duplicate — drop from queue silently
          dequeueEntry(e.clientUuid);
        }
      } catch {
        // offline still — keep
      }
    });
    if (toSync.length > 0) {
      setTimeout(loadEntries, 500);
    }
  }, [online, offlineQueue.length]);

  const hasEntry = (cid: string) => entries.some(e => e.customerId === cid);

  const addEntry = async (customer: Customer, qty: number, product: string = 'milk') => {
    if (product !== 'not_taken' && qty <= 0) return;
    const clientUuid = uuidv4();
    const rate = customer.defaultRate;

    // Optimistic UI — instant
    const tempEntry: Entry = {
      id: 'temp-' + clientUuid,
      customerId: customer.id,
      date: today,
      shift,
      qtyLiters: product === 'not_taken' ? 0 : qty,
      product,
      ratePerUnit: rate,
      amount: product === 'not_taken' ? 0 : qty * rate,
      status: 'active',
      enteredBy: session?.name || 'unknown',
      enteredByRole: session?.role || 'owner',
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
    };
    setEntries(prev => [...prev, tempEntry]);
    pushToast({ text: t(lang, 't_entry_added'), duration: 5000, undo: () => undoEntry(tempEntry) });

    if (!online) {
      enqueueEntry({
        clientUuid,
        customerId: customer.id,
        shift,
        qtyLiters: qty,
        product,
        ratePerUnit: rate,
        date: today,
        offline: true,
        ts: Date.now(),
      });
      pushToast({ text: t(lang, 't_offline_queued'), duration: 2000 });
      return;
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          shift,
          qtyLiters: qty,
          product,
          ratePerUnit: rate,
          date: today,
          clientUuid,
        }),
      });
      if (res.status === 409) {
        pushToast({ text: '⚠️ ' + (lang === 'gu' ? 'આજે આ શિફ્ટમાં એન્ટ્રી પહેલેથી છે' : 'Entry already exists for this shift') });
        setEntries(prev => prev.filter(e => e.id !== tempEntry.id));
        return;
      }
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      // Replace temp with real
      setEntries(prev => prev.map(e => e.id === tempEntry.id ? { ...data.entry, customer: tempEntry.customer } : e));
    } catch {
      // Network failed → enqueue
      enqueueEntry({
        clientUuid,
        customerId: customer.id,
        shift,
        qtyLiters: qty,
        product,
        ratePerUnit: rate,
        date: today,
        offline: true,
        ts: Date.now(),
      });
      pushToast({ text: t(lang, 't_offline_queued'), duration: 2000 });
    }
  };

  const undoEntry = async (entry: Entry) => {
    // If still temp (no server id), just remove
    if (entry.id.startsWith('temp-')) {
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      pushToast({ text: t(lang, 't_entry_reversed') });
      return;
    }
    try {
      const res = await fetch(`/api/entries/${entry.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Undo from owner' }),
      });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entry.id));
        pushToast({ text: t(lang, 't_entry_reversed') });
        loadEntries();
      }
    } catch {}
  };

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const totalDelivered = entries.length;
  const totalCustomers = customers.length;

  return (
    <div style={{ padding: '14px', position: 'relative' }}>
      {/* Floating 3D cow on the right — doesn't push the layout */}
      <div style={{ position: 'absolute', top: 12, right: 14, opacity: 0.95, pointerEvents: 'none', zIndex: 2 }}>
        <Cow3D size={72} parallax={false} sparkles={false} milkDrop />
      </div>
      {/* Extra milk drop floating around the cow */}
      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, 20, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: 8, right: 42, pointerEvents: 'none' }}
      >
        <svg width="12" height="16" viewBox="0 0 14 18" fill="none" aria-hidden="true">
          <path d="M7 0c3 5 5 7 5 11a5 5 0 0 1-10 0c0-4 2-6 5-11z" fill="#FFFFFF" stroke="#0B7A4B" strokeWidth="0.8" />
        </svg>
      </motion.div>

      {/* Date header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>{dayName}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
          {t(lang, 'delivered_count', { done: String(totalDelivered), total: String(totalCustomers) })}
        </div>
      </div>

      {/* Progress */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 14,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--ink-700)' }}>{t(lang, 'today')}</span>
          <span className="tabular" style={{ color: 'var(--brand-700)', fontWeight: 600 }}>
            {totalDelivered}/{totalCustomers}
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--muted)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${totalCustomers ? (totalDelivered / totalCustomers) * 100 : 0}%`,
            height: '100%',
            background: 'var(--brand-600)',
            borderRadius: 4,
            transition: 'width 200ms',
          }} />
        </div>
      </div>

      {/* Shift tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: 'var(--muted)', padding: 4, borderRadius: 10 }}>
        {(['morning', 'evening'] as const).map(s => (
          <button
            key={s}
            onClick={() => setShift(s)}
            className="motion-fast"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              background: shift === s ? 'var(--surface)' : 'transparent',
              color: shift === s ? 'var(--brand-700)' : 'var(--ink-500)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              minHeight: 40,
              boxShadow: shift === s ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {s === 'morning' ? '🌅 ' : '🌆 '}{t(lang, s)}
          </button>
        ))}
      </div>

      {/* Search + voice */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          type="text"
          placeholder={t(lang, 'search_customer')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 14,
            color: 'var(--ink-900)',
            outline: 'none',
            minHeight: 44,
          }}
        />
        <button
          onClick={() => setVoiceOpen(true)}
          style={{
            padding: '0 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 20,
            cursor: 'pointer',
            minHeight: 44,
          }}
          aria-label="Voice entry"
          title={t(lang, 'voice_hint')}
        >
          🎤
        </button>
      </div>

      {/* Customer list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>
          {t(lang, 'no_data')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => {
            const done = hasEntry(c.id);
            return (
              <div
                key={c.id}
                className="clean-card"
                style={{
                  padding: 12,
                  opacity: done ? 0.65 : 1,
                  border: done ? '1px solid var(--brand-tint)' : '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{c.phone}</div>
                  </div>
                  {done && (
                    <span style={{ fontSize: 11, color: 'var(--brand-700)', background: 'var(--brand-tint)', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                      ✓ {t(lang, 'taken')}
                    </span>
                  )}
                </div>

                {/* Quick actions — ONE TAP each, ≥48px targets with milk splash */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: 6 }}>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={(e) => { triggerMilkSplash(e.clientX, e.clientY); addEntry(c, 1); }}
                    className="clean-btn"
                    style={{
                      background: 'var(--gradient-brand)', color: '#fff', border: 'none',
                      fontWeight: 700, fontSize: 14,
                      boxShadow: '0 4px 12px rgba(11,122,75,0.28), inset 0 1px 0 rgba(255,255,255,0.30)',
                    }}
                    aria-label={`Add 1 liter for ${c.name}`}
                  >1L</motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={(e) => { triggerMilkSplash(e.clientX, e.clientY); addEntry(c, 0.5); }}
                    className="clean-btn"
                    style={{
                      background: 'var(--brand-tint)', color: 'var(--brand-700)',
                      border: '1px solid rgba(11,122,75,0.18)',
                      fontWeight: 700, fontSize: 14,
                    }}
                  >0.5L</motion.button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.25"
                      placeholder="L"
                      value={customQty[c.id] || ''}
                      onChange={e => setCustomQty(p => ({ ...p, [c.id]: e.target.value }))}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '0 10px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        fontSize: 14,
                        textAlign: 'center',
                        color: 'var(--ink-900)',
                        outline: 'none',
                        minHeight: 44,
                      }}
                    />
                    <button
                      onClick={() => {
                        const q = parseFloat(customQty[c.id] || '0');
                        if (q > 0) { addEntry(c, q); setCustomQty(p => ({ ...p, [c.id]: '' })); }
                      }}
                      className="clean-btn motion-fast"
                      style={{
                        background: 'var(--ink-900)', color: '#fff', border: 'none',
                        padding: '0 12px', fontWeight: 700, fontSize: 13,
                        minHeight: 44,
                      }}
                    >+</button>
                  </div>
                  <button
                    onClick={() => addEntry(c, 0, 'not_taken')}
                    className="clean-btn motion-fast"
                    style={{
                      background: 'var(--muted)', color: 'var(--ink-700)',
                      border: '1px solid var(--border)',
                      fontWeight: 600, fontSize: 11,
                    }}
                    aria-label={`Mark not taken for ${c.name}`}
                  >{t(lang, 'not_taken')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {voiceOpen && (
        <VoiceEntrySheet
          customers={customers}
          onClose={() => setVoiceOpen(false)}
          onConfirm={(c, qty) => { addEntry(c, qty); setVoiceOpen(false); }}
        />
      )}
    </div>
  );
}

// Voice quick-entry — Web Speech API, graceful fallback
function VoiceEntrySheet({ customers, onClose, onConfirm }: {
  customers: Customer[];
  onClose: () => void;
  onConfirm: (c: Customer, qty: number) => void;
}) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [matches, setMatches] = useState<Customer[]>([]);
  const [parsedQty, setParsedQty] = useState(1);

  const recognize = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      pushToast({ text: t(lang, 'voice_error') });
      return;
    }
    const r = new SR();
    r.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 3;
    setListening(true);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript.toLowerCase();
      setTranscript(text);
      // Parse "Raju 2 liter" → name match + qty
      const qtyMatch = text.match(/(\d+(\.\d+)?)|one|two|three|four|half/i);
      let qty = 1;
      if (qtyMatch) {
        if (/half/i.test(qtyMatch[0])) qty = 0.5;
        else if (/one/i.test(qtyMatch[0])) qty = 1;
        else if (/two/i.test(qtyMatch[0])) qty = 2;
        else if (/three/i.test(qtyMatch[0])) qty = 3;
        else if (/four/i.test(qtyMatch[0])) qty = 4;
        else qty = parseFloat(qtyMatch[0]);
      }
      setParsedQty(qty);
      const matched = customers.filter(c =>
        text.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().split(' ').some(p => text.includes(p))
      ).slice(0, 3);
      setMatches(matched);
    };
    r.onerror = () => {
      pushToast({ text: t(lang, 'voice_error') });
      setListening(false);
    };
    r.onend = () => setListening(false);
    r.start();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.4)', zIndex: 80,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="clean-card slide-up"
        style={{
          width: '100%', maxWidth: 420, padding: 20,
          borderRadius: '16px 16px 0 0',
          background: 'var(--surface)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🎤 Voice Quick Entry</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 14 }}>{t(lang, 'voice_hint')}</div>

        <button
          onClick={recognize}
          className="clean-btn motion-fast"
          style={{
            width: '100%',
            background: listening ? 'var(--red-tint)' : 'var(--brand-600)',
            color: listening ? 'var(--red)' : '#fff',
            border: 'none',
            fontSize: 16, fontWeight: 600,
            minHeight: 56,
          }}
        >
          {listening ? '🔴 ' + t(lang, 'voice_listen') : '🎙️ Start'}
        </button>

        {transcript && (
          <div style={{ marginTop: 14, padding: 10, background: 'var(--muted)', borderRadius: 8, fontSize: 13 }}>
            <div style={{ color: 'var(--ink-500)', fontSize: 11 }}>Heard:</div>
            <div style={{ color: 'var(--ink-900)' }}>"{transcript}"</div>
            <div style={{ marginTop: 6, color: 'var(--brand-700)' }}>Qty: {parsedQty}L</div>
          </div>
        )}

        {matches.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matches.map(c => (
              <button
                key={c.id}
                onClick={() => onConfirm(c, parsedQty)}
                className="clean-btn motion-fast"
                style={{
                  background: 'var(--brand-tint)',
                  color: 'var(--brand-700)',
                  border: '1px solid rgba(11,122,75,0.18)',
                  justifyContent: 'flex-start',
                  padding: '12px 14px',
                }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{c.phone}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{parsedQty}L</div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="clean-btn motion-fast"
          style={{
            marginTop: 12, width: '100%',
            background: 'transparent', color: 'var(--ink-500)',
            border: '1px solid var(--border)',
          }}
        >{t(lang, 'cancel')}</button>
      </div>
    </div>
  );
}
