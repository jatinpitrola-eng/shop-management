// Business settings — grace days, billing cycle day, rounding, UPI ID, etc.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const settings = await db.settings.findUnique({ where: { businessId: session.bid } });
  const business = await db.business.findUnique({ where: { id: session.bid } });
  return NextResponse.json({ settings, business });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = await req.json();
  const update: any = {};
  for (const key of [
    'billingCycleDay',
    'graceDays',
    'roundingRule',
    'dayBoundaryHour',
    'whatsappReminders',
    'defaultLang',
    'upiId',
    'products',
    'reminderTemplateGu',
    'reminderTemplateEn',
  ]) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const settings = await db.settings.upsert({
    where: { businessId: session.bid },
    update,
    create: { businessId: session.bid, ...update },
  });

  // Business name update
  if (body.businessName) {
    await db.business.update({ where: { id: session.bid }, data: { businessName: body.businessName } });
  }
  if (body.upiId !== undefined) {
    await db.business.update({ where: { id: session.bid }, data: { upiId: body.upiId } });
  }

  await db.auditLog.create({
    data: {
      businessId: session.bid,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'SETTINGS_UPDATE',
      entityType: 'Settings',
      entityId: session.bid,
      metadata: JSON.stringify(update),
    },
  });

  return NextResponse.json({ settings });
}
