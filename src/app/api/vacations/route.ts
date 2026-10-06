// Vacation — owner-set or customer-requested
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = await req.json();
  const customerId = body?.customerId as string;
  const fromDate = body?.fromDate as string;
  const toDate = body?.toDate as string;
  if (!customerId || !fromDate || !toDate) {
    return NextResponse.json({ error: 'FIELDS_REQUIRED' }, { status: 400 });
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Customer can request, owner can approve directly
  const status = session.role === 'owner' ? 'approved' : 'requested';
  const createdBy = session.role === 'customer' ? 'customer' : session.name;

  const vac = await db.vacation.create({
    data: {
      businessId: session.bid,
      customerId,
      fromDate,
      toDate,
      status,
      createdBy,
    },
  });

  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'VACATION_' + (status === 'approved' ? 'SET' : 'REQUEST'),
      entityType: 'Vacation',
      entityId: vac.id,
      metadata: JSON.stringify({ customerId, fromDate, toDate }),
    },
  });

  return NextResponse.json({ vacation: vac });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');
  const vacations = await db.vacation.findMany({
    where: {
      businessId: session.bid,
      ...(customerId ? { customerId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ vacations });
}
