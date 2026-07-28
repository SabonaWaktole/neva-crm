import { Quotation, QuotationStatus } from './Quotation';
import { QuotationLineItem } from './QuotationLineItem';
import { generateShareToken } from './shareToken';

const lineItem = () =>
  QuotationLineItem.create({
    id: 'li-1',
    tenantId: 'tenant-1',
    quotationId: 'q-1',
    productId: 'p-1',
    warehouseId: 'w-1',
    quantity: 1,
    unitPrice: 100,
  });

const draft = () =>
  Quotation.create({
    id: 'q-1',
    tenantId: 'tenant-1',
    clientId: 'c-1',
    createdByUserId: 'u-1',
    lineItems: [lineItem()],
  });

describe('Quotation share token', () => {
  it('is null on a new draft', () => {
    expect(draft().shareToken).toBeNull();
  });

  it('is refused while the quotation is still a draft', () => {
    // A token on a draft would make unfinished pricing publicly readable by
    // anyone holding the URL.
    const quotation = draft();
    quotation.issueShareToken('tok');

    expect(quotation.shareToken).toBeNull();
  });

  it('is refused while pending approval', () => {
    const quotation = draft();
    quotation.submit({ requiresApproval: true });
    quotation.issueShareToken('tok');

    expect(quotation.status).toBe(QuotationStatus.PendingApproval);
    expect(quotation.shareToken).toBeNull();
  });

  it('is issued when the quotation goes straight to sent', () => {
    const quotation = draft();
    quotation.submit({ requiresApproval: false });
    quotation.issueShareToken('tok');

    expect(quotation.shareToken).toBe('tok');
    expect(quotation.shareTokenIssuedAt).toBeInstanceOf(Date);
  });

  it('is issued on approval', () => {
    const quotation = draft();
    quotation.submit({ requiresApproval: true });
    quotation.approve();
    quotation.issueShareToken('tok');

    expect(quotation.shareToken).toBe('tok');
  });

  it('is never reissued, so a link already in a customer inbox keeps working', () => {
    // Both routes into SENT call issueShareToken unconditionally, so the
    // second call has to be a no-op rather than a new link.
    const quotation = draft();
    quotation.submit({ requiresApproval: false });
    quotation.issueShareToken('first');
    quotation.issueShareToken('second');

    expect(quotation.shareToken).toBe('first');
  });

  it('is still absent after a Pending Approval → Draft round trip', () => {
    // returnToDraft is only reachable from PENDING_APPROVAL, which never had a
    // token — so this path cannot leak one onto a draft.
    const quotation = draft();
    quotation.submit({ requiresApproval: true });
    quotation.returnToDraft();

    expect(quotation.status).toBe(QuotationStatus.Draft);
    expect(quotation.shareToken).toBeNull();
  });

  it('rehydrates from persistence', () => {
    const issuedAt = new Date('2026-07-02T00:00:00.000Z');
    const quotation = Quotation.create({
      id: 'q-1',
      tenantId: 'tenant-1',
      clientId: 'c-1',
      createdByUserId: 'u-1',
      status: QuotationStatus.Sent,
      lineItems: [lineItem()],
      shareToken: 'stored',
      shareTokenIssuedAt: issuedAt,
    });

    expect(quotation.shareToken).toBe('stored');
    expect(quotation.shareTokenIssuedAt).toEqual(issuedAt);
  });
});

describe('generateShareToken', () => {
  it('produces a 256-bit base64url token', () => {
    const token = generateShareToken();

    // 32 bytes base64url-encoded, unpadded.
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 100 }, generateShareToken));
    expect(tokens.size).toBe(100);
  });
});
