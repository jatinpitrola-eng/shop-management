// Activity feed — owner & customer
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');

  const where: any = { businessId: session.bid };
  if (session.role === 'customer') {
    where.customerId = session.cid;
  } else if (customerId) {
    where.customerId = customerId;
  }

  const activities = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ activities });
}

// "I have paid" — customer notifies owner (does NOT mark paid)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'customer') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = await req.json();
  const amount = Number(body?.amount || 0);
  const method = body?.method || 'upi';
  // Activity for owner — no Payment record created (only owner approval marks paid)
  await db.activityLog.create({
    data: {
      businessId: session.bid,
      customerId: session.cid,
      type: 'payment_pending',
      title: `⏳ ${session.name} એ ${method.toUpperCase()} થી ₹${amount} ચંકવ્યાની જાણ કરી`,
      body: `Method: ${method} • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    },
  });
  return NextResponse.json({ notified: true });
}
