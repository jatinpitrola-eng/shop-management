// Owner: add a customer (name + phone + email + password) → customer can install PWA + login
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, requireOwner } from '@/lib/auth';
import { normalizePhone } from '@/lib/dates';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = await req.json();
  const name = body?.name as string;
  const phoneRaw = body?.phone as string;
  if (!name || !phoneRaw) {
    return NextResponse.json({ error: 'NAME_PHONE_REQUIRED' }, { status: 400 });
  }
  const phone = normalizePhone(phoneRaw);
  const address = body?.address as string | undefined;
  const defaultQty = Number(body?.defaultQty ?? 1);
  const defaultRate = Number(body?.defaultRate ?? 50);
  const email = (body?.email as string | undefined)?.trim().toLowerCase() || null;
  const password = body?.password as string | undefined;

  // Hash password if provided
  let passwordHash: string | null = null;
  if (password && password.length >= 4) {
    passwordHash = await hashPassword(password);
  }

  // If email provided, check uniqueness within business
  if (email) {
    const existsEmail = await db.customer.findFirst({ where: { businessId: session.bid, email } });
    if (existsEmail) {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 400 });
    }
  }

  const customer = await db.customer.create({
    data: {
      businessId: session.bid,
      name,
      phone,
      address: address || null,
      email,
      passwordHash,
      defaultQty,
      defaultRate,
      active: true,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'CUSTOMER_ADD',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: JSON.stringify({ name, phone, email: !!email, password: !!password }),
    },
  });

  return NextResponse.json({ customer });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const customers = await db.customer.findMany({
    where: { businessId: session.bid },
    orderBy: { name: 'asc' },
  });
  // Don't expose passwordHash
  const safe = customers.map(c => ({ ...c, passwordHash: c.passwordHash ? '[set]' : null }));
  return NextResponse.json({ customers: safe });
}
