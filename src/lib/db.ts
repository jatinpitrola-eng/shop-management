import { PrismaClient } from '@prisma/client'

// When the Prisma schema changes, the globalForPrisma cache may hold a stale
// PrismaClient instance constructed against the old datamodel (which then rejects
// new fields like themeColor/tagline). Bump this hash whenever you change
// prisma/schema.prisma to force a fresh client on hot reload.
const SCHEMA_HASH = '4b0902ae4754d42889143d0f8583a327-v2'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaHash: string | undefined
}

if (globalForPrisma.prismaSchemaHash !== SCHEMA_HASH) {
  console.log('[db] schema hash changed — recreating PrismaClient', { old: globalForPrisma.prismaSchemaHash, new: SCHEMA_HASH })
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaSchemaHash = SCHEMA_HASH
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
