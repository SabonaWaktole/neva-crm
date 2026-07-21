export class QuotationStatusHistory {
  id: string;
  tenantId: string;
  quotationId: string;
  fromStatus: string;
  toStatus: string;
  changedByUserId: string;
  changedAt: Date;
  note: string | null;

  private constructor(props: {
    id: string;
    tenantId: string;
    quotationId: string;
    fromStatus: string;
    toStatus: string;
    changedByUserId: string;
    changedAt: Date;
    note: string | null;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.quotationId = props.quotationId;
    this.fromStatus = props.fromStatus;
    this.toStatus = props.toStatus;
    this.changedByUserId = props.changedByUserId;
    this.changedAt = props.changedAt;
    this.note = props.note;
  }

  static create(props: {
    id: string;
    tenantId: string;
    quotationId: string;
    fromStatus: string;
    toStatus: string;
    changedByUserId: string;
    note?: string | null;
  }): QuotationStatusHistory {
    return new QuotationStatusHistory({
      ...props,
      changedAt: new Date(),
      note: props.note ?? null
    });
  }
}
