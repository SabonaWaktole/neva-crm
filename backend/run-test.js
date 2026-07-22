require('ts-node/register');
const request = require('supertest');
const { createApp } = require('./src/main/app');
const { Tenant } = require('./src/tenant/domain/entities/Tenant');
const { UserRole } = require('./src/auth/domain/enums/UserRole');
const { Integration } = require('./src/integrations/domain/entities/Integration');

class InMemoryIntegrationRepository {
  constructor() { this.integrations = []; }
  async findByTenantId(tenantId) { return this.integrations.filter(i => i.tenantId === tenantId); }
  async findByProvider(tenantId, provider) { return this.integrations.find(i => i.tenantId === tenantId && i.provider === provider) ?? null; }
  async save(integration) { this.integrations.push(integration); }
}

class InMemoryTenantRepository {
  constructor() { this.tenants = []; }
  async findById(id) { return this.tenants.find(t => t.id === id) ?? null; }
  async findBySlug(slug) { return this.tenants.find(t => t.urlSlug === slug) ?? null; }
  async create(tenant) { this.tenants.push(tenant); return tenant; }
}

const fakeTokenService = {
  sign: (payload) => Buffer.from(JSON.stringify(payload)).toString('base64'),
  verify: (token) => JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
};

async function run() {
  const tenantRepo = new InMemoryTenantRepository();
  const integrationRepo = new InMemoryIntegrationRepository();
  
  await tenantRepo.create(Tenant.create({ id: 't1', name: 'T1', urlSlug: 't1-slug', createdAt: new Date() }));
  
  const app = createApp({
    tenantRepository: tenantRepo,
    tokenService: fakeTokenService,
    integrationRepository: integrationRepo
  });
  
  const ownerToken = fakeTokenService.sign({ userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1', tenantSlug: 't1-slug' });
  
  console.log("Running GET /api/t1-slug/integrations");
  const res = await request(app)
    .get('/api/t1-slug/integrations')
    .set('Authorization', `Bearer ${ownerToken}`);
    
  console.log("Status:", res.status);
  console.log("Body:", res.body);
  console.log("Text:", res.text);
}

run().catch(console.error);
