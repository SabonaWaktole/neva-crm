import {
  IReportRepository,
  AppointmentStatusCount,
  AppointmentsByStaff,
  AppointmentReportFilters,
} from '../../domain/IReportRepository';

export interface AppointmentReport {
  byStatus: AppointmentStatusCount[];
  byStaff: AppointmentsByStaff[];
  total: number;
}

/**
 * Appointment statistics (§6.7).
 *
 * A named MVP deliverable that had no backend at all: `src/reports` contained
 * client, inventory and revenue and nothing about appointments, so the module
 * the SRS asks for could not be built on the frontend either.
 *
 * Returns both cuts in one response because the SRS asks for both ("count of
 * appointments by status" and "basic breakdown by staff member or date range")
 * and a screen showing one without the other is half a report. Two endpoints
 * would also mean two chances for the date filters to disagree.
 */
export class GetAppointmentReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(tenantId: string, filters: AppointmentReportFilters = {}): Promise<AppointmentReport> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const [byStatus, byStaff] = await Promise.all([
      this.reportRepository.getAppointmentStatusDistribution(tenantId, filters),
      this.reportRepository.getAppointmentsByStaff(tenantId, filters),
    ]);

    return {
      byStatus,
      byStaff,
      // Summed from the status counts rather than queried again: a third count
      // could disagree with the two it is meant to total.
      total: byStatus.reduce((sum, s) => sum + s.count, 0),
    };
  }
}
