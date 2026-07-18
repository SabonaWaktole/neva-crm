import { DomainError } from '../../shared/domain/errors/DomainError';

export class WarehouseInUseError extends DomainError {
  constructor(warehouseId: string) {
    super(`Warehouse ${warehouseId} cannot be deleted because it has stock levels assigned.`);
  }
}

export class CategoryInUseError extends DomainError {
  constructor(categoryId: string) {
    super(`Category ${categoryId} cannot be deleted because it is assigned to products.`);
  }
}
