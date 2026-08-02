export interface AuditLogEntry {
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only record of platform-administrative actions.
 *
 * Deliberately not best-effort like `ITenantMediaCleaner` — a mutation whose
 * audit entry silently failed to write is an audit trail with a hole in it,
 * which defeats the trail's purpose. Callers `await` this like any other
 * write and let a failure here fail the whole request.
 */
export interface IAuditLogger {
  record(entry: AuditLogEntry): Promise<void>;
}
