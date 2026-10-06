// Shop Management by Nexoryos — bootstrap a business on first owner login.
// If business doesn't exist for this phone, create it; user becomes super owner.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, generateOtp, isDevMode, getDevOtp } from '@/lib/auth';
import { normalizePhone } from '@/lib/dates';

export async function POST(req: Request) {
  const body = await req.json();
  const phoneRaw = body?.phone as string;
  const name = body?.name as string | undefined;
  if (!phoneRaw) {
    return NextResponse.json({ error: 'PHONE_REQUIRED' }, { status: 400 });
  }
  const phone = normalizePhone(phoneRaw);

  // Find existing user with this phone (across all businesses — phone is unique per business)
  const existingUser = await db.user.findFirst({
    where: { phone, active: true },
    include: { business: true },
  });

  let bid: string;
  let userName: string;
  let userRole: 'owner' | 'staff' = 'owner';
  let isSuper = false;

  if (existingUser) {
    bid = existingUser.businessId;
    userName = existingUser.name;
    userRole = existingUser.role as 'owner' | 'staff';
    isSuper = existingUser.isSuper;
  } else {
    // First-time owner — create business + super owner
    const businessName = name ? `${name}'s Dairy` : 'My Dairy';
    const business = await db.business.create({
      data: {
        businessName,
        phone,
        settings: {
          create: {
            billingCycleDay: 1,
            graceDays: 10,
            roundingRule: 'none',
            dayBoundaryHour: 4,
            defaultLang: 'gu',
            products: 'milk,chhas,paneer,curd,ghee',
          },
        },
      },
    });
    bid = business.id;
    userName = name || 'Owner';
    isSuper = true;
    await db.user.create({
      data: {
        businessId: bid,
        name: userName,
        phone,
        role: 'owner',
        active: true,
        isSuper,
      },
    });
  }

  // Generate OTP
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
    businessId: bid,
    name: userName,
    role: userRole,
    isSuper,
    devMode: isDevMode(),
    devOtp: isDevMode() ? getDevOtp() : undefined,
    otpSent: true,
  });
}
