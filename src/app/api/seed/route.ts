// Seed a demo dairy with 2 owners (Raju, Kaju), 1 staff, 5 customers, and entries for this month.
// The first customer (Patel Bhai) gets email+password so user can test both login flows.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { istDate } from '@/lib/dates';

const SEED_BUSINESS_PHONE = '+919876543210';
const SEED_OTP = '123456';

export async function POST() {
  // Idempotent — if business exists, return its info.
  // If branding is missing on existing business (legacy), backfill it so DynamicTheme works.
  const existing = await db.business.findFirst({ where: { phone: SEED_BUSINESS_PHONE } });
  if (existing) {
    if (!existing.themeColor || !existing.tagline || !existing.accentEmoji) {
      await db.business.update({
        where: { id: existing.id },
        data: {
          themeColor: existing.themeColor || '#0B7A4B',
          tagline: existing.tagline || 'તાજું દૂધ, રોજ સવાર',
          accentEmoji: existing.accentEmoji || '🐄',
        },
      });
    }
    // If Patel Bhai exists but has no email/password yet, backfill so user can test email login
    const patel = await db.customer.findFirst({
      where: { businessId: existing.id, phone: '+919876543220' },
    });
    if (patel && (!patel.email || !patel.passwordHash)) {
      await db.customer.update({
        where: { id: patel.id },
        data: {
          email: 'patel@demo.com',
          passwordHash: await hashPassword('1234'),
        },
      });
    }
    return NextResponse.json({ businessId: existing.id, phone: SEED_BUSINESS_PHONE, devOtp: SEED_OTP });
  }

  const business = await db.business.create({
    data: {
      businessName: 'Raju & Kaju Dairy',
      phone: SEED_BUSINESS_PHONE,
      upiId: 'raju@upi',
      // Branding (default dairy theme — owner can edit in Settings → Branding)
      themeColor: '#0B7A4B',
      tagline: 'તાજું દૂધ, રોજ સવાર',
      accentEmoji: '🐄',
      logoUrl: null,
      settings: {
        create: {
          billingCycleDay: 1,
          graceDays: 10,
          roundingRule: 'none',
          dayBoundaryHour: 4,
          defaultLang: 'gu',
          products: 'milk,chhas,paneer,curd,ghee',
          whatsappReminders: 'before_due,on_due,after_grace',
          upiId: 'raju@upi',
        },
      },
    },
  });

  // Owners: Raju (super), Kaju
  const raju = await db.user.create({
    data: { businessId: business.id, name: 'Raju', phone: '+919876543210', role: 'owner', isSuper: true, active: true },
  });
  const kaju = await db.user.create({
    data: { businessId: business.id, name: 'Kaju', phone: '+919876543211', role: 'owner', isSuper: false, active: true },
  });
  const staff = await db.user.create({
    data: { businessId: business.id, name: 'Mohan (Delivery)', phone: '+919876543212', role: 'staff', active: true },
  });

  // 5 demo customers — first one (Patel Bhai) gets email+password for PWA login
  const custNames = ['Patel Bhai', 'Suresh', 'Mehta Saab', 'Anita Ben', 'Jayeshbhai'];
  const custPhones = ['+919876543220', '+919876543221', '+919876543222', '+919876543223', '+919876543224'];
  const customers = [];
  // Pre-hash Patel Bhai's password (will be reused for all demo customers — but only Patel gets email set)
  const patelPasswordHash = await hashPassword('1234');
  for (let i = 0; i < custNames.length; i++) {
    const isPatel = i === 0;
    const c = await db.customer.create({
      data: {
        businessId: business.id,
        name: custNames[i],
        phone: custPhones[i],
        address: `House ${i + 1}, Block B`,
        email: isPatel ? 'patel@demo.com' : null,
        passwordHash: isPatel ? patelPasswordHash : null,
        defaultQty: 1,
        defaultRate: 50,
        active: true,
      },
    });
    customers.push(c);
  }

  // OTP for seed login
  await db.otpCode.create({
    data: {
      businessId: business.id,
      phone: SEED_BUSINESS_PHONE,
      code: SEED_OTP,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // Add ~10 days of entries this month for first 3 customers
  const today = istDate();
  const [yy, mm, dd] = today.split('-').map(Number);
  const day = Math.min(dd, 25);
  for (let d = 1; d <= day; d++) {
    const dateStr = `${yy}-${mm}-${String(d).padStart(2, '0')}`;
    for (let ci = 0; ci < 3; ci++) {
      const c = customers[ci];
      const qty = ci === 0 ? 2 : ci === 1 ? 1.5 : 1;
      const rate = 50;
      await db.milkEntry.create({
        data: {
          businessId: business.id,
          customerId: c.id,
          enteredById: raju.id,
          date: dateStr,
          shift: 'morning',
          qtyLiters: qty,
          product: 'milk',
          ratePerUnit: rate,
          amount: qty * rate,
          status: 'active',
          enteredBy: 'Raju',
          enteredByRole: 'owner',
          clientUuid: `seed-${c.id}-${dateStr}-morning`,
        },
      }).catch(() => {});
    }
  }

  // Mark one customer's payment as paid by Kaju — proves audit log
  const c1 = customers[0];
  const amt1 = 2 * 50 * day;
  await db.payment.create({
    data: {
      businessId: business.id,
      customerId: c1.id,
      amount: Math.min(500, amt1),
      method: 'upi',
      note: 'Partial advance',
      approvedById: kaju.id,
      approvedByName: 'Kaju',
      approvedByPhone: kaju.phone,
      status: 'active',
    },
  });

  return NextResponse.json({
    businessId: business.id,
    phone: SEED_BUSINESS_PHONE,
    devOtp: SEED_OTP,
    seeded: true,
    note: 'Login with phone +91 98765 43210, OTP 123456 (auto-generated). Other test logins: Kaju +91 98765 43211, customer Patel Bhai +91 98765 43220 (OTP) OR email patel@demo.com / password 1234.',
  });
}
