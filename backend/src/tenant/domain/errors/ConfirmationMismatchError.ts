import { DomainError } from '../../../shared/domain/errors/DomainError';

/**
 * The caller was asked to type the workspace's slug back to confirm a
 * destructive action and typed something else — including nothing at all.
 */
export class ConfirmationMismatchError extends DomainError {
  constructor() {
    super('Confirmation text did not match the workspace slug.');
  }
}
