// Audit log helper — used across API routes
import { db } from './db';

interface AuditParams {
  businessId: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: string;
}

export async function audit(p: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        businessId: p.businessId,
        actorId: p.actorId || null,
        actorName: p.actorName,
        actorRole: p.actorRole,
        action: p.action,
        entityType: p.entityType,
        entityId: p.entityId || null,
        metadata: p.metadata || null,
      },
    });
  } catch (e) {
    // Audit failure should never break the main request
    console.error('audit log failed:', e);
  }
}
