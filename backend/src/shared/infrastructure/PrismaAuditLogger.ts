import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma/client';
import { AuditLogEntry, AuditLogRecord, IAuditLogger } from '../application/ports/IAuditLogger';

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

  async findRecent(take: number): Promise<AuditLogRecord[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });

    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      actorRole: row.actorRole,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      tenantId: row.tenantId,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      createdAt: row.createdAt,
    }));
  }
}
