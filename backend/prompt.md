PHASE 1 TASK: AUTHENTICATION, TENANT-AWARE NAVIGATION, AND ROLE-BASED ACCESS CONTROL

Building on the project context already established, implement the following using strict TDD and Clean Architecture. Work in this order — do not skip ahead:

─────────────────────────────
1. DOMAIN LAYER
─────────────────────────────
Write failing unit tests first, then implement:
- `User` entity: id, email, hashedPassword, role (enum: SUPER_ADMIN | BUSINESS_OWNER | STAFF), tenantId (nullable — null only for SUPER_ADMIN), createdAt.
- `Tenant` entity: id, name, urlSlug (unique, used for directory-based routing), createdAt.
- Value object for `Email` (validates format) and `Password` (validates minimum strength before hashing — define and test the rule, e.g. min 8 chars, at least one number).
- Repository interfaces (ports only, no implementation): `IUserRepository`, `ITenantRepository` — methods like `findByEmail`, `findById`, `create`, `findBySlug`, etc. All tenant-scoped methods must require a `tenantId` parameter explicitly in the interface signature — this is a structural safeguard against accidental cross-tenant queries.

─────────────────────────────
2. APPLICATION LAYER — USE CASES
─────────────────────────────
Each use case gets its own unit test file with mocked repositories, written BEFORE the implementation. Implement:

a) `RegisterBusinessOwnerUseCase`
   - Input: company name, desired URL slug, owner email, owner password, locale/language.
   - Creates a Tenant + a User with role BUSINESS_OWNER in one transaction.
   - Must reject if the slug is already taken (test this explicitly).
   - Must reject weak passwords (test this explicitly).
   - Hashes password via an injected `IPasswordHasher` port (implemented with bcrypt in infrastructure).

b) `InviteStaffUseCase`
   - Input: inviting user (must be BUSINESS_OWNER — test that STAFF cannot invite), invitee email, role (STAFF, with room for a `SALES_REPRESENTATIVE` permission flag as described in the SRD).
   - Generates a time-limited invitation token. Persist invitation record (new `Invitation` entity: id, tenantId, email, role, token, expiresAt, acceptedAt).

c) `AcceptInvitationUseCase`
   - Input: invitation token, new password.
   - Validates token not expired/already used (test both failure cases).
   - Creates the User record scoped to the correct tenantId with the role from the invitation.

d) `LoginUseCase`
   - Input: email, password, tenant slug (from URL).
   - Verifies user exists within that tenant (or is SUPER_ADMIN logging into the platform-level area — test that a SUPER_ADMIN cannot log in "into" a tenant slug, and a tenant user cannot log into the Super Admin area).
   - Verifies password via `IPasswordHasher.compare`.
   - Issues a JWT containing: userId, role, tenantId. Test the token payload shape explicitly.
   - Test invalid credentials, wrong tenant, and disabled/nonexistent user cases.

e) `RequestPasswordResetUseCase` and `ResetPasswordUseCase`
   - Request: generates a time-limited reset token, tied to the user, sent via an injected `IEmailSender` port (stub/mock it in tests — do not implement real email sending yet, just log to console in the infra adapter for now).
   - Reset: validates token, enforces password strength rule again, updates hashed password, invalidates the token after use (test that a used token can't be reused).

─────────────────────────────
3. INFRASTRUCTURE LAYER
─────────────────────────────
- Prisma schema for `User`, `Tenant`, `Invitation`, `PasswordResetToken` — include tenantId foreign keys and appropriate unique constraints (e.g. unique `(tenantId, email)` for User, unique `urlSlug` for Tenant).
- Prisma implementations of `IUserRepository`, `ITenantRepository`.
- `BcryptPasswordHasher` implementing `IPasswordHasher`.
- `JwtTokenService` implementing a `ITokenService` port (sign/verify).
- `ConsoleEmailSender` implementing `IEmailSender` (just logs — real email integration is out of scope for this phase).

─────────────────────────────
4. INTERFACES LAYER — EXPRESS
─────────────────────────────
- Middleware: `resolveTenant` — parses the URL path segment (e.g. `/:tenantSlug/api/...`), loads the Tenant, attaches it to `req`. Return 404 if slug doesn't exist. Write an integration test for this middleware in isolation.
- Middleware: `authenticate` — verifies JWT from Authorization header, attaches decoded user (id, role, tenantId) to `req`. Test missing/invalid/expired token cases.
- Middleware: `authorize(...allowedRoles)` — a reusable RBAC guard factory. Test that it correctly blocks/allows based on role, and specifically test the cross-tenant case: a valid JWT for Tenant A must be rejected on a route resolved to Tenant B, even if the role would otherwise be allowed. This is the core of "navigation"/route protection for this phase — every protected route must be provably impossible to access cross-tenant, and this must be covered by an automated test, not just manual verification.
- Routes + controllers (thin, per the architecture rules) for:
  - `POST /:tenantSlug/api/auth/login`
  - `POST /api/auth/register-business` (platform-level, no tenant slug yet — this is what creates the tenant)
  - `POST /:tenantSlug/api/auth/invite-staff` (BUSINESS_OWNER only — enforced via `authorize`)
  - `POST /:tenantSlug/api/auth/accept-invitation`
  - `POST /:tenantSlug/api/auth/request-password-reset`
  - `POST /:tenantSlug/api/auth/reset-password`
  - `GET /:tenantSlug/api/auth/me` (returns current user + role + tenant info — this is what the frontend will use to decide which sidebar/nav items to render, per the role-based App Shell designs already built in Figma)
- Zod schemas for request validation on every endpoint, tested for both valid and invalid payloads.

─────────────────────────────
5. INTEGRATION TESTS (Supertest, full HTTP round-trip against a test DB)
─────────────────────────────
Write end-to-end tests for the full flows:
- Register business owner → login → GET /me returns correct role and tenant.
- Business owner invites staff → staff accepts invitation → staff logs in → staff's JWT has role STAFF and correct tenantId.
- Staff attempts to hit the invite-staff endpoint → expect 403.
- User from Tenant A attempts to use their valid JWT against a route resolved to Tenant B's slug → expect 403/404 (define which, and be consistent).
- Forgot password → reset password with token → old password no longer works, new password does → reused token fails.

─────────────────────────────
DELIVERY EXPECTATIONS
─────────────────────────────
- Show me the test file for each piece before/alongside its implementation, as per our TDD workflow.
- Run the full test suite at the end and report the pass/fail summary and coverage.
- Do NOT implement the frontend wiring (React route guards, connecting Stitch screens to these endpoints) in this prompt — that's Phase 1B and I'll give you a separate prompt for it once this backend is solid.
- If you spot something in the SRD's later milestones that this phase's design should account for structurally (e.g. something about how Quotations approval will need role checks later), flag it to me as a comment/question rather than building it now.

Start with the domain layer tests. Show me those first before writing any implementation.