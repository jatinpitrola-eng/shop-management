'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t, LANG_LABELS, type Lang } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';
import { LANG_LABELS as _L } from '@/lib/i18n';

export function LoginScreen() {
  const lang = useApp(s => s.lang);
  const setLang = useApp(s => s.setLang);
  const setView = useApp(s => s.setView);
  const setSession = useApp(s => s.setSession);
  const pushToast = useApp(s => s.pushToast);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn > 0) {
      const id = setTimeout(() => setResendIn(r => r - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [resendIn]);

  const requestOtp = async (which: 'register' | 'request') => {
    if (!phone) { pushToast({ text: t(lang, 't_phone_required') }); return; }
    setLoading(true);
    try {
      // First try /api/otp/request — works for existing users + customers.
      // If phone is not found → for owners, prompt for name and call /api/business/create.
      const reqRes = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const reqData = await reqRes.json();
      if (reqRes.ok) {
        setDevHint(reqData?.devOtp ? t(lang, 'dev_otp_hint') : null);
        setStep('otp');
        setResendIn(30);
        setLoading(false);
        return;
      }
      // Phone not found → if user filled name, register as new owner
      if (reqData?.needsRegister && name) {
        const regRes = await fetch('/api/business/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, name }),
        });
        const regData = await regRes.json();
        if (regRes.ok) {
          setDevHint(regData?.devOtp ? t(lang, 'dev_otp_hint') : null);
          setStep('otp');
          setResendIn(30);
        } else {
          pushToast({ text: regData?.error || 'Error' });
        }
        setLoading(false);
        return;
      }
      // Needs register but no name — prompt
      if (reqData?.needsRegister) {
        pushToast({ text: '📝 ' + (lang === 'gu' ? 'પહેલી વાર લોગિન — નામ દાખલ કરો' : lang === 'hi' ? 'पहली बार — नाम डालें' : 'First login — enter name') });
      } else {
        pushToast({ text: reqData?.error || 'Error' });
      }
    } catch {
      pushToast({ text: t(lang, 'error') });
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!code) { pushToast({ text: t(lang, 't_invalid_otp') }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ text: t(lang, 't_invalid_otp') });
        setLoading(false);
        return;
      }
      const role = data.role as 'owner' | 'staff' | 'customer';
      setSession({ role, name: data.name, bid: data.businessId, uid: data.uid, cid: data.customerId, phone });
      pushToast({ text: '✅ ' + (lang === 'gu' ? 'લોગિન થયું' : 'Logged in') });
      setView(role === 'customer' ? 'cust_home' : 'owner_today');
    } catch {
      pushToast({ text: t(lang, 'error') });
      setLoading(false);
    }
  };

  // Quick demo login (one tap) — uses the seeded business
  const quickDemo = async () => {
    setPhone('+919876543210');
    setStep('otp');
    setResendIn(0);
    setDevHint('Dev OTP: 123456');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LangSwitcher lang={lang} setLang={setLang} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, maxWidth: 360, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <NexoryosLogo size={72} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-900)' }}>{t(lang, 'app_name')}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', opacity: 0.7, marginTop: 2 }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>{t(lang, 'login_title')}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{t(lang, 'login_subtitle')}</div>
        </div>

        {step === 'phone' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder={t(lang, 'phone_placeholder')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={inputStyle}
              className="clean-btn motion-fast"
            />
            <input
              type="text"
              placeholder={t(lang, 'name')}
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              className="clean-btn motion-fast"
            />
            <button
              disabled={loading || !phone}
              onClick={() => requestOtp('register')}
              className="clean-btn motion-fast"
              style={primaryBtnStyle}
            >
              {loading ? '...' : t(lang, 'send_otp')}
            </button>
            <button
              onClick={quickDemo}
              className="clean-btn motion-fast"
              style={ghostBtnStyle}
            >
              🚀 Demo Login (Raju — Owner)
            </button>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'center', marginTop: 8 }}>
              {lang === 'gu' ? 'કસ્ટમર તરીકે લોગિન: +91 98765 43220 (Patel Bhai)' :
               lang === 'hi' ? 'ग्राहक लॉगिन: +91 98765 43220 (Patel Bhai)' :
               'Customer login: +91 98765 43220 (Patel Bhai)'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {devHint && (
              <div style={{
                background: 'var(--brand-tint)',
                color: 'var(--brand-700)',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'center',
              }}>
                {devHint}
              </div>
            )}
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder={t(lang, 'otp_placeholder')}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center' }}
              className="clean-btn motion-fast"
            />
            <button
              disabled={loading || code.length !== 6}
              onClick={verify}
              className="clean-btn motion-fast"
              style={primaryBtnStyle}
            >
              {loading ? '...' : t(lang, 'verify_otp')}
            </button>
            <button
              disabled={resendIn > 0}
              onClick={() => requestOtp('request')}
              className="clean-btn motion-fast"
              style={ghostBtnStyle}
            >
              {resendIn > 0 ? t(lang, 'resend_in', { s: String(resendIn) }) : t(lang, 'resend_otp')}
            </button>
            <button
              onClick={() => { setStep('phone'); setCode(''); }}
              className="clean-btn motion-fast"
              style={ghostBtnStyle}
            >
              ← {lang === 'gu' ? 'ફોન બદલો' : lang === 'hi' ? 'फोन बदलें' : 'Change phone'}
            </button>
          </div>
        )}
      </div>

      <FooterCredit />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 16,
  color: 'var(--ink-900)',
  width: '100%',
  outline: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--brand-600)',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--brand-600)',
  border: '1px solid var(--brand-600)',
};

export function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const langs: Lang[] = ['gu', 'hi', 'en'];
  return (
    <div className="scroll-x" style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
      {langs.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="motion-fast"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: lang === l ? 'var(--brand-tint)' : 'transparent',
            color: lang === l ? 'var(--brand-700)' : 'var(--ink-500)',
            border: 'none',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: 28,
          }}
        >
          {LANG_LABELS[l].native}
        </button>
      ))}
    </div>
  );
}
