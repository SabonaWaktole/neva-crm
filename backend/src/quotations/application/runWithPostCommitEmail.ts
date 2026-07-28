import { Notification } from '../../notifications/domain/Notification';
import { IQuotationWriteTransaction, QuotationWriteRepos } from './ports/IQuotationWriteTransaction';

/** The slice of NotificationEmailDispatcher these use cases depend on. */
export interface IPostCommitEmailDispatcher {
  dispatch(notifications: Notification[]): Promise<void>;
}

/**
 * Runs a quotation transition, then emails about it — in that order.
 *
 * Every quotation status change writes the quotation, its history row and its
 * notifications inside one transaction (see IQuotationWriteTransaction). Email
 * cannot join that transaction: an SMTP call would hold a database connection
 * open across a third-party network round trip, and a message that has left the
 * building cannot be rolled back with the rest of the unit of work.
 *
 * So the notifications a transition produced are collected during the
 * transaction and dispatched only once it has committed. If the transaction
 * throws, `dispatch` is never reached and no mail goes out about a change that
 * did not happen. If the dispatch fails, the transition still stands — the
 * dispatcher is best-effort by contract and swallows its own errors.
 *
 * The alternative — emitting email from inside `NotificationService.emit` —
 * would have been one line and wrong in exactly the case that matters most:
 * a quotation acceptance that fails on the stock deduction after the
 * notification was written.
 */
export async function runWithPostCommitEmail<T>(
  writeTx: IQuotationWriteTransaction,
  dispatcher: IPostCommitEmailDispatcher | undefined,
  work: (repos: QuotationWriteRepos, notify: (emitted: Notification[]) => void) => Promise<T>
): Promise<T> {
  const pending: Notification[] = [];

  const result = await writeTx.run((repos) =>
    work(repos, (emitted) => {
      pending.push(...emitted);
    })
  );

  await dispatcher?.dispatch(pending);
  return result;
}
