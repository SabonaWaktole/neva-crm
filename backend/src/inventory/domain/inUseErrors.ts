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

/**
 * Raised instead of deleting a product that a quotation still cites. Quotations
 * are financial records, so the product row has to stay; archiving takes it out
 * of the catalogue without breaking those references.
 */
export class ProductInUseError extends DomainError {
  constructor(productName: string, quotationCount: number) {
    super(
      `"${productName}" is used by ${quotationCount} quotation${
        quotationCount === 1 ? '' : 's'
      } and cannot be deleted. Archive it instead to remove it from the catalogue.`
    );
  }
}

/** A tenant's SKUs must be unique; surfaced as a 409 rather than a 500. */
export class DuplicateSkuError extends DomainError {
  constructor(sku: string) {
    super(`SKU "${sku}" is already used by another product.`);
  }
}
