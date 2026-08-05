import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import {
  IInvoiceWriteTransaction,
  InvoiceWriteRepos,
} from '../application/ports/IInvoiceWriteTransaction';
import { PrismaInvoiceRepository } from './repositories/PrismaInvoiceRepository';
import { PrismaInvoiceLineItemRepository } from './repositories/PrismaInvoiceLineItemRepository';
import { PrismaInvoiceStatusHistoryRepository } from './repositories/PrismaInvoiceStatusHistoryRepository';

export class PrismaInvoiceWriteTransaction implements IInvoiceWriteTransaction {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async run<T>(work: (repos: InvoiceWriteRepos) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // Same narrow, deliberate cast as PrismaQuotationWriteTransaction — `tx`
      // is a Prisma.TransactionClient, missing only `$transaction`/`$connect`,
      // neither of which these repositories call.
      const client = tx as unknown as PrismaClient;
      return work({
        invoiceRepo: new PrismaInvoiceRepository(client),
        lineItemRepo: new PrismaInvoiceLineItemRepository(client),
        historyRepo: new PrismaInvoiceStatusHistoryRepository(client),
      });
    });
  }
}
