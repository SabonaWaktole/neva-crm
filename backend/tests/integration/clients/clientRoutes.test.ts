import request from 'supertest';
import express from 'express';
import { createClientRouter } from '../../../src/clients/interfaces/http/routes/clientRoutes';
import { PrismaClient } from '@prisma/client';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Mock middleware
jest.mock('../../../src/main/interfaces/http/middlewares/authenticate', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'u1', email: 'test@test.com', role: req.headers['x-role'] || 'BUSINESS_OWNER', tenantId: 't1' };
    next();
  }
}));

jest.mock('../../../src/main/interfaces/http/middlewares/resolveTenant', () => ({
  resolveTenant: () => (req: any, res: any, next: any) => {
    req.tenant = { id: 't1', name: 'Tenant 1' };
    next();
  }
}));

app.use('/api/clients', createClientRouter(prisma));

describe('Client Routes', () => {
  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [{ id: 't1', name: 'Tenant 1', urlSlug: 't1' }],
      skipDuplicates: true,
    });
    // clean
    await prisma.client.deleteMany({ where: { tenantId: 't1' } });
    await prisma.customFieldDefinition.deleteMany({ where: { tenantId: 't1' } });
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { tenantId: 't1' } });
    await prisma.customFieldDefinition.deleteMany({ where: { tenantId: 't1' } });
    await prisma.tenant.deleteMany({ where: { id: 't1' } });
    await prisma.$disconnect();
  });

  it('POST /api/clients/settings/custom-fields defines a field', async () => {
    const res = await request(app)
      .post('/api/clients/settings/custom-fields')
      .set('x-role', 'BUSINESS_OWNER')
      .send({ fieldName: 'industry', fieldType: 'TEXT' });
    
    expect(res.status).toBe(201);
    expect(res.body.fieldName).toBe('industry');
  });

  it('POST /api/clients creates a client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('x-role', 'BUSINESS_OWNER')
      .send({
        name: 'New Corp',
        status: ClientStatus.PROSPECT,
        customFieldValues: { industry: 'Software' }
      });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Corp');
  });

  it('GET /api/clients/search returns clients', async () => {
    const res = await request(app)
      .get('/api/clients/search')
      .set('x-role', 'BUSINESS_OWNER')
      .query({ name: 'New Corp' });
    
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].name).toBe('New Corp');
  });
});
