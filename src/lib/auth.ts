// Shop Management by Nexoryos — auth helper
// OTP-only OR email+password (for customers). Session via signed cookie.
// Dev OTP = 123456 when DEV_MODE flag is on.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'shopm_session';
const SESSION_DAYS = 30;
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'shopm-dev-secret-please-change-in-production-9f8a7c'
);
const DEV_MODE = process.env.DEV_MODE !== 'false'; // default ON for dev
const DEV_OTP = '123456';

export interface SessionPayload {
  bid: string; // businessId
  uid: string; // userId (for owner/staff)
  cid?: string; // customerId (for customer)
  role: 'owner' | 'staff' | 'customer';
  name: string;
  phone: string;
}

export function isDevMode(): boolean {
  return DEV_MODE;
}

export function getDevOtp(): string {
  return DEV_OTP;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);

  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const c = await cookies();
    const token = c.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

export async function requireOwner(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  if (s.role !== 'owner') throw new Error('FORBIDDEN_OWNER_ONLY');
  return s;
}

export async function requireStaff(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  if (s.role !== 'owner' && s.role !== 'staff') throw new Error('FORBIDDEN_STAFF_ONLY');
  return s;
}

export async function requireCustomer(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s || s.role !== 'customer') throw new Error('UNAUTHORIZED');
  return s;
}

export async function verifyOtp(businessId: string, phone: string, code: string): Promise<boolean> {
  if (DEV_MODE && code === DEV_OTP) return true;
  const record = await db.otpCode.findFirst({
    where: {
      businessId,
      phone,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return false;
  if (record.attempts >= 5) return false;
  if (record.code !== code) {
    await db.otpCode.update({ where: { id: record.id }, data: { attempts: record.attempts + 1 } });
    return false;
  }
  await db.otpCode.update({ where: { id: record.id }, data: { consumed: true } });
  return true;
}

/// Hash a password using bcrypt (10 rounds).
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/// Verify a plain-text password against the stored bcrypt hash.
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
