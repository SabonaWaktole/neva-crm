/**
 * Native pdfkit chart primitives for the Reports PDF export.
 *
 * The export used to embed chart PNGs captured client-side from the
 * already-rendered recharts SVGs (`XMLSerializer` -> canvas). That path kept
 * producing wrong output — first solid black shapes (recharts colors it with
 * `var(--chart-N)`, which doesn't resolve in the detached SVG document used
 * to rasterize it) and then a correctly-colored but visibly wrong shape (the
 * rasterization itself was unreliable across browsers). Drawing the same
 * numbers directly with pdfkit's own vector primitives sidesteps browser SVG
 * serialization entirely: what's in the report data is exactly what ends up
 * on the page, every time.
 */

export interface ChartBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

export interface Bar {
  label: string;
  value: number;
}

export interface Point {
  label: string;
  value: number;
}

const AXIS_COLOR = '#ddd';
const LABEL_COLOR = '#666';
const VALUE_COLOR = '#000';

/**
 * Filled pie/donut wedges approximated as fans of triangles (2-degree steps),
 * rather than relying on pdfkit's SVG-arc path support — this way the shape
 * is generated from plain trigonometry and there's no path-syntax edge case
 * to get wrong.
 */
export function drawPieChart(
  doc: PDFKit.PDFDocument,
  center: { cx: number; cy: number; radius: number; innerRadius?: number },
  slices: PieSlice[]
): void {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return;

  const { cx, cy, radius } = center;
  const innerRadius = center.innerRadius ?? 0;
  const step = Math.PI / 90; // 2 degrees
  let angle = -Math.PI / 2; // 12 o'clock

  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sliceAngle = (slice.value / total) * Math.PI * 2;
    const end = angle + sliceAngle;

    // Sample angles once, then derive both the outer and (if any) inner arc
    // from the same list — the two arcs then line up point-for-point instead
    // of being resampled independently.
    const angles: number[] = [];
    for (let a = angle; a < end; a += step) angles.push(a);
    angles.push(end);

    const outerPoints = angles.map(
      (a): [number, number] => [cx + radius * Math.cos(a), cy + radius * Math.sin(a)]
    );

    doc.save();
    if (innerRadius > 0) {
      const innerPoints = angles
        .map((a): [number, number] => [cx + innerRadius * Math.cos(a), cy + innerRadius * Math.sin(a)])
        .reverse();
      doc.moveTo(...outerPoints[0]);
      for (const p of outerPoints.slice(1)) doc.lineTo(...p);
      for (const p of innerPoints) doc.lineTo(...p);
      doc.closePath();
    } else {
      doc.moveTo(cx, cy);
      for (const p of outerPoints) doc.lineTo(...p);
      doc.closePath();
    }
    doc.fillColor(slice.color).fill();
    doc.restore();

    angle = end;
  }
}

/** Legend rows (color swatch + label + value) below/beside a chart. */
export function drawLegend(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  entries: { label: string; value: string; color: string }[]
): number {
  let cursorY = y;
  const swatch = 8;
  for (const entry of entries) {
    doc.rect(x, cursorY + 2, swatch, swatch).fillColor(entry.color).fill();
    doc
      .fillColor(VALUE_COLOR)
      .fontSize(9)
      .text(`${entry.label}  —  ${entry.value}`, x + swatch + 8, cursorY, { width: width - swatch - 8 });
    cursorY = doc.y + 4;
  }
  return cursorY;
}

/** Simple vertical bar chart with baseline axis, value-above-bar and label-below-bar. */
export function drawBarChart(
  doc: PDFKit.PDFDocument,
  box: ChartBox,
  bars: Bar[],
  color: string,
  valueFormatter: (n: number) => string = (n) => String(n)
): void {
  if (bars.length === 0) return;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const plotHeight = box.height - 24; // room for the label row
  const gap = 10;
  const barWidth = Math.max(4, (box.width - gap * (bars.length - 1)) / bars.length);
  const baseline = box.y + plotHeight;

  doc.moveTo(box.x, baseline).lineTo(box.x + box.width, baseline).strokeColor(AXIS_COLOR).stroke();

  bars.forEach((bar, i) => {
    const barHeight = max > 0 ? (bar.value / max) * plotHeight : 0;
    const bx = box.x + i * (barWidth + gap);
    const by = baseline - barHeight;

    if (barHeight > 0) {
      doc.rect(bx, by, barWidth, barHeight).fillColor(color).fill();
    }
    doc
      .fillColor(VALUE_COLOR)
      .fontSize(8)
      .text(valueFormatter(bar.value), bx - 5, by - 12, { width: barWidth + 10, align: 'center' });
    doc
      .fillColor(LABEL_COLOR)
      .fontSize(8)
      .text(bar.label, bx - 5, baseline + 4, { width: barWidth + 10, align: 'center' });
  });
}

/** Polyline chart: points connected by straight segments, with a small dot per point. */
export function drawLineChart(
  doc: PDFKit.PDFDocument,
  box: ChartBox,
  points: Point[],
  color: string,
  valueFormatter: (n: number) => string = (n) => String(n)
): void {
  if (points.length === 0) return;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;
  const plotHeight = box.height - 24;
  const baseline = box.y + plotHeight;
  const stepX = points.length > 1 ? box.width / (points.length - 1) : 0;

  doc.moveTo(box.x, baseline).lineTo(box.x + box.width, baseline).strokeColor(AXIS_COLOR).stroke();

  const coords = points.map((p, i) => {
    const px = box.x + i * stepX;
    const py = baseline - ((p.value - min) / range) * plotHeight;
    return { x: px, y: py, point: p };
  });

  if (coords.length > 1) {
    doc.moveTo(coords[0].x, coords[0].y);
    for (const c of coords.slice(1)) doc.lineTo(c.x, c.y);
    doc.strokeColor(color).lineWidth(2).stroke();
    doc.lineWidth(1);
  }

  for (const c of coords) {
    doc.circle(c.x, c.y, 2.5).fillColor(color).fill();
  }

  // Thin out labels so they don't overlap on a chart with many points.
  const labelEvery = Math.max(1, Math.ceil(coords.length / 8));
  coords.forEach((c, i) => {
    if (i % labelEvery !== 0 && i !== coords.length - 1) return;
    doc
      .fillColor(LABEL_COLOR)
      .fontSize(8)
      .text(c.point.label, c.x - 20, baseline + 4, { width: 40, align: 'center' });
  });

  void valueFormatter;
}
