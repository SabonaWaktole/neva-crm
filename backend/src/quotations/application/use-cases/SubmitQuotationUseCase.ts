import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { IQuotationWriteTransaction } from '../ports/IQuotationWriteTransaction';
import { NotificationService } from '../../../notifications/application/NotificationService';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { quotationReference } from '../../domain/quotationReference';

export class SubmitQuotationUseCase {
  constructor(
    private writeTx: IQuotationWriteTransaction,
    private userRepo: IUserRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
    requiresQuotationApproval: boolean;
  }) {
    return this.writeTx.run(async (repos) => {
      const quotation = await repos.quotationRepo.findById(input.tenantId, input.quotationId);
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      if (input.actingUserRole === UserRole.STAFF && quotation.createdByUserId !== input.actingUserId) {
        throw new Error('Unauthorized: Staff can only act on their own quotations');
      }

      const fromStatus = quotation.status;
      quotation.submit({ requiresApproval: input.requiresQuotationApproval });

      const history = QuotationStatusHistory.create({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        quotationId: input.quotationId,
        fromStatus,
        toStatus: quotation.status,
        changedByUserId: input.actingUserId
      });

      await repos.quotationRepo.save(quotation);
      await repos.historyRepo.save(history);

      /*
       * Only PENDING_APPROVAL produces a notification. `submit` resolves to
       * either that or SENT depending on the tenant's approval setting, and a
       * quotation that went straight out needs nobody's attention — notifying
       * on both would make the bell meaningless for tenants who do not use
       * approvals at all.
       *
       * Inside the transaction on purpose: this notification is the only thing
       * telling an owner there is work waiting, so it must not survive a
       * rolled-back submit, nor be lost when the submit succeeds.
       */
      if (quotation.status === 'PENDING_APPROVAL') {
        const notifications = new NotificationService(repos.notificationRepo, this.userRepo);
        await notifications.emit({
          tenantId: input.tenantId,
          toRole: UserRole.BUSINESS_OWNER,
          type: 'QUOTATION_SUBMITTED_FOR_APPROVAL',
          // Snapshot: the reference as shown on the quotation page.
          params: { reference: quotationReference(quotation.id) },
          actorUserId: input.actingUserId,
          entityType: 'QUOTATION',
          entityId: quotation.id,
        });
      }

      return { quotation };
    });
  }
}
