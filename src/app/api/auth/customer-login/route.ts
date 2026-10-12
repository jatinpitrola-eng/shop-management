// Customer email + password login — alternative to phone+OTP.
// Looks up customer by email across all businesses, verifies bcrypt hash.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const email = (body?.email as string)?.trim().toLowerCase();
  const password = (body?.password as string) || '';

  if (!email || !password) {
    return NextResponse.json({ error: 'EMAIL_PASSWORD_REQUIRED' }, { status: 400 });
  }

  // Find customer by email (any business — multi-tenant but email is unique per business)
  const customer = await db.customer.findFirst({
    where: { email, active: true },
    include: { business: true },
  });
  if (!customer || !customer.passwordHash) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const ok = await verifyPassword(password, customer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 400 });
  }

  await createSession({
    bid: customer.businessId,
    cid: customer.id,
    role: 'customer',
    name: customer.name,
    phone: customer.phone,
  });

  return NextResponse.json({
    role: 'customer',
    name: customer.name,
    businessId: customer.businessId,
    customerId: customer.id,
  });
}
