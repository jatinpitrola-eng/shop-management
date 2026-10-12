'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { t, LANG_LABELS, type Lang } from '@/lib/i18n';
import { NexoryosLogo } from './Brand';
import { FooterCredit } from './FooterCredit';

type Mode = 'phone' | 'email';

export function LoginScreen() {
  const lang = useApp(s => s.lang);
  const setLang = useApp(s => s.setLang);
  const setView = useApp(s => s.setView);
  const setSession = useApp(s => s.setSession);
  const pushToast = useApp(s => s.pushToast);

  const [mode, setMode] = useState<Mode>('phone');
  const [step, setStep] = useState<'phone' | 'otp' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn > 0) {
      const id = setTimeout(() => setResendIn(r => r - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [resendIn]);

  const requestOtp = async () => {
    if (!phone) { pushToast({ text: t(lang, 't_phone_required') }); return; }
    setLoading(true);
    try {
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

  const emailLogin = async () => {
    if (!email || !password) {
      pushToast({ text: lang === 'gu' ? 'ઇમેઇલ અને પાસવર્ડ દાખલ કરો' : lang === 'hi' ? 'इमेइल और पासवर्ड डालें' : 'Enter email and password' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ text: data?.error === 'INVALID_PASSWORD' ? (lang === 'gu' ? 'ખોટો પાસવર્ડ' : 'Wrong password') : data?.error === 'NOT_FOUND' ? (lang === 'gu' ? 'કસ્ટમર મળ્યો નથી' : 'Customer not found') : 'Error' });
        setLoading(false);
        return;
      }
      setSession({ role: 'customer', name: data.name, bid: data.businessId, cid: data.customerId, phone: '' });
      pushToast({ text: '✅ ' + (lang === 'gu' ? 'કસ્ટમર લોગિન થયું' : 'Customer logged in') });
      setView('cust_home');
    } catch {
      pushToast({ text: t(lang, 'error') });
      setLoading(false);
    }
  };

  const quickDemo = async () => {
    setPhone('+919876543210');
    setMode('phone');
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
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{t(lang, 'app_name')}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{t(lang, 'by_nexoryos')}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>{t(lang, 'login_title')}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{t(lang, 'login_subtitle')}</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--muted)', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => { setMode('phone'); setStep('phone'); setCode(''); }}
            className="motion-fast"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none',
              background: mode === 'phone' ? 'var(--surface)' : 'transparent',
              color: mode === 'phone' ? 'var(--brand-700)' : 'var(--ink-500)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 40,
              boxShadow: mode === 'phone' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            📱 {lang === 'gu' ? 'ફોન + OTP' : lang === 'hi' ? 'फोन + OTP' : 'Phone + OTP'}
          </button>
          <button
            onClick={() => { setMode('email'); setStep('email'); }}
            className="motion-fast"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none',
              background: mode === 'email' ? 'var(--surface)' : 'transparent',
              color: mode === 'email' ? 'var(--brand-700)' : 'var(--ink-500)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 40,
              boxShadow: mode === 'email' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            ✉️ {lang === 'gu' ? 'ઇમેઇલ' : lang === 'hi' ? 'इमेइल' : 'Email'}
          </button>
        </div>

        {mode === 'phone' && step === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="tel" inputMode="numeric" placeholder={t(lang, 'phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} className="motion-fast" />
            <input type="text" placeholder={t(lang, 'name')} value={name} onChange={e => setName(e.target.value)} style={inputStyle} className="motion-fast" />
            <button
              disabled={loading || !phone}
              onClick={requestOtp}
              className="clean-btn motion-fast"
              style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}
            >
              {loading ? '...' : t(lang, 'send_otp')}
            </button>
            <button onClick={quickDemo} className="clean-btn motion-fast" style={{ background: 'transparent', color: 'var(--brand-600)', border: '1px solid var(--brand-600)' }}>
              🚀 Demo Login (Raju — Owner)
            </button>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'center', marginTop: 4 }}>
              {lang === 'gu' ? 'કસ્ટમર: +91 98765 43220 (Patel Bhai)' : 'Customer: +91 98765 43220 (Patel Bhai)'}
            </div>
          </div>
        )}

        {mode === 'phone' && step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {devHint && (
              <div style={{ background: 'var(--brand-tint)', color: 'var(--brand-700)', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                {devHint}
              </div>
            )}
            <input type="tel" inputMode="numeric" maxLength={6} placeholder={t(lang, 'otp_placeholder')} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center' }} className="motion-fast" />
            <button
              disabled={loading || code.length !== 6}
              onClick={verify}
              className="clean-btn motion-fast"
              style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}
            >
              {loading ? '...' : t(lang, 'verify_otp')}
            </button>
            <button
              disabled={resendIn > 0}
              onClick={requestOtp}
              className="clean-btn motion-fast"
              style={{ background: 'transparent', color: 'var(--brand-600)', border: '1px solid var(--brand-600)' }}
            >
              {resendIn > 0 ? t(lang, 'resend_in', { s: String(resendIn) }) : t(lang, 'resend_otp')}
            </button>
            <button onClick={() => { setStep('phone'); setCode(''); }} className="clean-btn motion-fast" style={{ background: 'transparent', color: 'var(--ink-500)', border: '1px solid var(--border)' }}>
              ← {lang === 'gu' ? 'ફોન બદલો' : 'Change phone'}
            </button>
          </div>
        )}

        {mode === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--brand-tint)', color: 'var(--brand-700)', padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, textAlign: 'center' }}>
              🔒 {lang === 'gu' ? 'માલિક તમને આપેલ ઇમેઇલ + પાસવર્ડ વાપરો' : lang === 'hi' ? 'मालिक द्वारा दिया गया इमेइल + पासवर्ड उपयोग करें' : 'Use the email + password your dairy owner gave you'}
            </div>
            <input type="email" inputMode="email" placeholder={lang === 'gu' ? 'ઇમેઇલ' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} className="motion-fast" />
            <input type="password" placeholder={lang === 'gu' ? 'પાસવર્ડ' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} className="motion-fast" />
            <button
              disabled={loading}
              onClick={emailLogin}
              className="clean-btn motion-fast"
              style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}
            >
              {loading ? '...' : (lang === 'gu' ? 'લોગિન' : 'Login')}
            </button>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'center', marginTop: 4 }}>
              Demo: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>patel@demo.com</code> / <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>1234</code>
            </div>
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
  borderRadius: 10,
  fontSize: 16,
  color: 'var(--ink-900)',
  width: '100%',
  outline: 'none',
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
