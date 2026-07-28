import PDFDocument from 'pdfkit';
import { PublicQuotationView } from '../application/GetPublicQuotationUseCase';

/**
 * Renders a quotation as a PDF (§6.5, "generate a shareable/viewable version").
 *
 * Streams into a buffer rather than to disk. A file would need a location, a
 * cleanup policy and a story about surviving a container restart — all of which
 * §4.7 already has open questions about for uploaded media. A quotation PDF is
 * cheap to regenerate and always current if it is, so there is nothing worth
 * storing.
 *
 * Deliberately built on the same `PublicQuotationView` the web view uses: the
 * customer's PDF and the customer's page are the same document in two formats,
 * and a second data path is how the two start disagreeing about a total.
 */
export class QuotationPdfRenderer {
  async render(view: PublicQuotationView): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.draw(doc, view);
    doc.end();

    return finished;
  }

  private draw(doc: PDFKit.PDFDocument, view: PublicQuotationView): void {
    const money = (amount: number) => formatMoney(amount, view.currency, view.locale);

    // Issuer block.
    doc.fontSize(20).text(view.companyName, { continued: false });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#666');
    if (view.companyAddress) doc.text(view.companyAddress);
    const contact = [view.companyContactEmail, view.companyContactPhone]
      .filter(Boolean)
      .join('  ·  ');
    if (contact) doc.text(contact);

    doc.moveDown(1.2);
    doc.fillColor('#000').fontSize(16).text(`Quotation ${view.reference}`);
    doc.fontSize(10).fillColor('#666');
    doc.text(`Status: ${humanStatus(view.status)}`);
    doc.text(`Issued: ${view.issuedAt.toISOString().slice(0, 10)}`);
    if (view.sentAt) doc.text(`Sent: ${view.sentAt.toISOString().slice(0, 10)}`);

    doc.moveDown(0.8);
    doc.fillColor('#000').fontSize(11).text(`Prepared for: ${view.clientName}`);

    doc.moveDown(1.2);

    // Line items. Fixed columns rather than a table helper: pdfkit has none,
    // and four columns do not justify pulling one in.
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const cols = { desc: left, qty: right - 230, unit: right - 150, total: right - 70 };

    doc.fontSize(9).fillColor('#666');
    let y = doc.y;
    doc.text('Description', cols.desc, y, { width: cols.qty - cols.desc - 10 });
    doc.text('Qty', cols.qty, y, { width: 60, align: 'right' });
    doc.text('Unit', cols.unit, y, { width: 70, align: 'right' });
    doc.text('Total', cols.total, y, { width: 70, align: 'right' });

    y = doc.y + 4;
    doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
    y += 8;

    doc.fillColor('#000').fontSize(10);
    for (const line of view.lines) {
      // Manual page breaks: a long quotation must not run off the sheet.
      if (y > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      const descHeight = doc.heightOfString(line.description, {
        width: cols.qty - cols.desc - 10,
      });
      doc.text(line.description, cols.desc, y, { width: cols.qty - cols.desc - 10 });
      doc.text(String(line.quantity), cols.qty, y, { width: 60, align: 'right' });
      doc.text(money(line.unitPrice), cols.unit, y, { width: 70, align: 'right' });
      doc.text(money(line.lineTotal), cols.total, y, { width: 70, align: 'right' });

      y += Math.max(descHeight, 12) + 8;
    }

    doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
    y += 10;

    doc.fontSize(12).text('Subtotal', cols.unit - 60, y, { width: 130, align: 'right' });
    doc.text(money(view.subtotal), cols.total, y, { width: 70, align: 'right' });

    doc.moveDown(3);
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'This quotation reflects the pricing recorded at the time of viewing. Contact us with any questions.',
        left,
        doc.y,
        { width: right - left }
      );
  }
}

/**
 * Formats using the tenant's own currency and locale (§6.8).
 *
 * Falls back to the raw number if the stored locale or currency is one Node's
 * ICU build does not know. A malformed setting must degrade to an ugly total,
 * never to a failed download of a document a customer is waiting on.
 */
function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

function humanStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
