import { JwtTokenService } from '../../../../src/auth/infrastructure/JwtTokenService';
import { UserRole } from '../../../../src/auth/domain/enums/UserRole';

describe('JwtTokenService', () => {
  let tokenService: JwtTokenService;

  // process.env is shared by every suite in this Jest worker. Restore the real
  // values rather than deleting them: JwtTokenService now throws when
  // JWT_SECRET is absent, so leaving it deleted would break any suite that runs
  // later in the same worker and constructs one.
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  };

  beforeEach(() => {
    // Set a consistent test secret
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    tokenService = new JwtTokenService();
  });

  afterEach(() => {
    restore('JWT_SECRET', originalSecret);
    restore('JWT_EXPIRES_IN', originalExpiresIn);
  });

  it('signs and verifies a valid payload', () => {
    const payload = { userId: '123', role: UserRole.STAFF, tenantId: 't1', tenantSlug: 't1' , warehouseId: null };
    const token = tokenService.sign(payload);
    
    expect(typeof token).toBe('string');
    
    const decoded = tokenService.verify(token);
    expect(decoded.userId).toBe('123');
    expect(decoded.role).toBe(UserRole.STAFF);
    expect(decoded.tenantId).toBe('t1');
    expect(decoded.tenantSlug).toBe('t1');
  });

  it('throws an error when verifying an invalid or tampered token', () => {
    const payload = { userId: '123', role: UserRole.STAFF, tenantId: 't1', tenantSlug: 't1' , warehouseId: null };
    const token = tokenService.sign(payload);
    
    // Tamper with the token
    const tamperedToken = token.substring(0, token.length - 2) + 'aa';
    
    expect(() => tokenService.verify(tamperedToken)).toThrow();
  });

  it('throws an error when verifying a token signed with a different secret', () => {
    const payload = { userId: '123', role: UserRole.STAFF, tenantId: 't1', tenantSlug: 't1' , warehouseId: null };
    const token = tokenService.sign(payload);
    
    // Change the secret
    process.env.JWT_SECRET = 'different-secret';
    const newTokenService = new JwtTokenService();
    
    expect(() => newTokenService.verify(token)).toThrow();
  });
});
