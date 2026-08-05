export class InvoiceLineItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;

  /**
   * Display names of the product and warehouse, hydrated from the joined rows
   * on read. Not persisted from here — the line item owns the two ids, nothing
   * more. Undefined on entities built by a write path that never loaded the
   * joins, which is why every consumer falls back to the id.
   */
  productName?: string;
  warehouseName?: string;

  private constructor(props: {
    id: string;
    tenantId: string;
    invoiceId: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    productName?: string;
    warehouseName?: string;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.invoiceId = props.invoiceId;
    this.productId = props.productId;
    this.warehouseId = props.warehouseId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.productName = props.productName;
    this.warehouseName = props.warehouseName;
  }

  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }

  static create(props: {
    id: string;
    tenantId: string;
    invoiceId: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    productName?: string;
    warehouseName?: string;
  }): InvoiceLineItem {
    if (props.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (props.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    return new InvoiceLineItem(props);
  }
}
