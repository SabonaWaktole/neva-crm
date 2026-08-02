import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma/client';
import { AuditLogEntry, IAuditLogger } from '../application/ports/IAuditLogger';

export class PrismaAuditLogger implements IAuditLogger {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        actorUserId: entry.actorUserId,
        actorRole: entry.actorRole,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        tenantId: entry.tenantId ?? null,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }
}
