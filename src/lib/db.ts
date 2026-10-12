import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __schemaApplied: boolean
}

// Auto-apply schema on cold start using raw SQL CREATE TABLE IF NOT EXISTS.
// This works on Vercel serverless (no external prisma binary needed) and
// ensures tables exist before any query runs. SQLite per-instance on Vercel
// means data won't persist across cold starts — use for demo only.
// For production, set DATABASE_URL to a real Postgres (Neon / Supabase).
async function applySchemaIfFresh() {
  if (globalForPrisma.__schemaApplied) return
  globalForPrisma.__schemaApplied = true
  const client = globalForPrisma.prisma ?? new PrismaClient()
  try {
    // Raw SQL CREATE TABLE IF NOT EXISTS — matches prisma schema
    const stmts = [
      `CREATE TABLE IF NOT EXISTS "Business" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessName" TEXT NOT NULL,
        "upiId" TEXT,
        "phone" TEXT,
        "logoUrl" TEXT,
        "themeColor" TEXT,
        "themeColorDark" TEXT,
        "tagline" TEXT,
        "accentEmoji" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'owner',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "isSuper" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "address" TEXT,
        "email" TEXT,
        "passwordHash" TEXT,
        "defaultQty" REAL NOT NULL DEFAULT 1,
        "defaultRate" REAL NOT NULL DEFAULT 50,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "joinedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "MilkEntry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "enteredById" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "shift" TEXT NOT NULL,
        "qtyLiters" REAL NOT NULL,
        "product" TEXT NOT NULL,
        "ratePerUnit" REAL NOT NULL,
        "amount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "reversedByEntryId" TEXT,
        "reversalReason" TEXT,
        "enteredBy" TEXT NOT NULL,
        "enteredByRole" TEXT NOT NULL,
        "offline" BOOLEAN NOT NULL DEFAULT false,
        "clientUuid" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
        FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Vacation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "fromDate" TEXT NOT NULL,
        "toDate" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'approved',
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "RateChange" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT,
        "product" TEXT NOT NULL,
        "newRate" REAL NOT NULL,
        "effectiveFrom" TEXT NOT NULL,
        "changedById" TEXT NOT NULL,
        "changedBy" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
        FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "method" TEXT NOT NULL,
        "note" TEXT,
        "proofPhotoUrl" TEXT,
        "approvedById" TEXT NOT NULL,
        "approvedByName" TEXT NOT NULL,
        "approvedByPhone" TEXT,
        "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "billId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "reversalReason" TEXT,
        "offline" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
        FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Bill" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "billMonth" TEXT NOT NULL,
        "totalLiters" REAL NOT NULL,
        "totalAmount" REAL NOT NULL,
        "paidAmount" REAL NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'generated',
        "roundingRule" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Settings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
        "graceDays" INTEGER NOT NULL DEFAULT 10,
        "roundingRule" TEXT NOT NULL DEFAULT 'none',
        "dayBoundaryHour" INTEGER NOT NULL DEFAULT 4,
        "whatsappReminders" TEXT NOT NULL DEFAULT 'before_due,on_due,after_grace',
        "defaultLang" TEXT NOT NULL DEFAULT 'gu',
        "upiId" TEXT,
        "products" TEXT NOT NULL DEFAULT 'milk,chhas,paneer,curd,ghee',
        "reminderTemplateGu" TEXT,
        "reminderTemplateEn" TEXT,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "OtpCode" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "consumed" BOOLEAN NOT NULL DEFAULT false,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "actorId" TEXT,
        "actorName" TEXT NOT NULL,
        "actorRole" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT,
        "metadata" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "ActivityLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT,
        "userId" TEXT,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT,
        "readStatus" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
      )`,
      // Unique indexes (IF NOT EXISTS)
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_businessId_phone_key" ON "User"("businessId", "phone")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_phone_key" ON "Customer"("businessId", "phone")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Settings_businessId_key" ON "Settings"("businessId")`,
      // Performance indexes
      `CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone")`,
      `CREATE INDEX IF NOT EXISTS "Customer_businessId_idx" ON "Customer"("businessId")`,
      `CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email")`,
      `CREATE INDEX IF NOT EXISTS "MilkEntry_businessId_date_idx" ON "MilkEntry"("businessId", "date")`,
      `CREATE INDEX IF NOT EXISTS "MilkEntry_customerId_date_idx" ON "MilkEntry"("customerId", "date")`,
      `CREATE INDEX IF NOT EXISTS "Vacation_customerId_idx" ON "Vacation"("customerId")`,
      `CREATE INDEX IF NOT EXISTS "RateChange_businessId_product_idx" ON "RateChange"("businessId", "product")`,
      `CREATE INDEX IF NOT EXISTS "Payment_businessId_approvedAt_idx" ON "Payment"("businessId", "approvedAt")`,
      `CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" ON "Payment"("customerId")`,
      `CREATE INDEX IF NOT EXISTS "Bill_businessId_billMonth_idx" ON "Bill"("businessId", "billMonth")`,
      `CREATE INDEX IF NOT EXISTS "Bill_customerId_idx" ON "Bill"("customerId")`,
      `CREATE INDEX IF NOT EXISTS "OtpCode_businessId_phone_idx" ON "OtpCode"("businessId", "phone")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "ActivityLog_businessId_customerId_idx" ON "ActivityLog"("businessId", "customerId")`,
      `CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId")`,
    ]
    for (const sql of stmts) {
      await client.$executeRawUnsafe(sql)
    }
  } catch (e) {
    // Best-effort — surface via console but don't block init
    console.error('[db] schema apply failed:', e instanceof Error ? e.message : e)
  }
  globalForPrisma.prisma = client
}

// Apply schema on first import (cold start)
void applySchemaIfFresh()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
