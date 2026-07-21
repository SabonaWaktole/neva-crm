import { QuotationLineItem } from './QuotationLineItem';

export enum QuotationStatus {
  Draft = 'DRAFT',
  PendingApproval = 'PENDING_APPROVAL',
  Sent = 'SENT',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED'
}

export class Quotation {
  id: string;
  tenantId: string;
  clientId: string;
  createdByUserId: string;
  status: QuotationStatus;
  createdAt: Date;
  sentAt: Date | null;
  respondedAt: Date | null;
  lineItems: QuotationLineItem[];

  private constructor(props: {
    id: string;
    tenantId: string;
    clientId: string;
    createdByUserId: string;
    status: QuotationStatus;
    createdAt: Date;
    sentAt: Date | null;
    respondedAt: Date | null;
    lineItems: QuotationLineItem[];
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.clientId = props.clientId;
    this.createdByUserId = props.createdByUserId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.sentAt = props.sentAt;
    this.respondedAt = props.respondedAt;
    this.lineItems = props.lineItems;
  }

  get subtotal(): number {
    return this.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  static create(props: {
    id: string;
    tenantId: string;
    clientId: string;
    createdByUserId: string;
    lineItems: QuotationLineItem[];
    status?: QuotationStatus;
    createdAt?: Date;
    sentAt?: Date | null;
    respondedAt?: Date | null;
  }): Quotation {
    if (!props.lineItems || props.lineItems.length === 0) {
      throw new Error('A quotation must have at least one line item');
    }

    for (const item of props.lineItems) {
      if (item.tenantId !== props.tenantId) {
        throw new Error('Line item tenantId does not match quotation tenantId');
      }
    }

    return new Quotation({
      id: props.id,
      tenantId: props.tenantId,
      clientId: props.clientId,
      createdByUserId: props.createdByUserId,
      status: props.status ?? QuotationStatus.Draft,
      createdAt: props.createdAt ?? new Date(),
      sentAt: props.sentAt ?? null,
      respondedAt: props.respondedAt ?? null,
      lineItems: props.lineItems
    });
  }

  submit(options: { requiresApproval: boolean }) {
    if (this.status !== QuotationStatus.Draft) {
      throw new Error(`Invalid state transition from ${this.status} to Submit`);
    }

    if (options.requiresApproval) {
      this.status = QuotationStatus.PendingApproval;
      this.sentAt = null;
    } else {
      this.status = QuotationStatus.Sent;
      this.sentAt = new Date();
    }
  }

  approve() {
    if (this.status !== QuotationStatus.PendingApproval) {
      throw new Error(`Invalid state transition from ${this.status} to Approve`);
    }
    this.status = QuotationStatus.Sent;
    this.sentAt = new Date();
  }

  returnToDraft() {
    if (this.status !== QuotationStatus.PendingApproval) {
      throw new Error(`Invalid state transition from ${this.status} to Draft`);
    }
    this.status = QuotationStatus.Draft;
  }

  accept() {
    if (this.status !== QuotationStatus.Sent) {
      throw new Error(`Invalid state transition from ${this.status} to Accepted`);
    }
    this.status = QuotationStatus.Accepted;
    this.respondedAt = new Date();
  }

  reject() {
    if (this.status !== QuotationStatus.Sent) {
      throw new Error(`Invalid state transition from ${this.status} to Rejected`);
    }
    this.status = QuotationStatus.Rejected;
    this.respondedAt = new Date();
  }

  expire() {
    if (this.status !== QuotationStatus.Sent) {
      throw new Error(`Invalid state transition from ${this.status} to Expired`);
    }
    this.status = QuotationStatus.Expired;
  }
}
