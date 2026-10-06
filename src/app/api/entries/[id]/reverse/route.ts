// Reverse an entry (no silent edit). Creates a reversal entry that references the original.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const reason = body?.reason as string;

  const original = await db.milkEntry.findUnique({ where: { id } });
  if (!original || original.businessId !== session.bid) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (original.status === 'reversed') {
    return NextResponse.json({ error: 'ALREADY_REVERSED' }, { status: 400 });
  }

  // Mark original as reversed
  const updated = await db.milkEntry.update({
    where: { id },
    data: { status: 'reversed', reversalReason: reason || 'Reversed' },
  });

  // Create reversal entry (negative qty for ledger clarity, kept for audit)
  await db.milkEntry.create({
    data: {
      businessId: original.businessId,
      customerId: original.customerId,
      enteredById: session.uid || 'unknown',
      date: original.date,
      shift: original.shift,
      qtyLiters: -original.qtyLiters,
      product: original.product,
      ratePerUnit: original.ratePerUnit,
      amount: -original.amount,
      status: 'reversed',
      reversedByEntryId: original.id,
      reversalReason: reason || 'Reversed',
      enteredBy: session.name,
      enteredByRole: session.role,
      clientUuid: uuidv4(),
    },
  });

  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'ENTRY_REVERSE',
      entityType: 'MilkEntry',
      entityId: id,
      metadata: JSON.stringify({ reason: reason || 'Reversed' }),
    },
  });

  return NextResponse.json({ reversed: true, entry: updated });
}
