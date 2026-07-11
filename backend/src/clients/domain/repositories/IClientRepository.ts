import { Client } from '../entities/Client';

export interface SearchClientsFilters {
  name?: string;
  assignedUserId?: string;
  status?: string;
  customFields?: Record<string, any>;
}

export interface IClientRepository {
  findById(tenantId: string, id: string): Promise<Client | null>;
  search(tenantId: string, filters: SearchClientsFilters, skip: number, take: number): Promise<{ items: Client[]; total: number }>;
  save(tenantId: string, client: Client): Promise<void>;
  update(tenantId: string, client: Client): Promise<void>;
}
