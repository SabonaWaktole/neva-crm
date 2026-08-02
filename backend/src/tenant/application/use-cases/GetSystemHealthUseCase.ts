import { UnauthorizedError } from '../../../auth/domain/errors';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { IDatabaseHealthChecker } from '../ports/IDatabaseHealthChecker';

export interface GetSystemHealthDTO {
  callerRole: string;
}

export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED';

export interface SystemHealth {
  status: SystemHealthStatus;
  checkedAt: string;
  checks: {
    database: 'UP' | 'DOWN';
  };
}

/**
 * Platform system health for the Super Admin dashboard's System Health card.
 *
 * Only checks the database today, the one dependency the platform cannot run
 * without at all. There is no uptime/queue/error-rate telemetry anywhere in
 * the codebase yet — this is deliberately the smallest real check rather than
 * a status invented to fill the card.
 */
export class GetSystemHealthUseCase {
  constructor(private readonly dbHealthChecker: IDatabaseHealthChecker) {}

  async execute(dto: GetSystemHealthDTO): Promise<SystemHealth> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can view system health');
    }

    const databaseUp = await this.dbHealthChecker.checkConnection();

    return {
      status: databaseUp ? 'HEALTHY' : 'DEGRADED',
      checkedAt: new Date().toISOString(),
      checks: {
        database: databaseUp ? 'UP' : 'DOWN',
      },
    };
  }
}
