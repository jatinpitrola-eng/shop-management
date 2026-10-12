// Business branding — owner sets logo, theme color, business name, tagline.
// The theme color is then injected at runtime to override the default dairy green.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/audit';

function isValidHex(s: string | undefined | null): s is string {
  return !!s && /^#([0-9a-fA-F]{6})$/.test(s);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const business = await db.business.findUnique({ where: { id: session.bid } });
  if (!business) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ business });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN_OWNER_ONLY' }, { status: 403 });
  }
  const body = await req.json();
  const update: any = {};
  if (typeof body.businessName === 'string' && body.businessName.trim()) update.businessName = body.businessName.trim();
  if (typeof body.tagline === 'string') update.tagline = body.tagline.trim() || null;
  if (typeof body.accentEmoji === 'string') update.accentEmoji = body.accentEmoji.trim() || null;
  if (typeof body.logoUrl === 'string') update.logoUrl = body.logoUrl || null;
  if (isValidHex(body.themeColor)) update.themeColor = body.themeColor;
  if (isValidHex(body.themeColorDark)) update.themeColorDark = body.themeColorDark;
  if (typeof body.upiId === 'string') update.upiId = body.upiId || null;

  const business = await db.business.update({ where: { id: session.bid }, data: update });

  await audit({
    businessId: session.bid,
    actorId: session.uid,
    actorName: session.name,
    actorRole: session.role,
    action: 'BRANDING_UPDATE',
    entityType: 'Business',
    entityId: session.bid,
    metadata: JSON.stringify(update),
  });

  return NextResponse.json({ business });
}
