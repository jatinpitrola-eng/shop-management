// Get a business's branding by businessId — used by customer app + login screen
// to render the dairy's logo + theme color dynamically.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId');
  const phone = url.searchParams.get('phone'); // alternate lookup by phone
  if (!businessId && !phone) {
    return NextResponse.json({ error: 'BID_OR_PHONE_REQUIRED' }, { status: 400 });
  }
  const where = businessId ? { id: businessId } : { phone: phone! };
  const business = await db.business.findFirst({ where });
  if (!business) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({
    businessId: business.id,
    businessName: business.businessName,
    upiId: business.upiId,
    phone: business.phone,
    logoUrl: business.logoUrl,
    themeColor: business.themeColor,
    themeColorDark: business.themeColorDark,
    tagline: business.tagline,
    accentEmoji: business.accentEmoji,
  });
}
