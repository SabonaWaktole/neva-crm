import { UnauthorizedError } from '../../../auth/domain/errors';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { IMetricsCollector, SystemMetricsSnapshot } from '../ports/IMetricsCollector';

export interface GetSystemMetricsDTO {
  callerRole: string;
}

/**
 * Live request latency and traffic for the Super Admin dashboard's
 * Global Latency / Active Requests / Real-time Traffic panel. Backed by the
 * process's own request timings (see IMetricsCollector), not a synthesized figure.
 */
export class GetSystemMetricsUseCase {
  constructor(private readonly metricsCollector: IMetricsCollector) {}

  async execute(dto: GetSystemMetricsDTO): Promise<SystemMetricsSnapshot> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can view system metrics');
    }

    return this.metricsCollector.getSnapshot();
  }
}
