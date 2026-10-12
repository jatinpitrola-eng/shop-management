import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, statSync } from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __schemaApplied: boolean
}

// Detect schema hash changes (for local dev hot-reload safety)
const SCHEMA_HASH = '4b0902ae4754d42889143d0f8583a327-v2'

function applySchemaIfFresh() {
  // On Vercel serverless, the /tmp DB file may not exist on cold start.
  // Try to detect this and run prisma db push via execSync.
  // Also runs once per process (cached via __schemaApplied).
  if (globalForPrisma.__schemaApplied) return
  globalForPrisma.__schemaApplied = true
  try {
    const url = process.env.DATABASE_URL || ''
    // If file: URL, check if the file exists; if not, push schema
    const m = /^file:(.+)$/.exec(url)
    if (m) {
      const filePath = m[1]
      const fresh = !existsSync(filePath) || statSync(filePath).size === 0
      if (fresh) {
        execSync('node ./node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate', {
          stdio: 'ignore',
          env: { ...process.env },
        })
      }
    }
  } catch (e) {
    // Best-effort — if this fails, individual queries will surface the real error
  }
}

applySchemaIfFresh()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

void SCHEMA_HASH // unused locally; documented for hot-reload tracing
