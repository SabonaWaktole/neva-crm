import { tenantSchemas } from '@tenant/interfaces/http/schemas/tenantSchemas';

/*
 * These cases used to target `authSchemas.register`, the public self-signup
 * schema. Self-signup was removed — a workspace is now provisioned only by a
 * platform administrator — and `tenantSchemas.createTenant` validates the
 * identical fields for that path. The rules under test did not change owner.
 */
describe('tenantSchemas.createTenant', () => {
  it('should validate a valid workspace-provisioning payload', () => {
    const valid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'Password123',
    };
    const result = tenantSchemas.createTenant.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid owner email', () => {
    const invalid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'not-an-email',
      ownerPassword: 'Password123',
    };
    const result = tenantSchemas.createTenant.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject a weak owner password', () => {
    const invalid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'pass',
    };
    const result = tenantSchemas.createTenant.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
