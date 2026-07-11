import { Interaction } from '../entities/Interaction';

export interface IInteractionRepository {
  findByClientId(tenantId: string, clientId: string): Promise<Interaction[]>;
  save(tenantId: string, interaction: Interaction): Promise<void>;
}
