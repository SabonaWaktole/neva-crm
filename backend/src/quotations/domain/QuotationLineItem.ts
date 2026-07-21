export class QuotationLineItem {
  id: string;
  tenantId: string;
  quotationId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;

  private constructor(props: {
    id: string;
    tenantId: string;
    quotationId: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.quotationId = props.quotationId;
    this.productId = props.productId;
    this.warehouseId = props.warehouseId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
  }

  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }

  static create(props: {
    id: string;
    tenantId: string;
    quotationId: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
  }): QuotationLineItem {
    if (props.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (props.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    return new QuotationLineItem(props);
  }
}
