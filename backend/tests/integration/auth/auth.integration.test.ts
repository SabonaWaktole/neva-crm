import request from 'supertest';
import express from 'express';
import { createApp, AppDependencies } from '@main/app';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { IInvitationRepository } from '@auth/domain/repositories/IInvitationRepository';
import { IPasswordResetTokenRepository } from '@auth/domain/repositories/IPasswordResetTokenRepository';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { ITokenService, TokenPayload } from '@auth/application/ports/ITokenService';
import { IEmailSender } from '@auth/application/ports/IEmailSender';
import { IUnitOfWork } from '@shared/application/ports/IUnitOfWork';
import { User } from '@auth/domain/entities/User';
import { Tenant } from '@tenant/domain/entities/Tenant';
import { Invitation } from '@auth/domain/entities/Invitation';
import { PasswordResetToken } from '@auth/domain/entities/PasswordResetToken';
import { UserRole } from '@auth/domain/enums/UserRole';

// ---------------------------------------------------------------------------
// In-memory implementations of ports — lightweight fakes that behave like
// real repositories but keep state in plain arrays, removing the need for
// a running database.
// ---------------------------------------------------------------------------

class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null;
  }
  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.users.find(u => u.email === email && u.tenantId === tenantId) ?? null;
  }
  async findSuperAdminByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email && u.role === UserRole.SUPER_ADMIN) ?? null;
  }
  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      // Reconstruct with new password (immutable entity pattern)
      const idx = this.users.indexOf(user);
      this.users[idx] = User.create({
        id: user.id,
        email: user.email,
        hashedPassword,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      });
    }
  }

  // Test helper
  getAll(): User[] { return [...this.users]; }
  clear(): void { this.users = []; }
}

class InMemoryTenantRepository implements ITenantRepository {
  private tenants: Tenant[] = [];

  async findById(id: string): Promise<Tenant | null> {
    return this.tenants.find(t => t.id === id) ?? null;
  }
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenants.find(t => t.urlSlug === slug) ?? null;
  }
  async create(tenant: Tenant): Promise<Tenant> {
    this.tenants.push(tenant);
    return tenant;
  }

  getAll(): Tenant[] { return [...this.tenants]; }
  clear(): void { this.tenants = []; }
}

class InMemoryInvitationRepository implements IInvitationRepository {
  private invitations: Invitation[] = [];

  async create(invitation: Invitation): Promise<Invitation> {
    this.invitations.push(invitation);
    return invitation;
  }
  async findByToken(token: string): Promise<Invitation | null> {
    return this.invitations.find(i => i.token === token) ?? null;
  }
  async markAccepted(id: string, acceptedAt: Date): Promise<void> {
    const idx = this.invitations.findIndex(i => i.id === id);
    if (idx >= 0) {
      const inv = this.invitations[idx];
      this.invitations[idx] = Invitation.create({
        id: inv.id,
        tenantId: inv.tenantId,
        email: inv.email,
        role: inv.role,
        token: inv.token,
        expiresAt: inv.expiresAt,
        acceptedAt,
      });
    }
  }

  getAll(): Invitation[] { return [...this.invitations]; }
  clear(): void { this.invitations = []; }
}

class InMemoryPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private tokens: PasswordResetToken[] = [];

  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    this.tokens.push(token);
    return token;
  }
  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.tokens.find(t => t.token === token) ?? null;
  }
  async markUsed(id: string, usedAt: Date): Promise<void> {
    const idx = this.tokens.findIndex(t => t.id === id);
    if (idx >= 0) {
      const prt = this.tokens[idx];
      this.tokens[idx] = PasswordResetToken.create({
        id: prt.id,
        userId: prt.userId,
        token: prt.token,
        expiresAt: prt.expiresAt,
        usedAt,
      });
    }
  }

  getAll(): PasswordResetToken[] { return [...this.tokens]; }
  clear(): void { this.tokens = []; }
}

/** Plain hasher that uses a deterministic prefix so we can verify without bcrypt overhead. */
class FakePasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed:${plain}`;
  }
}

/** Minimal JWT-like token service using base64 encoding for speed. */
class FakeTokenService implements ITokenService {
  sign(payload: TokenPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
  verify(token: string): TokenPayload {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
      throw new Error('Invalid token');
    }
  }
}

class FakeEmailSender implements IEmailSender {
  public sentEmails: Array<{ to: string; type: string; token: string; tenantName?: string }> = [];

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.sentEmails.push({ to, type: 'password-reset', token });
  }
  async sendInvitationEmail(to: string, token: string, tenantName: string): Promise<void> {
    this.sentEmails.push({ to, type: 'invitation', token, tenantName });
  }

  clear(): void { this.sentEmails = []; }
}

class FakeUnitOfWork implements IUnitOfWork {
  async execute<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

// ===========================================================================
// INTEGRATION TESTS
// ===========================================================================

describe('Auth Integration Tests', () => {
  let app: express.Express;
  let userRepo: InMemoryUserRepository;
  let tenantRepo: InMemoryTenantRepository;
  let invitationRepo: InMemoryInvitationRepository;
  let prtRepo: InMemoryPasswordResetTokenRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let emailSender: FakeEmailSender;
  let unitOfWork: FakeUnitOfWork;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    tenantRepo = new InMemoryTenantRepository();
    invitationRepo = new InMemoryInvitationRepository();
    prtRepo = new InMemoryPasswordResetTokenRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    emailSender = new FakeEmailSender();
    unitOfWork = new FakeUnitOfWork();

    app = createApp({
      userRepository: userRepo,
      tenantRepository: tenantRepo,
      invitationRepository: invitationRepo,
      prtRepository: prtRepo,
      passwordHasher,
      tokenService,
      emailSender,
      unitOfWork,
    });
  });

  // -----------------------------------------------------------------------
  // 1. REGISTRATION
  // -----------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    const validPayload = {
      companyName: 'Acme Corp',
      urlSlug: 'acme',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'Password1',
    };

    it('should register a new business owner and tenant (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body.message).toBe('Registration successful');
      expect(res.body.tenantSlug).toBe('acme');

      // Verify side-effects in repositories
      const tenants = tenantRepo.getAll();
      expect(tenants).toHaveLength(1);
      expect(tenants[0].name).toBe('Acme Corp');

      const users = userRepo.getAll();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('owner@acme.com');
      expect(users[0].role).toBe(UserRole.BUSINESS_OWNER);
      expect(users[0].tenantId).toBe(tenants[0].id);
    });

    it('should reject duplicate slug (400)', async () => {
      // Register once
      await request(app).post('/api/auth/register').send(validPayload).expect(201);

      // Attempt duplicate
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload)
        .expect(400);

      expect(res.body.error).toContain('already taken');
    });

    it('should reject invalid email (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, ownerEmail: 'not-an-email' })
        .expect(400);

      expect(res.body).toBeDefined();
    });

    it('should reject weak password (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, ownerPassword: '123' })
        .expect(400);

      expect(res.body).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // 2. LOGIN
  // -----------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Seed a tenant and user via registration
      await request(app).post('/api/auth/register').send({
        companyName: 'Acme Corp',
        urlSlug: 'acme',
        ownerEmail: 'owner@acme.com',
        ownerPassword: 'Password1',
      });
    });

    it('should login with valid credentials and return a token (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'owner@acme.com', password: 'Password1' })
        .expect(200);

      expect(res.body.token).toBeDefined();
      const payload = tokenService.verify(res.body.token);
      expect(payload.role).toBe(UserRole.BUSINESS_OWNER);
    });

    it('should reject invalid password (401)', async () => {
      const res = await request(app)
        .post('/api/acme/auth/login')
        .send({ email: 'owner@acme.com', password: 'WrongPass1' })
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('should reject login with non-existent tenant slug (401)', async () => {
      const res = await request(app)
        .post('/api/no-such-tenant/auth/login')
        .send({ email: 'owner@acme.com', password: 'Password1' })
        .expect(404); // Expect 404 since tenant doesn't exist

      expect(res.body.error).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // 3. REGISTER → LOGIN → INVITE STAFF (full flow)
  // -----------------------------------------------------------------------
  describe('Full Registration → Login → Invite flow', () => {
    let ownerToken: string;
    let tenantId: string;

    beforeEach(async () => {
      // Register
      await request(app).post('/api/auth/register').send({
        companyName: 'Acme Corp',
        urlSlug: 'acme',
        ownerEmail: 'owner@acme.com',
        ownerPassword: 'Password1',
      });

      tenantId = tenantRepo.getAll()[0].id;

      // Login
      const loginRes = await request(app)
        .post('/api/acme/auth/login')
        .send({ email: 'owner@acme.com', password: 'Password1' });

      ownerToken = loginRes.body.token;
    });

    it('should allow BUSINESS_OWNER to invite staff (200)', async () => {
      const res = await request(app)
        .post('/api/acme/auth/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'staff@acme.com', role: 'STAFF' })
        .expect(200);

      expect(res.body.message).toBe('Invitation sent');

      // Verify invitation was created
      const invitations = invitationRepo.getAll();
      expect(invitations).toHaveLength(1);
      expect(invitations[0].email).toBe('staff@acme.com');

      // Verify email was sent
      expect(emailSender.sentEmails).toHaveLength(1);
      expect(emailSender.sentEmails[0].type).toBe('invitation');
      expect(emailSender.sentEmails[0].to).toBe('staff@acme.com');
    });

    it('should reject invitation from unauthenticated user (401)', async () => {
      await request(app)
        .post('/api/acme/auth/invitations')
        .send({ email: 'staff@acme.com', role: 'STAFF' })
        .expect(401);
    });

    it('should reject invitation from STAFF user (403)', async () => {
      // Manually add a STAFF user
      const staffUser = User.create({
        id: 'staff-id',
        email: 'staff-existing@acme.com',
        hashedPassword: 'hashed:SomePass1',
        role: UserRole.STAFF,
        tenantId,
        createdAt: new Date(),
      });
      await userRepo.create(staffUser);

      const staffToken = tokenService.sign({
        userId: staffUser.id,
        role: UserRole.STAFF,
        tenantId: staffUser.tenantId,
        tenantSlug: 'acme',
      });

      await request(app)
        .post('/api/acme/auth/invitations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ email: 'another@acme.com', role: 'STAFF' })
        .expect(403);
    });

    it('should return 403 when user tries to invite on a different tenant', async () => {
      // Create a second tenant
      const otherTenant = Tenant.create({
        id: 'other-tenant-id',
        name: 'Other Corp',
        urlSlug: 'other-corp',
        createdAt: new Date(),
      });
      await tenantRepo.create(otherTenant);

      // Owner of acme tries to invite on other-corp
      await request(app)
        .post('/api/other-corp/auth/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'staff@other.com', role: 'STAFF' })
        .expect(403);
    });
  });

  // -----------------------------------------------------------------------
  // 4. ACCEPT INVITATION
  // -----------------------------------------------------------------------
  describe('POST /api/auth/invitations/accept', () => {
    let invitationToken: string;

    beforeEach(async () => {
      // Seed a tenant
      const tenant = Tenant.create({
        id: 'tenant-1',
        name: 'Acme',
        urlSlug: 'acme',
        createdAt: new Date(),
      });
      await tenantRepo.create(tenant);

      // Seed an invitation
      invitationToken = 'valid-invitation-token';
      const invitation = Invitation.create({
        id: 'inv-1',
        tenantId: 'tenant-1',
        email: 'newstaff@acme.com',
        role: UserRole.STAFF,
        token: invitationToken,
        expiresAt: new Date(Date.now() + 86400000), // 24h from now
        acceptedAt: null,
      });
      await invitationRepo.create(invitation);
    });

    it('should accept a valid invitation and create a user (200)', async () => {
      const res = await request(app)
        .post('/api/auth/invitations/accept')
        .send({ token: invitationToken, newPassword: 'NewPass123' })
        .expect(200);

      expect(res.body.message).toBe('Invitation accepted successfully');

      // Verify a user was created
      const users = userRepo.getAll();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('newstaff@acme.com');
      expect(users[0].role).toBe(UserRole.STAFF);
      expect(users[0].tenantId).toBe('tenant-1');
    });

    it('should reject an already-accepted invitation (400)', async () => {
      // Accept first time
      await request(app)
        .post('/api/auth/invitations/accept')
        .send({ token: invitationToken, newPassword: 'NewPass123' })
        .expect(200);

      // Attempt second acceptance
      const res = await request(app)
        .post('/api/auth/invitations/accept')
        .send({ token: invitationToken, newPassword: 'NewPass123' })
        .expect(400);

      expect(res.body.error).toContain('already been accepted');
    });

    it('should reject an expired invitation (400)', async () => {
      // Create an already-expired invitation
      const expiredInvitation = Invitation.create({
        id: 'inv-expired',
        tenantId: 'tenant-1',
        email: 'expired@acme.com',
        role: UserRole.STAFF,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        acceptedAt: null,
      });
      await invitationRepo.create(expiredInvitation);

      const res = await request(app)
        .post('/api/auth/invitations/accept')
        .send({ token: 'expired-token', newPassword: 'NewPass123' })
        .expect(400);

      expect(res.body.error).toContain('expired');
    });
  });

  // -----------------------------------------------------------------------
  // 5. PASSWORD RESET FLOW
  // -----------------------------------------------------------------------
  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      // Seed a tenant + user
      const tenant = Tenant.create({
        id: 'tenant-1',
        name: 'Acme',
        urlSlug: 'acme',
        createdAt: new Date(),
      });
      await tenantRepo.create(tenant);

      const user = User.create({
        id: 'user-1',
        email: 'user@acme.com',
        hashedPassword: 'hashed:OldPassword1',
        role: UserRole.BUSINESS_OWNER,
        tenantId: 'tenant-1',
        createdAt: new Date(),
      });
      await userRepo.create(user);
    });

    describe('POST /api/auth/password-reset/request', () => {
      it('should send a reset email for existing user (200)', async () => {
        const res = await request(app)
          .post('/api/acme/auth/password-reset/request')
          .send({ email: 'user@acme.com' })
          .expect(200);

        expect(res.body.message).toContain('reset link');

        // Verify email was sent
        expect(emailSender.sentEmails).toHaveLength(1);
        expect(emailSender.sentEmails[0].type).toBe('password-reset');

        // Verify token was stored
        expect(prtRepo.getAll()).toHaveLength(1);
      });

      it('should return 200 even if user does not exist (silent fail)', async () => {
        const res = await request(app)
          .post('/api/acme/auth/password-reset/request')
          .send({ email: 'nonexistent@acme.com' })
          .expect(200);

        // Should not have sent any email
        expect(emailSender.sentEmails).toHaveLength(0);
      });
    });

    describe('POST /api/auth/password-reset/reset', () => {
      let resetToken: string;

      beforeEach(async () => {
        // Request a password reset
        await request(app)
          .post('/api/acme/auth/password-reset/request')
          .send({ email: 'user@acme.com' });

        // Get the token from the email sender
        resetToken = emailSender.sentEmails[0].token;
      });

      it('should reset the password with a valid token (200)', async () => {
        const res = await request(app)
          .post('/api/auth/password-reset/reset')
          .send({ token: resetToken, newPassword: 'NewPassword1' })
          .expect(200);

        expect(res.body.message).toBe('Password reset successfully');

        // Verify the user can now login with the new password
        // First, we need the login route to work — seed the tenant slug lookup
        const loginRes = await request(app)
          .post('/api/acme/auth/login')
          .send({ email: 'user@acme.com', password: 'NewPassword1' });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
      });

      it('should reject an already-used token (400)', async () => {
        // Use once
        await request(app)
          .post('/api/auth/password-reset/reset')
          .send({ token: resetToken, newPassword: 'NewPassword1' })
          .expect(200);

        // Attempt re-use
        const res = await request(app)
          .post('/api/auth/password-reset/reset')
          .send({ token: resetToken, newPassword: 'AnotherPass1' })
          .expect(400);

        expect(res.body.error).toContain('already been used');
      });
    });
  });

  // -----------------------------------------------------------------------
  // 6. CROSS-TENANT ISOLATION
  // -----------------------------------------------------------------------
  describe('Cross-Tenant Isolation', () => {
    let tenantAOwnerToken: string;
    let tenantBOwnerToken: string;

    beforeEach(async () => {
      // Register Tenant A
      await request(app).post('/api/auth/register').send({
        companyName: 'Tenant A',
        urlSlug: 'tenant-a',
        ownerEmail: 'owner@tenant-a.com',
        ownerPassword: 'Password1',
      });

      // Register Tenant B
      await request(app).post('/api/auth/register').send({
        companyName: 'Tenant B',
        urlSlug: 'tenant-b',
        ownerEmail: 'owner@tenant-b.com',
        ownerPassword: 'Password1',
      });

      // Login as Tenant A owner
      const loginA = await request(app)
        .post('/api/tenant-a/auth/login')
        .send({ email: 'owner@tenant-a.com', password: 'Password1' });
      tenantAOwnerToken = loginA.body.token;

      // Login as Tenant B owner
      const loginB = await request(app)
        .post('/api/tenant-b/auth/login')
        .send({ email: 'owner@tenant-b.com', password: 'Password1' });
      tenantBOwnerToken = loginB.body.token;
    });

    it('should return 403 when Tenant A owner tries to access Tenant B', async () => {
      await request(app)
        .post('/api/tenant-b/auth/invitations')
        .set('Authorization', `Bearer ${tenantAOwnerToken}`)
        .send({ email: 'staff@b.com', role: 'STAFF' })
        .expect(403);
    });

    it('should return 403 when Tenant B owner tries to access Tenant A', async () => {
      await request(app)
        .post('/api/tenant-a/auth/invitations')
        .set('Authorization', `Bearer ${tenantBOwnerToken}`)
        .send({ email: 'staff@a.com', role: 'STAFF' })
        .expect(403);
    });

    it('should allow SUPER_ADMIN to access any tenant', async () => {
      // Manually add a SUPER_ADMIN
      const sa = User.create({
        id: 'sa-id',
        email: 'super@crm.com',
        hashedPassword: 'hashed:SuperPass1',
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        createdAt: new Date(),
      });
      await userRepo.create(sa);

      const saToken = tokenService.sign({
        userId: sa.id,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        tenantSlug: null,
      });

      // SUPER_ADMIN can invite on Tenant A
      const res = await request(app)
        .post('/api/tenant-a/auth/invitations')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ email: 'new-staff@a.com', role: 'STAFF' })
        .expect(200);

      expect(res.body.message).toBe('Invitation sent');
    });
  });

  // -----------------------------------------------------------------------
  // 7. VALIDATION MIDDLEWARE
  // -----------------------------------------------------------------------
  describe('Request Validation', () => {
    it('should reject register with missing fields (400)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ companyName: 'X' }) // Missing required fields
        .expect(400);
    });

    it('should reject login with missing email (400)', async () => {
      await request(app)
        .post('/api/acme/auth/login')
        .send({ password: 'Password1' }) // Missing email
        .expect(400);
    });

    it('should reject accept-invitation with missing token (400)', async () => {
      await request(app)
        .post('/api/auth/invitations/accept')
        .send({ newPassword: 'Password1' }) // Missing token
        .expect(400);
    });

    it('should reject password reset with weak new password (400)', async () => {
      await request(app)
        .post('/api/auth/password-reset/reset')
        .send({ token: 'some-token', newPassword: '123' }) // Weak password
        .expect(400);
    });
  });
});
