import { authSchemas } from '@auth/interfaces/http/schemas/authSchemas';

describe('authSchemas', () => {
  it('should validate valid register payload', () => {
    const valid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'Password123',
    };
    const result = authSchemas.register.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in register payload', () => {
    const invalid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'not-an-email',
      ownerPassword: 'Password123',
    };
    const result = authSchemas.register.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject weak password in register payload', () => {
    const invalid = {
      companyName: 'Acme',
      urlSlug: 'acme',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'pass',
    };
    const result = authSchemas.register.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
