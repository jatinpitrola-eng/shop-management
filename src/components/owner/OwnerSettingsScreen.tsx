// Owner — Settings: Branding, General, Language, Staff Mgmt, WhatsApp Templates, Logout
'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { FooterCredit } from '../FooterCredit';
import { NexoryosLogo } from '../Brand';

interface SettingsResp {
  settings?: {
    billingCycleDay: number;
    graceDays: number;
    roundingRule: string;
    dayBoundaryHour: number;
    defaultLang: string;
    upiId?: string | null;
    products: string;
    reminderTemplateGu?: string | null;
    reminderTemplateEn?: string | null;
    whatsappReminders: string;
  } | null;
  business?: {
    id: string;
    businessName: string;
    upiId?: string | null;
  } | null;
}
interface BrandingResp {
  business?: {
    id: string;
    businessName: string;
    upiId?: string | null;
    logoUrl?: string | null;
    themeColor?: string | null;
    themeColorDark?: string | null;
    tagline?: string | null;
    accentEmoji?: string | null;
  } | null;
}
interface OwnerUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
  isSuper: boolean;
}

const PRESET_COLORS: { hex: string; key: string }[] = [
  { hex: '#0B7A4B', key: 'color_dairy_green' },
  { hex: '#1E88E5', key: 'color_milky_blue' },
  { hex: '#FF8F00', key: 'color_buttery_amber' },
  { hex: '#8E24AA', key: 'color_grape' },
  { hex: '#E53935', key: 'color_tomato' },
  { hex: '#00897B', key: 'color_teal' },
];

export function OwnerSettingsScreen() {
  const lang = useApp(s => s.lang);
  const setLang = useApp(s => s.setLang);
  const session = useApp(s => s.session);
  const setSession = useApp(s => s.setSession);
  const setView = useApp(s => s.setView);
  const pushToast = useApp(s => s.pushToast);

  const [data, setData] = useState<SettingsResp | null>(null);
  const [users, setUsers] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Branding
  const [bBusinessName, setBBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [accentEmoji, setAccentEmoji] = useState('🐄');
  const [themeColor, setThemeColor] = useState('#0B7A4B');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // General
  const [businessName, setBusinessName] = useState('');
  const [billingCycleDay, setBillingCycleDay] = useState('1');
  const [graceDays, setGraceDays] = useState('10');
  const [dayBoundaryHour, setDayBoundaryHour] = useState('4');
  const [roundingRule, setRoundingRule] = useState('none');
  const [upiId, setUpiId] = useState('');
  const [products, setProducts] = useState('milk,chhas,paneer,curd,ghee');
  const [reminderGu, setReminderGu] = useState('');
  const [reminderEn, setReminderEn] = useState('');

  const [addUserOpen, setAddUserOpen] = useState<null | 'owner' | 'staff'>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, bRes] = await Promise.all([
        fetch('/api/settings'),
        session?.role === 'owner' ? fetch('/api/owners') : Promise.resolve(null),
        session?.role === 'owner' ? fetch('/api/business/branding') : Promise.resolve(null),
      ]);
      if (sRes.ok) {
        const d: SettingsResp = await sRes.json();
        setData(d);
        setBusinessName(d.business?.businessName || '');
        setUpiId(d.settings?.upiId || d.business?.upiId || '');
        setBillingCycleDay(String(d.settings?.billingCycleDay ?? 1));
        setGraceDays(String(d.settings?.graceDays ?? 10));
        setDayBoundaryHour(String(d.settings?.dayBoundaryHour ?? 4));
        setRoundingRule(d.settings?.roundingRule || 'none');
        setProducts(d.settings?.products || 'milk,chhas,paneer,curd,ghee');
        setReminderGu(d.settings?.reminderTemplateGu || '');
        setReminderEn(d.settings?.reminderTemplateEn || '');
      }
      if (uRes && uRes.ok) {
        const d = await uRes.json();
        setUsers(d.users || []);
      }
      if (bRes && bRes.ok) {
        const bd: BrandingResp = await bRes.json();
        if (bd.business) {
          setBBusinessName(bd.business.businessName || '');
          setTagline(bd.business.tagline || '');
          setAccentEmoji(bd.business.accentEmoji || '🐄');
          setThemeColor(bd.business.themeColor || '#0B7A4B');
          setLogoUrl(bd.business.logoUrl || null);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const patch = async (body: Record<string, any>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        pushToast({ text: t(lang, 'error') });
        return;
      }
      pushToast({ text: '✅ ' + (lang === 'gu' ? 'સાચવ્યું' : lang === 'hi' ? 'सहेजा' : 'Saved') });
      load();
    } catch {
      pushToast({ text: t(lang, 'error') });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError(t(lang, 'logo_too_big'));
      return;
    }
    if (file.size > 200 * 1024) {
      setLogoError(t(lang, 'logo_too_big'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => setLogoError(t(lang, 'error'));
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    setSavingBranding(true);
    try {
      const res = await fetch('/api/business/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: bBusinessName,
          tagline,
          accentEmoji: accentEmoji.slice(0, 4),
          themeColor,
          logoUrl,
        }),
      });
      if (!res.ok) {
        pushToast({ text: t(lang, 'error') });
        setSavingBranding(false);
        return;
      }
      pushToast({ text: t(lang, 't_branding_saved') });
      // Apply theme locally for instant feedback
      try {
        const { applyTheme } = await import('../DynamicTheme');
        applyTheme(themeColor, undefined);
      } catch {}
      // Dispatch event so DynamicTheme (mounted in OwnerApp) refetches
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shopm:branding-updated'));
      }
      // Reload branding info so all UI is consistent
      await load();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSavingBranding(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    setSession(null);
    setView('login');
  };

  if (loading) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
        <FooterCredit />
      </div>
    );
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* Branding */}
      {session?.role === 'owner' && (
        <Section title={t(lang, 'settings_branding')}>
          {/* Live preview */}
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-tint), rgba(255,224,138,0.18))',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid var(--border)',
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#fff' }} />
            ) : (
              <NexoryosLogo size={48} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {accentEmoji ? `${accentEmoji} ` : ''}{bBusinessName || t(lang, 'app_name')}
              </div>
              {tagline && (
                <div style={{ fontSize: 11, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tagline}</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--brand-700)', marginTop: 2 }}>{t(lang, 'live_preview')}</div>
            </div>
          </div>

          <Field label={t(lang, 'business_name')}>
            <input value={bBusinessName} onChange={e => setBBusinessName(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={t(lang, 'tagline')}>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder={t(lang, 'tagline_placeholder')} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label={t(lang, 'accent_emoji')}>
              <input value={accentEmoji} onChange={e => setAccentEmoji(e.target.value.slice(0, 4))} placeholder="🐄" maxLength={4} style={{ ...inputStyle, textAlign: 'center' }} className="clean-btn motion-fast" />
            </Field>
            <Field label={t(lang, 'theme_color')}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', minHeight: 48 }}>
                <input
                  type="color"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  aria-label={t(lang, 'theme_color')}
                  style={{ width: 48, height: 48, padding: 0, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  maxLength={7}
                  className="tabular"
                  style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
                />
              </div>
            </Field>
          </div>

          {/* Preset color swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setThemeColor(c.hex)}
                className="motion-fast"
                title={t(lang, c.key)}
                aria-label={t(lang, c.key)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  background: c.hex,
                  border: themeColor.toLowerCase() === c.hex.toLowerCase() ? '2px solid var(--ink-900)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {themeColor.toLowerCase() === c.hex.toLowerCase() && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Logo upload */}
          <Field label={t(lang, 'logo_upload')}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="logo preview" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)', background: '#fff' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 10, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-500)', fontSize: 22, background: 'var(--bg)' }}>🖼️</div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="clean-btn motion-fast"
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--ink-700)', border: '1px solid var(--border)', fontSize: 13 }}
              >
                📁 {t(lang, 'logo_upload')}
              </button>
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl(null)}
                  className="clean-btn motion-fast"
                  style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.22)', fontSize: 13, padding: '0 14px' }}
                  aria-label="clear logo"
                >✕</button>
              )}
            </div>
            {logoError && (
              <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{logoError}</div>
            )}
            <div style={{ fontSize: 10, color: 'var(--ink-500)', marginTop: 2 }}>Max 200KB · PNG/SVG/JPG</div>
          </Field>

          <button
            onClick={saveBranding}
            disabled={savingBranding}
            className="clean-btn motion-fast"
            style={{ marginTop: 4, background: 'var(--brand-600)', color: '#fff', border: 'none' }}
          >
            {savingBranding ? '...' : t(lang, 'save')}
          </button>
        </Section>
      )}

      {/* General */}
      <Section title={t(lang, 'settings_general')}>
        <Field label={t(lang, 'business_name')}>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Field label={t(lang, 'billing_cycle_day')}>
            <input type="number" value={billingCycleDay} onChange={e => setBillingCycleDay(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={t(lang, 'grace_days')}>
            <input type="number" value={graceDays} onChange={e => setGraceDays(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={lang === 'gu' ? 'દિવસ કલાક' : 'Day boundary hr'}>
            <input type="number" value={dayBoundaryHour} onChange={e => setDayBoundaryHour(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
        </div>
        <Field label={t(lang, 'rounding_rule')}>
          <select value={roundingRule} onChange={e => setRoundingRule(e.target.value)} style={inputStyle} className="clean-btn motion-fast">
            <option value="none">{t(lang, 'rounding_none')}</option>
            <option value="round_off">{t(lang, 'rounding_round_off')}</option>
            <option value="cash_discount_5">{t(lang, 'rounding_cash_discount')}</option>
          </select>
        </Field>
        <Field label={t(lang, 'upi_id')}>
          <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="raju@upi" style={inputStyle} className="clean-btn motion-fast" />
        </Field>
        <Field label={lang === 'gu' ? 'પ્રોડક્ટ્સ' : 'Products'}>
          <input value={products} onChange={e => setProducts(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
        </Field>
        <button onClick={() => patch({
          businessName, billingCycleDay: Number(billingCycleDay), graceDays: Number(graceDays),
          dayBoundaryHour: Number(dayBoundaryHour), roundingRule, upiId, products,
        })} className="clean-btn motion-fast" style={{ marginTop: 4, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>
          {t(lang, 'save')}
        </button>
      </Section>

      {/* Language */}
      <Section title={t(lang, 'language')}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['gu', 'hi', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); patch({ defaultLang: l }); }}
              className="clean-btn motion-fast"
              style={{
                flex: 1, padding: '12px 0', background: lang === l ? 'var(--brand-tint)' : 'var(--bg)',
                color: lang === l ? 'var(--brand-700)' : 'var(--ink-700)',
                border: lang === l ? '1px solid var(--brand-600)' : '1px solid var(--border)',
                fontWeight: 600, fontSize: 13,
              }}
            >
              {l === 'gu' ? 'ગુજરાતી' : l === 'hi' ? 'हिन्दी' : 'English'}
            </button>
          ))}
        </div>
      </Section>

      {/* Staff Mgmt */}
      {session?.role === 'owner' && (
        <Section title={t(lang, 'staff_mgmt')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                    {u.name} {u.isSuper && <span style={{ fontSize: 10, color: 'var(--amber)' }}>★</span>}
                  </div>
                  <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{u.phone}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: u.role === 'owner' ? 'var(--brand-tint)' : 'var(--amber-tint)',
                  color: u.role === 'owner' ? 'var(--brand-700)' : 'var(--amber)',
                  alignSelf: 'center',
                }}>{u.role}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setAddUserOpen('owner')} className="clean-btn motion-fast" style={{ flex: 1, background: 'var(--brand-tint)', color: 'var(--brand-700)', border: '1px solid rgba(11,122,75,0.18)', fontSize: 12 }}>
              + {t(lang, 'add_owner')}
            </button>
            <button onClick={() => setAddUserOpen('staff')} className="clean-btn motion-fast" style={{ flex: 1, background: 'var(--amber-tint)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.22)', fontSize: 12 }}>
              + {t(lang, 'add_staff')}
            </button>
          </div>
        </Section>
      )}

      {/* WhatsApp templates */}
      <Section title={t(lang, 'templates')}>
        <Field label="Gujarati">
          <textarea value={reminderGu} onChange={e => setReminderGu(e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} className="clean-btn motion-fast" />
        </Field>
        <Field label="English">
          <textarea value={reminderEn} onChange={e => setReminderEn(e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} className="clean-btn motion-fast" />
        </Field>
        <button onClick={() => patch({ reminderTemplateGu: reminderGu, reminderTemplateEn: reminderEn })} className="clean-btn motion-fast" style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}>
          {t(lang, 'save')}
        </button>
      </Section>

      {/* Logout */}
      <button
        onClick={logout}
        className="clean-btn motion-fast"
        style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.22)', fontSize: 14 }}
      >
        ⏻ {t(lang, 'logout')}
      </button>

      <div style={{ marginTop: 8 }}>
        <FooterCredit />
      </div>

      {addUserOpen && (
        <AddUserSheet
          role={addUserOpen}
          onClose={() => setAddUserOpen(null)}
          onAdded={() => { setAddUserOpen(null); load(); }}
        />
      )}
    </div>
  );
}

function AddUserSheet({ role, onClose, onAdded }: { role: 'owner' | 'staff'; onClose: () => void; onAdded: () => void }) {
  const lang = useApp(s => s.lang);
  const pushToast = useApp(s => s.pushToast);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const submit = async () => {
    if (!name || !phone) {
      pushToast({ text: t(lang, 't_phone_required') });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, role }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast({ text: d?.error || t(lang, 'error') });
        setSaving(false);
        return;
      }
      if (d.devOtp) setDevOtp(d.devOtp);
      pushToast({ text: '✅ ' + (lang === 'gu' ? 'ઉમેર્યા' : 'Added') });
      onAdded();
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,31,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="clean-card slide-up" style={{ width: '100%', maxWidth: 440, padding: 18, borderRadius: '16px 16px 0 0', background: 'var(--surface)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          {role === 'owner' ? t(lang, 'add_owner') : t(lang, 'add_staff')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label={t(lang, 'name')}>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          <Field label={t(lang, 'phone')}>
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" style={inputStyle} className="clean-btn motion-fast" />
          </Field>
          {devOtp && (
            <div style={{ padding: '8px 10px', background: 'var(--brand-tint)', color: 'var(--brand-700)', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              {t(lang, 'dev_otp_hint')}: {devOtp}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} className="clean-btn motion-fast" style={{ flex: 1, background: 'transparent', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>{t(lang, 'cancel')}</button>
            <button onClick={submit} disabled={saving} className="clean-btn motion-fast" style={{ flex: 2, background: 'var(--brand-600)', color: '#fff', border: 'none' }}>{saving ? '...' : t(lang, 'save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="clean-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</div>
      {children}
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
