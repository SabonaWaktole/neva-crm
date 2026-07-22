import request from 'supertest';
import { createApp } from './src/main/app';
import { Tenant } from './src/tenant/domain/entities/Tenant';
import { UserRole } from './src/auth/domain/enums/UserRole';
import { IIntegrationRepository } from './src/integrations/domain/repositories/IIntegrationRepository';
import { Integration } from './src/integrations/domain/entities/Integration';
import { ITenantRepository } from './src/tenant/domain/repositories/ITenantRepository';

class InMemoryIntegrationRepository implements IIntegrationRepository {
  public integrations: Integration[] = [];
  async findByTenantId(tenantId: string): Promise<Integration[]> { return this.integrations.filter(i => i.tenantId === tenantId); }
  async findByProvider(tenantId: string, provider: string): Promise<Integration | null> { return this.integrations.find(i => i.tenantId === tenantId && i.provider === provider) ?? null; }
  async save(integration: Integration): Promise<void> { this.integrations.push(integration); }
}

class InMemoryTenantRepository implements ITenantRepository {
  public tenants: Tenant[] = [];
  async findById(id: string): Promise<Tenant | null> { return this.tenants.find(t => t.id === id) ?? null; }
  async findBySlug(slug: string): Promise<Tenant | null> { return this.tenants.find(t => t.urlSlug === slug) ?? null; }
  async create(tenant: Tenant): Promise<Tenant> { this.tenants.push(tenant); return tenant; }
  async findAll(skip: number, take: number): Promise<{items: Tenant[], total: number}> { return { items: this.tenants, total: this.tenants.length }; }
  async updateSettings(): Promise<void> {}
}

const fakeTokenService = {
  sign: (payload: any) => Buffer.from(JSON.stringify(payload)).toString('base64'),
  verify: (token: string) => JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
};

async function run() {
  const tenantRepo = new InMemoryTenantRepository();
  const integrationRepo = new InMemoryIntegrationRepository();
  
  await tenantRepo.create(Tenant.create({ id: 't1', name: 'T1', urlSlug: 't1-slug', createdAt: new Date() }));
  
  const app = createApp({
    tenantRepository: tenantRepo,
    tokenService: fakeTokenService as any,
    integrationRepository: integrationRepo
  });
  
  const ownerToken = fakeTokenService.sign({ userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1', tenantSlug: 't1-slug' });
  
  console.log("Running GET /api/t1-slug/integrations");
  const res = await request(app).get('/api/t1-slug/integrations').set('Authorization', 'Bearer ' + ownerToken);
  console.log('Status:', res.status);
  console.log('Body:', res.body);
  console.log('Text:', res.text);
}

run().catch(console.error);
