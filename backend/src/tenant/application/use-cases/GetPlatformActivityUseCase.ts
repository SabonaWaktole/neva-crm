import { IAuditLogger, AuditLogRecord } from '../../../shared/application/ports/IAuditLogger';
import { UnauthorizedError } from '../../../auth/domain/errors';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetPlatformActivityDTO {
  callerRole: string;
  take?: number;
}

/**
 * Recent platform-wide administrative events for the Super Admin dashboard's
 * Platform Activity feed. Reads the same append-only AuditLog every
 * user/tenant lifecycle use case already writes to — no separate event store.
 */
export class GetPlatformActivityUseCase {
  constructor(private readonly auditLogger: IAuditLogger) {}

  async execute(dto: GetPlatformActivityDTO): Promise<AuditLogRecord[]> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can view platform activity');
    }

    const take = dto.take ?? 10;
    return this.auditLogger.findRecent(take);
  }
}
