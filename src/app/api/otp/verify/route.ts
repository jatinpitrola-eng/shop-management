// Verify OTP — issue session
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, verifyOtp } from '@/lib/auth';
import { normalizePhone } from '@/lib/dates';

export async function POST(req: Request) {
  const body = await req.json();
  const phoneRaw = body?.phone as string;
  const code = body?.code as string;
  if (!phoneRaw || !code) {
    return NextResponse.json({ error: 'PHONE_OTP_REQUIRED' }, { status: 400 });
  }
  const phone = normalizePhone(phoneRaw);

  const user = await db.user.findFirst({
    where: { phone, active: true },
    include: { business: true },
  });

  let bid = user?.businessId || '';
  let customerId: string | undefined;

  if (!user) {
    // Could be a customer logging in by phone
    const customer = await db.customer.findFirst({
      where: { phone, active: true },
    });
    if (!customer) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    bid = customer.businessId;
    customerId = customer.id;
  }

  const ok = await verifyOtp(bid, phone, code);
  if (!ok) {
    return NextResponse.json({ error: 'INVALID_OTP' }, { status: 400 });
  }

  const role: 'owner' | 'staff' | 'customer' = user ? (user.role as any) : 'customer';
  const name = user?.name || (await db.customer.findFirst({ where: { phone } }))?.name || '';

  await createSession({
    bid,
    uid: user?.id || '',
    cid: customerId,
    role,
    name,
    phone,
  });

  return NextResponse.json({
    role,
    name,
    businessId: bid,
    customerId,
  });
}
