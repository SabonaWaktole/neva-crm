import { PrismaClient } from '@prisma/client';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';

export class PrismaQuotationStatusHistoryRepository implements IQuotationStatusHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findByQuotationId(tenantId: string, quotationId: string): Promise<QuotationStatusHistory[]> {
    const raw = await this.prisma.quotationStatusHistory.findMany({
      where: {
        tenantId,
        quotationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return raw.map(h => QuotationStatusHistory.create({
      id: h.id,
      tenantId: h.tenantId,
      quotationId: h.quotationId,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedByUserId: h.changedByUserId,
      note: h.note ?? undefined
    }));
  }

  async save(history: QuotationStatusHistory): Promise<void> {
    await this.prisma.quotationStatusHistory.create({
      data: {
        id: history.id,
        tenantId: history.tenantId,
        quotationId: history.quotationId,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        changedByUserId: history.changedByUserId,
        note: history.note
      }
    });
  }
}
