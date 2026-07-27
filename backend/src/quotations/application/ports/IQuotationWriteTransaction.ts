import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { INotificationRepository } from '../../../notifications/domain/INotificationRepository';

/** The repositories a status transition writes through, all on one connection. */
export interface QuotationWriteRepos {
  quotationRepo: IQuotationRepository;
  historyRepo: IQuotationStatusHistoryRepository;
  notificationRepo: INotificationRepository;
}

/**
 * Runs the writes of a quotation status transition atomically.
 *
 * Every transition previously ended with two independent awaits —
 * `save(quotation)` then `save(history)` — so a failure between them left the
 * quotation in a state its own history did not record. Adding notifications
 * would have made that a third independent write.
 *
 * **This exists instead of `IUnitOfWork` deliberately.** `PrismaUnitOfWork`
 * opens a `$transaction` but hands the work no transaction client, and the
 * repositories inside it keep using the global one — so nothing actually joins
 * the transaction. Its own source comment says as much ("in a real
 * implementation, you'd pass `tx` down to repositories"). Wrapping these six
 * use cases in it would have produced the appearance of atomicity with none of
 * the substance, which is worse than the honest gap it replaced. See TD-032.
 *
 * This port hands the caller repositories bound to the transaction, so the
 * guarantee is real.
 */
export interface IQuotationWriteTransaction {
  run<T>(work: (repos: QuotationWriteRepos) => Promise<T>): Promise<T>;
}
