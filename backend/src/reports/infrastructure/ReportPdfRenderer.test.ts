import { ReportPdfRenderer } from './ReportPdfRenderer';

describe('ReportPdfRenderer', () => {
  const renderer = new ReportPdfRenderer();

  it('renders a full report with every section populated', async () => {
    const pdf = await renderer.render({
      tenantName: 'Acme Salon',
      currency: 'USD',
      locale: 'en-US',
      generatedAt: new Date('2026-01-01'),
      revenue: [
        { month: 'Jan', revenue: 1200 },
        { month: 'Feb', revenue: 1800 },
        { month: 'Mar', revenue: 900 },
      ],
      clients: [
        { status: 'ACTIVE', count: 12 },
        { status: 'LEAD', count: 5 },
        { status: 'INACTIVE', count: 3 },
      ],
      inventory: [
        { warehouseName: 'Main', totalItems: 40, totalValue: 5000 },
        { warehouseName: 'Annex', totalItems: 15, totalValue: 1200 },
      ],
      clientTrend: [
        { month: 'Jan', count: 2 },
        { month: 'Feb', count: 4 },
      ],
      appointmentsByStatus: [
        { status: 'SCHEDULED', count: 10 },
        { status: 'COMPLETED', count: 20 },
      ],
      byStaff: [
        { staffName: 'Jane', scheduled: 2, confirmed: 3, completed: 5, cancelled: 1, total: 11 },
      ],
      lowStock: [
        { productName: 'Shampoo', warehouseName: 'Main', quantity: 2, threshold: 5, status: 'LOW_STOCK' },
      ],
    });

    expect(pdf.length).toBeGreaterThan(0);
    // A PDF file starts with this magic header — a cheap sanity check that
    // pdfkit actually produced a well-formed document rather than throwing
    // partway through and leaving a truncated stream.
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('handles every section being empty without throwing', async () => {
    const pdf = await renderer.render({
      tenantName: 'Empty Co',
      currency: 'USD',
      locale: 'en-US',
      generatedAt: new Date('2026-01-01'),
      revenue: [],
      clients: [],
      inventory: [],
      clientTrend: [],
      appointmentsByStatus: [],
      byStaff: [],
      lowStock: [],
    });

    expect(pdf.length).toBeGreaterThan(0);
  });

  it('handles a single-slice pie and a single-point line chart without dividing by zero', async () => {
    const pdf = await renderer.render({
      tenantName: 'Solo Co',
      currency: 'USD',
      locale: 'en-US',
      generatedAt: new Date('2026-01-01'),
      revenue: [{ month: 'Jan', revenue: 500 }],
      clients: [{ status: 'ACTIVE', count: 1 }],
      inventory: [],
      clientTrend: [],
      appointmentsByStatus: [],
      byStaff: [],
      lowStock: [],
    });

    expect(pdf.length).toBeGreaterThan(0);
  });
});
