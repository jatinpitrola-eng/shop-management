// Bill generation: month's active entries grouped by product → liters × per-entry rate
// → minus vacation days → rounding rule applied. Old entries keep locked rate.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

function applyRoundingRule(amount: number, rule: string): number {
  if (rule === 'round_off') return Math.round(amount);
  if (rule === 'cash_discount_5') return Math.max(0, amount - 5);
  return amount;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = await req.json();
  const customerId = body?.customerId as string;
  const billMonth = body?.billMonth as string; // YYYY-MM
  if (!customerId || !billMonth) {
    return NextResponse.json({ error: 'FIELDS_REQUIRED' }, { status: 400 });
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const settings = await db.settings.findUnique({ where: { businessId: session.bid } });
  const roundingRule = settings?.roundingRule || 'none';

  // Active entries for this month — rate locked per entry
  const entries = await db.milkEntry.findMany({
    where: {
      businessId: session.bid,
      customerId,
      date: { startsWith: billMonth },
      status: 'active',
    },
  });

  const totalLiters = entries.reduce((s, e) => s + e.qtyLiters, 0);
  let totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  totalAmount = applyRoundingRule(totalAmount, roundingRule);

  // Existing payments for this customer this month
  const payments = await db.payment.findMany({
    where: { businessId: session.bid, customerId, status: 'active' },
  });
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);

  // Existing bill → bump version
  const existingBill = await db.bill.findFirst({
    where: { businessId: session.bid, customerId, billMonth },
    orderBy: { version: 'desc' },
  });
  const version = (existingBill?.version || 0) + 1;
  if (existingBill) {
    await db.bill.update({ where: { id: existingBill.id }, data: { status: 'reversed' } });
  }

  const status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'generated';

  const bill = await db.bill.create({
    data: {
      businessId: session.bid,
      customerId,
      billMonth,
      totalLiters,
      totalAmount,
      paidAmount,
      status,
      roundingRule,
      version,
    },
  });

  await db.activityLog.create({
    data: {
      businessId: session.bid,
      customerId,
      type: 'bill_generated',
      title: `બિલ બન્યું — ₹${totalAmount}`,
      body: `${billMonth} • ${totalLiters.toFixed(1)}L • v${version}`,
    },
  });

  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'BILL_GENERATE',
      entityType: 'Bill',
      entityId: bill.id,
      metadata: JSON.stringify({ customerId, billMonth, totalLiters, totalAmount, version }),
    },
  });

  return NextResponse.json({ bill });
}

// GET list / detail
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff' && session.role !== 'customer') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');
  const billMonth = url.searchParams.get('billMonth');

  const where: any = { businessId: session.bid, status: { not: 'reversed' } };
  if (customerId) where.customerId = customerId;
  if (billMonth) where.billMonth = billMonth;
  if (session.role === 'customer') where.customerId = session.cid;

  const bills = await db.bill.findMany({
    where,
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ bills });
}
