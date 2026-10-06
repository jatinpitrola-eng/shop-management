// Request OTP for customer login (existing business)
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOtp, isDevMode, getDevOtp } from '@/lib/auth';
import { normalizePhone } from '@/lib/dates';

export async function POST(req: Request) {
  const body = await req.json();
  const phoneRaw = body?.phone as string;
  if (!phoneRaw) {
    return NextResponse.json({ error: 'PHONE_REQUIRED' }, { status: 400 });
  }
  const phone = normalizePhone(phoneRaw);

  const user = await db.user.findFirst({ where: { phone, active: true } });
  let bid = user?.businessId;

  if (!bid) {
    const customer = await db.customer.findFirst({ where: { phone, active: true } });
    if (!customer) {
      // No user/customer with this phone — direct them to create-business flow
      return NextResponse.json({ error: 'NOT_FOUND', needsRegister: true }, { status: 404 });
    }
    bid = customer.businessId;
  }

  const code = generateOtp();
  await db.otpCode.create({
    data: {
      businessId: bid,
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json({
    otpSent: true,
    businessId: bid,
    devMode: isDevMode(),
    devOtp: isDevMode() ? getDevOtp() : undefined,
  });
}
