import { Invoice, InvoiceStatus } from './Invoice';
import { InvoiceLineItem } from './InvoiceLineItem';

function makeLineItem() {
  return InvoiceLineItem.create({
    id: 'li1',
    tenantId: 'tenant-1',
    invoiceId: 'inv1',
    productId: 'prod-1',
    warehouseId: 'wh-1',
    quantity: 5,
    unitPrice: 100
  });
}

function makeInvoice(status?: InvoiceStatus) {
  return Invoice.create({
    id: 'inv1',
    tenantId: 'tenant-1',
    clientId: 'client-1',
    quotationId: 'q1',
    createdByUserId: 'user-1',
    lineItems: [makeLineItem()],
    dueDate: new Date('2026-09-01'),
    status
  });
}

describe('Invoice', () => {
  it('should create a Draft invoice with valid line items', () => {
    const invoice = makeInvoice();

    expect(invoice.status).toBe(InvoiceStatus.Draft);
    expect(invoice.subtotal).toBe(500);
  });

  it('should reject creation if there are zero line items', () => {
    expect(() => {
      Invoice.create({
        id: 'inv1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        quotationId: 'q1',
        createdByUserId: 'user-1',
        lineItems: [],
        dueDate: new Date()
      });
    }).toThrow('An invoice must have at least one line item');
  });

  it('should reject creation if line items belong to a different tenant', () => {
    const lineItem = InvoiceLineItem.create({
      id: 'li1', tenantId: 'tenant-2', invoiceId: 'inv1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10
    });

    expect(() => {
      Invoice.create({
        id: 'inv1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        quotationId: 'q1',
        createdByUserId: 'user-1',
        lineItems: [lineItem],
        dueDate: new Date()
      });
    }).toThrow('Line item tenantId does not match invoice tenantId');
  });

  describe('send()', () => {
    it('moves Draft to Sent and stamps sentAt', () => {
      const invoice = makeInvoice();
      invoice.send();
      expect(invoice.status).toBe(InvoiceStatus.Sent);
      expect(invoice.sentAt).not.toBeNull();
    });

    it('refuses from any status other than Draft', () => {
      const invoice = makeInvoice(InvoiceStatus.Sent);
      expect(() => invoice.send()).toThrow('Invalid state transition from SENT to Sent');
    });
  });

  describe('markPaid()', () => {
    it('moves Sent to Paid and stamps paidAt', () => {
      const invoice = makeInvoice(InvoiceStatus.Sent);
      invoice.markPaid();
      expect(invoice.status).toBe(InvoiceStatus.Paid);
      expect(invoice.paidAt).not.toBeNull();
    });

    it('moves Overdue to Paid too — a payment closes either', () => {
      const invoice = makeInvoice(InvoiceStatus.Overdue);
      invoice.markPaid();
      expect(invoice.status).toBe(InvoiceStatus.Paid);
    });

    it('refuses from Draft', () => {
      const invoice = makeInvoice(InvoiceStatus.Draft);
      expect(() => invoice.markPaid()).toThrow('Invalid state transition from DRAFT to Paid');
    });

    it('refuses from Void', () => {
      const invoice = makeInvoice(InvoiceStatus.Void);
      expect(() => invoice.markPaid()).toThrow('Invalid state transition from VOID to Paid');
    });
  });

  describe('markOverdue()', () => {
    it('moves Sent to Overdue', () => {
      const invoice = makeInvoice(InvoiceStatus.Sent);
      invoice.markOverdue();
      expect(invoice.status).toBe(InvoiceStatus.Overdue);
    });

    it('refuses from Draft', () => {
      const invoice = makeInvoice(InvoiceStatus.Draft);
      expect(() => invoice.markOverdue()).toThrow('Invalid state transition from DRAFT to Overdue');
    });

    it('refuses from Paid', () => {
      const invoice = makeInvoice(InvoiceStatus.Paid);
      expect(() => invoice.markOverdue()).toThrow('Invalid state transition from PAID to Overdue');
    });
  });

  describe('void()', () => {
    it('voids from Draft', () => {
      const invoice = makeInvoice(InvoiceStatus.Draft);
      invoice.void();
      expect(invoice.status).toBe(InvoiceStatus.Void);
    });

    it('voids from Sent', () => {
      const invoice = makeInvoice(InvoiceStatus.Sent);
      invoice.void();
      expect(invoice.status).toBe(InvoiceStatus.Void);
    });

    it('voids from Overdue', () => {
      const invoice = makeInvoice(InvoiceStatus.Overdue);
      invoice.void();
      expect(invoice.status).toBe(InvoiceStatus.Void);
    });

    it('refuses from Paid — a settled invoice cannot be un-issued', () => {
      const invoice = makeInvoice(InvoiceStatus.Paid);
      expect(() => invoice.void()).toThrow('Invalid state transition from PAID to Void');
    });
  });
});
