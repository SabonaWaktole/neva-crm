import { DomainError } from './DomainError';

/**
 * The caller was asked to type some piece of text back to confirm a
 * destructive action — a workspace's slug, a user's email — and typed
 * something else, including nothing at all.
 *
 * Shared across modules (tenant deletion, user deletion) rather than
 * duplicated: it is the same "type it exactly" confirmation pattern each
 * time, just against a different field.
 */
export class ConfirmationMismatchError extends DomainError {
  constructor() {
    super('Confirmation text did not match.');
  }
}
