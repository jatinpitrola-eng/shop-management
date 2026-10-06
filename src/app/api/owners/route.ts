// Add another owner (e.g., Raju and Kaju). Owner can also add staff.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateOtp, isDevMode, getDevOtp } from '@/lib/auth';
import { normalizePhone } from '@/lib/dates';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const users = await db.user.findMany({
    where: { businessId: session.bid },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = await req.json();
  const name = body?.name as string;
  const phoneRaw = body?.phone as string;
  const role = (body?.role as 'owner' | 'staff') || 'staff';
  if (!name || !phoneRaw) {
    return NextResponse.json({ error: 'NAME_PHONE_REQUIRED' }, { status: 400 });
  }
  const phone = normalizePhone(phoneRaw);
  const exists = await db.user.findFirst({ where: { businessId: session.bid, phone } });
  if (exists) {
    return NextResponse.json({ error: 'ALREADY_EXISTS' }, { status: 400 });
  }
  const user = await db.user.create({
    data: {
      businessId: session.bid,
      name,
      phone,
      role,
      active: true,
    },
  });
  // Send OTP for them to login (just generate; in prod SMS gateway)
  const code = generateOtp();
  await db.otpCode.create({
    data: {
      businessId: session.bid,
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: role === 'owner' ? 'OWNER_ADD' : 'STAFF_ADD',
      entityType: 'User',
      entityId: user.id,
      metadata: JSON.stringify({ name, phone, role }),
    },
  });
  return NextResponse.json({
    user,
    otpSent: true,
    devMode: isDevMode(),
    devOtp: isDevMode() ? getDevOtp() : undefined,
  });
}
