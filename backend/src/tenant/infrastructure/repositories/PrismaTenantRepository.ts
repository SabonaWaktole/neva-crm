import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { prisma } from '../../../shared/infrastructure/prisma/client';

export class PrismaTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const data = await prisma.tenant.findUnique({ where: { id } });
    if (!data) return null;
    // Map to domain entity using reflection or bypass private constructor
    return Tenant.create(data);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const data = await prisma.tenant.findUnique({ where: { urlSlug: slug } });
    if (!data) return null;
    return Tenant.create({
      id: data.id,
      name: data.name,
      urlSlug: data.urlSlug,
      createdAt: data.createdAt
    });
  }

  async create(tenant: Tenant): Promise<Tenant> {
    await prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        urlSlug: tenant.urlSlug,
        createdAt: tenant.createdAt,
      },
    });
    return tenant;
  }

  async findAll(skip: number, take: number): Promise<{ items: Tenant[]; total: number }> {
    const [records, total] = await Promise.all([
      prisma.tenant.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.tenant.count()
    ]);
    
    return {
      items: records.map(r => Tenant.create({
        id: r.id,
        name: r.name,
        urlSlug: r.urlSlug,
        createdAt: r.createdAt
      })),
      total
    };
  }
}
