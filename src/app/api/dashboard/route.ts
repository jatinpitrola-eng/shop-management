// Owner dashboard — this month vs last month, total liters, collection rate,
// top 5 overdue customers, customers on vacation today, month-end + grace countdown.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { currentMonth, istDate, nowIST } from '@/lib/dates';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const thisM = currentMonth(0);
  const lastM = currentMonth(-1);
  const today = istDate();

  // This month entries
  const thisEntries = await db.milkEntry.findMany({
    where: { businessId: session.bid, date: { startsWith: thisM }, status: 'active' },
  });
  const lastEntries = await db.milkEntry.findMany({
    where: { businessId: session.bid, date: { startsWith: lastM }, status: 'active' },
  });

  const thisAmount = thisEntries.reduce((s, e) => s + e.amount, 0);
  const lastAmount = lastEntries.reduce((s, e) => s + e.amount, 0);
  const thisLiters = thisEntries.reduce((s, e) => s + e.qtyLiters, 0);
  const lastLiters = lastEntries.reduce((s, e) => s + e.qtyLiters, 0);

  // Collection rate
  const payments = await db.payment.findMany({
    where: { businessId: session.bid, status: 'active' },
  });
  const paidThisMonth = payments
    .filter(p => {
      const am = p.approvedAt.toISOString().slice(0, 7);
      return am === thisM;
    })
    .reduce((s, p) => s + p.amount, 0);
  const collectionRate = thisAmount > 0 ? (paidThisMonth / thisAmount) * 100 : 0;

  // Top 5 overdue customers
  const customers = await db.customer.findMany({ where: { businessId: session.bid, active: true } });
  const overdue: { id: string; name: string; pending: number }[] = [];
  for (const c of customers) {
    const custEntries = await db.milkEntry.findMany({
      where: { businessId: session.bid, customerId: c.id, status: 'active' },
    });
    const total = custEntries.reduce((s, e) => s + e.amount, 0);
    const custPayments = payments.filter(p => p.customerId === c.id).reduce((s, p) => s + p.amount, 0);
    const pending = total - custPayments;
    if (pending > 0) overdue.push({ id: c.id, name: c.name, pending });
  }
  overdue.sort((a, b) => b.pending - a.pending);
  const top5Overdue = overdue.slice(0, 5);

  // Customers on vacation today
  const vacs = await db.vacation.findMany({
    where: { businessId: session.bid, status: 'approved', fromDate: { lte: today }, toDate: { gte: today } },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  // Month-end countdown
  const now = nowIST();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = lastDayOfMonth - now.getDate();
  const settings = await db.settings.findUnique({ where: { businessId: session.bid } });
  const graceDays = settings?.graceDays || 10;
  const graceEnds = new Date(now.getFullYear(), now.getMonth() + 1, graceDays);
  const graceDaysLeft = Math.max(0, Math.ceil((graceEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return NextResponse.json({
    thisMonth: { amount: thisAmount, liters: thisLiters, paid: paidThisMonth },
    lastMonth: { amount: lastAmount, liters: lastLiters },
    delta: lastAmount > 0 ? ((thisAmount - lastAmount) / lastAmount) * 100 : 0,
    collectionRate,
    top5Overdue,
    onVacationToday: vacs.map(v => ({ id: v.customerId, name: v.customer.name, phone: v.customer.phone, from: v.fromDate, to: v.toDate })),
    monthEndCountdown: { daysLeft: daysLeftInMonth, lastDay: lastDayOfMonth },
    graceCountdown: { daysLeft: graceDaysLeft, ends: graceEnds.toISOString() },
  });
}
