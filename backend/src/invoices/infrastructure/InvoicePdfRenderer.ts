import PDFDocument from 'pdfkit';
import { InvoicePdfView } from '../application/GetInvoicePdfViewUseCase';

/**
 * Renders an invoice as a PDF. Structurally a copy of `QuotationPdfRenderer`'s
 * `draw()` — same reasoning applies (rendered into a buffer, never written to
 * disk, cheap to regenerate) — with two differences that reflect what an
 * invoice actually is:
 *
 *  - a "Due" line, because a quotation has no obligation date and an invoice
 *    is exactly that obligation;
 *  - a status/paid line telling the reader whether this bill is settled,
 *    which a quotation (never "paid") has no equivalent of.
 *
 * Always downloaded via the authenticated staff API — there is no customer
 * share link for an invoice — so unlike the quotation PDF this is never
 * embedded in a page a customer opens directly.
 */
export class InvoicePdfRenderer {
  async render(view: InvoicePdfView): Promise<Buffer> {
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

  private draw(doc: PDFKit.PDFDocument, view: InvoicePdfView): void {
    const money = (amount: number) => formatMoney(amount, view.currency, view.locale);

    doc.fontSize(20).text(view.companyName, { continued: false });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#666');
    if (view.companyAddress) doc.text(view.companyAddress);
    const contact = [view.companyContactEmail, view.companyContactPhone]
      .filter(Boolean)
      .join('  ·  ');
    if (contact) doc.text(contact);

    doc.moveDown(1.2);
    doc.fillColor('#000').fontSize(16).text(`Invoice ${view.reference}`);
    doc.fontSize(10).fillColor('#666');
    doc.text(`Status: ${humanStatus(view.status)}`);
    doc.text(`Issued: ${view.issuedAt.toISOString().slice(0, 10)}`);
    doc.text(`Due: ${view.dueDate.toISOString().slice(0, 10)}`);
    if (view.sentAt) doc.text(`Sent: ${view.sentAt.toISOString().slice(0, 10)}`);
    if (view.paidAt) {
      doc.text(`Paid on: ${view.paidAt.toISOString().slice(0, 10)}`);
    } else {
      doc.text(`Balance due: ${money(view.subtotal)}`);
    }

    doc.moveDown(0.8);
    doc.fillColor('#000').fontSize(11).text(`Billed to: ${view.clientName}`);

    doc.moveDown(1.2);

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
        'Please remit payment by the due date above. Contact us with any questions.',
        left,
        doc.y,
        { width: right - left }
      );
  }
}

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
