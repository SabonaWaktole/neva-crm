import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { IStockLevelRepository, IStockTransactionManager } from '../../../inventory/domain/repositories';
import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';
import { StockMovement, StockMovementType } from '../../../inventory/domain/StockMovement';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { IQuotationWriteTransaction } from '../ports/IQuotationWriteTransaction';
import { NotificationService } from '../../../notifications/application/NotificationService';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { quotationReference } from '../../domain/quotationReference';

export class MarkQuotationAcceptedUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private lineItemRepo: IQuotationLineItemRepository,
    private historyRepo: IQuotationStatusHistoryRepository,
    private stockLevelRepo: IStockLevelRepository,
    private transactionManager: IStockTransactionManager,
    private writeTx: IQuotationWriteTransaction,
    private userRepo: IUserRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
  }) {
    const quotation = await this.quotationRepo.findById(input.tenantId, input.quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (input.actingUserRole === UserRole.STAFF && quotation.createdByUserId !== input.actingUserId) {
      throw new Error('Unauthorized: Staff can only act on their own quotations');
    }

    const fromStatus = quotation.status;
    quotation.accept(); // Throws if not Sent

    const lineItems = await this.lineItemRepo.findByQuotationId(input.tenantId, input.quotationId);

    // Pre-validate all stock levels
    for (const li of lineItems) {
      const stock = await this.stockLevelRepo.findByProductAndWarehouse(input.tenantId, li.productId, li.warehouseId);
      if (!stock) {
        throw new Error(`Stock level not found for product ${li.productId} at warehouse ${li.warehouseId}`);
      }
      if (stock.quantity < li.quantity) {
        throw new Error(`Insufficient stock for product ${li.productId} at warehouse ${li.warehouseId}`);
      }
    }

    await this.transactionManager.executeTransaction(async (repos) => {
      for (const li of lineItems) {
        const stock = await repos.stockLevelRepository.findByProductAndWarehouse(input.tenantId, li.productId, li.warehouseId);
        if (!stock) {
          throw new Error(`Stock level not found for product ${li.productId} at warehouse ${li.warehouseId}`);
        }

        // Deduct stock
        stock.quantity -= li.quantity;
        await repos.stockLevelRepository.save(stock);

        // Record stock movement (ADJUSTMENT negative)
        const movement = StockMovement.create({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          productId: li.productId,
          warehouseId: li.warehouseId,
          quantity: -li.quantity,
          type: StockMovementType.ADJUSTMENT,
          reason: `Quotation ${input.quotationId} accepted`,
          createdBy: input.actingUserId
        });
        await repos.stockMovementRepository.save(movement);
      }
    });

    const history = QuotationStatusHistory.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      quotationId: input.quotationId,
      fromStatus,
      toStatus: quotation.status,
      changedByUserId: input.actingUserId
    });

    /*
     * Quotation, history and notification commit together.
     *
     * The stock deduction above stays in its OWN transaction, sequentially,
     * exactly as before. Prisma rejects a nested interactive transaction, and
     * merging the two would mean rewriting the stock path — a change to
     * inventory correctness that has no business riding along with a
     * notification feature. So the pre-existing boundary between "stock moved"
     * and "quotation marked accepted" is unchanged; what is fixed is the
     * boundary *within* the quotation writes, which used to be two independent
     * awaits. Noted in TD-032.
     */
    await this.writeTx.run(async (repos) => {
      await repos.quotationRepo.save(quotation);
      await repos.historyRepo.save(history);

      const notifications = new NotificationService(repos.notificationRepo, this.userRepo);
      await notifications.emit({
        tenantId: input.tenantId,
        recipientUserIds: [quotation.createdByUserId],
        type: 'QUOTATION_ACCEPTED',
        params: { reference: quotationReference(quotation.id) },
        actorUserId: input.actingUserId,
        entityType: 'QUOTATION',
        entityId: quotation.id,
      });
    });

    return { quotation };
  }
}
