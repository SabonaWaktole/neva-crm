import { DomainError } from '../../../shared/domain/errors/DomainError';

export class TenantNotFoundError extends DomainError {
  constructor(id: string) {
    super(`No tenant exists with id "${id}"`);
  }
}

/**
 * The workspace exists but has been suspended by a platform administrator.
 *
 * Deliberately NOT folded into `InvalidCredentialsError`. That error is generic
 * because telling an unauthenticated caller an account exists leaks account
 * state — but a suspended workspace is different in kind: the person typing a
 * correct password is a customer who needs to know why they cannot get in, and
 * the only thing this message confirms is that the workspace exists, which its
 * own URL slug already confirms to anyone who can reach the login page.
 *
 * Telling them "invalid email or password" would send a paying customer to
 * reset a password that was never wrong.
 */
export class TenantSuspendedError extends DomainError {
  constructor() {
    super('This workspace is suspended — contact support');
  }
}
