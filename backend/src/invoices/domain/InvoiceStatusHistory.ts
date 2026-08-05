export class InvoiceStatusHistory {
  id: string;
  tenantId: string;
  invoiceId: string;
  fromStatus: string;
  toStatus: string;
  /** NULL when the scheduler made the change rather than a person. */
  changedByUserId: string | null;
  changedAt: Date;
  note: string | null;

  private constructor(props: {
    id: string;
    tenantId: string;
    invoiceId: string;
    fromStatus: string;
    toStatus: string;
    changedByUserId: string | null;
    changedAt: Date;
    note: string | null;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.invoiceId = props.invoiceId;
    this.fromStatus = props.fromStatus;
    this.toStatus = props.toStatus;
    this.changedByUserId = props.changedByUserId;
    this.changedAt = props.changedAt;
    this.note = props.note;
  }

  static create(props: {
    id: string;
    tenantId: string;
    invoiceId: string;
    fromStatus: string;
    toStatus: string;
    changedByUserId: string | null;
    note?: string | null;
  }): InvoiceStatusHistory {
    return new InvoiceStatusHistory({
      ...props,
      changedAt: new Date(),
      note: props.note ?? null
    });
  }
}
