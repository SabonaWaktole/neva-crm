import { IPublicQuotationReader } from '../GetPublicQuotationUseCase';
import { MarkQuotationAcceptedUseCase } from './MarkQuotationAcceptedUseCase';
import { MarkQuotationRejectedUseCase } from './MarkQuotationRejectedUseCase';

export type PublicQuotationDecision = 'accept' | 'reject';

export type RespondToPublicQuotationResult =
  | { outcome: 'ok' }
  | { outcome: 'not_found' }
  | { outcome: 'invalid_state' };

/**
 * The client's half of Accept / Reject / Re-quote (§6.5).
 *
 * Reuses the same domain transitions and use cases a staff member triggers
 * from the quotation detail page (`MarkQuotationAcceptedUseCase`,
 * `MarkQuotationRejectedUseCase`) — Accept and Reject already mean "the
 * client's decision", however it was recorded, so there is no separate
 * client-facing rule to keep in sync with the staff one. What differs is
 * identity: there is no `actingUserId` here, only a token, so both use cases
 * are called with `actingUserId: null` (see their own docs for what that does
 * downstream). "Re-quote" is not a third domain transition — it is Reject
 * with a note the client is required to leave, so staff sees what to change
 * rather than just a bare decline.
 */
export class RespondToPublicQuotationUseCase {
  constructor(
    private readonly reader: IPublicQuotationReader,
    private readonly acceptUseCase: MarkQuotationAcceptedUseCase,
    private readonly rejectUseCase: MarkQuotationRejectedUseCase
  ) {}

  async execute(input: {
    token: string;
    decision: PublicQuotationDecision;
    note?: string | null;
  }): Promise<RespondToPublicQuotationResult> {
    if (!input.token || input.token.trim() === '') return { outcome: 'not_found' };

    const view = await this.reader.findByShareToken(input.token);
    if (!view) return { outcome: 'not_found' };

    try {
      if (input.decision === 'accept') {
        await this.acceptUseCase.execute({
          tenantId: view.tenantId,
          quotationId: view.quotationId,
          actingUserId: null,
          actingUserRole: null,
        });
      } else {
        await this.rejectUseCase.execute({
          tenantId: view.tenantId,
          quotationId: view.quotationId,
          actingUserId: null,
          actingUserRole: null,
          note: input.note ?? null,
        });
      }
      return { outcome: 'ok' };
    } catch {
      // Both use cases throw on any status other than Sent — already
      // responded, or (impossibly, given a live token) still a draft. Either
      // way the client made a choice on a quotation that has since moved on,
      // not a token problem, so this is distinct from `not_found`.
      return { outcome: 'invalid_state' };
    }
  }
}
