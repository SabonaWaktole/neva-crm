import { ITenantRepository, TenantSettingsUpdate } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { prisma } from '../../../shared/infrastructure/prisma/client';

/**
 * Every mapping goes through this one function so a new column cannot be
 * remembered in `findBySlug` and forgotten in `findAll` — which is exactly how
 * `requiresQuotationApproval` ended up being read inconsistently before.
 */
const toDomain = (data: {
  id: string;
  name: string;
  urlSlug: string;
  requiresQuotationApproval: boolean;
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  defaultLanguage: string;
  createdAt: Date;
}): Tenant =>
  Tenant.create({
    id: data.id,
    name: data.name,
    urlSlug: data.urlSlug,
    requiresQuotationApproval: data.requiresQuotationApproval,
    currency: data.currency,
    locale: data.locale,
    timezone: data.timezone,
    dateFormat: data.dateFormat,
    defaultLanguage: data.defaultLanguage,
    createdAt: data.createdAt,
  });

export class PrismaTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const data = await prisma.tenant.findUnique({ where: { id } });
    return data ? toDomain(data) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const data = await prisma.tenant.findUnique({ where: { urlSlug: slug } });
    return data ? toDomain(data) : null;
  }

  async create(tenant: Tenant): Promise<Tenant> {
    await prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        urlSlug: tenant.urlSlug,
        requiresQuotationApproval: tenant.requiresQuotationApproval,
        currency: tenant.currency,
        locale: tenant.locale,
        timezone: tenant.timezone,
        dateFormat: tenant.dateFormat,
        defaultLanguage: tenant.defaultLanguage,
        createdAt: tenant.createdAt,
      },
    });
    return tenant;
  }

  async findAll(skip: number, take: number): Promise<{ items: Tenant[]; total: number }> {
    const [records, total] = await Promise.all([
      prisma.tenant.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.tenant.count(),
    ]);

    return { items: records.map(toDomain), total };
  }

  /**
   * Only the keys actually present are written. Passing `{}` updates nothing,
   * rather than coercing absent fields to `false`/empty.
   */
  async updateSettings(id: string, settings: TenantSettingsUpdate): Promise<void> {
    const data: TenantSettingsUpdate = {};
    if (settings.name !== undefined) data.name = settings.name;
    if (settings.requiresQuotationApproval !== undefined) {
      data.requiresQuotationApproval = settings.requiresQuotationApproval;
    }
    if (settings.currency !== undefined) data.currency = settings.currency;
    if (settings.locale !== undefined) data.locale = settings.locale;
    if (settings.timezone !== undefined) data.timezone = settings.timezone;
    if (settings.dateFormat !== undefined) data.dateFormat = settings.dateFormat;
    if (settings.defaultLanguage !== undefined) data.defaultLanguage = settings.defaultLanguage;

    if (Object.keys(data).length === 0) return;

    await prisma.tenant.update({ where: { id }, data });
  }
}
