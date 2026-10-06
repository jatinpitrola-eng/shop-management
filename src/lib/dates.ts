// IST helpers — day boundary at 04:00 (milk delivered after midnight counts to previous day)
export const IST_TZ = 'Asia/Kolkata';

export function nowIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TZ }));
}

/** Returns YYYY-MM-DD in IST, applying 04:00 day boundary. */
export function istDate(offsetMs: number = 0): string {
  const now = new Date(Date.now() + offsetMs);
  // Convert to IST by computing offset
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  // Apply 04:00 day boundary: if before 4 AM IST, count as previous day
  const d = new Date(istMs);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return formatDate(d);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentMonth(offsetMonths: number = 0): string {
  const d = nowIST();
  d.setMonth(d.getMonth() + offsetMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseMonth(month: string): { year: number; month: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, month: m };
}

export function formatINR(amount: number): string {
  // Indian grouping with ₹
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const fixed = abs.toFixed(0);
  // Indian grouping: last 3, then groups of 2
  const last3 = fixed.slice(-3);
  const rest = fixed.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `₹${sign}${grouped}`;
}

export function formatINRDecimal(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount).toFixed(2);
  const [whole, dec] = abs.split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `₹${sign}${grouped}.${dec}`;
}

export function normalizePhone(phone: string): string {
  // Indian normalization: +91 or 91 prefix → 10 digits
  let p = phone.replace(/[^\d]/g, '');
  if (p.length === 10) return '+91' + p;
  if (p.length === 11 && p.startsWith('0')) return '+91' + p.slice(1);
  if (p.length === 12 && p.startsWith('91')) return '+' + p;
  if (p.length === 13 && p.startsWith('91')) return '+' + p;
  if (p.length > 10) return '+' + p;
  return p;
}

export function formatDateTimeIST(d: Date): string {
  return d.toLocaleString('en-IN', {
    timeZone: IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTimeIST(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function daysUntil(target: Date): number {
  const now = nowIST();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
