import { Quotation, QuotationStatus } from './Quotation';
import { QuotationLineItem } from './QuotationLineItem';

describe('Quotation', () => {
  it('should create a Draft quotation with valid line items', () => {
    const lineItem = QuotationLineItem.create({
      id: 'li1',
      tenantId: 'tenant-1',
      quotationId: 'q1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 5,
      unitPrice: 100
    });

    const quotation = Quotation.create({
      id: 'q1',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      createdByUserId: 'user-1',
      lineItems: [lineItem]
    });

    expect(quotation.status).toBe(QuotationStatus.Draft);
    expect(quotation.subtotal).toBe(500); // 5 * 100
  });

  it('should reject creation if there are zero line items', () => {
    expect(() => {
      Quotation.create({
        id: 'q1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        createdByUserId: 'user-1',
        lineItems: []
      });
    }).toThrow('A quotation must have at least one line item');
  });

  it('should reject creation if line items belong to a different tenant', () => {
    const lineItem = QuotationLineItem.create({
      id: 'li1',
      tenantId: 'tenant-2', // different tenant
      quotationId: 'q1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 1,
      unitPrice: 100
    });

    expect(() => {
      Quotation.create({
        id: 'q1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        createdByUserId: 'user-1',
        lineItems: [lineItem]
      });
    }).toThrow('Line item tenantId does not match quotation tenantId');
  });

  it('should compute lineTotal and subtotal dynamically', () => {
    const lineItem1 = QuotationLineItem.create({
      id: 'li1',
      tenantId: 'tenant-1',
      quotationId: 'q1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 2,
      unitPrice: 150
    });

    const lineItem2 = QuotationLineItem.create({
      id: 'li2',
      tenantId: 'tenant-1',
      quotationId: 'q1',
      productId: 'prod-2',
      warehouseId: 'wh-2',
      quantity: 3,
      unitPrice: 50
    });

    const quotation = Quotation.create({
      id: 'q1',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      createdByUserId: 'user-1',
      lineItems: [lineItem1, lineItem2]
    });

    expect(lineItem1.lineTotal).toBe(300);
    expect(lineItem2.lineTotal).toBe(150);
    expect(quotation.subtotal).toBe(450);
  });

  describe('Status Transitions', () => {
    let lineItem: QuotationLineItem;
    let quotation: Quotation;

    beforeEach(() => {
      lineItem = QuotationLineItem.create({
        id: 'li1',
        tenantId: 'tenant-1',
        quotationId: 'q1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 5,
        unitPrice: 100
      });

      quotation = Quotation.create({
        id: 'q1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        createdByUserId: 'user-1',
        lineItems: [lineItem]
      });
    });

    it('should transition Draft -> PendingApproval (when approval required)', () => {
      quotation.submit({ requiresApproval: true });
      expect(quotation.status).toBe(QuotationStatus.PendingApproval);
      expect(quotation.sentAt).toBeNull();
    });

    it('should transition Draft -> Sent (when approval NOT required)', () => {
      quotation.submit({ requiresApproval: false });
      expect(quotation.status).toBe(QuotationStatus.Sent);
      expect(quotation.sentAt).toBeInstanceOf(Date);
    });

    it('should transition PendingApproval -> Sent (Approve)', () => {
      quotation.submit({ requiresApproval: true });
      quotation.approve();
      expect(quotation.status).toBe(QuotationStatus.Sent);
      expect(quotation.sentAt).toBeInstanceOf(Date);
    });

    it('should transition PendingApproval -> Draft (Return)', () => {
      quotation.submit({ requiresApproval: true });
      quotation.returnToDraft();
      expect(quotation.status).toBe(QuotationStatus.Draft);
    });

    it('should transition Sent -> Accepted and set respondedAt', () => {
      quotation.submit({ requiresApproval: false });
      quotation.accept();
      expect(quotation.status).toBe(QuotationStatus.Accepted);
      expect(quotation.respondedAt).toBeInstanceOf(Date);
    });

    it('should transition Sent -> Rejected and set respondedAt', () => {
      quotation.submit({ requiresApproval: false });
      quotation.reject();
      expect(quotation.status).toBe(QuotationStatus.Rejected);
      expect(quotation.respondedAt).toBeInstanceOf(Date);
    });

    it('should transition Sent -> Expired', () => {
      quotation.submit({ requiresApproval: false });
      quotation.expire();
      expect(quotation.status).toBe(QuotationStatus.Expired);
    });

    it('should reject illegal transitions (e.g. Draft -> Accepted)', () => {
      expect(() => quotation.accept()).toThrow('Invalid state transition from DRAFT to Accepted');
    });

    it('should reject illegal transitions (e.g. PendingApproval -> Accepted)', () => {
      quotation.submit({ requiresApproval: true });
      expect(() => quotation.accept()).toThrow('Invalid state transition from PENDING_APPROVAL to Accepted');
    });

    it('should transition Rejected -> Sent (resend), clear respondedAt, and keep the same share token', () => {
      quotation.submit({ requiresApproval: false });
      quotation.issueShareToken('tok-1');
      quotation.reject();
      expect(quotation.respondedAt).toBeInstanceOf(Date);

      quotation.resend();

      expect(quotation.status).toBe(QuotationStatus.Sent);
      expect(quotation.respondedAt).toBeNull();
      expect(quotation.sentAt).toBeInstanceOf(Date);
      // The customer's original link must keep working after a revision.
      expect(quotation.shareToken).toBe('tok-1');
    });

    it('should reject resend from anything other than Rejected', () => {
      expect(() => quotation.resend()).toThrow('Invalid state transition from DRAFT to Sent');
    });
  });
});
