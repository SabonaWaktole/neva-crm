import request from 'supertest';
import { createApp } from '@main/app';

/**
 * These tests exercise middleware mounted ahead of validation and controllers,
 * so they need no database fixtures: requests are rejected by the limiter (429)
 * or by request validation (400) before any repository is touched.
 */
describe('security middleware', () => {
  const originalMax = process.env.AUTH_RATE_LIMIT_MAX;

  afterEach(() => {
    // AUTH_RATE_LIMIT_MAX is worker-wide state; restore it after every test so a
    // failure here cannot leave a tight limit in place and trip other suites.
    if (originalMax === undefined) {
      delete process.env.AUTH_RATE_LIMIT_MAX;
    } else {
      process.env.AUTH_RATE_LIMIT_MAX = originalMax;
    }
  });

  describe('helmet security headers', () => {
    let headers: Record<string, string>;

    // The first createApp() in a worker pays Prisma engine initialization, which
    // alone can exceed the default 5s timeout. Do it once, with headroom.
    beforeAll(async () => {
      const res = await request(createApp()).get('/api/auth/me');
      headers = res.headers as Record<string, string>;
    }, 60000);

    it('sets the standard protective headers on responses', () => {
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-dns-prefetch-control']).toBeDefined();
    });

    it('removes the x-powered-by header that advertises Express', () => {
      expect(headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('auth rate limiting', () => {
    // Limit set low so the test is fast and unambiguous. The limiter is read at
    // createApp() time, so the env var must be set before the app is built.
    const buildAppWithLimit = (max: number) => {
      process.env.AUTH_RATE_LIMIT_MAX = String(max);
      return createApp();
    };

    it('returns 429 on POST /api/auth/login once the threshold is exceeded', async () => {
      const app = buildAppWithLimit(3);
      const payload = { email: 'nobody@example.com', password: 'WrongPass1' };

      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/api/auth/login').send(payload);
        expect(res.status).not.toBe(429);
      }

      const blocked = await request(app).post('/api/auth/login').send(payload);
      expect(blocked.status).toBe(429);
      expect(blocked.body).toEqual({ error: 'Too many attempts. Please try again later.' });
    });

    /*
     * POST /api/auth/register was covered here too. Public self-registration
     * was removed, so the route no longer exists and there is nothing left to
     * rate-limit on it. The limiter itself is still covered by the login case
     * above and the password-reset case below — the two remaining unauthenticated
     * routes it guards.
     */

    it('returns 429 on POST /api/:tenantSlug/auth/password-reset/request once exceeded', async () => {
      const app = buildAppWithLimit(3);
      const payload = { email: 'nobody@example.com' };

      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/some-tenant/auth/password-reset/request')
          .send(payload);
        expect(res.status).not.toBe(429);
      }

      const blocked = await request(app)
        .post('/api/some-tenant/auth/password-reset/request')
        .send(payload);
      expect(blocked.status).toBe(429);
    });

    it('counts attempts per app instance, so a fresh instance starts clean', async () => {
      const first = buildAppWithLimit(2);
      const payload = { email: 'nobody@example.com', password: 'WrongPass1' };

      await request(first).post('/api/auth/login').send(payload);
      await request(first).post('/api/auth/login').send(payload);
      const blocked = await request(first).post('/api/auth/login').send(payload);
      expect(blocked.status).toBe(429);

      const second = buildAppWithLimit(2);
      const fresh = await request(second).post('/api/auth/login').send(payload);
      expect(fresh.status).not.toBe(429);
    });

    it('does not rate limit non-auth endpoints', async () => {
      const app = buildAppWithLimit(2);

      for (let i = 0; i < 5; i++) {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).not.toBe(429);
      }
    });
  });
});
