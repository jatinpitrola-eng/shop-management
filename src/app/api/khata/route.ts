// Khata — per customer line items (liters × rate), running total, vacation exclusions
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { currentMonth } from '@/lib/dates';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || currentMonth();
  const customers = await db.customer.findMany({
    where: { businessId: session.bid, active: true },
    orderBy: { name: 'asc' },
  });

  const result: any[] = [];
  const payments = await db.payment.findMany({
    where: { businessId: session.bid, status: 'active' },
  });

  for (const c of customers) {
    const entries = await db.milkEntry.findMany({
      where: { businessId: session.bid, customerId: c.id, date: { startsWith: month }, status: 'active' },
      orderBy: { date: 'asc' },
    });
    const totalLiters = entries.reduce((s, e) => s + e.qtyLiters, 0);
    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    const paid = payments
      .filter(p => p.customerId === c.id)
      .reduce((s, p) => s + p.amount, 0);
    result.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      entries,
      totalLiters,
      totalAmount,
      paid,
      pending: Math.max(0, totalAmount - paid),
    });
  }

  return NextResponse.json({ month, customers: result });
}
