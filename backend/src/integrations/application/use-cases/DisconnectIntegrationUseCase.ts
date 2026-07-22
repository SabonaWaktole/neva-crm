import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import { UserRole } from '@auth/domain/enums/UserRole';

export interface DisconnectIntegrationDTO {
  tenantId: string;
  authorRole: UserRole;
  provider: string;
}

export class DisconnectIntegrationUseCase {
  constructor(private integrationRepository: IIntegrationRepository) {}

  async execute(dto: DisconnectIntegrationDTO): Promise<void> {
    if (dto.authorRole === UserRole.STAFF || dto.authorRole === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners can disconnect integrations.');
    }

    const integration = await this.integrationRepository.findByProvider(dto.tenantId, dto.provider);

    if (integration) {
      integration.disconnect();
      await this.integrationRepository.save(integration);
    }
  }
}
