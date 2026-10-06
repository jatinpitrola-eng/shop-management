// Footer credit — must be visible on EVERY screen
'use client';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';

export function FooterCredit() {
  const lang = useApp(s => s.lang);
  return (
    <footer className="footer-credit" style={{ paddingBottom: 'env(safe-area-inset-bottom, 6px)' }}>
      {t(lang, 'footer_credit')}
    </footer>
  );
}
