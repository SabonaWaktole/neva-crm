import PDFDocument from 'pdfkit';
import { drawBarChart, drawLegend, drawLineChart, drawPieChart } from './pdfCharts';

export interface ReportPdfMonthlyPoint {
  month: string;
  revenue: number;
}

export interface ReportPdfStatusCount {
  status: string;
  count: number;
}

export interface ReportPdfWarehouseValue {
  warehouseName: string;
  totalItems: number;
  totalValue: number;
}

export interface ReportPdfTrendPoint {
  month: string;
  count: number;
}

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
  currency: string;
  locale: string;
  generatedAt: Date;
  revenue: ReportPdfMonthlyPoint[];
  clients: ReportPdfStatusCount[];
  inventory: ReportPdfWarehouseValue[];
  clientTrend: ReportPdfTrendPoint[];
  appointmentsByStatus: ReportPdfStatusCount[];
  byStaff: ReportPdfStaffRow[];
  lowStock: ReportPdfLowStockRow[];
}

/**
 * Fixed categorical order, matching `--chart-1`..`--chart-6` in
 * `frontend/src/styles/tokens.css`. Duplicated rather than shared: the
 * frontend's copy is a CSS custom property resolved by the browser, this one
 * is a plain hex value pdfkit can fill a path with directly, and there's no
 * build step that would let the two mechanisms share a single source without
 * far more machinery than six colors justifies.
 */
const CHART_COLORS = ['#0071e3', '#0f9aa8', '#b45309', '#7c3aed', '#c2418f', '#12864a'];

/**
 * Renders the Reports page as a PDF.
 *
 * Charts are drawn natively with pdfkit (see `pdfCharts.ts`) rather than
 * embedding images captured from the on-screen recharts SVGs. That path was
 * tried first and produced wrong output twice running — colors that didn't
 * resolve outside the browser's stylesheet context, then a shape that didn't
 * rasterize correctly either — because it depended on browser SVG
 * serialization behaving predictably outside a live page. Plotting the same
 * numbers directly here removes that entire dependency: the PDF is built
 * from the same report data the page renders from, not a screenshot of it.
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
    const money = (amount: number) => formatMoney(amount, data.currency, data.locale);

    doc.fontSize(20).fillColor('#000').text(data.tenantName);
    doc.fontSize(10).fillColor('#666').text('Reports export');
    doc.text(`Generated: ${data.generatedAt.toISOString().slice(0, 10)}`);
    doc.moveDown(1);

    // One chart per page keeps each legible rather than shrinking six charts
    // onto one sheet.
    if (data.revenue.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Monthly revenue');
      doc.moveDown(0.5);
      drawLineChart(
        doc,
        { x: left, y: doc.y, width: contentWidth, height: 300 },
        data.revenue.map((r) => ({ label: r.month, value: r.revenue })),
        CHART_COLORS[0],
        money
      );
    }

    if (data.clients.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Client distribution');
      doc.moveDown(0.5);
      const total = data.clients.reduce((sum, c) => sum + c.count, 0);
      const slices = data.clients.map((c, i) => ({
        label: humanStatus(c.status),
        value: c.count,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
      const chartTop = doc.y;
      drawPieChart(doc, { cx: left + contentWidth / 2, cy: chartTop + 130, radius: 110, innerRadius: 60 }, slices);
      drawLegend(
        doc,
        left,
        chartTop + 270,
        contentWidth,
        slices.map((s) => ({
          label: s.label,
          value: `${s.value} (${total > 0 ? Math.round((s.value / total) * 100) : 0}%)`,
          color: s.color,
        }))
      );
    }

    if (data.inventory.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Inventory value by warehouse');
      doc.moveDown(0.5);
      drawBarChart(
        doc,
        { x: left, y: doc.y, width: contentWidth, height: 260 },
        data.inventory.map((i) => ({ label: i.warehouseName, value: i.totalValue })),
        CHART_COLORS[0],
        money
      );

      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Items held by warehouse');
      doc.moveDown(0.5);
      drawBarChart(
        doc,
        { x: left, y: doc.y, width: contentWidth, height: 260 },
        data.inventory.map((i) => ({ label: i.warehouseName, value: i.totalItems })),
        CHART_COLORS[1]
      );
    }

    if (data.appointmentsByStatus.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Appointment statistics');
      doc.moveDown(0.5);
      drawBarChart(
        doc,
        { x: left, y: doc.y, width: contentWidth, height: 260 },
        data.appointmentsByStatus.map((a) => ({ label: humanStatus(a.status), value: a.count })),
        CHART_COLORS[2]
      );
    }

    if (data.clientTrend.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('New clients');
      doc.moveDown(0.5);
      drawLineChart(
        doc,
        { x: left, y: doc.y, width: contentWidth, height: 300 },
        data.clientTrend.map((t) => ({ label: t.month, value: t.count })),
        CHART_COLORS[3]
      );
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
          humanStatus(r.status),
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

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return amount.toFixed(0);
  }
}

function humanStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
