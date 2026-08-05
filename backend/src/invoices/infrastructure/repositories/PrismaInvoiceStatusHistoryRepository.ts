import { PrismaClient } from '@prisma/client';
import { IInvoiceStatusHistoryRepository } from '../../domain/IInvoiceStatusHistoryRepository';
import { InvoiceStatusHistory } from '../../domain/InvoiceStatusHistory';

export class PrismaInvoiceStatusHistoryRepository implements IInvoiceStatusHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceStatusHistory[]> {
    const raw = await this.prisma.invoiceStatusHistory.findMany({
      where: { tenantId, invoiceId },
      orderBy: { createdAt: 'asc' }
    });

    return raw.map((h) =>
      InvoiceStatusHistory.create({
        id: h.id,
        tenantId: h.tenantId,
        invoiceId: h.invoiceId,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedByUserId: h.changedByUserId,
        note: h.note ?? undefined
      })
    );
  }

  async save(history: InvoiceStatusHistory): Promise<void> {
    await this.prisma.invoiceStatusHistory.create({
      data: {
        id: history.id,
        tenantId: history.tenantId,
        invoiceId: history.invoiceId,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        changedByUserId: history.changedByUserId,
        note: history.note
      }
    });
  }
}
