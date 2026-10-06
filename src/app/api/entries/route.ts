// Add milk entry (offline-aware). Duplicate protection via unique constraint.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { istDate } from '@/lib/dates';
import { v4 as uuidv4 } from 'uuid';

interface Body {
  customerId: string;
  shift: 'morning' | 'evening';
  qtyLiters: number;
  product?: string;
  ratePerUnit?: number;
  date?: string; // override (for offline)
  clientUuid?: string;
  offline?: boolean;
  status?: 'active' | 'reversed';
  reversalReason?: string;
  reversedByEntryId?: string;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = (await req.json()) as Body;
  if (!body.customerId || !body.shift) {
    return NextResponse.json({ error: 'CUSTOMER_SHIFT_REQUIRED' }, { status: 400 });
  }
  const customer = await db.customer.findUnique({ where: { id: body.customerId } });
  if (!customer || customer.businessId !== session.bid) {
    return NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
  }
  const product = body.product || 'milk';
  const rate = body.ratePerUnit ?? customer.defaultRate;
  const qty = Number(body.qtyLiters ?? (product === 'not_taken' ? 0 : customer.defaultQty));
  const amount = product === 'not_taken' ? 0 : qty * rate;
  const date = body.date || istDate();
  const clientUuid = body.clientUuid || uuidv4();

  // Duplicate protection: same customer + date + shift + product + active status
  const dup = await db.milkEntry.findFirst({
    where: {
      businessId: session.bid,
      customerId: body.customerId,
      date,
      shift: body.shift,
      product,
      status: 'active',
    },
  });
  if (dup) {
    return NextResponse.json(
      { error: 'DUPLICATE_ENTRY', existing: dup },
      { status: 409 }
    );
  }

  try {
    const entry = await db.milkEntry.create({
      data: {
        businessId: session.bid,
        customerId: body.customerId,
        enteredById: session.uid || 'unknown',
        date,
        shift: body.shift,
        qtyLiters: qty,
        product,
        ratePerUnit: rate,
        amount,
        status: body.status || 'active',
        reversedByEntryId: body.reversedByEntryId || null,
        reversalReason: body.reversalReason || null,
        enteredBy: session.name,
        enteredByRole: session.role,
        offline: !!body.offline,
        clientUuid,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        businessId: session.bid,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'ENTRY_ADD',
        entityType: 'MilkEntry',
        entityId: entry.id,
        metadata: JSON.stringify({ customerId: body.customerId, date, shift: body.shift, qty, product, rate, offline: !!body.offline }),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'DUPLICATE_ENTRY' }, { status: 409 });
    }
    throw e;
  }
}

// GET /api/entries?date=YYYY-MM-DD → entries for that day for the business
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const date = url.searchParams.get('date') || istDate();
  const shift = url.searchParams.get('shift');

  const entries = await db.milkEntry.findMany({
    where: {
      businessId: session.bid,
      date,
      ...(shift ? { shift } : {}),
      status: 'active',
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ entries, date });
}
