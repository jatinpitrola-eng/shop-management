// Customer's own khata — read-only mirror. They see ONLY their own data.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { currentMonth, istDate } from '@/lib/dates';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'customer' || !session.cid) {
    return NextResponse.json({ error: 'CUSTOMER_ONLY' }, { status: 403 });
  }
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || currentMonth();

  const customer = await db.customer.findUnique({ where: { id: session.cid } });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const business = await db.business.findUnique({ where: { id: session.bid } });
  const settings = await db.settings.findUnique({ where: { businessId: session.bid } });

  const entries = await db.milkEntry.findMany({
    where: { businessId: session.bid, customerId: session.cid, date: { startsWith: month }, status: 'active' },
    orderBy: { date: 'asc' },
  });
  const payments = await db.payment.findMany({
    where: { businessId: session.bid, customerId: session.cid, status: 'active' },
    orderBy: { approvedAt: 'desc' },
    take: 10,
  });
  const activities = await db.activityLog.findMany({
    where: { businessId: session.bid, customerId: session.cid },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const vacations = await db.vacation.findMany({
    where: { businessId: session.bid, customerId: session.cid },
    orderBy: { createdAt: 'desc' },
  });

  const totalLiters = entries.reduce((s, e) => s + e.qtyLiters, 0);
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  const today = istDate();
  const todayEntries = entries.filter(e => e.date === today);

  const graceDays = settings?.graceDays || 10;
  const todayDate = new Date();
  const billMonthDate = new Date(`${month}-01T00:00:00Z`);
  const billDueDate = new Date(billMonthDate.getUTCFullYear(), billMonthDate.getUTCMonth() + 1, graceDays);
  const overdueDays = Math.floor((todayDate.getTime() - billDueDate.getTime()) / (1000 * 60 * 60 * 24));
  const agingColor = pendingAmount <= 0 ? 'green' : overdueDays > 0 ? 'red' : 'amber';

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name, phone: customer.phone },
    business: { name: business?.businessName, upiId: business?.upiId || settings?.upiId || '' },
    month,
    today,
    todayEntries,
    totalLiters,
    totalAmount,
    paidAmount,
    pendingAmount,
    agingColor,
    activities,
    vacations,
    recentPayments: payments,
  });
}
