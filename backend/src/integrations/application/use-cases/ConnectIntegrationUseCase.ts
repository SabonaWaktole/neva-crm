import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import { Integration } from '../../domain/entities/Integration';
import { UserRole } from '@auth/domain/enums/UserRole';
import { v4 as uuidv4 } from 'uuid';

export interface ConnectIntegrationDTO {
  tenantId: string;
  authorRole: UserRole;
  provider: string;
  config?: Record<string, any>;
}

export class ConnectIntegrationUseCase {
  constructor(private integrationRepository: IIntegrationRepository) {}

  async execute(dto: ConnectIntegrationDTO): Promise<Integration> {
    if (dto.authorRole === UserRole.STAFF || dto.authorRole === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners can connect integrations.');
    }

    let integration = await this.integrationRepository.findByProvider(dto.tenantId, dto.provider);

    if (integration) {
      integration.connect(dto.config || null);
    } else {
      integration = new Integration({
        id: uuidv4(),
        tenantId: dto.tenantId,
        provider: dto.provider,
        status: 'CONNECTED',
        config: dto.config || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.integrationRepository.save(integration);
    return integration;
  }
}
