import { PrismaClient } from '@prisma/client';
import { Integration, IntegrationStatus } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export class PrismaIntegrationRepository implements IIntegrationRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToDomain(record: any): Integration {
    return new Integration({
      id: record.id,
      tenantId: record.tenantId,
      provider: record.provider,
      status: record.status as IntegrationStatus,
      config: record.config ? (record.config as Record<string, any>) : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async findByTenantId(tenantId: string): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: { tenantId },
    });
    return records.map(r => this.mapToDomain(r));
  }

  async findByProvider(tenantId: string, provider: string): Promise<Integration | null> {
    const record = await this.prisma.integration.findUnique({
      where: {
        tenantId_provider: { tenantId, provider },
      },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async save(integration: Integration): Promise<void> {
    await this.prisma.integration.upsert({
      where: { id: integration.id },
      create: {
        id: integration.id,
        tenantId: integration.tenantId,
        provider: integration.provider,
        status: integration.status,
        config: integration.config ?? undefined,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
      update: {
        status: integration.status,
        config: integration.config ?? undefined,
        updatedAt: integration.updatedAt,
      },
    });
  }
}
