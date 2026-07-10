import { DomainError } from '../../../shared/domain/errors/DomainError';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

export class WeakPasswordError extends DomainError {
  constructor() {
    super(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit',
    );
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password');
  }
}

export class SlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super(`The URL slug "${slug}" is already taken`);
  }
}

export class InvitationExpiredError extends DomainError {
  constructor() {
    super('This invitation has expired');
  }
}

export class InvitationAlreadyAcceptedError extends DomainError {
  constructor() {
    super('This invitation has already been accepted');
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('This token has expired');
  }
}

export class TokenAlreadyUsedError extends DomainError {
  constructor() {
    super('This token has already been used');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message);
  }
}
