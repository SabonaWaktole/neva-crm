import { ScheduledJob } from '../Scheduler';
import { ISchedulerQueries } from '../ISchedulerQueries';
import { MarkInvoiceOverdueUseCase } from '../../invoices/application/use-cases/MarkInvoiceOverdueUseCase';

/**
 * Automatic invoice overdue detection.
 *
 * Simpler than `QuotationExpiryJob`: there is no per-tenant opt-in setting to
 * check first — an overdue invoice is a fact about the calendar, not a
 * destructive action a tenant needs to have switched on. So this just sweeps
 * every tenant's Sent invoices whose due date has passed and flips them,
 * unconditionally.
 *
 * Goes through `MarkInvoiceOverdueUseCase` rather than a direct UPDATE for
 * the same reason `QuotationExpiryJob` goes through `ExpireQuotationUseCase`:
 * the use case owns the transition guard and the status-history row, so an
 * Overdue invoice's own history can always explain how it got there.
 */
export class InvoiceOverdueJob implements ScheduledJob {
  readonly name = 'invoice-overdue';
  readonly intervalMs = 60 * 60_000;

  constructor(
    private readonly queries: ISchedulerQueries,
    private readonly markInvoiceOverdue: MarkInvoiceOverdueUseCase
  ) {}

  async run(now: Date): Promise<string> {
    const pastDue = await this.queries.findInvoicesPastDue(now);
    let flipped = 0;

    for (const invoice of pastDue) {
      try {
        await this.markInvoiceOverdue.execute({
          tenantId: invoice.tenantId,
          invoiceId: invoice.id,
        });
        flipped += 1;
      } catch (error) {
        /*
         * Per-invoice isolation. The likely failure is a race — the invoice
         * was paid or voided between the sweep's SELECT and this call, so
         * `markOverdue()` refuses the transition. That is the guard working,
         * not an error worth stopping the batch for.
         */
        console.error(`Scheduler: could not mark invoice ${invoice.id} overdue`, error);
      }
    }

    return `${flipped} invoice(s) marked overdue`;
  }
}
