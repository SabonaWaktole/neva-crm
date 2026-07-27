import request from 'supertest';
import express, { Request, Response } from 'express';
import { validateRequest } from '@main/interfaces/http/middlewares/validateRequest';
import { authSchemas } from '../../../../../../src/auth/interfaces/http/schemas/authSchemas';

/**
 * Guards the mass-assignment fix in `validateRequest`.
 *
 * The middleware used to validate `req.body` and then discard the parsed
 * result, leaving the raw body in place. Because `z.object()` strips undeclared
 * keys, discarding the result meant undeclared keys survived — and three auth
 * handlers pass the body straight into a use case:
 *
 *   registerUseCase.execute(req.body)
 *   acceptInvitationUseCase.execute(req.body)
 *   resetPasswordUseCase.execute(req.body)
 *
 * so anything a client invented travelled all the way in.
 *
 * These tests drive the REAL schemas through the REAL middleware, one route at
 * a time, and assert on what a downstream handler actually receives. A fake
 * schema would prove nothing about the routes that are actually exposed.
 */
describe('validateRequest', () => {
  /** Mounts one route exactly as authRoutes does, echoing what got through. */
  const appFor = (schema: Parameters<typeof validateRequest>[0]) => {
    const app = express();
    app.use(express.json());
    app.post(
      '/',
      validateRequest(schema),
      (req: Request, res: Response) => res.status(200).json({ received: req.body })
    );
    return app;
  };

  describe('mass assignment — undeclared fields are stripped per route', () => {
    it('register: drops fields the schema does not declare', async () => {
      const res = await request(appFor(authSchemas.register))
        .post('/')
        .send({
          companyName: 'Acme',
          urlSlug: 'acme',
          ownerEmail: 'owner@acme.test',
          ownerPassword: 'Passw0rd',
          // None of these are in the schema. They used to reach
          // RegisterBusinessOwnerUseCase, which is handed req.body wholesale.
          role: 'SUPER_ADMIN',
          tenantId: 'some-other-tenant',
          isActive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual({
        companyName: 'Acme',
        urlSlug: 'acme',
        ownerEmail: 'owner@acme.test',
        ownerPassword: 'Passw0rd',
      });
      // Stated individually so a failure names the field that leaked.
      expect(res.body.received.role).toBeUndefined();
      expect(res.body.received.tenantId).toBeUndefined();
      expect(res.body.received.isActive).toBeUndefined();
    });

    it('acceptInvitation: drops fields the schema does not declare', async () => {
      const res = await request(appFor(authSchemas.acceptInvitation))
        .post('/')
        .send({
          token: 'invite-token',
          newPassword: 'Passw0rd',
          role: 'BUSINESS_OWNER',
          email: 'attacker@evil.test',
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual({
        token: 'invite-token',
        newPassword: 'Passw0rd',
      });
      expect(res.body.received.role).toBeUndefined();
      expect(res.body.received.email).toBeUndefined();
    });

    it('resetPassword: drops fields the schema does not declare', async () => {
      const res = await request(appFor(authSchemas.resetPassword))
        .post('/')
        .send({
          token: 'reset-token',
          newPassword: 'Passw0rd',
          userId: 'someone-elses-id',
          role: 'SUPER_ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual({
        token: 'reset-token',
        newPassword: 'Passw0rd',
      });
      expect(res.body.received.userId).toBeUndefined();
      expect(res.body.received.role).toBeUndefined();
    });
  });

  describe('declared fields still arrive intact', () => {
    it('preserves optional and explicitly-null values on updateProfile', async () => {
      // `language: null` is a real choice — "follow the workspace default" —
      // and must not be confused with an absent field or stripped as noise.
      const res = await request(appFor(authSchemas.updateProfile))
        .post('/')
        .send({ firstName: 'Ada', language: null, nickname: 'dropped' });

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual({ firstName: 'Ada', language: null });
      expect(res.body.received.nickname).toBeUndefined();
    });
  });

  describe('rejection', () => {
    it('rejects an invalid body with 400 and does not call the handler', async () => {
      const res = await request(appFor(authSchemas.login))
        .post('/')
        .send({ email: 'not-an-email', password: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.received).toBeUndefined();
    });

    it('reports errors in the same shape controllers use', async () => {
      // Previously this returned the raw ZodError, so clients saw one shape
      // from middleware-validated routes and another from controller-validated
      // ones. `{ error, details }` is what the controllers already return.
      const res = await request(appFor(authSchemas.register))
        .post('/')
        .send({ companyName: '', urlSlug: 'BAD SLUG', ownerEmail: 'nope', ownerPassword: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThan(0);
      for (const detail of res.body.details) {
        expect(typeof detail.path).toBe('string');
        expect(typeof detail.message).toBe('string');
      }
      // The raw ZodError internals must not be what we hand to clients.
      expect(res.body.issues).toBeUndefined();
      expect(res.body.name).toBeUndefined();
    });

    it('names the offending field in details.path', async () => {
      const res = await request(appFor(authSchemas.login))
        .post('/')
        .send({ email: 'not-an-email', password: 'ok' });

      expect(res.status).toBe(400);
      expect(res.body.details.map((d: { path: string }) => d.path)).toContain('email');
    });
  });
});
