// Customer detail with this-month entries + recent payments + vacation + entry history calendar
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { currentMonth, istDate } from '@/lib/dates';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      entries: { where: { status: 'active' }, orderBy: { date: 'desc' }, take: 200 },
      payments: { where: { status: 'active' }, orderBy: { approvedAt: 'desc' }, take: 20 },
      vacations: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const month = currentMonth();
  const monthEntries = customer.entries.filter(e => e.date.startsWith(month));
  const totalLiters = monthEntries.reduce((s, e) => s + e.qtyLiters, 0);
  const totalAmount = monthEntries.reduce((s, e) => s + e.amount, 0);
  const paidAmount = customer.payments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  return NextResponse.json({
    customer,
    thisMonth: { liters: totalLiters, amount: totalAmount, paid: paidAmount, pending: pendingAmount },
    recentEntries: monthEntries.slice(0, 60),
    recentPayments: customer.payments.slice(0, 10),
    vacations: customer.vacations,
    today: istDate(),
  });
}
