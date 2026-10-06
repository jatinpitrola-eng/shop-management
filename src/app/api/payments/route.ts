// Payment approval — only owner. Stamps approvedBy name + phone + server timestamp.
// This is the USP audit trail. Payment can be partial (₹500 of ₹1,860).
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDateTimeIST } from '@/lib/dates';

interface PaymentBody {
  customerId: string;
  amount: number;
  method: 'cash' | 'upi' | 'online';
  note?: string;
  proofPhotoUrl?: string;
  billId?: string;
  approvedById?: string; // when multiple owners, which owner approves
  approvedByName?: string;
  approvedByPhone?: string;
  offline?: boolean;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = (await req.json()) as PaymentBody;

  // If approvedById is different from session.uid, verify that user is an owner in this business
  let approverId = session.uid;
  let approverName = session.name;
  let approverPhone = session.phone;

  if (body.approvedById && body.approvedById !== session.uid) {
    const approver = await db.user.findUnique({ where: { id: body.approvedById } });
    if (!approver || approver.businessId !== session.bid || approver.role !== 'owner') {
      return NextResponse.json({ error: 'INVALID_APPROVER' }, { status: 400 });
    }
    approverId = approver.id;
    approverName = approver.name;
    approverPhone = approver.phone;
  }

  // Snapshot immutable
  const payment = await db.payment.create({
    data: {
      businessId: session.bid,
      customerId: body.customerId,
      amount: Number(body.amount),
      method: body.method,
      note: body.note || null,
      proofPhotoUrl: body.proofPhotoUrl || null,
      approvedById: approverId,
      approvedByName: approverName,
      approvedByPhone: approverPhone,
      billId: body.billId || null,
      status: 'active',
      offline: !!body.offline,
    },
  });

  // Customer-visible activity
  await db.activityLog.create({
    data: {
      businessId: session.bid,
      customerId: body.customerId,
      type: 'payment_confirmed',
      title: `✅ ${approverName} એ ચૂકવણી મંજૂર કરી`,
      body: `₹${body.amount} — ${body.method.toUpperCase()} — ${formatDateTimeIST(payment.approvedAt)}`,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: approverId,
      actorName: approverName,
      actorRole: 'owner',
      action: 'PAYMENT_APPROVE',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({
        customerId: body.customerId,
        amount: Number(body.amount),
        method: body.method,
        approvedAt: payment.approvedAt.toISOString(),
      }),
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}

// GET list with filters — for Approval Log tab
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const ownerId = url.searchParams.get('ownerId');
  const month = url.searchParams.get('month');
  const method = url.searchParams.get('method');

  const where: any = { businessId: session.bid, status: 'active' };
  if (ownerId) where.approvedById = ownerId;
  if (method) where.method = method;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    where.approvedAt = { gte: start, lt: end };
  }

  const payments = await db.payment.findMany({
    where,
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { approvedAt: 'desc' },
    take: 500,
  });

  return NextResponse.json({ payments });
}
