// Reports — month-wise earnings + bar chart (last 12 months); customer-wise yearly summary; CSV export
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { currentMonth, parseMonth } from '@/lib/dates';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'monthly';
  const year = url.searchParams.get('year') || String(new Date().getFullYear());

  // Last 12 months summary
  const thisMonth = currentMonth();
  const months: { month: string; liters: number; amount: number; paid: number; pending: number }[] = [];
  const [cy, cm] = thisMonth.split('-').map(Number);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(cy, cm - 1 - i, 1));
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entries = await db.milkEntry.findMany({
      where: { businessId: session.bid, date: { startsWith: m }, status: 'active' },
    });
    const payments = await db.payment.findMany({
      where: {
        businessId: session.bid,
        status: 'active',
        approvedAt: {
          gte: new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)),
          lt: new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1)),
        },
      },
    });
    const liters = entries.reduce((s, e) => s + e.qtyLiters, 0);
    const amount = entries.reduce((s, e) => s + e.amount, 0);
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    months.push({ month: m, liters, amount, paid, pending: Math.max(0, amount - paid) });
  }

  // Customer-wise yearly summary
  const { year: yNum } = parseMonth(`${year}-01`);
  const customers = await db.customer.findMany({ where: { businessId: session.bid } });
  const customerSummary: any[] = [];
  for (const c of customers) {
    const entries = await db.milkEntry.findMany({
      where: { businessId: session.bid, customerId: c.id, date: { startsWith: String(yNum) }, status: 'active' },
    });
    if (entries.length === 0) continue;
    const liters = entries.reduce((s, e) => s + e.qtyLiters, 0);
    const amount = entries.reduce((s, e) => s + e.amount, 0);
    customerSummary.push({ id: c.id, name: c.name, phone: c.phone, liters, amount });
  }
  customerSummary.sort((a, b) => b.amount - a.amount);

  if (format === 'csv') {
    const rows = [['Month', 'Liters', 'Amount', 'Paid', 'Pending']];
    months.forEach(m => rows.push([m.month, String(m.liters), String(m.amount), String(m.paid), String(m.pending)]));
    rows.push([]);
    rows.push(['Customer', 'Phone', 'Liters', 'Amount']);
    customerSummary.forEach(c => rows.push([c.name, c.phone, String(c.liters), String(c.amount)]));
    const csv = rows.map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${thisMonth}.csv"`,
      },
    });
  }

  return NextResponse.json({ months, customerSummary, year: yNum });
}
