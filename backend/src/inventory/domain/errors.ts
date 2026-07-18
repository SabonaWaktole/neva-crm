import { DomainError } from '../../shared/domain/errors/DomainError';

export class NegativeStockError extends DomainError {
  constructor(message: string = 'Stock quantity cannot be negative.') {
    super(message);
  }
}

export class InvalidStockMovementError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class CrossTenantIsolationError extends DomainError {
  constructor(message: string = 'Cross-entity tenant ID mismatch.') {
    super(message);
  }
}
