// Statement PDF for a customer / month — embedded logo, line items, totals, UPI QR, both credit lines.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');
  const month = url.searchParams.get('month');
  if (!customerId || !month) {
    return NextResponse.json({ error: 'FIELDS_REQUIRED' }, { status: 400 });
  }
  if (session.role === 'customer' && session.cid !== customerId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const business = await db.business.findUnique({ where: { id: session.bid } });
  const settings = await db.settings.findUnique({ where: { businessId: session.bid } });

  const entries = await db.milkEntry.findMany({
    where: { businessId: session.bid, customerId, date: { startsWith: month }, status: 'active' },
    orderBy: { date: 'asc' },
  });
  const payments = await db.payment.findMany({
    where: { businessId: session.bid, customerId, status: 'active' },
    orderBy: { approvedAt: 'asc' },
  });

  const totalLiters = entries.reduce((s, e) => s + e.qtyLiters, 0);
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  return NextResponse.json({
    statement: {
      business: { name: business?.businessName || 'Shop Management', upiId: business?.upiId || settings?.upiId || '' },
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      month,
      entries,
      payments,
      totalLiters,
      totalAmount,
      paidAmount,
      pendingAmount,
    },
    footer: {
      by_nexoryos: 'by Nexoryos',
      credit: 'By Pitroda Jatin Jayeshbhai',
    },
  });
}
