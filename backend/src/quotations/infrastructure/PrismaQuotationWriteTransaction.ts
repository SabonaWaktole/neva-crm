import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import {
  IQuotationWriteTransaction,
  QuotationWriteRepos,
} from '../application/ports/IQuotationWriteTransaction';
import { PrismaQuotationRepository } from './repositories/PrismaQuotationRepository';
import { PrismaQuotationStatusHistoryRepository } from './repositories/PrismaQuotationStatusHistoryRepository';
import { PrismaNotificationRepository } from '../../notifications/infrastructure/PrismaNotificationRepository';

export class PrismaQuotationWriteTransaction implements IQuotationWriteTransaction {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async run<T>(work: (repos: QuotationWriteRepos) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      /*
       * The repositories are constructed HERE, bound to `tx`, rather than
       * injected. That is the whole difference between this and
       * `PrismaUnitOfWork`: repositories built against the global client would
       * run outside the transaction no matter what wrapper surrounded them.
       *
       * `tx` is a Prisma.TransactionClient — the same model delegates minus
       * `$transaction` and `$connect`, neither of which these repositories
       * call. The cast is narrow and deliberate.
       */
      const client = tx as unknown as PrismaClient;
      return work({
        quotationRepo: new PrismaQuotationRepository(client),
        historyRepo: new PrismaQuotationStatusHistoryRepository(client),
        notificationRepo: new PrismaNotificationRepository(client),
      });
    });
  }
}
