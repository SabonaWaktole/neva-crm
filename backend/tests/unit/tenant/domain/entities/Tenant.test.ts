import { Tenant } from '@tenant/domain/entities/Tenant';

describe('Tenant Entity', () => {
  describe('create', () => {
    it('should create a Tenant with all provided properties', () => {
      const props = {
        id: 'tenant-001',
        name: 'Acme Corp',
        urlSlug: 'acme-corp',
        createdAt: new Date('2026-01-15T10:00:00Z'),
      };

      const tenant = Tenant.create(props);

      expect(tenant.id).toBe(props.id);
      expect(tenant.name).toBe(props.name);
      expect(tenant.urlSlug).toBe(props.urlSlug);
      expect(tenant.createdAt).toEqual(props.createdAt);
    });

    it('should accept a valid slug', () => {
      const tenant = Tenant.create({
        id: 'tenant-002',
        name: 'My Business',
        urlSlug: 'my-business',
        createdAt: new Date(),
      });

      expect(tenant.urlSlug).toBe('my-business');
    });

    it('should expose all properties correctly for different tenants', () => {
      const now = new Date();
      const tenant = Tenant.create({
        id: 'tenant-xyz',
        name: 'Test Org',
        urlSlug: 'test-org',
        createdAt: now,
      });

      expect(tenant.id).toBe('tenant-xyz');
      expect(tenant.name).toBe('Test Org');
      expect(tenant.urlSlug).toBe('test-org');
      expect(tenant.createdAt).toBe(now);
    });
  });
});
