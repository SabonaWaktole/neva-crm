import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import { IPlatformSettingsRepository } from '../domain/IPlatformSettingsRepository';
import { PlatformSettings, PlatformSettingsPatch } from '../domain/PlatformSettings';

/** Fixed row id — see the schema comment on `PlatformSettings` for why this is a genuine singleton. */
const SINGLETON_ID = 'platform';

export class PrismaPlatformSettingsRepository implements IPlatformSettingsRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async get(): Promise<PlatformSettings> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: SINGLETON_ID } });
    return row ? PlatformSettings.fromPersistence(row) : PlatformSettings.defaults();
  }

  /**
   * Validates against the CURRENT stored state, not against an empty one — a
   * patch of just `{ currency: 'EUR' }` is checked as "defaults with currency
   * swapped to EUR", the same way `NotificationSettings.withPatch` works. The
   * upsert then writes the full resulting record either way, so a first-ever
   * save (no row yet) and a subsequent edit look identical to the database.
   */
  async save(patch: PlatformSettingsPatch): Promise<PlatformSettings> {
    const current = await this.get();
    const next = current.withPatch(patch);

    const data = {
      requiresQuotationApproval: next.requiresQuotationApproval,
      currency: next.currency,
      locale: next.locale,
      timezone: next.timezone,
      dateFormat: next.dateFormat,
      defaultLanguage: next.defaultLanguage,
    };

    const saved = await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });

    return PlatformSettings.fromPersistence(saved);
  }
}
