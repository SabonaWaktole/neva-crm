import PDFDocument from 'pdfkit';

export interface ReportPdfStaffRow {
  staffName: string;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface ReportPdfLowStockRow {
  productName: string;
  warehouseName: string;
  quantity: number;
  threshold: number;
  status: string;
}

export interface ReportPdfData {
  tenantName: string;
  generatedAt: Date;
  byStaff: ReportPdfStaffRow[];
  lowStock: ReportPdfLowStockRow[];
  /** One base64-encoded PNG per chart, keyed by a human title (e.g. "Monthly Revenue"). */
  charts: Record<string, string>;
}

/**
 * Renders the Reports page as a PDF: chart images captured client-side (see
 * `ReportsPage.tsx`'s `XMLSerializer` -> canvas -> PNG pipeline, since recharts
 * has no server-side renderer here) followed by the two tables the page
 * already shows, using the same manual-column pdfkit technique as
 * `QuotationPdfRenderer`/`InvoicePdfRenderer` — four columns is not enough to
 * justify a table helper pdfkit does not provide.
 */
export class ReportPdfRenderer {
  async render(data: ReportPdfData): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.draw(doc, data);
    doc.end();

    return finished;
  }

  private draw(doc: PDFKit.PDFDocument, data: ReportPdfData): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    doc.fontSize(20).fillColor('#000').text(data.tenantName);
    doc.fontSize(10).fillColor('#666').text('Reports export');
    doc.text(`Generated: ${data.generatedAt.toISOString().slice(0, 10)}`);
    doc.moveDown(1);

    // One chart per page keeps each image legible rather than shrinking six
    // charts onto one sheet.
    for (const [title, base64] of Object.entries(data.charts)) {
      if (!base64) continue;
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text(title);
      doc.moveDown(0.5);
      try {
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        doc.image(buffer, doc.x, doc.y, { fit: [contentWidth, 380] });
      } catch {
        // A malformed/undecodable chart image must not fail the whole export
        // — the tables below are still worth having.
        doc.fontSize(10).fillColor('#999').text('(chart image unavailable)');
      }
    }

    if (data.byStaff.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Appointments by staff');
      doc.moveDown(0.5);
      this.drawTable(
        doc,
        ['Staff', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Total'],
        data.byStaff.map((r) => [
          r.staffName,
          String(r.scheduled),
          String(r.confirmed),
          String(r.completed),
          String(r.cancelled),
          String(r.total),
        ])
      );
    }

    if (data.lowStock.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Low stock');
      doc.moveDown(0.5);
      this.drawTable(
        doc,
        ['Product', 'Warehouse', 'Quantity', 'Threshold', 'Status'],
        data.lowStock.map((r) => [
          r.productName,
          r.warehouseName,
          String(r.quantity),
          String(r.threshold),
          r.status,
        ])
      );
    }
  }

  /** Fixed equal-width columns — same manual technique as the quotation/invoice renderers. */
  private drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const colWidth = (right - left) / headers.length;

    let y = doc.y;
    doc.fontSize(9).fillColor('#666');
    headers.forEach((h, i) => {
      doc.text(h, left + i * colWidth, y, { width: colWidth - 6 });
    });
    y = doc.y + 4;
    doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
    y += 8;

    doc.fontSize(9).fillColor('#000');
    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      row.forEach((cell, i) => {
        doc.text(cell, left + i * colWidth, y, { width: colWidth - 6 });
      });
      y += 18;
    }
  }
}
