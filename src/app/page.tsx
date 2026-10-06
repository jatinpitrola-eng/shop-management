'use client';
import { useEffect } from 'react';
import { useApp } from '@/lib/store';
import { IntroScreen } from '@/components/IntroScreen';
import { LoginScreen } from '@/components/LoginScreen';
import { OwnerApp } from '@/components/OwnerApp';
import { CustomerApp } from '@/components/customer/CustomerApp';
import { Toasts } from '@/components/Toasts';

export default function Home() {
  const view = useApp(s => s.view);
  const session = useApp(s => s.session);
  const setSession = useApp(s => s.setSession);
  const setView = useApp(s => s.setView);
  const setOnline = useApp(s => s.setOnline);

  // On mount: seed + session check
  useEffect(() => {
    // Online status
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    // Best-effort seed (ignore errors / 401)
    fetch('/api/seed', { method: 'POST' }).catch(() => {});

    // Try to restore session by hitting an auth-protected route
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) {
          // No session — always start at intro
          setView('intro');
          return;
        }
        // We have a session — find out what role
        const userRes = await fetch('/api/dashboard', { cache: 'no-store' });
        if (userRes.ok) {
          // Owner or staff — fetch minimal session shape via owners list
          const ownersRes = await fetch('/api/owners', { cache: 'no-store' });
          let name = 'Owner';
          let bid = '';
          if (ownersRes.ok) {
            const d = await ownersRes.json();
            // The current user is whoever — we can't tell precisely from this list
            // but we know the role is owner/staff from /api/dashboard returning 200
          }
          setSession({ role: 'owner', name, bid, phone: '' });
          setView('owner_today');
        } else {
          const custRes = await fetch('/api/customer', { cache: 'no-store' });
          if (custRes.ok) {
            const cd = await custRes.json();
            setSession({
              role: 'customer',
              name: cd.customer?.name || 'Customer',
              bid: '',
              cid: cd.customer?.id,
              phone: cd.customer?.phone || '',
            });
            setView('cust_home');
          } else {
            setView('intro');
          }
        }
      } catch {
        setView('intro');
      }
    })();

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [setSession, setView, setOnline]);

  return (
    <>
      {view === 'intro' && <IntroScreen />}
      {view === 'login' && <LoginScreen />}
      {view.startsWith('owner_') && (session ? <OwnerApp /> : <LoginScreen />)}
      {view.startsWith('cust_') && (session ? <CustomerApp /> : <LoginScreen />)}
      <Toasts />
    </>
  );
}
