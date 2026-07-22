import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import { Integration } from '../../domain/entities/Integration';

export class GetIntegrationsUseCase {
  constructor(private integrationRepository: IIntegrationRepository) {}

  async execute(dto: { tenantId: string }): Promise<Integration[]> {
    return this.integrationRepository.findByTenantId(dto.tenantId);
  }
}
