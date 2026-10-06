// Rate change — forward-only. Effective from given date forward.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = await req.json();
  const customerId = body?.customerId as string | null;
  const product = body?.product as string;
  const newRate = Number(body?.newRate);
  const effectiveFrom = body?.effectiveFrom as string;
  if (!product || !newRate || !effectiveFrom) {
    return NextResponse.json({ error: 'FIELDS_REQUIRED' }, { status: 400 });
  }
  if (customerId) {
    const c = await db.customer.findUnique({ where: { id: customerId } });
    if (!c || c.businessId !== session.bid) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const rc = await db.rateChange.create({
    data: {
      businessId: session.bid,
      customerId: customerId || null,
      product,
      newRate,
      effectiveFrom,
      changedById: session.uid,
      changedBy: session.name,
    },
  });

  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'RATE_CHANGE',
      entityType: 'RateChange',
      entityId: rc.id,
      metadata: JSON.stringify({ customerId, product, newRate, effectiveFrom }),
    },
  });

  return NextResponse.json({ rateChange: rc });
}
