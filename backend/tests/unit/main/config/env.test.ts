import { assertRequiredEnv, requireJwtSecret, MissingEnvironmentError } from '@main/config/env';
import { JwtTokenService } from '@auth/infrastructure/JwtTokenService';

/**
 * Env hygiene: JWT_SECRET is process-wide state shared by every suite running in
 * this worker. Snapshot the real value once and restore it after EVERY test
 * (including on failure, via afterEach rather than inline cleanup), so a failing
 * assertion here cannot leave the variable unset and break unrelated suites that
 * run later in the same worker.
 */
describe('required environment validation', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('has a real JWT_SECRET supplied by the test environment', () => {
    // Guards the assumption the rest of the suite depends on: if this fails,
    // the test bootstrap is not supplying a secret and other failures are noise.
    expect(originalSecret).toBeDefined();
    expect(originalSecret?.trim()).not.toBe('');
  });

  describe('requireJwtSecret', () => {
    it('returns the secret when set', () => {
      process.env.JWT_SECRET = 'a-real-secret';
      expect(requireJwtSecret()).toBe('a-real-secret');
    });

    it('throws when JWT_SECRET is entirely absent', () => {
      delete process.env.JWT_SECRET;
      expect(() => requireJwtSecret()).toThrow(MissingEnvironmentError);
    });

    it('throws when JWT_SECRET is an empty string', () => {
      process.env.JWT_SECRET = '';
      expect(() => requireJwtSecret()).toThrow(MissingEnvironmentError);
    });

    it('throws when JWT_SECRET is only whitespace', () => {
      process.env.JWT_SECRET = '   ';
      expect(() => requireJwtSecret()).toThrow(MissingEnvironmentError);
    });

    it('does not fall back to a default secret', () => {
      delete process.env.JWT_SECRET;
      expect(() => requireJwtSecret()).toThrow(/Refusing to start/);
    });
  });

  describe('assertRequiredEnv (startup guard)', () => {
    it('passes when configuration is complete', () => {
      process.env.JWT_SECRET = 'a-real-secret';
      expect(() => assertRequiredEnv()).not.toThrow();
    });

    it('throws when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => assertRequiredEnv()).toThrow(MissingEnvironmentError);
    });

    it('throws regardless of NODE_ENV, so no environment can opt out', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        delete process.env.JWT_SECRET;
        for (const env of ['production', 'development', 'test', 'staging']) {
          process.env.NODE_ENV = env;
          expect(() => assertRequiredEnv()).toThrow(MissingEnvironmentError);
        }
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('JwtTokenService construction', () => {
    it('refuses to construct without a secret, so no token can be signed with a fallback', () => {
      delete process.env.JWT_SECRET;
      expect(() => new JwtTokenService()).toThrow(MissingEnvironmentError);
    });

    it('constructs normally when a secret is present', () => {
      process.env.JWT_SECRET = 'a-real-secret';
      expect(() => new JwtTokenService()).not.toThrow();
    });
  });
});
