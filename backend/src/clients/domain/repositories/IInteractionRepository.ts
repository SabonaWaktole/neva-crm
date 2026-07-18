import { Interaction } from '../entities/Interaction';

export interface IInteractionRepository {
  findById(id: string): Promise<Interaction | null>;
  findByClientId(tenantId: string, clientId: string): Promise<Interaction[]>;
  findRecentByTenant(tenantId: string, limit: number, authorUserId?: string): Promise<Interaction[]>;
  save(tenantId: string, interaction: Interaction): Promise<void>;
}
